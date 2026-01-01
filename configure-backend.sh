#!/bin/bash

# Quick script to update backend URL in netlify.toml

if [ -z "$1" ]; then
    echo "❌ Error: Backend URL is required"
    echo "Usage: ./configure-backend.sh https://your-backend-url.onrender.com"
    exit 1
fi

BACKEND_URL=$1

# Validate URL
if [[ ! $BACKEND_URL =~ ^https?:// ]]; then
    echo "❌ Invalid URL. Please include https://"
    exit 1
fi

echo "📝 Updating backend URL to: $BACKEND_URL"

# Update netlify.toml
sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" netlify.toml
rm -f netlify.toml.bak

echo "✅ netlify.toml updated successfully!"
echo ""
echo "Next steps:"
echo "  1. git add netlify.toml"
echo "  2. git commit -m 'Update backend URL'"
echo "  3. git push origin main"
echo ""
echo "Netlify will automatically redeploy with the new configuration!"
