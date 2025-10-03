class CodeDetectors:
    JAILBREAK_PATTERNS = [
        r"(?i)ignore (previous|prior|above|earlier) (instructions|prompt|directives)",
        r"(?i)disregard (your|previous|prior) (instructions|programming|guidelines|training)",
        r"(?i)(pretend|role[- ]?play|imagine).*?(you are|you're).*(unfiltered|jailbroken|no rules|no restrictions)",
        r"(?i)(output|print|show|tell me) (your|the) (system prompt|instructions|guidelines)",
        r"(?i)from now on you (must|shall|will|should)",
        r"(?i)(DAN|uncensored|unethical|immoral)\b",
    ]

    PROMPT_INJECTION_PATTERNS = [
        r"(?i)new instructions\s*:",
        r"(?i)your new (instructions|prompt|directive)\s*:",
        r"(?i)<(system|user|assistant)>",
        r"(?i)\b(system|user|assistant)\s*:\s*",
    ]

    SECRET_PATTERNS = [
        r"-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----",
        r"AKIA[0-9A-Z]{16}",
        r"(?i)aws(.{0,20})?(secret|access)[^a-zA-Z0-9]?key(.{0,3})?[:=]\s*[A-Za-z0-9/+=]{20,}",
        r'"type"\s*:\s*"service_account"',
        r'"private_key"\s*:\s*"\-+BEGIN PRIVATE KEY\-+',
        r"(?i)azure(.{0,20})?(client|tenant|subscription).*[:=].{5,}",
        r"eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}",
        r"(?i)bearer\s+[A-Za-z0-9\.\-_~\+\/]{20,}",
        r"(?i)(xox[baprs]-[A-Za-z0-9\-]{10,})",
        r"(?i)(sk_live_[A-Za-z0-9]{16,})",
    ]

    UNSAFE_CODE_PATTERNS = [
        r"\beval\s*\(", r"\bexec\s*\(", r"\bcompile\s*\([^,]+,\s*['\"]exec['\"]\)",
        r"\bpickle\.load\s*\(", r"\bpickle\.loads\s*\(", r"\byaml\.load\s*\(",
        r"\bsubprocess\.Popen\s*\(.*shell\s*=\s*True", r"\bos\.system\s*\(",
        r"\bmarshal\.loads\s*\(", r"\bctypes\.CDLL\s*\(", r"\bdill\.loads\s*\(",
        r"\beval\s*\(", r"\bFunction\s*\(", r"\bchild_process\.exec\s*\(",
        r"\bObjectInputStream\b", r"\bbinaryFormatter\b", r"\bXMLDecoder\b",
    ]

    OBFUSCATION_PATTERNS = [
        r"[A-Za-z0-9+/]{80,}={0,2}",
        r"(?:\\x[0-9a-fA-F]{2}){16,}",
        r"(?:[01]{8}\s*){16,}",
        r"[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]",
        r"[А-Яа-яЁёΑ-Ωα-ω]",
    ]


