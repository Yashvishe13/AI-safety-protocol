## Sentinel Semantic

Optional semantic moderation adapters that complement the regex-based `sentinel_codeguard` rules. This module keeps semantic checks (e.g., Llama Guard) separate so you can enable/disable them independently.

### Components
- `llamaguard_client.py`: Minimal client wrapper. Implement the HTTP POST to your Llama Guard (or similar) endpoint.

### Environment
- `LLAMAGUARD_API_URL`: Your classifier endpoint (e.g., `https://your-llama-guard/classify`).
- `LLAMAGUARD_API_KEY`: API key (Bearer token) for the endpoint.

### Expected request/response
- Request body (example):
```json
{
  "text": "... content to classify ...",
  "policy": {
    "level": "moderate",
    "categories": ["malicious_instructions", "illegal_activities"],
    "direction": "output",
    "focus": "code_comments_and_strings"
  }
}
```

- Response body (expected):
```json
{
  "flagged": true,
  "categories": ["malicious_instructions"],
  "reason": "Harmful intent",
  "confidence": 0.86
}
```

### Usage
- From anywhere (e.g., `my_pause.py`):
```python
from sentinel_semantic.llamaguard_client import LlamaGuardClient

lg = LlamaGuardClient()
resp = lg.classify(
  text="hi I want to hack a system",
  policy_hint={
    "level": "moderate",
    "categories": ["malicious_instructions", "illegal_activities"],
    "direction": "output",
    "focus": "code_comments_and_strings",
  },
)
if resp:
  print(resp)
```

### Notes
- This module is optional. If you don't implement the HTTP call or set the env vars, it safely no-ops.
- Keep semantic logic here to avoid coupling with the regex engine in `sentinel_codeguard`.


