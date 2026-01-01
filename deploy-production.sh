#!/bin/bash

# Automated deployment script for Study Assistant
# This will deploy both backend and frontend

set -e

echo "🚀 Starting Study Assistant Deployment"
echo "======================================"

# Step 1: Deploy backend to Render via dashboard
echo ""
echo "📦 BACKEND DEPLOYMENT"
echo "--------------------"
echo "Please follow these steps to deploy your backend:"
echo ""
echo "1. Go to: https://dashboard.render.com/select-repo?type=web"
echo "2. Connect your GitHub repository: hrideymarwah15/StudyAssistant"
echo "3. Configure the service:"
echo "   - Name: study-assistant-backend"
echo "   - Root Directory: backend"
echo "   - Environment: Python 3"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: python app.py"
echo "   - Instance Type: Free (or your preference)"
echo ""
echo "4. Add these environment variables:"
echo "   - PORT: 8000"
echo "   - DEBUG: False"
echo ""
echo "5. Click 'Create Web Service'"
echo ""
echo "6. Wait for deployment to complete (5-10 minutes)"
echo ""
echo "7. Copy your backend URL (e.g., https://study-assistant-backend.onrender.com)"
echo ""

read -p "Have you deployed the backend and copied the URL? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled. Please deploy the backend first."
    exit 1
fi

# Get backend URL from user
read -p "Enter your backend URL (e.g., https://your-app.onrender.com): " BACKEND_URL

# Validate URL
if [[ ! $BACKEND_URL =~ ^https?:// ]]; then
    echo "❌ Invalid URL. Please include https://"
    exit 1
fi

echo ""
echo "✅ Backend URL received: $BACKEND_URL"

# Step 2: Update netlify.toml with backend URL
echo ""
echo "📝 Updating frontend configuration..."

# Update netlify.toml
sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" netlify.toml
rm netlify.toml.bak

echo "✅ Configuration updated"

# Step 3: Commit changes
echo ""
echo "📝 Committing configuration changes..."
git add netlify.toml
git commit -m "Update backend URL for production deployment" || echo "No changes to commit"

# Step 4: Deploy to Netlify
echo ""
echo "🌐 FRONTEND DEPLOYMENT"
echo "---------------------"
echo "Deploying to Netlify..."

# Set environment variable for build
export NEXT_PUBLIC_API_URL=$BACKEND_URL

# Build the project
echo "Building Next.js application..."
npm run build

# Deploy to Netlify
netlify deploy --prod --build

# Step 5: Get deployment URLs
echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🎉 Your application is now live!"
echo ""
echo "Frontend URL: http://assistantstudy.netlify.app"
echo "Backend URL: $BACKEND_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Visit your frontend URL and test the application"
echo "2. Check the AI Assistant panel to verify backend connectivity"
echo "3. Try uploading study materials to test the full stack"
echo "4. Monitor your backend logs at: https://dashboard.render.com"
echo ""
echo "⚠️  Note: The backend is using local AI services (Ollama, Qdrant)."
echo "   In production, you'll need to deploy these separately or use cloud alternatives."
echo ""
