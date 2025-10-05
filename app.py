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

@app.route('/api/executions/<execution_id>/security/override', methods=['POST'])
def override_security_flag(execution_id):
    """
    Accept or reject a security flag for a specific layer
    Used when user manually overrides security decision
    """
    try:
        data = request.get_json()

        print(f"🔐 Security override request: {data}")

        # Required fields from frontend
        layer = data.get('layer')  # 'L1', 'L2', 'L3', 'llama_guard'
        agent_name = data.get('agent_name')  # Agent name or 'Prompt'
        action = data.get('action')  # 'accept' or 'reject'
        reason = data.get('reason', '')
        user_id = data.get('user_id', 'admin')

        # Validation
        if not all([layer, agent_name, action]):
            return jsonify({"error": "Missing required fields"}), 400

        # Validate layer
        valid_layers = ['L1', 'L2', 'L3', 'llama_guard']
        if layer not in valid_layers:
            return jsonify({"error": f"Invalid layer. Must be one of: {valid_layers}"}), 400

        if action not in ['accept', 'reject']:
            return jsonify({"error": "Action must be 'accept' or 'reject'"}), 400

        # TODO: Add proper authentication/authorization check for user_id
        # This is currently a security vulnerability

        # Find execution
        execution = traces_collection.find_one({'execution_id': execution_id})
        if not execution:
            return jsonify({"error": "Execution not found"}), 404

        current_time = datetime.now(timezone.utc)

        # Handle prompt security override
        if agent_name == 'Prompt':
            override_path = f'prompt_security.{layer}.override'
            update_data = {
                '$set': {
                    f'{override_path}': {
                        'action': action,
                        'reason': reason,
                        'user_id': user_id,
                        'timestamp': current_time
                    }
                }
            }

            # Update overall status based on action
            if action == 'accept':
                update_data['$set']['overall_action'] = 'allowed'
                update_data['$set']['status'] = 'APPROVED'
            elif action == 'reject':
                # Keep the original blocked status if rejecting override
                update_data['$set']['overall_action'] = 'blocked'
                update_data['$set']['status'] = 'BLOCKED'

        # Handle agent security override
        else:
            # Find agent index
            agent_index = None
            for idx, agent in enumerate(execution.get('agents', [])):
                if agent['agent_name'] == agent_name:
                    agent_index = idx
                    break

            if agent_index is None:
                return jsonify({"error": f"Agent '{agent_name}' not found"}), 404

            override_path = f'agents.{agent_index}.sentinel_result.{layer}.override'
            update_data = {
                '$set': {
                    f'{override_path}': {
                        'action': action,
                        'reason': reason,
                        'user_id': user_id,
                        'timestamp': current_time
                    }
                }
            }

            # Update agent action based on override decision
            if action == 'accept':
                update_data['$set'][f'agents.{agent_index}.action'] = 'allowed'
            elif action == 'reject':
                update_data['$set'][f'agents.{agent_index}.action'] = 'blocked'

        # Update MongoDB
        result = traces_collection.update_one(
            {'execution_id': execution_id},
            update_data
        )

        if result.modified_count == 0:
            return jsonify({"error": "Failed to update"}), 500

        print(f"✅ Security override: {action.upper()} by {user_id}")
        print(f"   Execution: {execution_id}, Layer: {layer}, Agent: {agent_name}")

        return jsonify({
            "status": "success",
            "action": action,
            "execution_id": execution_id
        }), 200

    except Exception as e:
        print(f"❌ Error in security override: {e}")
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
    Mark an execution as completed and optionally store final state
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
        
        # Prepare update data
        update_data = {
            'status': 'COMPLETED',
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
        
        print(f"✅ Execution {execution_id} marked as COMPLETED")
        
        return jsonify({
            "status": "success",
            "execution_id": execution_id,
            "message": "Execution marked as completed"
        }), 200
        
    except Exception as e:
        print(f"❌ Error marking execution as completed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=False, port=9000, host='127.0.0.1')