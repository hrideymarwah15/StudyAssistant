# 🏠 Local Hosting Guide

This guide explains how to run the StudyPal backend on your local laptop and expose it to the internet using a public HTTPS tunnel.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Tunnel Options](#tunnel-options)
- [Frontend Connection](#frontend-connection)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

1. **Docker** - For running Qdrant vector database
2. **Ollama** - For running local AI models
3. **Python 3.10+** - For the backend
4. **Tunnel Tool** - Ngrok OR Cloudflare Tunnel

### Optional

- Ngrok account (free tier available)
- Cloudflare account (optional, not required for tunnel)

---

## Quick Start

### 1. Start All Services

```bash
# Start Qdrant (Vector Database)
docker run -d -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  --name qdrant qdrant/qdrant

# Start Ollama (in separate terminal)
ollama serve

# Pull AI models (first time only)
ollama pull mixtral
ollama pull qwen2.5:14b
```

### 2. Start Backend

```bash
./scripts/run_local_backend.sh
```

This script will:
- ✅ Activate Python virtual environment
- ✅ Check Qdrant connection
- ✅ Check Ollama models
- ✅ Start FastAPI on port 8000
- ✅ Verify server is reachable

### 3. Create Public Tunnel

```bash
./scripts/setup_tunnel.sh
```

Choose between Ngrok or Cloudflare Tunnel.

### 4. Update Frontend

Set the tunnel URL in Netlify:
```
NEXT_PUBLIC_API_URL=https://your-tunnel-url.ngrok-free.app
```

---

## Detailed Setup

### Qdrant Setup

Qdrant is your vector database for semantic memory.

**Check if running:**
```bash
curl http://localhost:6333/health
```

**Start existing container:**
```bash
docker start qdrant
```

**Create new container:**
```bash
docker run -d -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  --name qdrant qdrant/qdrant
```

**Verify:**
```bash
curl http://localhost:6333/health
# Should return: {"title":"qdrant - vector search engine","version":"..."}
```

---

### Ollama Setup

Ollama runs your AI models locally.

**Start Ollama:**
```bash
ollama serve
```

**Pull required models:**
```bash
# Mixtral - For Q&A and general AI tasks
ollama pull mixtral

# Qwen 2.5 14B - For flashcard generation
ollama pull qwen2.5:14b
```

**Verify models:**
```bash
ollama list
```

**Expected output:**
```
NAME                ID              SIZE      MODIFIED
mixtral:latest      abcd1234...     26 GB     2 hours ago
qwen2.5:14b         efgh5678...     8.0 GB    1 hour ago
```

---

### Backend Setup

The backend is a FastAPI application.

**Auto-start with script:**
```bash
./scripts/run_local_backend.sh
```

**Manual start:**
```bash
# Activate virtual environment
source .venv/bin/activate

# Go to backend directory
cd backend

# Start server
python app.py
```

**Verify backend:**
```bash
curl http://localhost:8000/health
```

**Check API docs:**
Open in browser: http://localhost:8000/docs

---

## Tunnel Options

### Option 1: Ngrok (Recommended for Testing)

**Pros:**
- ✅ Very easy setup
- ✅ Web interface for debugging
- ✅ Request inspection
- ✅ Free tier available

**Cons:**
- ❌ URL changes on restart (free tier)
- ❌ Session timeout
- ❌ Limited to 40 connections/minute (free)

**Installation:**
```bash
brew install ngrok
```

**Authentication (required):**
```bash
# Sign up at https://ngrok.com
ngrok authtoken YOUR_AUTH_TOKEN
```

**Start tunnel:**
```bash
ngrok http 8000
```

**Your public URL:**
```
Forwarding: https://abcd-1234-5678.ngrok-free.app -> http://localhost:8000
```

**Features:**
- Web UI: http://localhost:4040
- See all requests in real-time
- Replay requests for debugging

---

### Option 2: Cloudflare Tunnel (Recommended for Stability)

**Pros:**
- ✅ Stable URL (doesn't change)
- ✅ Unlimited bandwidth
- ✅ DDoS protection
- ✅ Free forever
- ✅ No rate limits

**Cons:**
- ❌ Random subdomain (can't customize on free)
- ❌ No web UI for debugging

**Installation:**
```bash
brew install cloudflared
```

**Start tunnel:**
```bash
cloudflared tunnel --url http://localhost:8000
```

**Your public URL:**
```
https://abc-def-ghi.trycloudflare.com
```

**No registration required!**

---

## Frontend Connection

### Set Environment Variable

**In Netlify Dashboard:**
1. Go to: https://app.netlify.com/sites/assistantstudy
2. Site settings → Environment variables
3. Add new variable:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-tunnel-url.ngrok-free.app`
4. Trigger new deploy

**For Local Development:**

Create `.env.local` in project root:
```bash
NEXT_PUBLIC_API_URL=https://your-tunnel-url.ngrok-free.app
```

### Verify Connection

1. Open: https://assistantstudy.netlify.app
2. Check JARVIS status indicator
3. Should show: "AI ONLINE" (green)
4. Try asking a question

---

## CORS Configuration

The backend only allows connections from:
- `http://localhost:3000` (local development)
- `https://assistantstudy.netlify.app` (production)
- Your tunnel domain (automatically allowed)

If you deploy to a different domain, update `backend/app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://assistantstudy.netlify.app",
        "https://your-custom-domain.com",  # Add your domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Troubleshooting

### Backend Won't Start

**Issue:** Port 8000 already in use
```bash
# Find process using port 8000
lsof -ti:8000

# Kill it
kill -9 $(lsof -ti:8000)
```

**Issue:** Import errors
```bash
# Reinstall dependencies
source .venv/bin/activate
pip install -r backend/requirements.txt
```

---

### Qdrant Not Working

**Issue:** Connection refused
```bash
# Check if running
docker ps | grep qdrant

# Restart
docker restart qdrant

# Check logs
docker logs qdrant
```

**Issue:** Container doesn't exist
```bash
# Create new container
docker run -d -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  --name qdrant qdrant/qdrant
```

---

### Ollama Issues

**Issue:** Models not found
```bash
# List installed models
ollama list

# Pull missing models
ollama pull mixtral
ollama pull qwen2.5:14b
```

**Issue:** Ollama not responding
```bash
# Check if running
curl http://localhost:11434/api/tags

# Restart Ollama
# Kill existing process and restart
ollama serve
```

---

### Tunnel Issues

**Ngrok:**
- Ensure you've authenticated: `ngrok authtoken YOUR_TOKEN`
- Free tier has limits: 40 requests/minute
- URL changes on restart

**Cloudflare:**
- No authentication needed
- If URL blocked, try restarting tunnel
- Cloudflare may show "Are you human?" check first time

---

### Frontend Connection Issues

**Issue:** JARVIS shows "BACKEND OFFLINE"

1. Check backend is running: `curl http://localhost:8000/health`
2. Check tunnel is running (should see URL in terminal)
3. Verify Netlify environment variable is set correctly
4. Check CORS settings in `backend/app.py`

**Issue:** CORS errors in browser console

Add your tunnel domain to CORS origins in `backend/app.py`.

---

## Performance Tips

### Speed Up AI Responses

1. **Use faster models:**
   ```bash
   ollama pull llama3.2:3b  # Smaller, faster
   ```

2. **Increase Ollama resources:**
   ```bash
   # Set environment variable before starting
   export OLLAMA_NUM_PARALLEL=2
   ollama serve
   ```

3. **Use GPU acceleration:**
   Ollama automatically uses GPU if available (NVIDIA, AMD, or Apple Silicon)

### Reduce Qdrant Memory Usage

```bash
# Stop container
docker stop qdrant

# Start with memory limits
docker run -d -p 6333:6333 \
  -v qdrant_storage:/qdrant/storage \
  --memory="2g" \
  --name qdrant qdrant/qdrant
```

---

## Advanced Configuration

### Persistent Ngrok URL (Paid)

With Ngrok Pro, get a static URL:
```bash
ngrok http 8000 --domain=your-static-domain.ngrok-free.app
```

### Cloudflare Named Tunnel

For a persistent tunnel name:
```bash
# Login to Cloudflare
cloudflared tunnel login

# Create named tunnel
cloudflared tunnel create studypal

# Run named tunnel
cloudflared tunnel run studypal
```

---

## Production Checklist

Before going live:

- [ ] Backend starts automatically on laptop boot
- [ ] Qdrant data persisted to volume
- [ ] Ollama models downloaded
- [ ] Tunnel auto-restarts on disconnect
- [ ] Frontend environment variable set correctly
- [ ] CORS configured for your domains only
- [ ] Error monitoring in place
- [ ] Backup strategy for Qdrant data

---

## Support

**Issues with setup?**
- Check logs: `docker logs qdrant`
- Check backend logs in terminal
- Verify all services with health checks

**Need help?**
- Check GitHub Issues
- Review error messages carefully
- Ensure all prerequisites are installed

---

## Summary

**To run everything:**

```bash
# Terminal 1: Qdrant
docker start qdrant

# Terminal 2: Ollama
ollama serve

# Terminal 3: Backend
./scripts/run_local_backend.sh

# Terminal 4: Tunnel
./scripts/setup_tunnel.sh
```

**Then:**
- Set `NEXT_PUBLIC_API_URL` in Netlify
- Open https://assistantstudy.netlify.app
- Enjoy your AI-powered study assistant! 🎉

---

## Next Steps

- [Backend API Documentation](http://localhost:8000/docs)
- [Qdrant Dashboard](http://localhost:6333/dashboard)
- [Ngrok Web UI](http://localhost:4040)
