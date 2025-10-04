from __future__ import annotations
from typing import Any, Dict, Optional
import re

from .types import Category
from .utils import clip
from .core import CodeGuard


class CodeGenFirewall:
    def __init__(self, guard: Optional[CodeGuard] = None):
        self.guard = guard or CodeGuard()

    def generate(self, prompt: str, filename: Optional[str] = None) -> Dict[str, Any]:
        p_res = self.guard.scan_prompt(prompt, filename=filename)
        if p_res.flagged and "block" in p_res.actions:
            return {"error": "prompt_blocked", "moderation": p_res.__dict__}

        clean_prompt = self._maybe_redact(prompt) if Category.SECRETS.value in [c.value for c in p_res.categories] else prompt

        completion = self._fake_model(clean_prompt)

        o_res = self.guard.scan_output(completion, filename=filename)
        if o_res.flagged and "block_if_output" in o_res.actions:
            return {"error": "output_blocked", "moderation": o_res.__dict__}

        return {"output": completion, "prompt_moderation": p_res.__dict__, "output_moderation": o_res.__dict__}

    def _maybe_redact(self, text: str) -> str:
        text = re.sub(r"(-----BEGIN [A-Z ]+PRIVATE KEY-----)[\s\S]+?(-----END [A-Z ]+PRIVATE KEY-----)", r"\1[REDACTED]\2", text)
        text = re.sub(r"AKIA[0-9A-Z]{16}", "AKIA****************", text)
        text = re.sub(r"(eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.)[A-Za-z0-9_\-]{10,}", r"\1[REDACTED]", text)
        text = re.sub(r"(?i)(bearer\s+)[A-Za-z0-9\.\-_~\+\/]{20,}", r"\1[REDACTED]", text)
        return text

    def _fake_model(self, prompt: str) -> str:
        return f"// Generated code for: {clip(prompt, 80)}\nprint('hello world')\n"


