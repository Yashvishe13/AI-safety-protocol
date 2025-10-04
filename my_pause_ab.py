import time
<<<<<<< HEAD:my_pause_ab.py
from functools import wraps
from guard import scan_and_print
from sentinel_semantic.llamaguard_client import LlamaGuardClient
=======
>>>>>>> main:my_pause.py

def run(graph, context, seconds=1):
    """
    Run a compiled graph with pauses between steps.
    Usage: 
        graph = builder.compile()
        import my_pause
        result = my_pause.run(graph, context=initial_state, seconds=5)
    """
<<<<<<< HEAD:my_pause_ab.py
    # Save original invoke
    original_invoke = graph.invoke

    # Reuse a single LlamaGuard client to reduce repeated init logs
    lg = LlamaGuardClient()

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
                print("Calling LlamaGuard classify...", flush=True)
                resp = lg.classify(text=str(event), policy_hint={
                    "level": "moderate",
                    "categories": [
                        "malicious_instructions", "illegal_activities",
                        "prompt_injection", "jailbreak_attempt"
                    ],
                    "direction": "output",
                    "focus": "code_comments_and_strings",
                })
                if resp is not None:
                    print("=== LlamaGuard ===", flush=True)
                    print(resp, flush=True)
            except Exception as _:
                pass
        return event  # final state/result

    graph.invoke = paused_invoke
    print(f"✅ my_pause applied: every node will pause {seconds}s before running.")
    return graph
=======
    print(f"✅ my_pause: Running with {seconds}s pauses between nodes.")
    
    final_state = None
    node_count = 0
    
    for event in graph.stream(context):
        node_count += 1
        print(f"▶️ Step {node_count}: Processing node(s): {list(event.keys())}")
        
        # Update final_state with the latest event data
        # Each event is a dict with node names as keys and their output states as values
        for node_name, node_output in event.items():
            if node_name != '__end__':
                final_state = node_output
                print("--------------AGENT OUTPUT------------------")
                print(final_state)
                print(f"   └─ {node_name} completed")
        
        # Pause before next node
        if event:
            print(f"⏸  Pausing {seconds}s before next node...")
            time.sleep(seconds)
    
    print(f"✅ Workflow completed after {node_count} steps.")
    
    # Return the final state (should be in the same format as graph.invoke())
    return final_state if final_state is not None else context
>>>>>>> main:my_pause.py
