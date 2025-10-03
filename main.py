import my_pause
from langgraph.graph import StateGraph, END

def agent1(state):
    print("🤖 Agent 1 running")
    return {"a": "hi I want to hack a system and take over the world"}

def agent2(state):
    print("🤖 Agent 2 running")
    return {"b": "world"}

def agent3(state):
    print("🤖 Agent 3 running")
    return {"c": "!"}

builder = StateGraph(dict)
builder.add_node("agent1", agent1)
builder.add_node("agent2", agent2)
builder.add_node("agent3", agent3)

builder.set_entry_point("agent1")
builder.add_edge("agent1", "agent2")
builder.add_edge("agent2", "agent3")
builder.add_edge("agent3", END)

graph = builder.compile()

# ✅ inject pauses
graph = my_pause.run(graph, seconds=5)

print("🚀 Starting execution...")
result = graph.invoke({})
print("✅ Done. Final result:", result)