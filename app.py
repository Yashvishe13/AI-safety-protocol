from flask import Flask, render_template, request, jsonify, Response
from demo_agent.coding_agent import generate_code
import json
import queue

app = Flask(__name__)


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
    data = request.get_json()
    print(f"📬 Received data via API:\n{data}")
    # Broadcast to any SSE subscribers
    try:
        message = json.dumps(data)
        for q in _sse_subscribers:
            try:
                q.put_nowait(message)
            except Exception:
                pass
    except Exception as e:
        print(f"SSE broadcast error: {e}")
    return jsonify({"status": "received"}), 200

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

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5000, threaded=True)