import time
import sys
import os
import threading
import requests
import uuid
from functools import wraps

from guard import scan_and_print
from sentinel_semantic.llamaguard_client import LlamaGuardClient
from sentinel_multiagent.agent_validator import sentinel_multiagent
from config import API_RECEIVER_URL
import re

# Import safety checker
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'sentinel_backdoor'))
try:
    from backdoor_guard import check_code_safety
except:
    check_code_safety = None


lg = LlamaGuardClient()

output_summary = ""


def sentinel(value: str, key):
    global output_summary
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
    resp = lg.classify(text=str(value), policy_hint={"direction": "output"})
    if resp is not None:
        print("=== LlamaGuard ===", flush=True)
        print(resp, flush=True)

    # Handle LlamaGuard response - if None (not configured), default to safe/low
    if resp is None:
        # LlamaGuard not configured, default to safe
        llama_guard = {
            "flagged": False,
            "reason": "LlamaGuard not configured",
            "category": "LOW",
        }
    else:
        print("---------- LlamaGuard Response ----------")
        print(resp)
        print("---------- END LlamaGuard Response ----------")
        # LlamaGuard is configured and returned a response
        llama_guard = {
            "flagged": True if "unsafe" in str(resp).lower() else False,
            "reason": resp.get("categories", ""),
            "category": "HIGH" if "unsafe" in str(resp).lower() else "LOW",
        }
        
        print("---------- print LlamaGuard Response ----------")
        print(llama_guard)
        print("---------- END LlamaGuard Response ----------")

    print("---------- L2 - BACKDOOR GUARD ----------")
    backdoor_guard_l2 = {"flagged": False, "reason": "", "category": ""}
    
    def _extract_code_blocks(text: str):
        # ```py\n...\n``` or ```\n...\n```
        return re.findall(r"```(?:[a-zA-Z0-9_+-]+)?\n(.*?)```", text, flags=re.S)

    if callable(check_code_safety) and isinstance(value, str) and value.strip():
        blocks = _extract_code_blocks(value)
        candidates = blocks if blocks else [value]  # ← if no code blocks, scan the whole value
        print("candidates:", candidates)
        worst = ("CLEAN", 0.0, None)
        for i, snippet in enumerate(candidates):
            res = check_code_safety(snippet)  # ← call guard directly on the value/snippet
            tag = f"block#{i}" if blocks else "full"
            print(f"    └─ {tag}: {res['label']} (score: {res['score']:.3f})")
            if res["label"] in ("SUSPICIOUS", "MALICIOUS") and res["score"] >= worst[1]:
                worst = (res["label"], res["score"], res)
        print("worst:", worst)
        label, score, best = worst
        mapping_flagged = {"CLEAN": False, "SUSPICIOUS": True, "MALICIOUS": True}
        backdoor_guard_l2["flagged"] = mapping_flagged[label]
        backdoor_guard_l2["category"] = "HIGH" if label == "MALICIOUS" else "LOW"
        if best:
            signals = best["details"].get("scores", {})
            brief = ", ".join(f"{k}:{v:.2f}" for k, v in signals.items() if v > 0)
            backdoor_guard_l2["reason"] = f"{label} (fused:{score:.2f}; {brief})"
    else:
        print("    └─ Skipping Backdoor Guard (value is not a non-empty string).")

    print("---------- L3 - MULTIAGENT VALIDATOR ----------")
    L3 = sentinel_multiagent(summary=output_summary+str(value))
    output_summary = L3.summary
    multiagent_result = {
        "flagged": L3.label,
        "reason": L3.reason,
        "category": L3.category,
    }
    sentinel_result = {
        "L1": sentinel_l1,
        "llama_guard": llama_guard,
        "L2": backdoor_guard_l2,
        "L3": multiagent_result,
    }
    return sentinel_result

