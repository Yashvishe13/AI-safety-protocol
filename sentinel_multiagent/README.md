# Sentinel MultiAgent

Multi-agent validation and risk assessment powered by **Cerebras**.

## Overview

Sentinel MultiAgent provides intelligent validation and risk assessment for AI-generated content using advanced language models. It serves as the final validation layer in the Sentinel framework.

## Key Features

- **Cerebras Integration**: Powered by Cerebras API for intelligent analysis
- **Risk Categorization**: Labels content as Low/Medium/High risk
- **Comprehensive Summarization**: Provides detailed analysis of content
- **Enterprise-Ready**: Designed for production AI safety workflows

## Components

### AgentValidator
The core validation engine that:
- Analyzes content for safety and compliance
- Generates risk assessments with detailed reasoning
- Provides actionable recommendations
- Integrates with the broader Sentinel framework

## Usage

```python
from sentinel_multiagent.agent_validator import AgentValidator

validator = AgentValidator()
result = validator.validate(
    content="Generated code content",
    context="Additional context information"
)

print(f"Risk Level: {result.category}")
print(f"Summary: {result.summary}")
print(f"Reason: {result.reason}")
```

## Configuration

### Environment Variables
- `CEREBRAS_API_KEY`: Required for Cerebras API access
- `CEREBRAS_MODEL`: Optional model override (default: "gpt-oss-120b")

### Model Settings
- **Temperature**: 0.3 (conservative for safety analysis)
- **Max Tokens**: 1024 (sufficient for detailed analysis)
- **Fallback**: Graceful degradation when Cerebras is unavailable

## Risk Categories

### Low Risk
- Content appears safe and compliant
- No concerning patterns detected
- Suitable for production use

### Medium Risk
- Some concerning elements detected
- Requires human review
- May need modification before use

### High Risk
- Significant safety concerns
- Should be blocked or heavily modified
- Requires immediate attention

## Integration

Sentinel MultiAgent integrates seamlessly with:
- **Sentinel CodeGuard**: Receives pre-filtered content
- **Sentinel Backdoor**: Incorporates malware detection results
- **Enterprise Workflows**: Provides actionable risk assessments

## Error Handling

- **Graceful Degradation**: Falls back to safe defaults when Cerebras is unavailable
- **Detailed Logging**: Comprehensive error reporting and debugging
- **Retry Logic**: Robust handling of API failures
