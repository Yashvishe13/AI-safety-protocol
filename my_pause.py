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


def pause_step(seconds=5, label="next step"):
    """
    Pause helper for non-LangGraph flows.
    Prints a message, sleeps for N seconds, then prints resume message.
    """
    print(f"⏸ Pausing {seconds}s before {label}...")
    time.sleep(seconds)
    print(f"▶️ Resuming: {label}")


def instrument_workflow_engine(workflow_engine, *, seconds=5, moderation_fn=None):
    """
    Monkey-patch a workflow engine to pause before each agent and optionally
    call a moderation function with (agent_name, result) after each step.
    This avoids modifying the engine's source code.
    """
    original_execute = workflow_engine.__class__.execute_workflow
    original_continue = workflow_engine.__class__._continue_workflow

    def execute_workflow_patched(self, initial_agent, task, initial_data=None, **kwargs):
        return original_execute(
            self,
            initial_agent,
            task,
            initial_data,
            pause_seconds=seconds,
            moderation_hook=moderation_fn,
        )

    def continue_patched(self, current_agent, context, **kwargs):
        return original_continue(
            self,
            current_agent,
            context,
            pause_seconds=seconds,
            moderation_hook=moderation_fn,
        )

    workflow_engine.__class__.execute_workflow = execute_workflow_patched
    workflow_engine.__class__._continue_workflow = continue_patched
    print(f"✅ my_pause: workflow engine instrumented (pause {seconds}s per step)")
    return workflow_engine