import os
from typing import Any, Dict, Optional

from .logger import log


class LlamaGuardClient:
    def __init__(self):
        self.url = os.getenv("LLAMAGUARD_API_URL")
        self.key = os.getenv("LLAMAGUARD_API_KEY")
        if not self.url or not self.key:
            log.warning("Llama Guard API not configured; semantic layer will be skipped.")

    def classify(self, text: str, policy_hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not (self.url and self.key):
            return None
        return None


