import time
from functools import wraps

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

    @wraps(original_invoke)
    def paused_invoke(input, *args, **kwargs):
        # Instead of calling once, we stream step-by-step
        for event in graph.stream(input, *args, **kwargs):
            print(f"⏸ Pausing {seconds}s before next node...")
            time.sleep(seconds)
            print(f"▶️ Node finished: {event}")
        return event  # final state/result

    graph.invoke = paused_invoke
    print(f"✅ my_pause applied: every node will pause {seconds}s before running.")
    return graph