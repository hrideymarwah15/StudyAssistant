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
        read -p "Press Enter after installing and authenticating Ngrok..."
    fi

    echo "Starting Ngrok tunnel..."
    echo -e "${BLUE}Command: ngrok http 8000${NC}"
    echo ""

    # Start ngrok in background
    ngrok http 8000 &
    NGROK_PID=$!

    # Wait for ngrok to start
    echo "Waiting for Ngrok to initialize..."
    sleep 5

    # Get tunnel URL
    TUNNEL_URL=""
    for i in {1..10}; do
        TUNNEL_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4 | head -1)
        if [ -n "$TUNNEL_URL" ]; then
            break
        fi
        echo "Waiting for tunnel URL... ($i/10)"
        sleep 2
    done

    if [ -z "$TUNNEL_URL" ]; then
        echo -e "${RED}❌ Failed to get Ngrok tunnel URL${NC}"
        echo "Check if Ngrok is authenticated:"
        echo "  ngrok authtoken YOUR_TOKEN"
        kill $NGROK_PID 2>/dev/null
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✅ Ngrok tunnel active!${NC}"
    echo -e "${CYAN}Public URL: ${TUNNEL_URL}${NC}"
    echo ""

    # Instructions
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📋 NEXT STEPS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Copy this URL: ${TUNNEL_URL}"
    echo ""
    echo "2. Go to Netlify:"
    echo "   https://app.netlify.com/sites/assistantstudy"
    echo ""
    echo "3. Site settings → Environment variables"
    echo ""
    echo "4. Add/Update:"
    echo "   Key: NEXT_PUBLIC_API_URL"
    echo "   Value: ${TUNNEL_URL}"
    echo ""
    echo "5. Trigger deploy (Deploy settings → Trigger deploy)"
    echo ""
    echo "6. Open: https://assistantstudy.netlify.app"
    echo ""
    echo -e "${YELLOW}Keep this terminal open to maintain the tunnel!${NC}"
    echo ""
    echo "To stop: Ctrl+C or kill $NGROK_PID"

    # Wait for user
    wait $NGROK_PID
}

# Function to setup LocalTunnel (fallback option)
setup_localtunnel() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  🌐 LOCALTUNNEL SETUP${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if ! command -v lt &> /dev/null; then
        echo -e "${YELLOW}⚠️  LocalTunnel is not installed${NC}"
        echo ""
        echo "Installing LocalTunnel..."
        npm install -g localtunnel || {
            echo -e "${RED}❌ Failed to install localtunnel${NC}"
            exit 1
        }
    fi

    echo "Starting LocalTunnel..."
    echo -e "${BLUE}Command: lt --port 8000${NC}"
    echo ""
    echo -e "${YELLOW}Note: LocalTunnel URLs are temporary and may change${NC}"
    echo ""

    # Start localtunnel
    lt --port 8000 &
    LT_PID=$!

    # Wait for tunnel to start
    sleep 3

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  📋 NEXT STEPS${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Look above for your tunnel URL (https://xyz.loca.lt)"
    echo ""
    echo "2. Copy the HTTPS URL from the output above"
    echo ""
    echo "3. Go to Netlify:"
    echo "   https://app.netlify.com/sites/assistantstudy"
    echo ""
    echo "4. Site settings → Environment variables"
    echo ""
    echo "5. Add/Update:"
    echo "   Key: NEXT_PUBLIC_API_URL"
    echo "   Value: <your-localtunnel-url>"
    echo ""
    echo "6. Trigger deploy (Deploy settings → Trigger deploy)"
    echo ""
    echo "7. Open: https://assistantstudy.netlify.app"
    echo ""
    echo -e "${YELLOW}Keep this terminal open to maintain the tunnel!${NC}"
    echo ""
    echo "To stop: Ctrl+C or kill $LT_PID"

    # Wait for user
    wait $LT_PID
}

# Main menu
while true; do
    echo "Choose your tunnel provider:"
    echo ""
    echo -e "${GREEN}  1) Ngrok${NC} (Quick testing, requires account)"
    echo -e "${BLUE}  2) Cloudflare Tunnel${NC} (Stable, free forever)"
    echo -e "${CYAN}  3) LocalTunnel${NC} (Simple, no account needed)"
    echo -e "${YELLOW}  4) Exit${NC}"
    echo ""
    read -p "Enter your choice (1-4): " choice

    case $choice in
        1)
            setup_ngrok
            break
            ;;
        2)
            setup_cloudflare
            break
            ;;
        3)
            setup_localtunnel
            break
            ;;
        4)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please enter 1, 2, 3, or 4.${NC}"
            ;;
    esac
done
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
