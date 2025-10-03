#!/bin/bash

echo "🔄 Restarting Enterprise Database Multi-Agent Manager"
echo "======================================================"

# Kill any existing instances
echo "Stopping existing instances..."
pkill -f "python.*app.py" 2>/dev/null
sleep 2

# Check if stopped
if pgrep -f "python.*app.py" > /dev/null; then
    echo "⚠️  Warning: Some instances still running. Force killing..."
    pkill -9 -f "python.*app.py"
    sleep 1
fi

echo "✅ Old instances stopped"

# Start the app
echo ""
echo "Starting Flask application..."
cd /home/yav13/hackathon/backend

# Check if CEREBRAS_API_KEY is set
if [ -z "$CEREBRAS_API_KEY" ]; then
    echo "⚠️  Warning: CEREBRAS_API_KEY not set"
    echo "   Set it with: export CEREBRAS_API_KEY='your-key'"
fi

# Start in background with output to log
nohup python3 app.py > ../app.log 2>&1 &
APP_PID=$!

sleep 3

# Check if it started successfully
if ps -p $APP_PID > /dev/null; then
    echo "✅ Application started successfully (PID: $APP_PID)"
    echo ""
    echo "🌐 Access the application at: http://localhost:5000"
    echo ""
    echo "📋 Logs: tail -f /home/yav13/hackathon/app.log"
    echo "🛑 Stop: pkill -f 'python.*app.py'"
else
    echo "❌ Failed to start application"
    echo "Check logs: cat /home/yav13/hackathon/app.log"
    exit 1
fi

