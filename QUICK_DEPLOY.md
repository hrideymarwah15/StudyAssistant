# Study Assistant - Quick Deploy Guide

## 🚀 Deploy Backend to Render (5 minutes)

1. **Click this button to deploy:**

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/hrideymarwah15/StudyAssistant)

2. **Or manually:**
   - Go to https://dashboard.render.com/blueprints
   - Click "New Blueprint Instance"
   - Connect repository: `hrideymarwah15/StudyAssistant`
   - Select `backend/render.yaml`
   - Click "Apply"

3. **Wait for deployment** (5-10 minutes)

4. **Copy your backend URL** from the Render dashboard
   - It will look like: `https://study-assistant-backend.onrender.com`

## 🌐 Deploy Frontend to Netlify (Automatic)

The frontend is already connected to Netlify and will auto-deploy when you push to GitHub!

**Your frontend URL:** http://assistantstudy.netlify.app

## ⚙️ Configure Backend URL

After Render deployment completes:

```bash
# Update the backend URL in netlify.toml
./configure-backend.sh YOUR_BACKEND_URL
```

Or manually edit `netlify.toml` and replace:
```toml
NEXT_PUBLIC_API_URL = "https://study-assistant-backend.onrender.com"
```

Then commit and push:
```bash
git add netlify.toml
git commit -m "Update backend URL"
git push origin main
```

Netlify will automatically redeploy with the new configuration!

## ✅ Test Your Deployment

```bash
./check-deployment.sh
```

## 📝 What's Deployed

**Frontend (Netlify):**
- ✅ Auto-deploys from GitHub
- ✅ Connected to your backend
- ✅ All UI features working

**Backend (Render):**
- ✅ Basic API endpoints
- ✅ Health checks
- ⚠️  AI features in demo mode (need Ollama/Qdrant for full features)

## 🔧 Upgrade to Full AI Features

To enable full AI capabilities, you'll need to:
1. Deploy Qdrant (vector database)
2. Deploy Ollama (AI models)
3. Configure environment variables in Render

See `DEPLOYMENT_GUIDE.md` for full setup instructions.

## 🎉 Your URLs

- **Frontend:** http://assistantstudy.netlify.app
- **Backend:** (will be shown after Render deployment)
- **API Docs:** `your-backend-url/docs`
