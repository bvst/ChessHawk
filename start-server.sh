#!/bin/bash

# Chess Hawk - Development Server Starter
echo "🚀 Starting Chess Hawk development server..."
echo ""

# Check if Node.js and npm are available
if command -v npm &> /dev/null; then
    echo "📦 Checking npm dependencies..."
    
    # Check if node_modules exists and has our required packages
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/jquery" ] || [ ! -d "node_modules/chess.js" ] || [ ! -d "node_modules/@chrisoakman" ]; then
        echo "📥 Installing npm dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install npm dependencies!"
            echo "Please run 'npm install' manually and try again."
            exit 1
        fi
        echo "✅ Dependencies installed successfully!"
    else
        echo "✅ Dependencies already installed."
    fi
else
    echo "⚠️  npm not found. Using local lib files as fallback."
    echo "   Consider installing Node.js and npm for better package management."
fi

echo ""

# Check if python3 is available
if command -v python3 &> /dev/null; then
    echo "🐍 Using Python 3..."
    echo "🌐 Server will be available at: http://localhost:8000"
    echo "📋 Test files available at:"
    echo "   - http://localhost:8000/test-basic-load.html (recommended for debugging)"
    echo "   - http://localhost:8000/test-simple.html"
    echo "   - http://localhost:8000/test-minimal.html"
    echo "   - http://localhost:8000/index.html (main application)"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "🐍 Using Python 2..."
    echo "🌐 Server will be available at: http://localhost:8000"
    python -m SimpleHTTPServer 8000
else
    echo "❌ Python not found!"
    echo "Please install Python and try again."
    exit 1
fi