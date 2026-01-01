#!/bin/bash

# Complete Local Setup Script
# Runs all services and creates tunnel in one command

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  StudyPal Complete Local Setup        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Check/Start Qdrant
echo -e "${BLUE}[1/5]${NC} Checking Qdrant..."
if ! curl -s http://localhost:6333/health > /dev/null 2>&1; then
    echo "Starting Qdrant..."
    if docker ps -a | grep -q qdrant; then
        docker start qdrant
    else
        docker run -d -p 6333:6333 -p 6334:6334 \
            -v qdrant_storage:/qdrant/storage \
            --name qdrant qdrant/qdrant
    fi
    sleep 3
fi
echo -e "${GREEN}✅ Qdrant running${NC}"

# Step 2: Check Ollama
echo ""
echo -e "${BLUE}[2/5]${NC} Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ollama not running${NC}"
    echo "Start Ollama in another terminal:"
    echo "  ollama serve"
    read -p "Press Enter when Ollama is running..."
fi
echo -e "${GREEN}✅ Ollama running${NC}"

# Step 3: Check models
echo ""
echo -e "${BLUE}[3/5]${NC} Checking AI models..."
MODELS=$(curl -s http://localhost:11434/api/tags)
if ! echo "$MODELS" | grep -q "mixtral"; then
    echo "Pulling mixtral..."
    ollama pull mixtral &
fi
if ! echo "$MODELS" | grep -q "qwen"; then
    echo "Pulling qwen2.5:14b..."
    ollama pull qwen2.5:14b &
fi
wait
echo -e "${GREEN}✅ Models ready${NC}"

# Step 4: Start backend in background
echo ""
echo -e "${BLUE}[4/5]${NC} Starting backend..."
cd "$PROJECT_ROOT"
source .venv/bin/activate
cd backend
python app.py &
BACKEND_PID=$!
sleep 3

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may not be ready yet${NC}"
fi

# Step 5: Setup tunnel
echo ""
echo -e "${BLUE}[5/5]${NC} Setting up public tunnel..."
echo ""
echo "Choose tunnel option:"
echo "  1) Ngrok"
echo "  2) Cloudflare"
read -p "Choice (1-2): " choice

cd "$PROJECT_ROOT"

case $choice in
    1)
        if command -v ngrok &> /dev/null; then
            echo "Starting Ngrok..."
            ngrok http 8000 &
            NGROK_PID=$!
            sleep 3
            TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)
        else
            echo -e "${YELLOW}Ngrok not installed${NC}"
            echo "Install: brew install ngrok"
            exit 1
        fi
        ;;
    2)
        if command -v cloudflared &> /dev/null; then
            echo "Starting Cloudflare Tunnel..."
            cloudflared tunnel --url http://localhost:8000 &
            CF_PID=$!
            sleep 5
            echo -e "${GREEN}Cloudflare tunnel started${NC}"
            echo "Check terminal output above for your URL"
        else
            echo -e "${YELLOW}Cloudflared not installed${NC}"
            echo "Install: brew install cloudflared"
            exit 1
        fi
        ;;
esac

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ SETUP COMPLETE!                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Services Running:${NC}"
echo "  • Qdrant: http://localhost:6333"
echo "  • Ollama: http://localhost:11434"
echo "  • Backend: http://localhost:8000"
if [ -n "$TUNNEL_URL" ]; then
    echo "  • Public URL: $TUNNEL_URL"
fi
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Copy your public tunnel URL"
echo "  2. Set in Netlify: NEXT_PUBLIC_API_URL=<tunnel-url>"
echo "  3. Open: https://assistantstudy.netlify.app"
echo ""
echo "To stop everything:"
echo "  kill $BACKEND_PID"
if [ -n "$NGROK_PID" ]; then
    echo "  kill $NGROK_PID"
fi
if [ -n "$CF_PID" ]; then
    echo "  kill $CF_PID"
fi
echo "  docker stop qdrant"
echo ""
echo -e "${YELLOW}Keep this terminal open!${NC}"
echo ""

# Wait for user to stop
wait
