#!/bin/bash

# Deployment Status Checker
# This script checks if all services are properly deployed

echo "🔍 Study Assistant Deployment Status Check"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if URL is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <frontend-url> [backend-url]"
    echo "Example: $0 https://studypal.netlify.app https://studypal-backend.onrender.com"
    exit 1
fi

FRONTEND_URL=$1
BACKEND_URL=${2:-""}

echo -e "${BLUE}Frontend URL:${NC} $FRONTEND_URL"
if [ -n "$BACKEND_URL" ]; then
    echo -e "${BLUE}Backend URL:${NC} $BACKEND_URL"
fi
echo

# Function to check HTTP status
check_url() {
    local url=$1
    local service_name=$2

    echo -n "Checking $service_name... "

    if curl -s --head --fail "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# Function to check JSON response
check_json_endpoint() {
    local url=$1
    local service_name=$2
    local expected_field=${3:-""}

    echo -n "Checking $service_name... "

    response=$(curl -s "$url" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        # Check if it's valid JSON
        if echo "$response" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
            if [ -n "$expected_field" ]; then
                # Check specific field
                value=$(echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('$expected_field', 'missing'))" 2>/dev/null)
                if [ "$value" = "healthy" ] || [ "$value" = "true" ]; then
                    echo -e "${GREEN}✅ OK${NC}"
                    return 0
                else
                    echo -e "${YELLOW}⚠️ WARNING${NC} ($value)"
                    return 1
                fi
            else
                echo -e "${GREEN}✅ OK${NC}"
                return 0
            fi
        else
            echo -e "${RED}❌ INVALID JSON${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ NO RESPONSE${NC}"
        return 1
    fi
}

echo "🌐 Frontend Checks:"
echo "-------------------"
check_url "$FRONTEND_URL" "Homepage"
check_url "$FRONTEND_URL/dashboard" "Dashboard"
check_url "$FRONTEND_URL/login" "Login Page"

echo
echo "🔧 Backend Checks:"
echo "------------------"

if [ -n "$BACKEND_URL" ]; then
    check_json_endpoint "$BACKEND_URL/health" "Backend Health" "status"

    # Check AI services if backend is responding
    if curl -s --head --fail "$BACKEND_URL/health" > /dev/null 2>&1; then
        health_response=$(curl -s "$BACKEND_URL/health" 2>/dev/null)
        if [ -n "$health_response" ]; then
            echo "AI Services:"
            qdrant_status=$(echo "$health_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('services', {}).get('qdrant', {}).get('connected', False))" 2>/dev/null)
            ollama_status=$(echo "$health_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('services', {}).get('ollama', {}).get('connected', False))" 2>/dev/null)
            whisper_status=$(echo "$health_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('services', {}).get('whisper', {}).get('loaded', False))" 2>/dev/null)

            [ "$qdrant_status" = "True" ] && echo -e "  Qdrant: ${GREEN}✅ Connected${NC}" || echo -e "  Qdrant: ${RED}❌ Disconnected${NC}"
            [ "$ollama_status" = "True" ] && echo -e "  Ollama: ${GREEN}✅ Connected${NC}" || echo -e "  Ollama: ${RED}❌ Disconnected${NC}"
            [ "$whisper_status" = "True" ] && echo -e "  Whisper: ${GREEN}✅ Loaded${NC}" || echo -e "  Whisper: ${RED}❌ Not loaded${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Backend URL not provided${NC}"
    echo "  Run: $0 $FRONTEND_URL <backend-url>"
fi

echo
echo "📋 Next Steps:"
echo "--------------"

if [ -n "$BACKEND_URL" ]; then
    echo "1. Test AI features:"
    echo "   - Upload a study material"
    echo "   - Ask questions in the chat"
    echo "   - Generate flashcards"
    echo "   - Create a study plan"
    echo
    echo "2. Monitor performance:"
    echo "   - Check Netlify analytics"
    echo "   - Monitor backend logs"
    echo "   - Set up error tracking"
    echo
    echo "3. Configure custom domain (optional):"
    echo "   - Add domain in Netlify dashboard"
    echo "   - Update DNS records"
else
    echo "1. Deploy your backend (Railway/Render)"
    echo "2. Update NEXT_PUBLIC_API_URL in Netlify"
    echo "3. Run this script again with backend URL"
fi

echo
echo -e "${GREEN}🎉 Deployment check complete!${NC}"