import time
from functools import wraps
from guard import scan_and_print
from sentinel_semantic.llamaguard_client import LlamaGuardClient

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
            # Sentinel moderation of each streamed event
            try:
                scan_and_print(str(event), filename="langgraph_event.txt", direction="output")
                # Optional: semantic moderation via Llama Guard
                lg = LlamaGuardClient()
                resp = lg.classify(text=str(event), policy_hint={
                    "level": "moderate",
                    "categories": [
                        "malicious_instructions", "illegal_activities",
                        "prompt_injection", "jailbreak_attempt"
                    ],
                    "direction": "output",
                    "focus": "code_comments_and_strings",
                })
                if resp:
                    print("=== LlamaGuard ===")
                    print(resp)
            except Exception as _:
                pass
        return event  # final state/result

    graph.invoke = paused_invoke
    print(f"✅ my_pause applied: every node will pause {seconds}s before running.")
    return graph