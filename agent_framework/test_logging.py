"""
Quick test script to verify logging is working
"""

import sys
sys.path.insert(0, 'backend')

from agent_logger import get_logger
import os

# Test logger initialization
logger = get_logger()
print(f"✅ Logger initialized")
print(f"   Log directory: {logger.log_dir}")
print(f"   Directory exists: {os.path.exists(logger.log_dir)}")

# Test starting an execution
execution_id = logger.start_execution("Test task", "Test user request")
print(f"\n✅ Execution started")
print(f"   Execution ID: {execution_id}")
print(f"   Log file: {logger.get_current_log_file()}")
print(f"   Log file exists: {os.path.exists(logger.get_current_log_file())}")

# Test logging an agent
logger.log_agent_start("TestAgent", "Test task", 1)
print(f"\n✅ Agent logged (start)")

# Test completing an agent
logger.log_agent_complete("TestAgent", {"test": "output"}, success=True)
print(f"✅ Agent logged (complete)")

# Test ending execution
logger.end_execution({"final": "result"}, success=True)
print(f"✅ Execution ended")

# Read and display the log
print(f"\n📄 Log file contents:")
print("=" * 60)
with open(logger.get_current_log_file(), 'r') as f:
    import json
    log_data = json.load(f)
    print(json.dumps(log_data, indent=2))

print("\n" + "=" * 60)
print("✅ All logging tests passed!")
print(f"📂 Check logs directory: ls -la {logger.log_dir}")

