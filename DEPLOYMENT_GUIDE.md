# 🚀 Study Assistant Deployment Guide

This guide will help you deploy your AI-enhanced study assistant to production.

## 📋 Prerequisites

- GitHub account
- Netlify account (for frontend)
- Railway or Render account (for backend)
- Qdrant instance (for vector storage)
- Ollama instance (for AI models)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   Netlify       │    │   Railway/      │
│   (Frontend)    │◄──►│   Render        │
│   Next.js       │    │   (Backend)     │
└─────────────────┘    │   FastAPI       │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │   • Qdrant      │
                       │   • Ollama      │
                       │   • Whisper     │
                       └─────────────────┘
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make sure you're in the project root
cd /Users/hridey/Desktop/Studyassistant

# Run the deployment script
./deploy.sh
```

### Option 2: Manual Deployment

## Step 1: Deploy Backend

### Option A: Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Get Backend URL**:
   ```bash
   railway domain
   ```
   Save this URL for the frontend configuration.

### Option B: Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set root directory to `backend`

2. **Configure Build**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Python Version: `3.11`

3. **Environment Variables**:
   ```
   QDRANT_URL=https://your-qdrant-instance.onrender.com
   OLLAMA_BASE_URL=https://your-ollama-instance.onrender.com
   DEBUG=False
   ```

## Step 2: Deploy AI Services

### Qdrant (Vector Database)

1. **Deploy to Render**:
   - Go to Render Dashboard
   - Create new "Web Service"
   - Use Docker image: `qdrant/qdrant`
   - Set environment variable: `QDRANT__SERVICE__HTTP_PORT=6333`

2. **Get Qdrant URL** and save it.

### Ollama (AI Models)

1. **Deploy to Render**:
   - Create new "Web Service"
   - Use Docker image: `ollama/ollama`
   - Start command: `ollama serve`

2. **Pull Models** (via Render shell):
   ```bash
   ollama pull mixtral:8x7b
   ollama pull qwen2.5:14b
   ```

3. **Get Ollama URL** and save it.

## Step 3: Deploy Frontend

### Netlify Deployment

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   netlify login
   ```

2. **Deploy**:
   ```bash
   # Update netlify.toml with your backend URL
   # Replace "https://your-backend-url.onrender.com" with your actual backend URL

   netlify deploy --prod --build
   ```

3. **Set Environment Variables** in Netlify Dashboard:
   - `NEXT_PUBLIC_API_URL`: Your backend URL
   - `NEXT_PUBLIC_GEMINI_API_KEY`: Your Gemini API key

## 🔧 Configuration

### Environment Variables

Create `.env.production` in the root directory:

```env
# Frontend
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Backend (set in Railway/Render)
QDRANT_URL=https://your-qdrant.onrender.com
OLLAMA_BASE_URL=https://your-ollama.onrender.com
DEBUG=False
```

### Update API URLs

1. **In `netlify.toml`**:
   ```toml
   NEXT_PUBLIC_API_URL = "https://your-backend-url.onrender.com"
   ```

2. **In backend environment**:
   ```
   QDRANT_URL=https://your-qdrant-instance.onrender.com
   OLLAMA_BASE_URL=https://your-ollama-instance.onrender.com
   ```

## 🧪 Testing Deployment

1. **Test Frontend**:
   ```bash
   curl https://your-netlify-site.netlify.app
   ```

2. **Test Backend**:
   ```bash
   curl https://your-backend.onrender.com/health
   ```

3. **Test AI Features**:
   - Upload materials
   - Ask questions in chat
   - Generate flashcards
   - Create study plans

## 🔍 Troubleshooting

### Common Issues

1. **Backend Connection Failed**:
   - Check `NEXT_PUBLIC_API_URL` in Netlify
   - Verify backend is running
   - Check CORS settings

2. **AI Services Not Working**:
   - Verify Qdrant and Ollama URLs
   - Check if models are loaded
   - Test backend health endpoint

3. **Build Failures**:
   - Check Node.js version (18+)
   - Verify all dependencies are installed
   - Check TypeScript errors

### Logs and Debugging

- **Netlify**: Check build logs in dashboard
- **Railway/Render**: Check service logs
- **Backend**: Check `/health` endpoint

## 📊 Performance Optimization

1. **Enable Caching**:
   - Configure Netlify caching headers
   - Use Redis for session storage (if needed)

2. **Optimize Builds**:
   - Use Netlify's build hooks
   - Enable incremental builds

3. **Monitor Usage**:
   - Set up analytics
   - Monitor API usage
   - Track performance metrics

## 🔒 Security

1. **Environment Variables**:
   - Never commit secrets to Git
   - Use Netlify/Railway environment variables
   - Rotate API keys regularly

2. **CORS Configuration**:
   - Configure allowed origins in backend
   - Use HTTPS everywhere

3. **Rate Limiting**:
   - Implement rate limiting in backend
   - Use Netlify's built-in protection

## 📞 Support

If you encounter issues:

1. Check the logs in your deployment platform
2. Verify all environment variables are set
3. Test individual services
4. Check network connectivity

## 🎉 Success Checklist

- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Railway/Render
- [ ] Qdrant instance running
- [ ] Ollama instance with models loaded
- [ ] Environment variables configured
- [ ] All services communicating
- [ ] AI features working
- [ ] HTTPS enabled
- [ ] Domain configured (optional)

Your AI-enhanced study assistant is now live! 🎓🤖