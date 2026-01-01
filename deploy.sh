#!/bin/bash

# Study Assistant Deployment Script
# This script helps deploy both frontend and backend

set -e

echo "🚀 Study Assistant Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi

    print_success "Dependencies check passed"
}

# Deploy frontend to Netlify
deploy_frontend() {
    print_status "Deploying frontend to Netlify..."

    # Check if netlify-cli is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi

    # Check if already logged in
    if ! netlify status &> /dev/null; then
        print_warning "Please login to Netlify:"
        netlify login
    fi

    # Deploy to Netlify
    print_status "Building and deploying to Netlify..."
    netlify deploy --prod --build

    print_success "Frontend deployed to Netlify"
}

# Deploy backend to Railway
deploy_backend_railway() {
    print_status "Deploying backend to Railway..."

    # Check if railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi

    # Check if logged in
    if ! railway status &> /dev/null; then
        print_warning "Please login to Railway:"
        railway login
    fi

    # Navigate to backend directory
    cd backend

    # Deploy to Railway
    print_status "Deploying backend to Railway..."
    railway deploy

    # Get the backend URL
    BACKEND_URL=$(railway domain)

    print_success "Backend deployed to Railway: $BACKEND_URL"

    # Go back to root
    cd ..

    # Update frontend environment
    echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" >> .env.production
}

# Deploy backend to Render
deploy_backend_render() {
    print_status "Deploying backend to Render..."

    # Check if render CLI is installed
    if ! command -v render &> /dev/null; then
        print_warning "Render CLI not found. Installing..."
        npm install -g render-cli
    fi

    # Navigate to backend directory
    cd backend

    # Deploy to Render
    print_status "Creating Render service..."
    render services create --name study-assistant-backend --type web --repo https://github.com/yourusername/study-assistant --branch main --root-dir backend

    print_success "Backend deployment initiated on Render"
    print_warning "Please configure environment variables in Render dashboard"

    cd ..
}

# Update environment variables
update_env() {
    print_status "Updating environment variables..."

    if [ -z "$BACKEND_URL" ]; then
        read -p "Enter your backend URL: " BACKEND_URL
    fi

    # Update netlify.toml
    sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" netlify.toml

    print_success "Environment variables updated"
}

# Main deployment function
main() {
    echo "Choose deployment option:"
    echo "1. Deploy frontend only (Netlify)"
    echo "2. Deploy backend to Railway"
    echo "3. Deploy backend to Render"
    echo "4. Full deployment (frontend + backend)"
    read -p "Enter your choice (1-4): " choice

    check_dependencies

    case $choice in
        1)
            deploy_frontend
            ;;
        2)
            deploy_backend_railway
            update_env
            deploy_frontend
            ;;
        3)
            deploy_backend_render
            update_env
            deploy_frontend
            ;;
        4)
            echo "Choose backend platform:"
            echo "1. Railway"
            echo "2. Render"
            read -p "Enter backend platform (1-2): " backend_choice

            case $backend_choice in
                1)
                    deploy_backend_railway
                    ;;
                2)
                    deploy_backend_render
                    ;;
                *)
                    print_error "Invalid choice"
                    exit 1
                    ;;
            esac

            update_env
            deploy_frontend
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    print_success "Deployment completed!"
    print_warning "Don't forget to:"
    echo "  1. Update your domain settings in Netlify"
    echo "  2. Configure environment variables in your backend service"
    echo "  3. Set up your AI services (Qdrant, Ollama, etc.)"
    echo "  4. Test the deployed application"
}

# Run main function
main