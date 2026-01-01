#!/bin/bash
# Startup script for StudyPal AI OS Backend
# Checks dependencies and starts the server

echo "========================================="
echo "🚀 StudyPal AI OS - Backend Startup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo "Checking Python..."
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ Python found$(python3 --version)${NC}"
else
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "../.venv" ]; then
    echo -e "${YELLOW}⚠ Virtual environment not found${NC}"
    echo "Creating virtual environment..."
    python3 -m venv ../.venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source ../.venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "========================================="
echo "Checking External Services"
echo "========================================="
echo ""

# Check Qdrant
echo "Checking Qdrant..."
if curl -s http://localhost:6333/collections > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Qdrant is running${NC}"
else
    echo -e "${YELLOW}⚠ Qdrant not detected${NC}"
    echo "  Start with: docker run -p 6333:6333 qdrant/qdrant"
    echo "  Or install: https://qdrant.tech/documentation/quick-start/"
fi

# Check Ollama
echo "Checking Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama is running${NC}"
    
    # Check for required models
    echo "Checking Ollama models..."
    MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    
    if echo "$MODELS" | grep -q "mixtral"; then
        echo -e "${GREEN}  ✓ mixtral found${NC}"
    else
        echo -e "${YELLOW}  ⚠ mixtral not found${NC}"
        echo "    Install with: ollama pull mixtral"
    fi
    
    if echo "$MODELS" | grep -q "qwen"; then
        echo -e "${GREEN}  ✓ qwen found${NC}"
    else
        echo -e "${YELLOW}  ⚠ qwen not found${NC}"
        echo "    Install with: ollama pull qwen"
    fi
else
    echo -e "${YELLOW}⚠ Ollama not detected${NC}"
    echo "  Start with: ollama serve"
    echo "  Or install: https://ollama.ai/"
fi

echo ""
echo "========================================="
echo "Starting FastAPI Server"
echo "========================================="
echo ""

# Start the server
python app.py
