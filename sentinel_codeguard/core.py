from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
import os
import re
import time
import concurrent.futures

from .logger import log
from .types import Category, Level, Result
from .config import Config
from .utils import md5, clip
from .extractors import COMMENT_STRING_EXTRACTORS, extract_generic_comments_and_strings
from .detectors import CodeDetectors
from .client import LlamaGuardClient


class CodeGuard:
    def __init__(self, config: Optional[Config] = None):
        self.cfg = config or Config()
        self.cache: Dict[str, Tuple[Result, float]] = {}
        self.llama = LlamaGuardClient()

        self.re_jb = [re.compile(p) for p in CodeDetectors.JAILBREAK_PATTERNS]
        self.re_inj = [re.compile(p) for p in CodeDetectors.PROMPT_INJECTION_PATTERNS]
        self.re_secret = [re.compile(p) for p in CodeDetectors.SECRET_PATTERNS]
        self.re_unsafe = [re.compile(p) for p in CodeDetectors.UNSAFE_CODE_PATTERNS]
        self.re_obf = [re.compile(p) for p in CodeDetectors.OBFUSCATION_PATTERNS]
        self.re_mal = [re.compile(p) for p in CodeDetectors.MALICIOUS_PATTERNS]
        self.re_illegal = [re.compile(p) for p in CodeDetectors.ILLEGAL_PATTERNS]

    def scan_prompt(self, text: str, filename: Optional[str] = None) -> Result:
        return self._scan(text, filename=filename, direction="prompt")

    def scan_output(self, text: str, filename: Optional[str] = None) -> Result:
        return self._scan(text, filename=filename, direction="output")

    def _scan(self, text: str, filename: Optional[str], direction: str) -> Result:
        t0 = time.time()
        if not text:
            return Result(content_preview="", flagged=False)

        if len(text) > self.cfg.max_len:
            text = text[: self.cfg.max_len]

        key = md5(f"{direction}:{filename}:{text}")
        if self.cfg.enable_cache:
            cached = self._cache_get(key)
            if cached:
                cached.processing_time = time.time() - t0
                return cached

        natural_segments = self._extract_natural_language_segments(text, filename)

        result = self._run_layers(natural_segments, direction)

        result.content_preview = clip(text)
        result.processing_time = time.time() - t0

        if self.cfg.enable_cache:
            self._cache_put(key, result)

        return result

    def _run_layers(self, natural_segments: List[str], direction: str) -> Result:
        checks: List[Tuple[str, Any, Category]] = []
        if Category.JAILBREAK in self.cfg.categories:
            checks.append(("jailbreak", self._check_jailbreak, Category.JAILBREAK))
        if Category.PROMPT_INJECTION in self.cfg.categories:
            checks.append(("injection", self._check_injection, Category.PROMPT_INJECTION))
        if Category.SECRETS in self.cfg.categories:
            checks.append(("secrets", self._check_secrets, Category.SECRETS))
        if Category.UNSAFE_CODE in self.cfg.categories:
            checks.append(("unsafe", self._check_unsafe_code, Category.UNSAFE_CODE))
        if Category.OBFUSCATION in self.cfg.categories:
            checks.append(("obfuscation", self._check_obfuscation, Category.OBFUSCATION))
        if Category.MALICIOUS_INSTRUCTIONS in self.cfg.categories:
            checks.append(("malicious", self._check_malicious, Category.MALICIOUS_INSTRUCTIONS))
        if Category.ILLEGAL in self.cfg.categories:
            checks.append(("illegal", self._check_illegal, Category.ILLEGAL))

        flagged_results: List[Result] = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.cfg.max_parallel_checks) as ex:
            futs = {ex.submit(fn, natural_segments): (name, cat) for name, fn, cat in checks}
            for f in concurrent.futures.as_completed(futs):
                name, cat = futs[f]
                try:
                    r = f.result()
                    if r.flagged:
                        flagged_results.append(r)
                except Exception as e:
                    log.error("Error in check %s: %s", name, e)

        if flagged_results:
            best = flagged_results[0]
            return self._attach_actions(best)

        if self.cfg.enable_llama_guard:
            lg = self._check_llama_guard(natural_segments, direction)
            if lg.flagged:
                return self._attach_actions(lg)

        return Result(content_preview="", flagged=False)

    def _check_malicious(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_mal:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.MALICIOUS_INSTRUCTIONS],
                        reason="Detected hacking/malicious instruction phrase.",
                        confidence=0.85,
                        detection_method="regex:malicious",
                    )
        return Result(content_preview="", flagged=False)

    def _check_illegal(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_illegal:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.ILLEGAL],
                        reason="Detected potentially illegal activity request.",
                        confidence=0.85,
                        detection_method="regex:illegal",
                    )
        return Result(content_preview="", flagged=False)

    def _check_jailbreak(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_jb:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.JAILBREAK],
                        reason="Detected jailbreak phrasing in comments/strings.",
                        confidence=0.9,
                        detection_method="regex:jailbreak",
                    )
        return Result(content_preview="", flagged=False)

    def _check_injection(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_inj:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.PROMPT_INJECTION],
                        reason="Detected prompt-injection attempt in comments/strings.",
                        confidence=0.9,
                        detection_method="regex:injection",
                    )
        return Result(content_preview="", flagged=False)

    def _check_secrets(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_secret:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.SECRETS],
                        reason="Potential secret/credential detected.",
                        confidence=0.95,
                        detection_method="regex:secrets",
                    )
        return Result(content_preview="", flagged=False)

    def _check_unsafe_code(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_unsafe:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.UNSAFE_CODE],
                        reason="Detected potentially unsafe API usage.",
                        confidence=0.85,
                        detection_method="regex:unsafe_code",
                    )
        return Result(content_preview="", flagged=False)

    def _check_obfuscation(self, segments: List[str]) -> Result:
        for seg in segments:
            for rx in self.re_obf:
                if rx.search(seg):
                    return Result(
                        content_preview=clip(seg),
                        flagged=True,
                        categories=[Category.OBFUSCATION],
                        reason="Detected obfuscation/encoding or invisible characters.",
                        confidence=0.8,
                        detection_method="regex:obfuscation",
                    )
        return Result(content_preview="", flagged=False)

    def _check_llama_guard(self, segments: List[str], direction: str) -> Result:
        if not (self.llama.url and self.llama.key):
            return Result(content_preview="", flagged=False)

        text = "\n---\n".join(segments)
        policy_hint = {
            "level": self.cfg.level.value,
            "categories": [c.value for c in self.cfg.categories],
            "direction": direction,
            "focus": "code_comments_and_strings",
        }
        try:
            resp = self.llama.classify(text=text, policy_hint=policy_hint)
        except Exception as e:
            log.error("Llama Guard error: %s", e)
            resp = None

        if not resp:
            return Result(content_preview="", flagged=False)

        cats: List[Category] = []
        for c in resp.get("categories", []):
            try:
                cats.append(Category(c))
            except ValueError:
                cats.append(Category.CUSTOM)

        return Result(
            content_preview=clip(text),
            flagged=bool(resp.get("flagged", False)),
            categories=cats,
            reason=resp.get("reason"),
            confidence=resp.get("confidence"),
            detection_method="llamaguard",
        )

    def _attach_actions(self, r: Result) -> Result:
        actions: List[str] = []
        for c in r.categories:
            actions += self.cfg.actions.get(c, [])
        r.actions = sorted(list(set(actions)))
        return r

    def _extract_natural_language_segments(self, text: str, filename: Optional[str]) -> List[str]:
        ext = (os.path.splitext(filename)[1].lower() if filename else None)
        extractor = COMMENT_STRING_EXTRACTORS.get(ext or "", None)

        segments: List[str] = []
        if extractor:
            segments = extractor(text)
        else:
            generic = extract_generic_comments_and_strings(text)
            if generic:
                segments = generic
            else:
                symbol_ratio = sum(ch in "{}();<>=/*`" for ch in text) / max(len(text), 1)
                segments = [text] if symbol_ratio < 0.05 else []

        return [re.sub(r"\s+", " ", s).strip() for s in segments if s and s.strip()]

    def _cache_get(self, key: str) -> Optional[Result]:
        entry = self.cache.get(key)
        if not entry:
            return None
        res, ts = entry
        if time.time() - ts > self.cfg.cache_ttl:
            self.cache.pop(key, None)
            return None
        return res

    def _cache_put(self, key: str, res: Result) -> None:
        self.cache[key] = (res, time.time())
        if len(self.cache) > 1000:
            items = sorted(self.cache.items(), key=lambda kv: kv[1][1], reverse=True)[:1000]
            self.cache = dict(items)


