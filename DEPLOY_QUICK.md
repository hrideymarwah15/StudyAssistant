# 🚀 QUICK DEPLOYMENT INSTRUCTIONS

## ⚡ Deploy in 15 Minutes

Your Study Assistant is ready to deploy! All code is committed and pushed to GitHub.

---

## STEP 1: Deploy Backend (5 minutes)

### Option A: Railway (Recommended)

1. Go to: **https://railway.app/new**
2. Click **"Login with GitHub"**
3. Click **"Deploy from GitHub repo"**
4. Select: **StudyAssistant** repository
5. Railway will auto-detect the Python app
6. **Wait** for deployment (2-3 minutes)
7. **Copy the URL** (looks like: `https://xxx.railway.app`)

### Option B: Render

1. Go to: **https://render.com/**
2. Sign in with GitHub
3. **New** → **Web Service**
4. Connect **StudyAssistant** repository
5. Configuration:
   - Root Directory: `backend`
   - Build: `pip install -r requirements-production.txt`
   - Start: `uvicorn app_production_v2:app --host 0.0.0.0 --port $PORT`
6. **Wait** for first deployment (5-10 minutes)
7. **Copy the URL** (looks like: `https://xxx.onrender.com`)

---

## STEP 2: Configure Netlify (5 minutes)

1. Go to: **https://app.netlify.com/sites/assistantstudy/settings/env**

2. Click **"Add a variable"** for each of these:

### Backend URL
```
Key: NEXT_PUBLIC_API_URL
Value: <paste your Railway/Render URL from Step 1>
```

### Firebase Configuration
Open your `.env.local` file and copy these 8 values:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FIREBASE_DATABASE_URL
```

3. **Save** all variables

---

## STEP 3: Rebuild Netlify (2 minutes)

1. Go to: **https://app.netlify.com/sites/assistantstudy/deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. **Wait** for build (2-3 minutes)
4. Check for **"Published"** status

---

## STEP 4: Test Everything (3 minutes)

### Test Backend
Open in browser:
```
https://your-backend-url/health
```
Should show: `{"backend": "online", "status": "healthy"}`

### Test Frontend
1. Visit: **https://assistantstudy.netlify.app**
2. Sign in with Firebase
3. Go to **Flashcards** page
4. Click **"Generate Exam-Grade Flashcards"**
5. Enter topic: **"Mitosis"**
6. Click **"Generate Flashcards"**
7. Should see 10 flashcards appear
8. Try reviewing one (Show Answer → Rate it)

---

## ✅ SUCCESS CHECKLIST

- [ ] Backend deployed to Railway/Render
- [ ] Backend `/health` endpoint works
- [ ] All 9 Netlify env variables set
- [ ] Netlify rebuild completed
- [ ] Frontend loads without errors
- [ ] Can sign in with Firebase
- [ ] Can generate flashcards
- [ ] Can review flashcards with SRS

---

## 🎉 YOU'RE LIVE!

Your site: **https://assistantstudy.netlify.app**

### What Works:
✅ Exam-grade flashcard generation (7 card types)
✅ SRS review system (4-level rating)
✅ Mistake tracking and TRAP cards
✅ Firebase authentication
✅ All study tools and dashboard

### Current Mode:
📝 **Mock Mode** - Flashcards use template data. To upgrade to real AI, see `PRODUCTION_SETUP_GUIDE.md`

---

## 🔧 Troubleshooting

### Backend not responding?
- Check Railway/Render logs
- Verify start command is correct
- Test: `curl https://your-backend-url/health`

### Frontend errors?
- Open browser console (F12)
- Check Network tab for failed API calls
- Verify `NEXT_PUBLIC_API_URL` is set correctly (no trailing slash)

### Flashcards not generating?
- Check backend is responding
- Verify all env variables are set
- Clear browser cache and retry

---

## 📞 Need Help?

1. Check **PRODUCTION_SETUP_GUIDE.md** for detailed instructions
2. Check **DEPLOYMENT_STATUS_FINAL.md** for architecture overview
3. Verify backend health: `<your-backend-url>/health`
4. Check Netlify deploy logs
5. Check browser console for errors

---

**Total deployment time: 15 minutes** ⏱️

**Your credentials are in `.env.local` - do NOT commit this file!** 🔐
