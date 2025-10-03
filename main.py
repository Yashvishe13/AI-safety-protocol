import os
import json
from guard import CodeGuard
import my_pause
from agent_framework.backend.advanced_orchestrator import AdvancedMultiAgentOrchestrator


def main():
    api_key = os.getenv("CEREBRAS_API_KEY", "")
    if not api_key:
        print("CEREBRAS_API_KEY not set. Skipping run.")
        return

    db_path = os.path.join(os.path.dirname(__file__), "agent_framework", "backend", "enterprise.db")
    model = os.getenv("CEREBRAS_MODEL", "llama3.1-8b")

    orchestrator = AdvancedMultiAgentOrchestrator(db_path, api_key, model)

    # Instrument the workflow engine via my_pause without editing engine code
    guard = CodeGuard()

    def moderation_fn(agent_name: str, result: dict):
        text_payload = json.dumps(result) if isinstance(result, dict) else str(result)
        mod = guard.scan_output(text_payload, filename=f"{agent_name}.json")
        print(f"=== Moderation for {agent_name} ===")
        print(json.dumps(mod.__dict__, indent=2))

    my_pause.instrument_workflow_engine(
        orchestrator.workflow_engine,
        seconds=int(os.getenv("PAUSE_SECONDS", "5")),
        moderation_fn=moderation_fn,
    )

    task = os.getenv("TASK", "Provide an overview of the employees and departments")
    print("🚀 Starting advanced workflow...")
    result = orchestrator.workflow_engine.execute_workflow(
        initial_agent="DataAnalysisPlannerAgent",
        task=task,
        initial_data={},
    )
    print("✅ Done. Final result:")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
