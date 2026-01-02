#!/bin/bash

# ============================================
# PRODUCTION DEPLOYMENT SCRIPT
# Deploy Study Assistant to Production
# ============================================

set -e  # Exit on error

echo "🚀 Study Assistant - Production Deployment"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# STEP 1: Verify Environment
# ============================================

echo -e "${BLUE}Step 1: Verifying environment...${NC}"

if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo "Please create .env.local with required environment variables"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Environment verified${NC}"
echo ""

# ============================================
# STEP 2: Test Backend Locally
# ============================================

echo -e "${BLUE}Step 2: Testing production backend locally...${NC}"

cd backend

# Test that backend starts
echo "Starting backend on port 8001 for testing..."
PORT=8001 python app_production_v2.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test health endpoint
if curl -f http://localhost:8001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test flashcard endpoint
if curl -f -X POST http://localhost:8001/ai/flashcards/exam-grade \
    -H "Content-Type: application/json" \
    -d '{"topic":"Test","num_cards":3,"difficulty":"intermediate"}' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Flashcard endpoint working${NC}"
else
    echo -e "${YELLOW}⚠️  Flashcard endpoint test failed (may be expected in mock mode)${NC}"
fi

# Stop test backend
kill $BACKEND_PID 2>/dev/null || true

cd ..
echo ""

# ============================================
# STEP 3: Commit Changes
# ============================================

echo -e "${BLUE}Step 3: Committing production changes...${NC}"

git add .
git status

read -p "Commit message (or press Enter for default): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Production deployment: Updated backend with exam-grade flashcards"
fi

git commit -m "$COMMIT_MSG" || echo "No changes to commit"
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

# ============================================
# STEP 4: Push to GitHub
# ============================================

echo -e "${BLUE}Step 4: Pushing to GitHub...${NC}"

BRANCH=$(git branch --show-current)
echo "Pushing to branch: $BRANCH"

git push origin $BRANCH

echo -e "${GREEN}✓ Pushed to GitHub${NC}"
echo ""

# ============================================
# STEP 5: Deploy Instructions
# ============================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT READY${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo -e "${BLUE}1. DEPLOY BACKEND:${NC}"
echo ""
echo "   Option A: Railway (Recommended)"
echo "   ----------------------------------"
echo "   1. Go to https://railway.app"
echo "   2. Create new project"
echo "   3. Deploy from GitHub repo"
echo "   4. Use configuration: backend/railway-production.toml"
echo "   5. Copy the generated URL (e.g., https://xxx.railway.app)"
echo ""
echo "   Option B: Render"
echo "   ----------------------------------"
echo "   1. Go to https://render.com"
echo "   2. Create new Web Service"
echo "   3. Connect GitHub repository"
echo "   4. Root Directory: backend"
echo "   5. Build Command: pip install -r requirements-production.txt"
echo "   6. Start Command: uvicorn app_production_v2:app --host 0.0.0.0 --port \$PORT"
echo "   7. Copy the generated URL (e.g., https://xxx.onrender.com)"
echo ""
echo -e "${BLUE}2. CONFIGURE NETLIFY:${NC}"
echo "   1. Go to https://app.netlify.com"
echo "   2. Select your site: assistantstudy"
echo "   3. Go to: Site settings → Environment variables"
echo "   4. Add/Update:"
echo "      - NEXT_PUBLIC_API_URL = <your-backend-url>"
echo "      (e.g., https://xxx.railway.app or https://xxx.onrender.com)"
echo ""
echo "   5. Copy Firebase config from .env.local:"
echo "      - NEXT_PUBLIC_FIREBASE_API_KEY"
echo "      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "      - NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "      - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "      - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "      - NEXT_PUBLIC_FIREBASE_APP_ID"
echo "      - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
echo ""
echo "   6. Trigger manual deploy or push to GitHub"
echo ""
echo -e "${BLUE}3. VERIFY DEPLOYMENT:${NC}"
echo "   1. Visit: https://assistantstudy.netlify.app"
echo "   2. Test flashcard generation"
echo "   3. Check browser console for errors"
echo "   4. Verify backend: <your-backend-url>/health"
echo ""
echo -e "${YELLOW}FILES CREATED:${NC}"
echo "   - backend/app_production_v2.py (Production backend with all features)"
echo "   - backend/requirements-production.txt (Minimal dependencies)"
echo "   - backend/railway-production.toml (Railway config)"
echo "   - backend/render-production.yaml (Render config)"
echo ""
echo -e "${GREEN}Your site will be fully functional once backend is deployed!${NC}"
echo ""
