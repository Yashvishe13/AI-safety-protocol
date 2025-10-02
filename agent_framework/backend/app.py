"""
Flask Backend API for Multi-Agent Database Management
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from agents import MultiAgentOrchestrator
from advanced_orchestrator import AdvancedMultiAgentOrchestrator
import json

app = Flask(__name__, static_folder='../static', template_folder='../templates')
CORS(app)

# Configuration
DB_PATH = os.path.join(os.path.dirname(__file__), 'enterprise.db')
CEREBRAS_API_KEY = os.getenv('CEREBRAS_API_KEY', 'your-api-key-here')
CEREBRAS_MODEL = os.getenv('CEREBRAS_MODEL', 'llama3.1-8b')

# Initialize Multi-Agent Systems
# Keep simple orchestrator for backward compatibility
orchestrator = MultiAgentOrchestrator(DB_PATH, CEREBRAS_API_KEY, CEREBRAS_MODEL)

# Initialize advanced orchestrator for complex workflows
advanced_orchestrator = AdvancedMultiAgentOrchestrator(DB_PATH, CEREBRAS_API_KEY, CEREBRAS_MODEL)


@app.route('/')
def index():
    """Serve the main page"""
    return send_from_directory('../templates', 'index.html')


@app.route('/api/query', methods=['POST'])
def process_query():
    """Process natural language query through multi-agent system"""
    try:
        data = request.json
        user_query = data.get('query', '')
        
        if not user_query:
            return jsonify({
                "success": False,
                "error": "No query provided"
            }), 400
        
        result = orchestrator.route_request(user_query)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/sql', methods=['POST'])
def execute_sql():
    """Execute direct SQL query"""
    try:
        data = request.json
        sql_query = data.get('sql', '')
        
        if not sql_query:
            return jsonify({
                "success": False,
                "error": "No SQL query provided"
            }), 400
        
        result = orchestrator.sql_agent.execute_query(sql_query)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_data():
    """Perform data analysis using advanced multi-agent workflow"""
    try:
        data = request.json
        analysis_request = data.get('request', '')
        use_advanced = data.get('advanced', True)  # Use advanced by default
        
        if not analysis_request:
            return jsonify({
                "success": False,
                "error": "No analysis request provided"
            }), 400
        
        if use_advanced:
            # Use advanced multi-agent workflow
            result = advanced_orchestrator.advanced_analysis(analysis_request)
        else:
            # Use simple analysis (backward compatibility)
            result = orchestrator.analysis_agent.analyze_data(analysis_request)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/analyze/advanced', methods=['POST'])
def advanced_analyze():
    """Explicitly use advanced multi-agent workflow"""
    try:
        data = request.json
        analysis_request = data.get('request', '')
        
        if not analysis_request:
            return jsonify({
                "success": False,
                "error": "No analysis request provided"
            }), 400
        
        result = advanced_orchestrator.advanced_analysis(analysis_request)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/execution-log/<execution_id>', methods=['GET'])
def get_execution_log(execution_id):
    """Get execution log for a specific execution ID"""
    try:
        from agent_logger import get_logger
        logger = get_logger()
        
        # Get log file path
        log_file = logger.get_current_log_file()
        
        if not log_file or not os.path.exists(log_file):
            return jsonify({
                "success": False,
                "error": "Log file not found"
            }), 404
        
        # Read log file
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        return jsonify({
            "success": True,
            "log": log_data
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/logs', methods=['GET'])
def list_logs():
    """List all execution logs"""
    try:
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
        
        if not os.path.exists(log_dir):
            return jsonify({
                "success": True,
                "logs": []
            })
        
        log_files = []
        for filename in os.listdir(log_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(log_dir, filename)
                
                # Read basic info from log
                try:
                    with open(filepath, 'r') as f:
                        log_data = json.load(f)
                    
                    log_files.append({
                        "filename": filename,
                        "execution_id": log_data.get("execution_id", ""),
                        "task": log_data.get("task", ""),
                        "start_time": log_data.get("start_time", ""),
                        "status": log_data.get("status", ""),
                        "total_agents": log_data.get("total_agents", 0)
                    })
                except:
                    pass
        
        # Sort by start time (newest first)
        log_files.sort(key=lambda x: x.get("start_time", ""), reverse=True)
        
        return jsonify({
            "success": True,
            "logs": log_files
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/logs/<filename>', methods=['GET'])
def get_log_file(filename):
    """Get a specific log file by filename"""
    try:
        log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
        log_file = os.path.join(log_dir, filename)
        
        if not os.path.exists(log_file) or not filename.endswith('.json'):
            return jsonify({
                "success": False,
                "error": "Log file not found"
            }), 404
        
        with open(log_file, 'r') as f:
            log_data = json.load(f)
        
        return jsonify({
            "success": True,
            "log": log_data
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/ingest', methods=['POST'])
def ingest_data():
    """Ingest data into database"""
    try:
        data = request.json
        table_name = data.get('table_name', '')
        records = data.get('data', [])
        
        if not table_name or not records:
            return jsonify({
                "success": False,
                "error": "Table name and data required"
            }), 400
        
        result = orchestrator.ingestion_agent.ingest_json(records, table_name)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/schema', methods=['GET'])
def get_schema():
    """Get database schema"""
    try:
        schema = orchestrator.sql_agent.get_schema()
        return jsonify({
            "success": True,
            "schema": schema
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/tables', methods=['GET'])
def get_tables():
    """Get list of tables"""
    try:
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        # Get row count for each table
        table_info = []
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            table_info.append({"name": table, "rows": count})
        
        conn.close()
        
        return jsonify({
            "success": True,
            "tables": table_info
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/delete', methods=['POST'])
def delete_data():
    """Delete data from database"""
    try:
        data = request.json
        user_query = data.get('query', '')
        
        if not user_query:
            return jsonify({
                "success": False,
                "error": "No query provided"
            }), 400
        
        # Convert to SQL DELETE query
        sql_query = orchestrator.sql_agent.natural_language_to_sql(user_query)
        
        # Ensure it's a DELETE query
        if not sql_query.strip().upper().startswith('DELETE'):
            return jsonify({
                "success": False,
                "error": "Query must be a DELETE operation"
            }), 400
        
        result = orchestrator.sql_agent.execute_query(sql_query)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/api/text-to-sql', methods=['POST'])
def text_to_sql():
    """Convert natural language to SQL without executing"""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({
                "success": False,
                "error": "No text provided"
            }), 400
        
        # Convert to SQL
        sql_query = orchestrator.sql_agent.natural_language_to_sql(text)
        
        # Generate explanation
        explanation_messages = [
            {
                "role": "system",
                "content": "You are a SQL expert. Explain what the SQL query does in 1-2 simple sentences."
            },
            {
                "role": "user",
                "content": f"Explain this SQL query: {sql_query}"
            }
        ]
        
        explanation = orchestrator.cerebras_api.chat_completion(explanation_messages, temperature=0.3, max_tokens=150)
        
        return jsonify({
            "success": True,
            "sql": sql_query,
            "explanation": explanation,
            "original_text": text
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

