import time

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