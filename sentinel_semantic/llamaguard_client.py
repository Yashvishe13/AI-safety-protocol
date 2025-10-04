import os
import json
import logging
import re
from typing import Any, Dict, Optional

try:
    from groq import Groq  # pip install groq
except Exception:  # pragma: no cover
    Groq = None


logger = logging.getLogger("sentinel.semantic.llamaguard")


class LlamaGuardClient:
    def __init__(self):
        # Two modes supported:
        # 1) HTTP endpoint (LLAMAGUARD_API_URL/LLAMAGUARD_API_KEY)
        # 2) Groq SDK using meta-llama/llama-guard-4-12b (GROQ_API_KEY)
        self.url = os.getenv("LLAMAGUARD_API_URL")
        self.key = os.getenv("LLAMAGUARD_API_KEY")
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_LLAMAGUARD_MODEL", "meta-llama/llama-guard-4-12b")
        self._groq_client = None
        if self.groq_key and Groq is not None:
            try:
                self._groq_client = Groq(api_key=self.groq_key)
                logger.info("LlamaGuard via Groq client initialized (model=%s)", self.groq_model)
            except Exception as e:
                logger.error("Failed to init Groq client: %s", e)
        elif not (self.url and self.key):
            logger.warning("LlamaGuard not configured (set GROQ_API_KEY or LLAMAGUARD_API_URL/KEY).")

    def classify(self, text: str, policy_hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call your Llama Guard (or equivalent) classification endpoint.

        Required env:
          - LLAMAGUARD_API_URL
          - LLAMAGUARD_API_KEY

        Expected JSON response shape:
          {"flagged": bool, "categories": [str], "reason": str, "confidence": float}
        """
        configured = bool((self.url and self.key) or self._groq_client)

        # Minimal console trace (mirrors guard.py style of quick, readable prints)
        summary = {
            "configured": configured,
            "text_len": len(text or ""),
            "level": (policy_hint or {}).get("level"),
            "categories": (policy_hint or {}).get("categories"),
            "direction": (policy_hint or {}).get("direction"),
        }
        print("=== LlamaGuard (client) ===")
        print(summary)

        logger.info("LlamaGuard classify called | configured=%s level=%s direction=%s",
                    configured, summary["level"], summary["direction"])

        if not configured:
            logger.info("Skipping LlamaGuard call: not configured.")
            return None

        # Prefer Groq if available
        if self._groq_client is not None:
            try:
                system_prompt = self._build_system_prompt(policy_hint)
                user_payload = {
                    "text": text,
                    "policy": policy_hint or {},
                }
                completion = self._groq_client.chat.completions.create(
                    model=self.groq_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_payload)},
                    ],
                    temperature=0,
                    max_tokens=256,
                )
                content = completion.choices[0].message.content if completion.choices else ""
                # TEMP: print raw model output for debugging/inspection
                print("=== LlamaGuard RAW ===", flush=True)
                print(content, flush=True)
                # Also print minimal completion info if content looks empty
                if not content:
                    try:
                        meta = {
                            "choices": len(completion.choices) if getattr(completion, "choices", None) else 0,
                            "model": getattr(completion, "model", None),
                        }
                    except Exception:
                        meta = {"choices": None, "model": None}
                    print("=== LlamaGuard COMPLETION META ===", flush=True)
                    print(meta, flush=True)
                parsed = self._parse_json_strict(content)
                if parsed is None:
                    parsed = self._parse_json_loose(content)
                # If still not parsed, return a fallback structure including raw text
                if parsed is None:
                    return {
                        "flagged": False,
                        "categories": [],
                        "reason": None,
                        "confidence": None,
                        "raw_text": content,
                    }
                return parsed
            except Exception as e:  # pragma: no cover
                logger.error("Groq classify error: %s", e)
                return None

        # Otherwise fallback to generic HTTP endpoint (implement if needed)
        # Intentionally left unimplemented to avoid hard dependency on 'requests'.
        logger.debug("HTTP classify path not implemented; set GROQ_API_KEY to use Groq.")
        return None

    def _build_system_prompt(self, policy_hint: Dict[str, Any]) -> str:
        level = (policy_hint or {}).get("level", "moderate")
        cats = ", ".join((policy_hint or {}).get("categories") or [])
        direction = (policy_hint or {}).get("direction", "output")
        focus = (policy_hint or {}).get("focus", "")
        return (
            "You are Llama Guard. Classify the provided text according to the policy.\n"
            f"Level: {level}\nCategories: {cats}\nDirection: {direction}\nFocus: {focus}\n"
            "Return ONLY a JSON object with keys: flagged (bool), categories (list of strings), "
            "reason (string), confidence (float)."
        )

    def _parse_json_strict(self, s: str) -> Optional[Dict[str, Any]]:
        try:
            obj = json.loads(s)
            # Minimal validation
            if isinstance(obj, dict) and "flagged" in obj and "categories" in obj:
                return obj
        except Exception:
            return None
        return None

    def _parse_json_loose(self, s: str) -> Optional[Dict[str, Any]]:
        try:
            m = re.search(r"\{[\s\S]*\}", s)
            if m:
                return self._parse_json_strict(m.group(0))
        except Exception:
            return None
        return None


