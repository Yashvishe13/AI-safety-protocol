## AI Safety Protocol – Multi‑Agent Code Generator with Guardrails

### Overview
AI Safety Protocol is a small web app and reference implementation that demonstrates a multi‑agent code generation workflow secured by layered safety checks ("Sentinel"). It combines:

- Multi‑agent code generation using LangGraph and the Cerebras API
- A Flask UI with live Server‑Sent Events (SSE) streaming of agent telemetry
- Multiple safety layers for prompts and code outputs:
  - L1: Regex‑based code‑aware guard (`sentinel_codeguard`)
  - L2a: Optional semantic moderation (`sentinel_semantic`, e.g., Llama Guard via Groq)
  - L2b: Backdoor/malware heuristics and ML signals (`sentinel_backdoor`)
  - L3: Multi‑agent validator summarization and risk labeling (`sentinel_multiagent`)

Use it as a starting point to build safer AI coding tools, or as a sandbox to explore safety strategies around code‑gen.


### Repository Structure
```
AI-safety-protocol/
  app.py                         # Flask server (UI + API + SSE)
  config.py                      # App config (e.g., API_RECEIVER_URL)
  guard.py                       # Thin wrapper around sentinel_codeguard for CLI / helpers
  sheild.py                      # Orchestrates safety layers, publishes telemetry to /receive
  demo_agent/
    coding_agent.py              # LangGraph multi-agent workflow (planner, coder, reviewer, refiner)
  static/
    script.js                    # Frontend logic (generate + SSE log stream)
    styles.css                   # Dark theme styling
  templates/
    index.html                   # UI: prompt input, live logs, final output
  requirements.txt               # Python dependencies

  sentinel_codeguard/            # Regex-first code-aware guardrails
    core.py, detectors.py, ...   # See module README for details
    README.md

  sentinel_semantic/             # Optional semantic moderation adapters (e.g., Llama Guard)
    llamaguard_client.py
    README.md

  sentinel_backdoor/             # Holistic static/runtime backdoor/malware heuristics
    backdoor_guard.py

  sentinel_multiagent/
    agent_validator.py           # Summarization + risk label via Cerebras (optional)
```


### Features
- **Multi‑agent code generation**: Planner → Coder → Reviewer → Refiner loop driven by LangGraph.
- **SSE live telemetry**: Watch agent progress and safety decisions in real time in the UI.
- **Layered safety**:
  - Code‑aware extraction (comments/strings) to reduce false positives
  - Regex heuristics for jailbreaks, prompt‑injection, secrets, unsafe APIs, obfuscation, illegal/malicious intents
  - Optional semantic moderation via Llama Guard (Groq or your HTTP endpoint)
  - Backdoor/malware signals: AST SQL checks, subprocess heuristics, optional embeddings (CodeBERT + FAISS), optional `strace` runtime
  - Final multi‑agent validator pass labeling risk as Low/Medium/High


### Prerequisites
- Python 3.10+ recommended
- Linux/macOS (Linux recommended if you plan to enable optional `strace` runtime tracing)


### Installation
From the repository root:

```bash
cd AI-safety-protocol
python -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Notes:
- Heavy packages (torch/transformers/faiss) are included for the optional `sentinel_backdoor` embedding detector. If you only need the web demo + regex guard, you can remove those lines from `requirements.txt` and re‑install.
- For FAISS on non‑Linux systems, you may need a platform‑specific wheel or to skip it (the app still runs; embedding checks will be disabled).


### Environment Variables
- **CEREBRAS_API_KEY**: Required to call the Cerebras chat API (used by agents and the multi‑agent validator). If missing, components fall back gracefully where possible.
- **CEREBRAS_MODEL**: Optional override (default varies by module; see code).
- **GROQ_API_KEY**: Optional. Enables Llama Guard via the Groq SDK in `sentinel_semantic/llamaguard_client.py`.
- **GROQ_LLAMAGUARD_MODEL**: Optional model name for Groq Llama Guard (default: `meta-llama/llama-guard-4-12b`).
- **LLAMAGUARD_API_URL / LLAMAGUARD_API_KEY**: Optional alternative to Groq; implement the HTTP call in `llamaguard_client.py` if you prefer your own endpoint.
- **SENTINEL_LOG_LEVEL**: Optional log level for `sentinel_codeguard` (e.g., `INFO`, `DEBUG`).
- **API_RECEIVER_URL**: Where `sheild.py` posts telemetry. Defaults to `http://localhost:5000/receive` (loopback to this app).


