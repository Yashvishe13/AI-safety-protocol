import os
import logging
from typing import Any, Dict, Optional


logger = logging.getLogger("sentinel.semantic.llamaguard")


class LlamaGuardClient:
    def __init__(self):
        self.url = os.getenv("LLAMAGUARD_API_URL")
        self.key = os.getenv("LLAMAGUARD_API_KEY")
        if not (self.url and self.key):
            logger.warning("LlamaGuard not configured (missing LLAMAGUARD_API_URL or LLAMAGUARD_API_KEY).")

    def classify(self, text: str, policy_hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Call your Llama Guard (or equivalent) classification endpoint.

        Required env:
          - LLAMAGUARD_API_URL
          - LLAMAGUARD_API_KEY

        Expected JSON response shape:
          {"flagged": bool, "categories": [str], "reason": str, "confidence": float}
        """
        configured = bool(self.url and self.key)

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

        # TODO: Implement your HTTP POST request here with requests or httpx.
        # For now, we log and no-op to avoid hard dependency.
        logger.debug("LlamaGuard HTTP call not implemented in client; returning None.")
        return None


