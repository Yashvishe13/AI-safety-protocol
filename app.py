from flask import Flask, render_template, request, jsonify, Response
from flask_cors import CORS
from demo_agent.coding_agent import generate_code
from database import traces_collection
from datetime import datetime, timezone
from bson import ObjectId
import json
import queue

# Configuration
from config import API_RECEIVER_URL

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

def calculate_risk_and_action(sentinel_result):
    """Calculate overall risk level and action based on sentinel result"""
    # Determine action
    action = 'allowed'
    blocked_by = None

    if sentinel_result.get('L1', {}).get('flagged'):
        action = 'blocked'
        blocked_by = 'L1'
    elif sentinel_result.get('llama_guard', {}).get('flagged'):
        action = 'blocked'
        blocked_by = 'llama_guard'
    elif sentinel_result.get('L2', {}).get('flagged'):
        action = 'blocked'
        blocked_by = 'L2'
    elif sentinel_result.get('L3', {}).get('flagged'):
        action = 'blocked'
        blocked_by = 'L3'

    # Determine risk level
    categories = [
        sentinel_result.get('L1', {}).get('category'),
        sentinel_result.get('llama_guard', {}).get('category'),
        sentinel_result.get('L2', {}).get('category'),
        sentinel_result.get('L3', {}).get('category')
    ]

    if 'HIGH' in categories:
        overall_risk = 'CRITICAL'
    elif 'MEDIUM' in categories:
        overall_risk = 'HIGH'
    else:
        overall_risk = 'LOW'

    return action, blocked_by, overall_risk

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    data = request.get_json()
    prompt = data.get('prompt', '')
    print(f"Received Prompt: {prompt}")
    result = generate_code(prompt=prompt, max_iterations=2)
    return jsonify({'final_code': result.get('final_code', '')})

