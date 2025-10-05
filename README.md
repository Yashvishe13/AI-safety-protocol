# AI Safety Protocol

A comprehensive multi-layered security framework for AI agents in enterprise workflows, powered by **Cerebras** and **Llama Guard**.

## 🎯 Motivation

As AI agents become deeply integrated into enterprise workflows, ensuring their safety and security becomes paramount. Our solution addresses the critical need for protecting AI systems from:

- **Jailbreaking attacks** that manipulate AI behavior
- **Backdoor attacks** planted in open-source LLMs
- **Destructive actions** like unauthorized database deletions
- **Suspicious prompts** from malicious actors

Unlike existing solutions that only protect single LLMs, our framework is designed for the multi-agent future of enterprise AI adoption, providing inclusive protection for both proprietary and open-source models.

## 🛡️ Multi-Layer Defense System

### L1: Sentinel CodeGuard
- **Regex-based code-aware protection**
- Detects jailbreaks, prompt injection, secrets, unsafe APIs
- Code-aware extraction to reduce false positives

### Llama Guard Integration
- **Semantic content moderation via Llama Guard**
- Intelligent analysis of natural language content
- 14 safety categories including malicious instructions and illegal activities
- Powered by Meta's Llama Guard model

### L2: Sentinel Backdoor
- **Advanced backdoor and malware detection**
- AST SQL checks and subprocess heuristics
- Optional CodeBERT embeddings with FAISS similarity
- Runtime tracing capabilities

### L3: Sentinel MultiAgent
- **Multi-agent validation and risk assessment**
- Powered by **Cerebras** for intelligent summarization
- Risk labeling (Low/Medium/High) for enterprise decision-making

## 🚀 Key Features

- **Multi-agent code generation** using LangGraph and Cerebras API
- **Real-time safety monitoring** with live telemetry streaming
- **Semantic moderation** via Llama Guard integration
- **Enterprise-ready** Flask UI with Server-Sent Events
- **Comprehensive protection** against various attack vectors

## 🏗️ Architecture

```
AI Safety Protocol
├── L1: Sentinel CodeGuard    # Regex-first protection
├── Llama Guard Integration   # Semantic moderation
├── L2: Sentinel Backdoor     # Advanced threat detection  
└── L3: Sentinel MultiAgent   # Cerebras-powered validation
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Cerebras API key
- Optional: Groq API key for Llama Guard

### Installation
```bash
git clone <repository-url>
cd AI-safety-protocol
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Environment Setup
```bash
export CEREBRAS_API_KEY=your_cerebras_key
export GROQ_API_KEY=your_groq_key  # Optional for Llama Guard
```

### Run the Application
```bash
python app.py
```

Open `http://localhost:5000` to access the web interface.

## 🔧 Core Components

### Multi-Agent Workflow
- **Planner**: Creates implementation strategies
- **Coder**: Generates code based on plans
- **Reviewer**: Evaluates code quality and safety
- **Refiner**: Produces production-ready output

### Safety Integration
- **Cerebras**: Powers the multi-agent validation layer
- **Llama Guard**: Provides semantic content moderation
- **CodeBERT**: Enables embedding-based threat detection

## 📊 API Endpoints

- `POST /generate` - Generate code with safety checks
- `GET /stream` - Real-time safety telemetry
- `POST /receive` - Internal safety data collection

## 🔒 Security Features

- **Code-aware extraction** reduces false positives
- **Multi-layered validation** ensures comprehensive protection
- **Real-time monitoring** provides immediate threat detection
- **Enterprise-grade** risk assessment and reporting

## 🛠️ Configuration

Customize safety rules in `sentinel_codeguard/config.py`:
- Adjust detection categories
- Configure action responses (block/warn/redact)
- Tune sensitivity levels

## ⚠️ Security Notice

This framework provides robust safety guardrails but should be used as part of a comprehensive security strategy. Always review generated code and implement additional security measures appropriate for your environment.

## 📄 License

See LICENSE file for details.

---

**Built for the future of enterprise AI - where safety meets innovation.**