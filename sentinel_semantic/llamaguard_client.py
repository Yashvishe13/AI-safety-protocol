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
    # ---- Static built-in mapping ----
    S_CODE_MAP: Dict[str, str] = {
        "S1":  "Hate / Harassment",
        "S2":  "Violence / Crime",
        "S3":  "Self-harm / Suicide",
        "S4":  "Sexual Content",
        "S5":  "Child Safety / Exploitation",
        "S6":  "Privacy / PII Exposure",
        "S7":  "Weapons / Illicit Goods",
        "S8":  "Drugs / Controlled Substances",
        "S9":  "Terrorism / Extremism",
        "S10": "Fraud / Scams / Deception",
        "S11": "Medical Misinformation",
        "S12": "Political Misinformation",
        "S13": "Financial Risk / Advice",
        "S14": "Spam / Malware / Abuse",
    }

    def __init__(self):
        # Supports two modes:
        # (1) HTTP endpoint (LLAMAGUARD_API_URL/KEY)
        # (2) Groq SDK with meta-llama/llama-guard-4-12b
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

    # -------------------- MAIN ENTRY --------------------
    def classify(self, text: str, policy_hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        configured = bool((self.url and self.key) or self._groq_client)
        print("=== LlamaGuard (client) ===")
        print({
            "configured": configured,
            "text_len": len(text or ""),
            "level": (policy_hint or {}).get("level"),
            "direction": (policy_hint or {}).get("direction"),
        })

        if not configured:
            logger.info("Skipping LlamaGuard call: not configured.")
            return None

        if self._groq_client is None:
            logger.debug("HTTP classify path not implemented; set GROQ_API_KEY to use Groq.")
            return None

        # Determine direction (input vs output screening)
        direction = (policy_hint or {}).get("direction", "input").lower()
        role = "assistant" if direction.startswith("out") else "user"

        try:
            completion = self._groq_client.chat.completions.create(
                model=self.groq_model,
                messages=[{"role": role, "content": text}],
                temperature=0,
                max_tokens=32,
            )
            content = completion.choices[0].message.content.strip() if completion.choices else ""
            result = self._parse_llamaguard_plain(content)

            if result is None:
                return {
                    "flagged": None,
                    "categories_codes": [],
                    "categories": [],
                    "reason": None,
                    "confidence": None,
                    "raw_text": content,
                }
            return result

        except Exception as e:
            logger.error("Groq classify error: %s", e)
            return None

    # -------------------- PARSER --------------------
    def _parse_llamaguard_plain(self, s: str) -> Optional[Dict[str, Any]]:
        """Parses plain-text LlamaGuard output ('safe' or 'unsafe\\nS2,S10...')"""
        if not s:
            return None

        raw = s.strip()
        low = raw.lower()

        if low.startswith("safe"):
            return {
                "flagged": False,
                "categories_codes": [],
                "categories": [],
                "reason": "safe",
                "confidence": None,
            }

        if low.startswith("unsafe"):
            lines = raw.splitlines()
            codes: list[str] = []
            if len(lines) >= 2:
                tail = ",".join(lines[1:])
                codes = [c.strip().upper() for c in re.split(r"[,\s]+", tail) if c.strip()]
            codes = [c for c in codes if re.match(r"^S\d+$", c)]

            # Map to human-readable labels
            labels = [self.S_CODE_MAP.get(c, f"Unknown ({c})") for c in codes]

            return {
                "flagged": True,
                "categories_codes": codes,
                "categories": labels,
                "reason": "unsafe",
                "confidence": None,
            }

        return None

    # -------------------- OPTIONAL JSON PARSERS (for backward use) --------------------
    def _parse_json_strict(self, s: str) -> Optional[Dict[str, Any]]:
        try:
            obj = json.loads(s)
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