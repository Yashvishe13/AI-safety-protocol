from __future__ import annotations
from typing import List, Optional
from enum import Enum
from dataclasses import dataclass, field


class Category(str, Enum):
    JAILBREAK = "jailbreak_attempt"
    PROMPT_INJECTION = "prompt_injection"
    MALICIOUS_INSTRUCTIONS = "malicious_instructions"
    SECRETS = "secrets"
    PII = "personal_information"
    ILLEGAL = "illegal_activities"
    MISINFO = "misinformation"
    UNSAFE_CODE = "unsafe_code"
    LICENSE_RISK = "license_risk"
    OBFUSCATION = "obfuscation"
    CUSTOM = "custom"


class Level(str, Enum):
    STRICT = "strict"
    MODERATE = "moderate"
    PERMISSIVE = "permissive"


@dataclass
class Result:
    content_preview: str
    flagged: bool
    categories: List[Category] = field(default_factory=list)
    reason: Optional[str] = None
    confidence: Optional[float] = None
    detection_method: Optional[str] = None
    processing_time: Optional[float] = None
    actions: List[str] = field(default_factory=list)


