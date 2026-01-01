#!/bin/bash

# StudyPal Deployment Verification Script
# Run this after deploying your backend to verify everything works

echo "🔍 StudyPal Deployment Verification"
echo "=================================="

# Check if backend URL is provided
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backend-url>"
    echo "   Example: $0 https://your-render-app.onrender.com"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL="https://assistantstudy.netlify.app"

echo "🌐 Testing Backend: $BACKEND_URL"
echo "🌐 Frontend: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo "✅ Backend is healthy!"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    echo "❌ Backend health check failed"
    echo "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 2: AI Endpoint
echo "2️⃣  Testing AI Q&A..."
AI_RESPONSE=$(curl -s -X POST "$BACKEND_URL/ai/ask" \
    -H "Content-Type: application/json" \
    -d '{"question": "What is machine learning?"}')
if echo "$AI_RESPONSE" | grep -q "answer"; then
    echo "✅ AI endpoint working!"
    echo "$AI_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$AI_RESPONSE"
else
    echo "❌ AI endpoint failed"
    echo "Response: $AI_RESPONSE"
fi
echo ""

# Test 3: Frontend Connection
echo "3️⃣  Testing Frontend Connection..."
FRONTEND_TEST=$(curl -s "$FRONTEND_URL" | head -c 200)
if echo "$FRONTEND_TEST" | grep -q "StudyPal"; then
    echo "✅ Frontend is accessible!"
    echo "   Visit: $FRONTEND_URL"
else
    echo "❌ Frontend check failed"
fi
echo ""

echo "🎉 Verification complete!"
echo "   If all tests pass, your StudyPal is fully deployed! 🚀"
echo ""
echo "💡 Next: Open $FRONTEND_URL and check if JARVIS shows 'AI ONLINE'"