# 🚀 COMPLETE PRODUCTION DEPLOYMENT GUIDE

## Overview
This guide will help you deploy the Study Assistant with all exam-grade flashcard features to production.

## Architecture
- **Frontend**: Netlify (https://assistantstudy.netlify.app)
- **Backend**: Railway/Render (you choose)
- **Database**: Firebase/Firestore
- **AI Mode**: Mock data (upgrade to Ollama/cloud AI later)

## ⚡ QUICK START (15 minutes)

### Step 1: Deploy Backend (5 min)

#### Option A: Railway (Recommended - Easiest)

1. **Go to Railway**: https://railway.app/new
2. **Sign in** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select**: Your Study Assistant repository
5. **Settings**:
   - Root Directory: `backend`
   - Start Command: `uvicorn app_production_v2:app --host 0.0.0.0 --port $PORT`
6. **Deploy** → Wait 2-3 minutes
7. **Copy URL**: Click on the deployment → Copy the public URL
   - Example: `https://studyassistant-production.railway.app`

#### Option B: Render (Free tier available)

1. **Go to Render**: https://render.com/
2. **Sign in** with GitHub
3. **New** → **Web Service**
4. **Connect repository**: Select your Study Assistant repo
5. **Configuration**:
   - Name: `studyassistant-backend`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements-production.txt`
   - Start Command: `uvicorn app_production_v2:app --host 0.0.0.0 --port $PORT`
   - Instance Type: `Free`
6. **Create Web Service** → Wait 5-10 minutes (first deploy is slow)
7. **Copy URL**: Once deployed, copy the public URL
   - Example: `https://studyassistant-backend.onrender.com`

### Step 2: Configure Netlify Environment Variables (5 min)

1. **Go to Netlify**: https://app.netlify.com
2. **Select your site**: `assistantstudy`
3. **Site settings** → **Environment variables**
4. **Add variables**:

#### Required Variables:

```bash
# Backend URL (from Step 1)
NEXT_PUBLIC_API_URL=https://your-backend-url-here.railway.app

# Firebase Configuration (copy from your .env.local file)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDA8RqXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

5. **Save** all variables

### Step 3: Trigger Netlify Rebuild (2 min)

1. **Go to**: Deploys tab
2. **Trigger deploy** → **Deploy site**
3. **Wait** for build to complete (2-3 minutes)
4. **Check logs** for any errors

### Step 4: Verify Deployment (3 min)

#### Test Backend:
```bash
# Replace with your backend URL
curl https://your-backend-url.railway.app/health
```

Expected response:
```json
{
  "backend": "online",
  "status": "healthy",
  "mode": "PRODUCTION_MOCK"
}
```

#### Test Flashcard Endpoint:
```bash
curl -X POST https://your-backend-url.railway.app/ai/flashcards/exam-grade \
  -H "Content-Type: application/json" \
  -d '{"topic":"Biology","num_cards":5,"difficulty":"intermediate"}'
```

Should return 5 flashcards.

#### Test Frontend:
1. Visit: https://assistantstudy.netlify.app
2. Log in with your Firebase account
3. Go to **Flashcards** page
4. Click **Generate Exam-Grade Flashcards**
5. Enter topic: "Mitosis"
6. Generate cards → Should see 10 cards appear

## 🔧 TROUBLESHOOTING

### Backend URL Not Working
- **Check**: Make sure URL has `https://` (not `http://`)
- **Check**: No trailing slash at the end
- **Test**: Visit `<backend-url>/health` in browser

### Netlify Build Failing
- **Check**: All environment variables are set correctly
- **Check**: Variable names have `NEXT_PUBLIC_` prefix
- **Fix**: Clear deploy cache and retry

### Flashcard Generation Not Working
- **Check**: Browser console for errors (F12)
- **Check**: Backend URL is correct in Netlify env vars
- **Check**: Backend is running: `<backend-url>/health`
- **Fix**: Verify CORS settings in backend

### Firebase Auth Not Working
- **Check**: All Firebase env variables are set
- **Check**: Firebase project is active
- **Check**: Authorized domains include your Netlify domain

## 📝 WHAT'S INCLUDED

### Backend Features (Mock Mode):
✅ All endpoints functional with mock data:
- `/ai/flashcards/exam-grade` - Generate 7 card types
- `/ai/flashcards/trap-cards` - Mistake-driven cards
- `/ai/flashcards/exam-simulation` - Exam practice
- `/ai/ask` - Question answering
- `/ai/intelligent-ask` - Mode-based AI responses
- `/ai/plan/create` - Study plan generation

### Frontend Features:
✅ All UI components functional:
- Exam-grade flashcard generator
- SRS review system with 4-level rating
- Mistake tracker
- TRAP card generation
- Advanced dashboard
- AI intelligence system

## 🎯 PRODUCTION STATUS

### ✅ WORKING NOW:
- Frontend deployed and accessible
- Backend API with all endpoints
- Flashcard generation (mock data)
- SRS review system (fully functional)
- Mistake tracking (fully functional)
- Firebase authentication
- All UI components

### 🔄 MOCK MODE (Works but not AI-powered):
- Flashcards return template data
- AI responses are pre-formatted
- No vector search or RAG
- No Ollama/Mixtral/Qwen generation

### 🚀 UPGRADE TO FULL AI (Optional - Future):
To enable real AI generation:
1. Deploy Ollama-capable server (requires GPU)
2. Set up Qdrant vector database
3. Configure environment variables:
   - `OLLAMA_URL`
   - `QDRANT_URL`
4. Switch from `app_production_v2.py` to `app.py`

**OR** use cloud AI services:
- Groq API (you have key: `gsk_HxKr...`)
- Google Gemini API (you have key: `AIzaSyDA...`)

## 🎓 USAGE EXAMPLES

### Generate Flashcards:
1. Go to Flashcards page
2. Click "Generate Exam-Grade Flashcards"
3. Enter topic (e.g., "Cell Division")
4. Select difficulty level
5. Click "Generate"
6. Review cards with SRS system

### Review with SRS:
1. Cards appear in review queue
2. Read question, try to answer
3. Click "Show Answer"
4. Rate: Again (hard) → Hard → Good → Easy
5. Cards automatically scheduled

### Track Mistakes:
1. When you rate a card "Again"
2. Mistake is logged automatically
3. After 3+ mistakes, system suggests TRAP cards
4. Generate TRAP cards to fix misconceptions

## 📊 MONITORING

### Check Backend Status:
```bash
curl https://your-backend-url/health | jq
```

### Check Netlify Deployment:
1. Netlify Dashboard → Site
2. View deploy logs
3. Check function logs (if using)

### Check Frontend Status:
1. Visit site
2. Open browser console (F12)
3. Check Network tab for API calls

## 🔐 SECURITY NOTES

1. **Never commit** `.env.local` to Git
2. **Use environment variables** for all secrets
3. **Firebase rules** should restrict database access
4. **Backend CORS** is set to allow all origins (configure for production)

## 📞 SUPPORT

If you encounter issues:
1. Check backend `/health` endpoint
2. Check Netlify deploy logs
3. Check browser console for errors
4. Verify all environment variables are set

## ✅ DEPLOYMENT CHECKLIST

- [ ] Backend deployed to Railway/Render
- [ ] Backend URL copied
- [ ] Netlify environment variables configured
- [ ] Firebase variables added
- [ ] Netlify redeployed
- [ ] Backend health check passed
- [ ] Frontend loads successfully
- [ ] Flashcard generation works
- [ ] SRS review works
- [ ] Firebase auth works
- [ ] All pages accessible

---

**Your site is now fully functional in production!** 🎉

Users can:
- Generate exam-grade flashcards (mock mode)
- Review cards with advanced SRS
- Track mistakes and get TRAP cards
- Use all dashboard features
- Access study tools

**Next upgrade**: Connect real AI services for intelligent generation.
