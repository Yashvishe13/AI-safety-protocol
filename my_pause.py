import time
import sys
import os
import threading
import requests
from functools import wraps
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
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
FLASK_PORT = int(os.getenv('FLASK_PORT', 8080))
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
API_RECEIVER_URL = f"http://localhost:{FLASK_PORT}/receive"

app = Flask(__name__)

# Endpoint to receive data
@app.route('/receive', methods=['POST'])
def receive_data():
    data = request.get_json()
    print(f"📬 Received data via API:\n{data}")
    return jsonify({"status": "received"}), 200

# Start the Flask app in a separate thread
def start_flask():
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.run(host=FLASK_HOST, port=FLASK_PORT, debug=debug_mode)

flask_thread = threading.Thread(target=start_flask, daemon=True)
flask_thread.start()


def sentinel(value: str, key):
    print("---------- L1 - SENTINEL GUARD ----------")
    try:
        res_l1 = scan_and_print(str(value), filename="langgraph_event.txt", direction="output")
        sentinel_l1 = {
            "flagged": res_l1.flagged,
            "reason": res_l1.reason,
            "category": "HIGH" if res_l1.flagged else "LOW",
        }
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

    llama_guard = {
        "flagged": True if str(resp).lower() == "safe" else False,
        "reason": "",
        "category": "LOW" if str(resp).lower() == "safe" else "HIGH",
    }
    backdoor_guard_l2 = {
        "flagged": False,
        "reason": "",
        "category": "",
    }
    print("---------- L2 - BACKDOOR GUARD ----------")
    if check_code_safety and key in ['code', 'final_code'] and isinstance(value, str):
        safety = check_code_safety(value)
        print(f"    └─ Safety: {safety['label']} (score: {safety['score']:.3f})")
        mapping_label = {
            "CLEAN": False,
            "SUSPICIOUS": True,
            "MALICIOUS": True,
        }
        backdoor_guard_l2 = {
            "label": mapping_label[safety['label']],
            "reason": "",
            "category": "HIGH" if safety['label'] == "MALICIOUS" else "LOW" if safety['label'] == "SUSPICIOUS" else "LOW",
        }

    sentinel_result = {
        "L1": sentinel_l1,
        "llama_guard": llama_guard,
        "L2": backdoor_guard_l2,
        "L3": {
            "flagged": False,
            "reason": "",
            "category": "",
        },
    }
    return sentinel_result


def send_agent_data(agent_name, task, output, prompt, sentinel_result):
    try:
        data = {
            "agent_name": agent_name,
            "task": task,
            "output": output,
            "prompt": prompt,
            "sentinel_result": sentinel_result,
        }
        print(f"🌐 Sending data to API: {data}")
        response = requests.post(API_RECEIVER_URL, json=data)
        print(f"✅ API Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to send agent data: {e}")


def run(graph, context, prompt, seconds=1):
    print(f"✅ my_pause: Running with {seconds}s pauses between nodes.")
    print(f"📝 Prompt: {prompt}")
    sentinel_result = sentinel(prompt, key=None)
    send_agent_data(agent_name="Prompt", task=prompt, output=None, prompt=prompt, sentinel_result=sentinel_result)

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
                            sentinel_result = sentinel(value, key)
                            output_summary[key] = display_value
                        else:
                            print("No value to check")

                    send_agent_data(agent_name=node_name, task=task, output=output_summary, prompt=None, sentinel_result=sentinel_result)
                else:
                    print(f"📤 OUTPUT: {node_output}")
                    send_agent_data(agent_name=node_name, task="Unknown", output=str(node_output), prompt=None, sentinel_result=sentinel_result)

                print("="*60)
                print(f"✅ {node_name} completed")

        if event:
            print(f"⏸  Pausing {seconds}s before next node...")
            time.sleep(seconds)

    print(f"✅ Workflow completed after {node_count} steps.")
    return final_state if final_state is not None else context
