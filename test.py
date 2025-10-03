#!/usr/bin/env python3
import os
import sys
import json

from agent_framework.backend.agents import MultiAgentOrchestrator
from guard import CodeGuard
from agent_framework.backend.advanced_orchestrator import AdvancedMultiAgentOrchestrator
from agent_framework.backend.agent_framework import AgentWorkflowEngine


def build_summary(agent_name, result) -> str:
    parts = []
    parts.append(f"Agent used: {agent_name}")
    parts.append("Available agents: SQL Agent, Analysis Agent, Ingestion Agent")

    if isinstance(result, dict):
        if "executive_summary" in result:
            parts.append("Executive summary:")
            parts.append(str(result.get("executive_summary", "")))
        elif "message" in result:
            parts.append(f"Message: {result.get('message')}")
        elif "error" in result:
            parts.append(f"Error: {result.get('error')}")
        else:
            parts.append("Result keys: " + ", ".join(result.keys()))
    else:
        parts.append(str(result))

    return "\n".join(parts)


def main() -> int:
    api_key = os.getenv("CEREBRAS_API_KEY")
    model = os.getenv("CEREBRAS_MODEL", "llama3.1-8b")

    if not api_key:
        print("CEREBRAS_API_KEY not set. Set it to run this test.")
        return 1

    db_path = os.path.join(os.path.dirname(__file__), "agent_framework", "backend", "enterprise.db")
    orchestrator = MultiAgentOrchestrator(db_path, api_key, model)
    advanced = AdvancedMultiAgentOrchestrator(db_path, api_key, model)

    user_input = "Provide an overview of the employees and departments, trends and key KPIs."
    if len(sys.argv) > 1:
        user_input = " ".join(sys.argv[1:])

    # Choose advanced workflow to demonstrate per-step pause + moderation
    wf = advanced.workflow_engine

    guard = CodeGuard()

    def moderation_hook(agent_name: str, result: dict):
        text_payload = json.dumps(result) if isinstance(result, dict) else str(result)
        mod = guard.scan_output(text_payload, filename=f"{agent_name}.json")
        print(f"=== Moderation for {agent_name} ===")
        print(json.dumps(mod.__dict__, indent=2))

    run = advanced.workflow_engine.execute_workflow(
        initial_agent="DataAnalysisPlannerAgent",
        task=user_input,
        initial_data={},
        pause_seconds=int(os.getenv("PAUSE_SECONDS", "5")),
        moderation_hook=moderation_hook,
    )
    print("=== Workflow Result ===")
    print(json.dumps(run, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())


