# my_pause.py
import time
import os
from functools import wraps
from graceful_integration import GracefulGuard

def run(graph, seconds=30):
    """
    Patch a compiled graph so that every step pauses before execution.
    Usage: 
        graph = builder.compile()
        import my_pause
        graph = my_pause.run(graph, seconds=5)
    """
    # Save original invoke
    original_invoke = graph.invoke
    guard = GracefulGuard()
    enforce = os.getenv("GRACEFUL_ENFORCE", "1") == "1"

    @wraps(original_invoke)
    def paused_invoke(input, *args, **kwargs):
        # Pre-check initial input through GraCeFul
        if enforce:
            decision = guard.assess({"input_text": str(input)})
            if decision.get("block"):
                raise RuntimeError(f"Blocked by GraCeFul: {decision.get('reason', '')}")
        # Instead of calling once, we stream step-by-step
        for event in graph.stream(input, *args, **kwargs):
            # Check each step/event through GraCeFul
            if enforce:
                step_decision = guard.assess({"input_text": str(input), "event_text": str(event)})
                if step_decision.get("block"):
                    raise RuntimeError(f"Blocked by GraCeFul: {step_decision.get('reason', '')}")
            print(f"⏸ Pausing {seconds}s before next node...")
            time.sleep(seconds)
            print(f"▶️ Node finished: {event}")
        return event  # final state/result

    graph.invoke = paused_invoke
    print(f"✅ my_pause applied: every node will pause {seconds}s before running.")
    return graph
