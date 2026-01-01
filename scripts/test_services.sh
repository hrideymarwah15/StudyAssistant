#!/bin/bash

# Quick Test - Verify all services are working

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Local Setup..."
echo "========================="

# Test Qdrant
echo ""
echo -n "Testing Qdrant... "
if curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Start: docker start qdrant"
fi

# Test Ollama
echo -n "Testing Ollama... "
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    
    # Check models
    MODELS=$(curl -s http://localhost:11434/api/tags)
    echo -n "  - mixtral model... "
    if echo "$MODELS" | grep -q "mixtral"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  missing${NC}"
    fi
    
    echo -n "  - qwen model... "
    if echo "$MODELS" | grep -q "qwen"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  missing${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Start: ollama serve"
fi

# Test Backend
echo -n "Testing Backend... "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    
    # Test API endpoint
    echo -n "  - Health check... "
    HEALTH=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH" | grep -q "healthy"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${YELLOW}⚠️  degraded${NC}"
    fi
else
    echo -e "${RED}❌ FAILED${NC}"
    echo "Start: ./scripts/run_local_backend.sh"
fi

echo ""
echo "========================="
echo "Test complete!"
