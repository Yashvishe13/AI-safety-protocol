import os
import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional

try:
    from cerebras.cloud.sdk import Cerebras
except Exception:  # pragma: no cover - optional dependency at runtime
    Cerebras = None  # type: ignore


@dataclass
class ValidatorResult:
    summary: str
    label: bool
    reason: str
    category: str  # One of: "Low", "Medium", "High"


class _CerebrasClient:
    """Minimal Cerebras chat client wrapper used by AgentValidator.

    Reads API key and model from environment:
      - CEREBRAS_API_KEY: required
      - CEREBRAS_MODEL: optional (default: "llama-4-scout-17b-16e-instruct")
    """

    def __init__(self, model: Optional[str] = None):
        api_key = os.environ.get("CEREBRAS_API_KEY")
        if not api_key or Cerebras is None:
            self._client = None
            self._model = None
            return
        self._client = Cerebras(api_key=api_key)
        self._model = model or os.environ.get("CEREBRAS_MODEL", "gpt-oss-120b")

    def is_configured(self) -> bool:
        return self._client is not None and self._model is not None

    def chat(self, messages: list, temperature: float = 0.3, max_tokens: int = 1024) -> str:
        if not self.is_configured():
            raise RuntimeError("Cerebras client not configured. Set CEREBRAS_API_KEY and install cerebras-cloud-sdk.")
        resp = self._client.chat.completions.create(  # type: ignore[attr-defined]
            messages=messages,
            model=self._model,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content  # type: ignore[index]


class AgentValidator:
    """Uses Cerebras Llama to summarize and validate maliciousness in one shot.

    Call with: `AgentValidator()(summary=str)`
    Returns a `ValidatorResult` with fields: summary, label (bool), reason, category (Low/Medium/High).
    """

    def __init__(self, model: Optional[str] = None):
        self.client = _CerebrasClient(model=model)

    def __call__(self, summary: str) -> ValidatorResult:
        # Fallback result if API not configured
        fallback = ValidatorResult(
            summary=self._safe_truncate(summary, 500),
            label=False,
            reason="Validator not configured; defaulting to safe.",
            category="Low",
        )
        if not self.client.is_configured():
            return fallback

        sys_prompt = (
            "You are a strict JSON-only validator. Perform TWO tasks on the given input: "
            "(1) Decide if it contains malicious/unsafe or harmful intent as boolean 'label' (true if malicious or harmful). "
            "(2) Provide a brief 2-3 sentence 'reason' and a risk 'category' among: Low, Medium, High. "
            "If there is slightest hint of harmful intent, return label as true."
            "Return ONLY a JSON object with keys exactly: Label (boolean), reason (string), category (string). "
            "Do not include any extra commentary, preamble, or code fences."
        )

        user_prompt = (
            "Input to evaluate (may be a partial summary):\n" + summary.strip()
        )
        messages = [
            {"role": "system", "content": "Summarize the input succinctly in 1-2 sentences as 'summary'. Address any harmful intent."},
            {"role": "user", "content": user_prompt},
        ]
        content_summary = self.client.chat(messages, temperature=0.2, max_tokens=400)
        
        print("---------- USER PROMPT ----------")
        print(content_summary)
        print("---------- END USER PROMPT ----------")
        
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": content_summary},
        ]

        try:
            content = self.client.chat(messages, temperature=0.2, max_tokens=400)
            data = self._parse_json_strict(content)
            print("---------- DATA ----------")
            print(data)
            print("---------- END DATA ----------")
            if not isinstance(data, dict):
                raise ValueError("Non-dict JSON response")
            return ValidatorResult(
                summary=str(data.get("summary",content_summary)).strip(),
                label=bool(data.get("label", False)),
                reason=str(data.get("reason", "")).strip(),
                category=self._normalize_category(str(data.get("category", "Low"))),
            )
        except Exception:
            # On any failure, return a conservative, non-blocking result
            return fallback

    def _normalize_category(self, cat: str) -> str:
        c = (cat or "").strip().lower()
        if c.startswith("hi"):
            return "High"
        if c.startswith("me") or c == "med":
            return "Medium"
        return "Low"

    def _parse_json_strict(self, text: str) -> Dict[str, Any]:
        """Parse JSON; if the model added stray text, extract the first JSON object."""
        text = (text or "").strip()
        # Fast path
        try:
            return json.loads(text)
        except Exception:
            pass
        # Fallback: extract first top-level JSON object
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        raise ValueError("No JSON object found in response")

    def _safe_truncate(self, s: str, max_len: int) -> str:
        s = s or ""
        return s if len(s) <= max_len else s[: max_len - 3] + "..."


# Export a callable instance to match usage: `from sentinel_multiagent.agent_validator import sentinel_multiagent`
sentinel_multiagent = AgentValidator()

__all__ = ["AgentValidator", "ValidatorResult", "sentinel_multiagent"]