# Endpoint to receive data
@app.route('/receive', methods=['POST'])
def receive_data():
    try:
        data = request.get_json()
        print(f"📬 Received data via API:\n{data}")

        # Extract execution_id (required field)
        execution_id = data.get('execution_id')
        if not execution_id:
            return jsonify({"status": "error", "message": "execution_id is required"}), 400

        prompt = data.get('prompt')
        sentinel_result = data.get('sentinel_result', {})

        if prompt:  # New execution (prompt exists)
            action, blocked_by, overall_risk = calculate_risk_and_action(sentinel_result)

            # Create new execution document
            execution_doc = {
                'execution_id': execution_id,
                'user_prompt': prompt,
                'status': 'PROCESSING',
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'prompt_security': sentinel_result,
                'agents': [],
                'overall_risk': overall_risk,
                'overall_action': action,
                'blocked_by': blocked_by
            }

            try:
                result = traces_collection.insert_one(execution_doc)
                print(f"✅ Created new execution: {execution_id}")
            except Exception as e:
                print(f"❌ MongoDB insert error: {e}")
                return jsonify({"status": "error", "message": "Database error"}), 500

        else:  # Agent step (prompt is None)
            # Find existing execution
            execution = traces_collection.find_one({'execution_id': execution_id})
            if not execution:
                return jsonify({"status": "error", "message": "Execution not found"}), 404

            agent_name = data.get('agent_name')
            task = data.get('task')
            output = data.get('output')

            # Calculate action for this agent step
            action, _, _ = calculate_risk_and_action(sentinel_result)

            # Create agent object
            agent_data = {
                'agent_name': agent_name,
                'task': task,
                'output': output,
                'timestamp': datetime.now(timezone.utc),
                'sentinel_result': sentinel_result,
                'action': action
            }

            # Update document
            update_data = {
                '$push': {'agents': agent_data},
                '$set': {'updated_at': datetime.now(timezone.utc)}
            }

            # If action is blocked, update status
            if action == 'blocked':
                update_data['$set']['status'] = 'BLOCKED'

            try:
                traces_collection.update_one(
                    {'execution_id': execution_id},
                    update_data
                )
                print(f"✅ Updated execution {execution_id} with agent {agent_name}")
            except Exception as e:
                print(f"❌ MongoDB update error: {e}")
                return jsonify({"status": "error", "message": "Database error"}), 500

        # Broadcast to SSE subscribers (keep existing logic)
        try:
            message = json.dumps(data)
            for q in _sse_subscribers:
                try:
                    q.put_nowait(message)
                except Exception:
                    pass
        except Exception as e:
            print(f"SSE broadcast error: {e}")

        return jsonify({"status": "received", "execution_id": execution_id}), 200

    except Exception as e:
        print(f"❌ Receive endpoint error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# Simple in-memory list of subscriber queues for SSE
_sse_subscribers = []

@app.route('/stream')
def stream():
    q = queue.Queue()
    _sse_subscribers.append(q)

    def event_stream():
        try:
            while True:
                data = q.get()
                yield f"data: {data}\n\n"
        except GeneratorExit:
            pass
        finally:
            try:
                _sse_subscribers.remove(q)
            except ValueError:
                pass

    return Response(event_stream(), mimetype='text/event-stream')

# New API Endpoints
@app.route('/api/executions', methods=['GET'])
def get_executions():
    """Get recent executions (last 50)"""
    try:
        # Query recent executions
        executions = list(traces_collection.find()
                         .sort('created_at', -1)
                         .limit(50))

        # Convert ObjectId to string for JSON serialization
        for execution in executions:
            execution['_id'] = str(execution['_id'])

        return jsonify(executions), 200

    except Exception as e:
        print(f"❌ Error retrieving executions: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Add this endpoint after your existing /api/executions/<execution_id> endpoint
# Just before "if __name__ == '__main__':"

def recalculate_overall_status(execution):
    """
    Recalculate overall_action and overall_risk based on current state
    Returns: (overall_action, overall_risk, blocked_by)
    """
    prompt_flagged = False
    prompt_categories = []
    blocked_by_layer = None

    for layer in ['L1', 'L2', 'L3', 'llama_guard']:
        layer_data = execution.get('prompt_security', {}).get(layer, {})
        if layer_data.get('flagged'):
            prompt_flagged = True
            blocked_by_layer = layer
            prompt_categories.append(layer_data.get('category', 'LOW'))

    agents_flagged = False
    agent_categories = []

    for agent in execution.get('agents', []):
        for layer in ['L1', 'L2', 'L3', 'llama_guard']:
            layer_data = agent.get('sentinel_result', {}).get(layer, {})
            if layer_data.get('flagged'):
                agents_flagged = True
                if not blocked_by_layer:
                    blocked_by_layer = layer
                agent_categories.append(layer_data.get('category', 'LOW'))

    if prompt_flagged or agents_flagged:
        overall_action = 'blocked'
    else:
        overall_action = 'allowed'
        blocked_by_layer = None

    all_categories = prompt_categories + agent_categories

    if 'HIGH' in all_categories or 'CRITICAL' in all_categories:
        overall_risk = 'CRITICAL'
    elif 'MEDIUM' in all_categories:
        overall_risk = 'HIGH'
    else:
        overall_risk = 'LOW'

    return overall_action, overall_risk, blocked_by_layer


@app.route('/api/executions/<execution_id>/security/override', methods=['POST'])
def override_security_flag(execution_id):
    """
    Accept or reject a security flag for a specific layer
    When accepting, set flagged=false and category=LOW for that layer
    When rejecting agent, remove all subsequent agents and mark execution as REJECTED
    """
    try:
        data = request.get_json()

        layer = data.get('layer')
        agent_name = data.get('agent_name')
        action = data.get('action')
        reason = data.get('reason', '')
        user_id = data.get('user_id', 'admin')

        # Validation
        if not all([layer, agent_name, action]):
            return jsonify({"error": "Missing required fields"}), 400

        valid_layers = ['L1', 'L2', 'L3', 'llama_guard']
        if layer not in valid_layers:
            return jsonify({"error": f"Invalid layer. Must be one of: {valid_layers}"}), 400

        if action not in ['accept', 'reject']:
            return jsonify({"error": "Action must be 'accept' or 'reject'"}), 400

        # Find execution
        execution = traces_collection.find_one({'execution_id': execution_id})
        if not execution:
            return jsonify({"error": "Execution not found"}), 404

        current_time = datetime.now(timezone.utc)

        # Handle prompt security override
        if agent_name == 'Prompt':
            layer_path = f'prompt_security.{layer}'
            current_flagged = execution.get('prompt_security', {}).get(layer, {}).get('flagged', False)
            current_category = execution.get('prompt_security', {}).get(layer, {}).get('category', 'LOW')

            if action == 'accept':
                update_data = {
                    '$set': {
                        f'{layer_path}.flagged': False,
                        f'{layer_path}.category': 'LOW',
                        f'{layer_path}.override': {
                            'action': action,
                            'reason': reason,
                            'user_id': user_id,
                            'timestamp': current_time,
                            'original_flagged': current_flagged,
                            'original_category': current_category
                        }
                    }
                }
            else:  # reject prompt
                # Set all prompt_security layers to false
                prompt_security_clean = {}
                for reject_layer in ['L1', 'L2', 'L3', 'llama_guard']:
                    prompt_security_clean[f'prompt_security.{reject_layer}.flagged'] = False
                    prompt_security_clean[f'prompt_security.{reject_layer}.category'] = 'LOW'

                # Add override to rejected layer
                prompt_security_clean[f'{layer_path}.override'] = {
                    'action': action,
                    'reason': reason,
                    'user_id': user_id,
                    'timestamp': current_time
                }

                update_data = {
                    '$set': {
                        **prompt_security_clean,
                        'overall_action': 'rejected',  # ✅ Changed from 'blocked'
                        'status': 'REJECTED',
                        'rejected_by': user_id,
                        'rejected_reason': reason,
                        'rejected_at': current_time,
                        'agents': []  # Remove all agents
                    }
                }

        # Handle agent security override
        else:
            agent_index = None
            for idx, agent in enumerate(execution.get('agents', [])):
                if agent['agent_name'] == agent_name:
                    agent_index = idx
                    break

            if agent_index is None:
                return jsonify({"error": f"Agent '{agent_name}' not found"}), 404

            current_flagged = execution['agents'][agent_index]['sentinel_result'][layer].get('flagged', False)
            current_category = execution['agents'][agent_index]['sentinel_result'][layer].get('category', 'LOW')
            current_action = execution['agents'][agent_index].get('action', 'unknown')

            layer_path = f'agents.{agent_index}.sentinel_result.{layer}'

            if action == 'accept':
                update_data = {
                    '$set': {
                        f'{layer_path}.flagged': False,
                        f'{layer_path}.category': 'LOW',
                        f'{layer_path}.override': {
                            'action': action,
                            'reason': reason,
                            'user_id': user_id,
                            'timestamp': current_time,
                            'original_flagged': current_flagged,
                            'original_category': current_category
                        },
                        f'agents.{agent_index}.action': 'allowed'
                    }
                }
            else:  # reject agent
                # Keep only agents up to and including the rejected one
                agents_to_keep = execution['agents'][:agent_index + 1]

                # Mark the rejected agent with rejection metadata
                agents_to_keep[agent_index]['rejected'] = True
                agents_to_keep[agent_index]['rejected_by'] = user_id
                agents_to_keep[agent_index]['rejected_reason'] = reason
                agents_to_keep[agent_index]['rejected_at'] = current_time
                agents_to_keep[agent_index]['action'] = 'rejected'  # ✅ Changed from 'blocked'

                # Set all flags to false in rejected agent
                for reject_layer in ['L1', 'L2', 'L3', 'llama_guard']:
                    agents_to_keep[agent_index]['sentinel_result'][reject_layer]['flagged'] = False
                    agents_to_keep[agent_index]['sentinel_result'][reject_layer]['category'] = 'LOW'

                # ✅ NEW: Set all prompt_security flags to false
                prompt_security_clean = {}
                for reject_layer in ['L1', 'L2', 'L3', 'llama_guard']:
                    prompt_security_clean[f'prompt_security.{reject_layer}.flagged'] = False
                    prompt_security_clean[f'prompt_security.{reject_layer}.category'] = 'LOW'

                update_data = {
                    '$set': {
                        **prompt_security_clean,  # ✅ NEW: Clean prompt security
                        'agents': agents_to_keep,
                        'overall_action': 'rejected',  # ✅ Changed from 'blocked'
                        'status': 'REJECTED',
                        'rejected_by': user_id,
                        'rejected_reason': reason,
                        'rejected_at': current_time,
                        'rejected_agent': agent_name,
                        'rejected_layer': layer
                    }
                }

        # Update MongoDB
        result = traces_collection.update_one(
            {'execution_id': execution_id},
            update_data
        )

        if result.modified_count == 0:
            return jsonify({"error": "Failed to update"}), 500

        # Only recalculate if action was accept
        if action == 'accept':
            updated_execution = traces_collection.find_one({'execution_id': execution_id})
            old_overall_action = updated_execution.get('overall_action')
            old_overall_risk = updated_execution.get('overall_risk')

            new_overall_action, new_overall_risk, new_blocked_by = recalculate_overall_status(updated_execution)

            if new_overall_action != old_overall_action or new_overall_risk != old_overall_risk:
                new_status = 'APPROVED' if new_overall_action == 'allowed' else 'BLOCKED'

                status_update = {
                    '$set': {
                        'overall_action': new_overall_action,
                        'overall_risk': new_overall_risk,
                        'blocked_by': new_blocked_by,
                        'status': new_status,
                        'updated_at': current_time
                    }
                }

                traces_collection.update_one(
                    {'execution_id': execution_id},
                    status_update
                )

        # Get final state
        final_execution = traces_collection.find_one({'execution_id': execution_id})

        return jsonify({
            "status": "success",
            "action": action,
            "execution_id": execution_id,
            "layer": layer,
            "agent_name": agent_name,
            "overall_status": {
                "overall_action": final_execution.get('overall_action'),
                "overall_risk": final_execution.get('overall_risk'),
                "status": final_execution.get('status')
            },
            "agents_remaining": len(final_execution.get('agents', [])),
            "changes": {
                "flagged": f"{current_flagged} → False" if action == 'accept' else "rejected",
                "category": f"{current_category} → LOW" if action == 'accept' else "rejected"
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/executions/<execution_id>', methods=['GET'])
def get_execution_detail(execution_id):
    """Get detailed information about a specific execution"""
    try:
        execution = traces_collection.find_one({'execution_id': execution_id})

        if not execution:
            return jsonify({"status": "error", "message": "Execution not found"}), 404

        # Convert ObjectId to string for JSON serialization
        execution['_id'] = str(execution['_id'])

        return jsonify(execution), 200

    except Exception as e:
        print(f"❌ Error retrieving execution {execution_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/executions/final_state", methods=["POST"])
def get_final_state():
    """
    Mark an execution as completed, store final state, and retrieve all flagged values
    """
    try:
        data = request.get_json()
        execution_id = data.get('execution_id')
        final_state = data.get('final_state')
        
        
        if not execution_id:
            return jsonify({"status": "error", "message": "execution_id is required"}), 400
        
        # Find the execution
        execution = traces_collection.find_one({'execution_id': execution_id})
        if not execution:
            return jsonify({"status": "error", "message": "Execution not found"}), 404
        
        # Extract all flagged values from prompt_security
        prompt_security = execution.get('prompt_security', {})
        prompt_flags = {
            'L1': prompt_security.get('L1', {}).get('flagged', False),
            'llama_guard': prompt_security.get('llama_guard', {}).get('flagged', False),
            'L2': prompt_security.get('L2', {}).get('flagged', False),
            'L3': prompt_security.get('L3', {}).get('flagged', False)
        }
        
        # Extract all flagged values from agents
        agents_flags = []
        for agent in execution.get('agents', []):
            agent_name = agent.get('agent_name', 'unknown')
            sentinel_result = agent.get('sentinel_result', {})
            agent_flags = {
                'agent_name': agent_name,
                'L1': sentinel_result.get('L1', {}).get('flagged', False),
                'llama_guard': sentinel_result.get('llama_guard', {}).get('flagged', False),
                'L2': sentinel_result.get('L2', {}).get('flagged', False),
                'L3': sentinel_result.get('L3', {}).get('flagged', False)
            }
            agents_flags.append(agent_flags)
        
        # Check if any flags are True
        any_prompt_flagged = any(prompt_flags.values())
        any_agent_flagged = any(
            agent_flag for agent in agents_flags 
            for key, agent_flag in agent.items() 
            if key != 'agent_name'
        )
        
        # Determine status based on flagged values
        # If all are false → COMPLETED, if any are true → PROCESSING
        any_flagged = any_prompt_flagged or any_agent_flagged
        execution_status = 'PROCESSING' if any_flagged else 'COMPLETED'
        
        # Prepare update data
        update_data = {
            'status': execution_status,
            'updated_at': datetime.now(timezone.utc)
        }
        
        # Add final state if provided
        if final_state is not None:
            update_data['final_state'] = final_state
        
        # Update status to COMPLETED
        result = traces_collection.update_one(
            {'execution_id': execution_id},
            {'$set': update_data}
        )
        
        if result.modified_count == 0:
            return jsonify({"status": "error", "message": "Failed to update execution"}), 500
        
        print(f"✅ Execution {execution_id} marked as {execution_status}")
        print(f"   Prompt flagged: {any_prompt_flagged}, Agents flagged: {any_agent_flagged}")
        
        return jsonify({
            "status": "success",
            "execution_id": execution_id,
            "execution_status": execution_status,
            "message": f"Execution marked as {execution_status.lower()}",
            "flagged_summary": {
                "prompt": prompt_flags,
                "agents": agents_flags,
                "any_prompt_flagged": any_prompt_flagged,
                "any_agent_flagged": any_agent_flagged,
                "any_flagged": any_flagged
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error marking execution as completed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=False, port=9000, host='127.0.0.1')
