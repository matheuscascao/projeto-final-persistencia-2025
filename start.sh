#!/bin/bash

# Start both servers for Tourism System

echo "🚀 Starting Tourism System..."
echo ""

# Start API server in background
echo "📡 Starting API server (port 3000)..."
cd apps/api
NODE_TLS_REJECT_UNAUTHORIZED=0 bun run dev &
API_PID=$!
cd ../..

# Wait a moment for API to start
sleep 2

# Start Web server in background
echo "🌐 Starting Web server (port 5173)..."
cd apps/web
bun run dev &
WEB_PID=$!
cd ../..

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "📡 API Server: http://localhost:3000"
echo "🌐 Web App:    http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user interrupt
trap "kill $API_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait

