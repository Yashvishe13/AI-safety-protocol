import time
import sys
import os
from functools import wraps
from guard import scan_and_print
from sentinel_semantic.llamaguard_client import LlamaGuardClient

# Import safety checker
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sentinel_backdoor'))
try:
    from backdoor_guard import check_code_safety
except:
    check_code_safety = None

lg = LlamaGuardClient()

def run(graph, context, seconds=1):
    """
    Run a compiled graph with pauses between steps.
    Usage: 
        graph = builder.compile()
        import my_pause
        result = my_pause.run(graph, context=initial_state, seconds=5)
    """
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
                print("\n" + "="*60)
                print(f"🤖 AGENT: {node_name.upper()}")
                print("="*60)
                
                # Extract and display the task/context
                if isinstance(node_output, dict):
                    # Try to identify the task
                    task = node_output.get('user_prompt', 
                           node_output.get('task', 
                           'Processing workflow step'))
                    print(f"📋 TASK: {task}")
                    print("-"*60)
                    
                    # Display the output based on what keys are present
                    print("📤 OUTPUT:")
                    for key, value in node_output.items():
                        # Skip certain keys that are too verbose or internal
                        if key in ['messages', 'user_prompt', 'task']:
                            continue
                        
                        # Format the value nicely
                        if isinstance(value, str) and len(value) > 200:
                            # Truncate long strings
                            display_value = value[:200] + "..."
                        else:
                            display_value = value
                        
                        print(f"  • {key}: {display_value}")
                        # Safety check for code outputs
                        # L1
                        try:
                            scan_and_print(str(value), filename="langgraph_event.txt", direction="output")
                        except Exception as e:
                            print(f"Error at L1: {e}")

                        # LlamaGuard
                        print("Calling LlamaGuard classify...", flush=True)
                        resp = lg.classify(text=str(value), policy_hint={
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

                        # L3
                        if check_code_safety and key in ['code', 'final_code'] and isinstance(value, str): safety = check_code_safety(value); print(f"    └─ Safety: {safety['label']} (score: {safety['score']:.3f})")
                else:
                    print(f"📤 OUTPUT: {node_output}")
                
                print("="*60)
                print(f"✅ {node_name} completed")
        
        # Pause before next node
        if event:
            print(f"⏸  Pausing {seconds}s before next node...")
            time.sleep(seconds)
    
    print(f"✅ Workflow completed after {node_count} steps.")
    
    # Return the final state (should be in the same format as graph.invoke())
    return final_state if final_state is not None else context