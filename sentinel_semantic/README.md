# Sentinel Semantic

Semantic moderation via **Llama Guard** for AI-generated content.

## Overview

Sentinel Semantic provides intelligent content moderation using Llama Guard, complementing regex-based detection with semantic understanding. It focuses on natural language content within code comments and strings.

## Key Features

- **Llama Guard Integration**: Powered by Meta's Llama Guard model
- **Dual API Support**: Groq SDK and custom HTTP endpoints
- **Code-Focused**: Optimized for code comments and string content
- **Configurable Policies**: Flexible moderation levels and categories
- **Graceful Fallback**: Safe operation when Llama Guard is unavailable

## Supported Categories

- **Hate/Harassment** (S1)
- **Violence/Crime** (S2)
- **Self-harm/Suicide** (S3)
- **Sexual Content** (S4)
- **Child Safety** (S5)
- **Privacy/PII** (S6)
- **Weapons/Illicit Goods** (S7)
- **Drugs/Controlled Substances** (S8)
- **Terrorism/Extremism** (S9)
- **Fraud/Scams** (S10)
- **Medical Misinformation** (S11)
- **Political Misinformation** (S12)
- **Financial Risk** (S13)
- **Spam/Malware** (S14)

## Usage

### Basic Usage
```python
from sentinel_semantic.llamaguard_client import LlamaGuardClient

client = LlamaGuardClient()
result = client.classify(
    text="I want to hack into a system",
    policy_hint={
        "level": "moderate",
        "categories": ["malicious_instructions", "illegal_activities"],
        "direction": "output",
        "focus": "code_comments_and_strings"
    }
)

if result and result.get("flagged"):
    print("Content flagged:", result["categories"])
```

### Integration with CodeGuard
```python
from sentinel_codeguard import CodeGuard, Config

# Enable Llama Guard integration
config = Config(enable_llama_guard=True)
guard = CodeGuard(config)
result = guard.scan_prompt("suspicious content")
```

## Configuration

### Environment Variables
- `GROQ_API_KEY`: Required for Groq SDK integration
- `GROQ_LLAMAGUARD_MODEL`: Model name (default: "meta-llama/llama-guard-4-12b")
- `LLAMAGUARD_API_URL`: Custom HTTP endpoint
- `LLAMAGUARD_API_KEY`: API key for custom endpoint

### API Modes

#### Groq SDK (Recommended)
```bash
export GROQ_API_KEY=your_groq_key
export GROQ_LLAMAGUARD_MODEL=meta-llama/llama-guard-4-12b
```

#### Custom HTTP Endpoint
```bash
export LLAMAGUARD_API_URL=https://your-llama-guard/classify
export LLAMAGUARD_API_KEY=your_api_key
```

## Response Format

```json
{
  "flagged": true,
  "categories": ["malicious_instructions"],
  "reason": "Harmful intent detected",
  "confidence": 0.86
}
```

## Integration

Sentinel Semantic integrates with:
- **Sentinel CodeGuard**: Provides semantic validation layer
- **Enterprise Workflows**: Configurable for different moderation needs
- **Multi-Agent Systems**: Validates agent-generated content

## Error Handling

- **Graceful Degradation**: Safe operation when Llama Guard is unavailable
- **Detailed Logging**: Comprehensive error reporting
- **Retry Logic**: Robust handling of API failures
- **Fallback Behavior**: Returns safe defaults on errors