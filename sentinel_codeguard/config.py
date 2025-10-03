from __future__ import annotations
from typing import Dict, List, Set
from dataclasses import dataclass, field

from .types import Category, Level


@dataclass
class Config:
    name: str = "Sentinel CodeGuard"
    description: str = "Code-aware guardrails for coding/code-gen LLM systems"
    level: Level = Level.MODERATE
    categories: Set[Category] = field(default_factory=lambda: {
        Category.JAILBREAK, Category.PROMPT_INJECTION, Category.MALICIOUS_INSTRUCTIONS,
        Category.SECRETS, Category.UNSAFE_CODE, Category.OBFUSCATION, Category.LICENSE_RISK
    })
    enable_cache: bool = True
    cache_ttl: int = 3600
    max_len: int = 20000
    max_parallel_checks: int = 4
    enable_llama_guard: bool = True
    actions: Dict[Category, List[str]] = field(default_factory=lambda: {
        Category.SECRETS: ["redact:secrets", "block_if_output"],
        Category.UNSAFE_CODE: ["warn", "require_review"],
        Category.JAILBREAK: ["block"],
        Category.PROMPT_INJECTION: ["block"],
        Category.MALICIOUS_INSTRUCTIONS: ["block"],
        Category.LICENSE_RISK: ["warn"],
        Category.OBFUSCATION: ["warn"],
    })


