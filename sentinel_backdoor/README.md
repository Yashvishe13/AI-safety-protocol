# Sentinel Backdoor

Advanced backdoor and malware detection system using multiple detection techniques.

## Overview

Sentinel Backdoor provides comprehensive protection against malicious code patterns, backdoors, and malware through static analysis, ML-based detection, and optional runtime monitoring.

## Detection Methods

### Static Analysis
- **AST-based SQL detection**: Identifies suspicious database operations
- **Subprocess heuristics**: Detects potentially dangerous system calls
- **Binary usage patterns**: Flags suspicious executable invocations

### ML-Based Detection
- **CodeBERT embeddings**: Uses transformer-based code understanding
- **FAISS similarity search**: Detects code similar to known malicious patterns
- **Configurable thresholds**: Adjustable sensitivity for different environments

### Runtime Monitoring (Optional)
- **strace integration**: Monitors system calls during execution
- **Destructive action scoring**: Identifies potentially harmful operations
- **Isolated execution**: Safe testing environment for suspicious code

## Usage

### Command Line
```bash
# Demo with built-in examples
python backdoor_guard.py

# Process JSONL file
python backdoor_guard.py --input samples.jsonl --output results.jsonl

# Enable runtime tracing (Linux only)
python backdoor_guard.py --input samples.jsonl --output results.jsonl --enable-runtime
```

### Programmatic
```python
from sentinel_backdoor.backdoor_guard import BackdoorGuard

guard = BackdoorGuard()
result = guard.analyze_code(code_string)
print(f"Risk Level: {result.risk_level}")
```

## Configuration

### Thresholds
- `EMBEDDING_SIM_THRESHOLD`: Similarity threshold for embedding detection (default: 0.72)
- `ML_SCORE_THRESHOLD`: ML classifier threshold (default: 0.75)

### Dependencies
- `torch`: PyTorch for ML models
- `transformers`: Hugging Face transformers
- `faiss`: Facebook AI Similarity Search
- `numpy`: Numerical computations

## Safety Features

- **Isolated execution**: Runtime monitoring runs in controlled environments
- **Multiple detection layers**: Combines static and dynamic analysis
- **Configurable sensitivity**: Adjustable for different threat models
- **Detailed diagnostics**: Comprehensive reporting of detected issues

## Limitations

- Runtime monitoring requires Linux environment
- ML dependencies are heavy and optional
- Some patterns may require domain-specific tuning
