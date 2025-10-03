#!/bin/bash

# Enterprise Database Multi-Agent Manager - Startup Script

echo "🚀 Starting Enterprise Database Multi-Agent Manager"
echo "=================================================="

# Check if CEREBRAS_API_KEY is set
if [ -z "$CEREBRAS_API_KEY" ]; then
    echo "⚠️  Warning: CEREBRAS_API_KEY environment variable not set"
    echo "   Please set it with: export CEREBRAS_API_KEY='your-key-here'"
    echo "   You can get your API key from: https://cerebras.ai"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

# Populate sample data if database doesn't exist
if [ ! -f "backend/enterprise.db" ]; then
    echo "🗄️  Database not found. Creating and populating with sample data..."
    python sample_data.py
else
    echo "✅ Database found"
fi

# Start the application
echo ""
echo "✨ Starting the application..."
echo "   URL: http://localhost:5000"
echo "   Press Ctrl+C to stop"
echo ""

cd backend && python app.py

