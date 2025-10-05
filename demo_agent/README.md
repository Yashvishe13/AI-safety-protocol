# Demo Agent

Multi-agent code generation system powered by **Cerebras** and LangGraph.

## Overview

This module demonstrates a sophisticated multi-agent workflow for code generation, featuring specialized agents that collaborate to produce high-quality, production-ready code.

## Architecture

### Agent Roles
- **Planner**: Creates high-level implementation strategies
- **Coder**: Generates code based on plans and feedback
- **Reviewer**: Evaluates code quality, correctness, and safety
- **Refiner**: Produces polished, production-ready output

### Workflow
```
User Prompt → Planner → Coder → Reviewer → Refiner → Final Code
                    ↑         ↓
                    ←─────────┘
```

## Key Features

- **Cerebras Integration**: Powered by Cerebras API for intelligent agent reasoning
- **LangGraph Orchestration**: Uses LangGraph for state management and agent coordination
- **Iterative Refinement**: Agents can iterate based on feedback
- **Safety Integration**: Built-in safety checks via the Sentinel framework

## Usage

```python
from demo_agent.coding_agent import generate_code

# Generate code with multi-agent workflow
result = generate_code("Create a Python function to calculate fibonacci numbers")
print(result.final_code)
```

## Configuration

Set the following environment variables:
- `CEREBRAS_API_KEY`: Required for agent operations
- `CEREBRAS_MODEL`: Optional model override (default: "llama-3.1-8b")

## Integration

The demo agent integrates with the Sentinel safety framework:
- Each agent's output is automatically scanned for safety issues
- Real-time telemetry is provided during code generation
- Final output undergoes comprehensive safety validation
