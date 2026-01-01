#!/bin/bash

# StudyPal Local Backend Runner
# Starts FastAPI backend with all dependencies

set -e

echo "🚀 StudyPal Local Backend - Starting..."
echo "========================================"

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_DIR="$PROJECT_ROOT/.venv"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python virtual environment
echo ""
echo "📦 Checking Python environment..."
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${RED}❌ Virtual environment not found at $VENV_DIR${NC}"
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
echo -e "${GREEN}✅ Activating virtual environment${NC}"
source "$VENV_DIR/bin/activate"

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "📥 Installing backend dependencies..."
    pip install -r "$BACKEND_DIR/requirements.txt"
fi

# Check Qdrant
echo ""
echo "🔍 Checking Qdrant (Vector Database)..."
if curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Qdrant is running on port 6333${NC}"
else
    echo -e "${YELLOW}⚠️  Qdrant is not running${NC}"
    echo ""
    echo "To start Qdrant, run ONE of these commands:"
    echo -e "${BLUE}# If Qdrant container exists:${NC}"
    echo "  docker start qdrant"
    echo ""
    echo -e "${BLUE}# If you need to create it:${NC}"
    echo "  docker run -d -p 6333:6333 -p 6334:6334 \\"
    echo "    -v qdrant_storage:/qdrant/storage \\"
    echo "    --name qdrant qdrant/qdrant"
    echo ""
    read -p "Press Enter after starting Qdrant, or Ctrl+C to exit..."
fi

# Check Ollama
echo ""
echo "🔍 Checking Ollama (AI Models)..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ollama is running on port 11434${NC}"
    
    # Check for required models
    OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    
    if echo "$OLLAMA_MODELS" | grep -q "mixtral"; then
        echo -e "${GREEN}✅ mixtral model found${NC}"
    else
        echo -e "${YELLOW}⚠️  mixtral model not found${NC}"
        echo "  Run: ollama pull mixtral"
    fi
    
    if echo "$OLLAMA_MODELS" | grep -q "qwen"; then
        echo -e "${GREEN}✅ qwen model found${NC}"
    else
        echo -e "${YELLOW}⚠️  qwen2.5:14b model not found${NC}"
        echo "  Run: ollama pull qwen2.5:14b"
    fi
else
    echo -e "${YELLOW}⚠️  Ollama is not running${NC}"
    echo ""
    echo "To start Ollama, run:"
    echo -e "${BLUE}  ollama serve${NC}"
    echo ""
    echo "Then pull required models:"
    echo "  ollama pull mixtral"
    echo "  ollama pull qwen2.5:14b"
    echo ""
    read -p "Press Enter after starting Ollama, or Ctrl+C to exit..."
fi

# Start FastAPI server
echo ""
echo "========================================"
echo "🎯 Starting FastAPI Backend"
echo "========================================"
echo ""
echo "Backend will be available at:"
echo -e "${GREEN}  Local:  http://localhost:8000${NC}"
echo -e "${GREEN}  Network: http://0.0.0.0:8000${NC}"
echo -e "${GREEN}  API Docs: http://localhost:8000/docs${NC}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$BACKEND_DIR"
python app.py
