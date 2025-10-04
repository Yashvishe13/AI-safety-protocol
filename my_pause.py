import time
import sys
import os
import threading
import requests
from functools import wraps
from flask import Flask, request, jsonify
from guard import scan_and_print
from sentinel_semantic.llamaguard_client import LlamaGuardClient

# Import safety checker
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sentinel_backdoor'))
try:
    from backdoor_guard import check_code_safety
except:
    check_code_safety = None

lg = LlamaGuardClient()

# Configuration
API_RECEIVER_URL = "http://localhost:5000/receive"

app = Flask(__name__)

# Endpoint to receive data
@app.route('/receive', methods=['POST'])
def receive_data():
    data = request.get_json()
    print(f"📬 Received data via API:\n{data}")
    return jsonify({"status": "received"}), 200

# Start the Flask app in a separate thread
def start_flask():
    app.run(host="0.0.0.0", port=5000, debug=False)

flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()


def sentinel(value: str, key):
    print("---------- L1 - SENTINEL GUARD ----------")
    try:
        scan_and_print(str(value), filename="langgraph_event.txt", direction="output")
    except Exception as e:
        print(f"Error at L1: {e}")

    print("---------- L2 - LLAMA GUARD ----------")
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

    print("---------- L2 - BACKDOOR GUARD ----------")
    if check_code_safety and key in ['code', 'final_code'] and isinstance(value, str):
        safety = check_code_safety(value)
        print(f"    └─ Safety: {safety['label']} (score: {safety['score']:.3f})")


def send_agent_data(agent_name, task, output, prompt):
    try:
        data = {
            "agent_name": agent_name,
            "task": task,
            "output": output,
            "prompt": prompt
        }
        print(f"🌐 Sending data to API: {data}")
        response = requests.post(API_RECEIVER_URL, json=data)
        print(f"✅ API Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to send agent data: {e}")


def run(graph, context, prompt, seconds=1):
    print(f"✅ my_pause: Running with {seconds}s pauses between nodes.")
    print(f"📝 Prompt: {prompt}")
    sentinel(prompt, key=None)

    final_state = None
    node_count = 0

    for event in graph.stream(context):
        node_count += 1
        print(f"▶️ Step {node_count}: Processing node(s): {list(event.keys())}")

        for node_name, node_output in event.items():
            if node_name != '__end__':
                final_state = node_output
                print("\n" + "="*60)
                print(f"🤖 AGENT: {node_name.upper()}")
                print("="*60)

                if isinstance(node_output, dict):
                    task = node_output.get('user_prompt', node_output.get('task', 'Processing workflow step'))
                    print(f"📋 TASK: {task}")
                    print("-"*60)

                    output_summary = {}
                    print("📤 OUTPUT:")
                    for key, value in node_output.items():
                        if key in ['messages', 'user_prompt', 'task']:
                            continue
                        display_value = value[:200] + "..." if isinstance(value, str) and len(value) > 200 else value
                        print(f"  • {key}: {display_value}")
                        if value:
                            sentinel(value, key)
                            output_summary[key] = display_value
                        else:
                            print("No value to check")

                    send_agent_data(agent_name=node_name, task=task, output=output_summary, prompt=prompt)
                else:
                    print(f"📤 OUTPUT: {node_output}")
                    send_agent_data(agent_name=node_name, task="Unknown", output=str(node_output), prompt=prompt)

                print("="*60)
                print(f"✅ {node_name} completed")

        if event:
            print(f"⏸  Pausing {seconds}s before next node...")
            time.sleep(seconds)

    print(f"✅ Workflow completed after {node_count} steps.")
    return final_state if final_state is not None else context