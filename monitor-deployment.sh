#!/bin/bash

# Railway Deployment Monitor
# Run this while Railway is deploying to check status

echo "🔍 Monitoring Railway Deployment..."
echo "==================================="

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <railway-project-name>"
    echo "   Example: $0 studypal-backend"
    echo ""
    echo "💡 Find your project name in Railway dashboard"
    exit 1
fi

PROJECT_NAME=$1
EXPECTED_URL="https://$PROJECT_NAME.railway.app"

echo "🎯 Monitoring: $EXPECTED_URL"
echo "⏳ Checking every 30 seconds... (Ctrl+C to stop)"
echo ""

while true; do
    echo "$(date '+%H:%M:%S') - Checking deployment status..."

    # Test health endpoint
    RESPONSE=$(curl -s --max-time 10 "$EXPECTED_URL/health" 2>/dev/null)

    if echo "$RESPONSE" | grep -q "healthy"; then
        echo "✅ DEPLOYMENT SUCCESSFUL!"
        echo "🌐 Backend URL: $EXPECTED_URL"
        echo ""
        echo "🎉 Next steps:"
        echo "   1. Update Netlify: NEXT_PUBLIC_API_URL=$EXPECTED_URL"
        echo "   2. Run: ./verify-deployment.sh $EXPECTED_URL"
        echo "   3. Open: https://assistantstudy.netlify.app"
        break
    elif echo "$RESPONSE" | grep -q "status"; then
        echo "🔄 Backend responding but not healthy yet..."
        echo "Response: $RESPONSE"
    else
        echo "⏳ Still deploying or not ready..."
    fi

    sleep 30
done