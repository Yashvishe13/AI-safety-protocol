"""
Real-time Agent Execution Logger
Logs agent activities to JSON file during execution
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from threading import Lock
import uuid


class AgentExecutionLogger:
    """Logs agent execution in real-time to JSON file"""
    
    def __init__(self, log_dir: str = None):
        # Use absolute path for logs directory
        if log_dir is None:
            # Default to logs directory in project root
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            log_dir = os.path.join(base_dir, "logs")
        
        self.log_dir = log_dir
        self.current_log_file: Optional[str] = None
        self.execution_id: Optional[str] = None
        self.lock = Lock()  # Thread-safe file writing
        
        # Create logs directory if it doesn't exist
        os.makedirs(log_dir, exist_ok=True)
    
    def start_execution(self, task: str, user_request: str) -> str:
        """Start a new execution and create log file"""
        self.execution_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        self.current_log_file = os.path.join(
            self.log_dir, 
            f"execution_{timestamp}_{self.execution_id}.json"
        )
        
        initial_data = {
            "execution_id": self.execution_id,
            "user_request": user_request,
            "task": task,
            "start_time": datetime.now().isoformat(),
            "status": "in_progress",
            "agents_executed": [],
            "total_agents": 0,
            "end_time": None,
            "total_duration_seconds": None
        }
        
        self._write_log(initial_data)
        return self.execution_id
    
    def log_agent_start(self, agent_name: str, task: str, step: int):
        """Log when an agent starts execution"""
        with self.lock:
            log_data = self._read_log()
            
            agent_entry = {
                "step": step,
                "agent_name": agent_name,
                "task": task,
                "status": "running",
                "start_time": datetime.now().isoformat(),
                "end_time": None,
                "duration_seconds": None,
                "output": None,
                "success": None,
                "error": None
            }
            
            log_data["agents_executed"].append(agent_entry)
            log_data["total_agents"] = len(log_data["agents_executed"])
            
            self._write_log(log_data)
    
    def log_agent_complete(self, agent_name: str, output: Dict[str, Any], success: bool = True, error: str = None):
        """Log when an agent completes execution"""
        with self.lock:
            log_data = self._read_log()
            
            # Find the agent entry (last one with this name in running state)
            for agent_entry in reversed(log_data["agents_executed"]):
                if agent_entry["agent_name"] == agent_name and agent_entry["status"] == "running":
                    # Update the entry
                    end_time = datetime.now()
                    agent_entry["end_time"] = end_time.isoformat()
                    agent_entry["status"] = "completed" if success else "failed"
                    agent_entry["success"] = success
                    agent_entry["output"] = output
                    agent_entry["error"] = error
                    
                    # Calculate duration
                    start_time = datetime.fromisoformat(agent_entry["start_time"])
                    duration = (end_time - start_time).total_seconds()
                    agent_entry["duration_seconds"] = round(duration, 2)
                    
                    break
            
            self._write_log(log_data)
    
    def end_execution(self, final_result: Dict[str, Any], success: bool = True):
        """Mark execution as complete"""
        with self.lock:
            log_data = self._read_log()
            
            end_time = datetime.now()
            log_data["end_time"] = end_time.isoformat()
            log_data["status"] = "completed" if success else "failed"
            log_data["final_result"] = final_result
            
            # Calculate total duration
            start_time = datetime.fromisoformat(log_data["start_time"])
            total_duration = (end_time - start_time).total_seconds()
            log_data["total_duration_seconds"] = round(total_duration, 2)
            
            self._write_log(log_data)
    
    def _read_log(self) -> Dict[str, Any]:
        """Read current log file"""
        if not self.current_log_file or not os.path.exists(self.current_log_file):
            return {}
        
        try:
            with open(self.current_log_file, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    
    def _write_log(self, data: Dict[str, Any]):
        """Write to log file"""
        if not self.current_log_file:
            return
        
        with open(self.current_log_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def get_current_log_file(self) -> Optional[str]:
        """Get path to current log file"""
        return self.current_log_file
    
    def get_execution_status(self) -> Dict[str, Any]:
        """Get current execution status"""
        return self._read_log()


# Global logger instance
_global_logger = AgentExecutionLogger()


def get_logger() -> AgentExecutionLogger:
    """Get the global logger instance"""
    return _global_logger

