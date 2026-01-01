#!/bin/bash

# StudyPal Tunnel Setup
# Creates a public HTTPS URL for your local backend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "🌐 StudyPal Public Tunnel Setup"
echo "========================================"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on localhost:8000${NC}"
    echo "Start the backend first:"
    echo "  ./scripts/run_local_backend.sh"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Function to setup Ngrok
setup_ngrok() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🚀 NGROK SETUP${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if ! command -v ngrok &> /dev/null; then
        echo -e "${YELLOW}⚠️  Ngrok is not installed${NC}"
        echo ""
        echo "Install Ngrok:"
        echo "  brew install ngrok"
        echo ""
        echo "Or download from: https://ngrok.com/download"
        echo ""
        echo "After installation, authenticate:"
        echo "  ngrok authtoken YOUR_TOKEN"
        echo ""
        return 1
    fi
    
    echo -e "${GREEN}✅ Ngrok is installed${NC}"
    echo ""
    echo "Starting Ngrok tunnel..."
    echo -e "${YELLOW}This will open a new terminal window${NC}"
    echo ""
    echo "Your public URL will look like:"
    echo -e "${BLUE}  https://xyz123.ngrok-free.app${NC}"
    echo ""
    echo -e "${CYAN}Copy the HTTPS URL and set it in Netlify:${NC}"
    echo "  NEXT_PUBLIC_API_URL=<your-ngrok-url>"
    echo ""
    
    read -p "Press Enter to start Ngrok..."
    
    # Start ngrok in background and capture output
    ngrok http 8000 --log=stdout &
    NGROK_PID=$!
    
    echo ""
    echo -e "${GREEN}✅ Ngrok started (PID: $NGROK_PID)${NC}"
    echo ""
    echo "To stop Ngrok: kill $NGROK_PID"
    echo ""
    
    # Wait a moment for ngrok to start
    sleep 3
    
    # Try to get the public URL
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*ngrok[^"]*' | head -1)
    if [ -n "$NGROK_URL" ]; then
        echo -e "${GREEN}🎉 Your public URL:${NC}"
        echo -e "${BLUE}  $NGROK_URL${NC}"
        echo ""
        echo "Set this in Netlify environment variables:"
        echo -e "${CYAN}  NEXT_PUBLIC_API_URL=$NGROK_URL${NC}"
    fi
}

# Function to setup Cloudflare Tunnel
setup_cloudflare() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  ☁️  CLOUDFLARE TUNNEL SETUP${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if ! command -v cloudflared &> /dev/null; then
        echo -e "${YELLOW}⚠️  Cloudflare Tunnel is not installed${NC}"
        echo ""
        echo "Install cloudflared:"
        echo "  brew install cloudflared"
        echo ""
        echo "Or download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
        echo ""
        return 1
    fi
    
    echo -e "${GREEN}✅ Cloudflared is installed${NC}"
    echo ""
    echo "Starting Cloudflare Tunnel..."
    echo ""
    echo "Your public URL will look like:"
    echo -e "${BLUE}  https://xyz-abc-def.trycloudflare.com${NC}"
    echo ""
    echo -e "${CYAN}Copy the HTTPS URL and set it in Netlify:${NC}"
    echo "  NEXT_PUBLIC_API_URL=<your-cloudflare-url>"
    echo ""
    
    read -p "Press Enter to start Cloudflare Tunnel..."
    
    cloudflared tunnel --url http://localhost:8000
}

# Show menu
echo "Choose your tunnel provider:"
echo ""
echo "  1) Ngrok (Quick testing, free tier)"
echo "  2) Cloudflare Tunnel (Stable, free forever)"
echo "  3) Exit"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        setup_ngrok
        ;;
    2)
        setup_cloudflare
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ SETUP COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Copy your public HTTPS URL"
echo "  2. Set in Netlify: Site settings → Environment variables"
echo "  3. Add: NEXT_PUBLIC_API_URL=<your-tunnel-url>"
echo "  4. Trigger new deploy"
echo "  5. Open: https://assistantstudy.netlify.app"
echo ""
echo -e "${CYAN}Keep this terminal open to maintain the tunnel!${NC}"
echo ""