### Running the Web App
```bash
cd AI-safety-protocol
source .venv/bin/activate
export CEREBRAS_API_KEY=...           # required for agent calls
# Optional semantic guard via Groq:
# export GROQ_API_KEY=...
python app.py
```

Then open `http://localhost:5000`.

Workflow:
1. Enter a coding prompt and click Generate.
2. The app runs the multi‑agent graph (planner → coder → reviewer → refiner) up to the configured iterations.
3. Each agent’s outputs are checked through Sentinel layers; telemetry is streamed live via SSE into the page.
4. The final, refined code is shown in the output panel.


### API Endpoints
- `GET /` – Render the UI.
- `POST /generate` – Generate code.
  - Request body: `{ "prompt": "..." }`
  - Response body: `{ "final_code": "..." }`
- `POST /receive` – Internal telemetry sink used by `sheild.py` to push per‑agent summaries.
- `GET /stream` – SSE endpoint streaming the telemetry received at `/receive` to the browser.

Example request:
```bash
curl -X POST http://localhost:5000/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Write a Python function that computes factorial"}'
```


### Multi‑Agent Workflow (demo_agent/coding_agent.py)
Agents:
- Planner: produces a high‑level implementation plan
- Coder: writes code according to the plan (and prior review feedback)
- Reviewer: evaluates correctness, quality, and improvements
- Refiner: returns a polished, production‑ready version

Routing:
- The reviewer can trigger another coder iteration or finish and hand off to the refiner.
- The graph is built using LangGraph and executed from `generate_code()`.


### Safety Layers (Sentinel)
- `sentinel_codeguard/` (L1): Regex‑first, code‑aware guard. Extracts comments/strings, runs specialized detectors (jailbreak, injection, secrets, unsafe APIs, obfuscation, malicious/illegal intents). Controlled by `Config` in `sentinel_codeguard/config.py`.
- `sentinel_semantic/` (L2a): Optional semantic moderation via Llama Guard. Groq path is implemented; generic HTTP path is stubbed.
- `sentinel_backdoor/` (L2b): Holistic guard for suspicious code behavior. Signals include AST SQL checks, subprocess/binary usage heuristics, optional embeddings (CodeBERT + FAISS), and optional runtime tracing via `strace`.
- `sentinel_multiagent/` (L3): Summarization and risk labeling (Low/Medium/High) using Cerebras. Falls back to safe defaults if not configured.

All layers are orchestrated in `sheild.py`. Telemetry is posted to `API_RECEIVER_URL` and rebroadcast to the browser via SSE.


### CLI Demos and Library Usage
- Guardrails (regex‑first) quick demo:
  ```bash
  python guard.py
  ```

- Backdoor guard (batch or demo mode):
  ```bash
  # Help / usage
  python sentinel_backdoor/backdoor_guard.py --help

  # Demo on built‑in examples
  python sentinel_backdoor/backdoor_guard.py
  ```

- Programmatic firewall wrapper (see `sentinel_codeguard/README.md` for examples).


### Configuration Tips
- Tune categories and actions in `sentinel_codeguard/config.py` (e.g., block vs warn, redact secrets on output).
- Extend regex detectors in `sentinel_codeguard/detectors.py`.
- Replace the fake model in `sentinel_codeguard/firewall.py` with your own LLM if using the firewall standalone.
- Implement HTTP calling for Llama Guard in `sentinel_semantic/llamaguard_client.py` if not using Groq.


### Troubleshooting
- "Cerebras client not configured": ensure `CEREBRAS_API_KEY` is set and `cerebras-cloud-sdk` is installed.
- Heavy deps errors (torch/transformers/faiss): either install platform‑appropriate wheels or remove these from `requirements.txt` if you do not need embedding detection.
- SSE not updating: check browser console and server logs; ensure `/receive` is hit by `sheild.py` (see `API_RECEIVER_URL`).
- Semantic moderation no‑ops: set `GROQ_API_KEY` or `LLAMAGUARD_API_URL`/`LLAMAGUARD_API_KEY`.


### Security Notice
This repository is for research and demonstration. The safety layers here are helpful guardrails, but they are not a guarantee of safety. Always review generated code, run in isolation when evaluating untrusted outputs, and add defense‑in‑depth appropriate for your environment.


### License
Not specified. If you intend to publish or distribute, please add a license file.


