from __future__ import annotations
from typing import Callable, Dict, List
import re
import tokenize
import io


COMMENT_STRING_EXTRACTORS: Dict[str, Callable[[str], List[str]]] = {}


def extract_python_comments_and_strings(code: str) -> List[str]:
    out: List[str] = []
    buf = io.BytesIO(code.encode("utf-8"))
    try:
        for tok in tokenize.tokenize(buf.readline):
            if tok.type == tokenize.COMMENT:
                out.append(tok.string.lstrip("# ").strip())
            elif tok.type == tokenize.STRING:
                s = tok.string
                if s.startswith(("'''", '"""')) and s.endswith(("'''", '"""')) and len(s) >= 6:
                    out.append(s[3:-3])
                elif s.startswith(("'", '"')) and s.endswith(("'", '"')) and len(s) >= 2:
                    out.append(s[1:-1])
                else:
                    out.append(s)
    except tokenize.TokenError:
        pass
    return [x for x in (t.strip() for t in out) if x]


COMMENT_STRING_EXTRACTORS[".py"] = extract_python_comments_and_strings


def extract_generic_comments_and_strings(code: str) -> List[str]:
    parts: List[str] = []
    parts += [m.group(1) for m in re.finditer(r"/\*([\s\S]*?)\*/", code)]
    parts += [m.group(1) for m in re.finditer(r"//(.*)$", code, re.M)]
    parts += [m.group(1) for m in re.finditer(r"\"([^\"\\]*(?:\\.[^\"\\]*)*)\"", code)]
    parts += [m.group(1) for m in re.finditer(r"'([^'\\]*(?:\\.[^'\\]*)*)'", code)]
    parts += [m.group(1) for m in re.finditer(r"`([^`\\]*(?:\\.[^`\\]*)*)`", code)]
    return [x.strip() for x in parts if x and x.strip()]


for ext in [
    ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".h", ".hpp", ".cc",
    ".cpp", ".go", ".rs", ".kt", ".scala", ".swift",
]:
    COMMENT_STRING_EXTRACTORS[ext] = extract_generic_comments_and_strings


