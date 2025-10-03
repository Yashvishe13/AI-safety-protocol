#!/usr/bin/env python3
"""
Thin wrapper around the modular sentinel_codeguard package for backward compatibility.
Public API: Category, Level, Result, Config, CodeGuard, CodeGenFirewall
CLI demo preserved.
"""

from __future__ import annotations
import json

from sentinel_codeguard import Category, Level, Result, Config, CodeGuard, CodeGenFirewall


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