def send_agent_data(agent_name, task, output, prompt, sentinel_result, execution_id,execution_time):
    try:
        data = {
            "agent_name": agent_name,
            "task": task,
            "output": output,
            "prompt": prompt,
            "sentinel_result": sentinel_result,
            "execution_id": execution_id,
            "execution_time": execution_time,
        }
        print(f"🌐 Sending data to API: {data}")
        response = requests.post(API_RECEIVER_URL, json=data)
        print(f"✅ API Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to send agent data: {e}")

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/executions/<execution_id>/security/override", methods=["POST"])
def receive_user_command():
    try:
        try:
            data = request.get_json(force=True)
        except:
            data = None
        print(f"📥 Received user command data: {data}")
        action = data.get("action")
        execution_id = data.get("execution_id")

        return jsonify({
            "status": "success",
            "received": data,
            "message": "Data from user received successfully.",
            "command": action,
            "execution_id": execution_id
        }), 200 if data else 400

    except Exception as e:
        print(f"❌ Error processing data: {e}")
        return jsonify({"status": "error", "error": str(e)}), 400

def send_final_state(final_state, execution_id):
    """Send final state to the API to mark execution as completed"""
    try:
        data = {
            "final_state": final_state,
            "execution_id": execution_id,
        }
        print(f"🏁 Sending final state to API: execution_id={execution_id}")
        response = requests.post(f"{API_RECEIVER_URL.replace('/receive', '')}/api/executions/final_state", json=data)
        print(f"✅ Final state API Response: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Failed to send final state: {e}")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)



def run(graph, context, prompt, seconds=30):
    execution_id = f"exec-{uuid.uuid4().hex[:8]}"
    print(f"✅ sheild: Running with {seconds}s pauses between nodes.")
    print(f"🆔 Execution ID: {execution_id}")
    print(f"📝 Prompt: {prompt}")
    sentinel_result = sentinel(prompt, key=None)
    send_agent_data(agent_name="Prompt", task=prompt, output=None, prompt=prompt, sentinel_result=sentinel_result, execution_id=execution_id,execution_time=0)

    final_state = None
    node_count = 0
    for event in graph.stream(context):
        if node_count == -1:
            break
        node_count += 1
        print(f"▶️ Step {node_count}: Processing node(s): {list(event.keys())}")

        for node_name, node_output in event.items():
            # start time 
            start_time = time.time()
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
                            print("----- Sentinel Result -----")
                            print(sentinel_result)
                            print("----- End Sentinel Result -----")
                            output_summary[key] = display_value
                        else:
                            print("No value to check")
                    end_time = time.time()
                    execution_time = end_time - start_time
                    print(f"Time taken: {execution_time} seconds")
                    send_agent_data(agent_name=node_name, task=task, output=output_summary, prompt=None, sentinel_result=sentinel_result, execution_id=execution_id,execution_time=execution_time)
                    
                else:
                    print(f"📤 OUTPUT: {node_output}")
                    send_agent_data(agent_name=node_name, task="Unknown", output=str(node_output), prompt=None, sentinel_result=sentinel_result, execution_id=execution_id,execution_time=0)

                print("="*60)
                print(f"✅ {node_name} completed")

        if event:
            print(f"⏸  Pausing {seconds}s before next node...")
            
            while True:
                status_code, response = receive_user_command()
                print("----- Response -----")
                print(response)
                if status_code == 200:
                    execution_id = response.get("execution_id")
                    print("----- Accept -----")
                    print(response.get("command"))
                    if str(response.get("command")).lower() == "accept":
                        new_data = {
                            "L1": {"flagged": False, "reason": "", "category": ""},
                            "llama_guard": {"flagged": False, "reason": "", "category": ""},
                            "L2": {"flagged": False, "reason": "", "category": ""},
                            "L3": {"flagged": False, "reason": "", "category": ""},
                        }
                        print("----- New Data -----")
                        print(new_data)
                        print("----- End New Data -----")
                        send_agent_data(agent_name=node_name, task=task, output=output_summary, prompt=None, sentinel_result=new_data, execution_id=execution_id,execution_time=execution_time)
                        break
                    else:
                        node_count = -1
                else:
                    print(f"❌ Error processing data: {response}")
                    break
            time.sleep(seconds)

    

    print(f"✅ Workflow completed after {node_count} steps.")
    if final_state:
        send_final_state(final_state, execution_id)
    return final_state if final_state is not None else context
