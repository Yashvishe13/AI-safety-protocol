#!/bin/bash

echo "🔍 Checking Application Status"
echo "======================================================"

# Check if app is running
if pgrep -f "python.*app.py" > /dev/null; then
    echo "✅ Application is RUNNING"
    echo ""
    echo "Process Info:"
    ps aux | grep "python.*app.py" | grep -v grep
    echo ""
    
    # Test the server
    echo "Testing server response..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Server responding correctly (HTTP $HTTP_CODE)"
        echo ""
        echo "🌐 Access at: http://localhost:5000"
    else
        echo "⚠️  Server responding with HTTP $HTTP_CODE"
        echo "   Expected: 200"
    fi
else
    echo "❌ Application is NOT running"
    echo ""
    echo "To start: ./start.sh"
    echo "Or:       ./restart_app.sh"
fi

echo ""
echo "======================================================"

