#!/usr/bin/env python3
"""
Thin wrapper around the modular sentinel_codeguard package for backward compatibility.
Public API: Category, Level, Result, Config, CodeGuard, CodeGenFirewall
CLI demo preserved.
"""

from __future__ import annotations
import json

from sentinel_codeguard import Category, Level, Result, Config, CodeGuard, CodeGenFirewall
import os
from typing import Optional

# Lightweight helpers so other modules (e.g., shield.py) can call moderation
_GUARD_SINGLETON: Optional[CodeGuard] = None


def get_guard() -> CodeGuard:
    global _GUARD_SINGLETON
    if _GUARD_SINGLETON is None:
        _GUARD_SINGLETON = CodeGuard()
    return _GUARD_SINGLETON


def scan_text(text: str, filename: Optional[str] = None, direction: str = "output") -> Result:
    """
    Scan text with Sentinel CodeGuard and return the moderation Result.
    direction: "prompt" or "output".
    """
    guard = get_guard()
    if direction == "prompt":
        return guard.scan_prompt(text, filename=filename)
    return guard.scan_output(text, filename=filename)


def scan_and_print(text: str, filename: Optional[str] = None, direction: str = "output") -> Result:
    """
    Scan and print a concise JSON-like summary to stdout. Returns the Result.
    """
    res = scan_text(text, filename=filename, direction=direction)
    # Minimal, copy-safe printout (no external deps)
    print("=== Sentinel Moderation ===")
    print({
        "flagged": res.flagged,
        "categories": [c.value for c in res.categories],
        "actions": res.actions,
        "reason": res.reason,
        "confidence": res.confidence,
        "detection_method": res.detection_method,
    })
    return res


def is_suspicious(text: str, filename: Optional[str] = None, direction: str = "output") -> bool:
    """
    Convenience wrapper: True if flagged.
    """
    return scan_text(text, filename=filename, direction=direction).flagged


def scan_summary(summary_text: str) -> Result:
    """
    Convenience for scanning agent summaries.
    """
    return scan_text(summary_text, filename="summary.txt", direction="output")


__all__ = [
    "Category",
    "Level",
    "Result",
    "Config",
    "CodeGuard",
    "CodeGenFirewall",
]


if __name__ == "__main__":
    guard = CodeGuard()
    fw = CodeGenFirewall(guard)

    demo = r'''
# Example safe input
print("hello world this is Guard")
'''
    res = fw.generate(demo, filename="example.py")
    print(json.dumps(res, indent=2))


