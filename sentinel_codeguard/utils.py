import hashlib


def md5(s: str) -> str:
    return hashlib.md5(s.encode("utf-8")).hexdigest()


def clip(s: str, n: int = 120) -> str:
    return s if len(s) <= n else s[:n] + "..."


