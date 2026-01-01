# StudyPal Local Hosting - Quick Reference

## 🚀 Quick Start

Start everything with one command:
```bash
./scripts/start_everything.sh
```

OR start services individually:

### 1. Start Services
```bash
# Terminal 1: Qdrant
docker start qdrant  # or create if doesn't exist

# Terminal 2: Ollama  
ollama serve

# Terminal 3: Backend
./scripts/run_local_backend.sh

# Terminal 4: Tunnel
./scripts/setup_tunnel.sh
```

### 2. Set Frontend URL
In Netlify dashboard:
```
NEXT_PUBLIC_API_URL=https://your-tunnel-url
```

### 3. Test
```bash
./scripts/test_services.sh
```

## 📚 Available Scripts

| Script | Purpose |
|--------|---------|
| `run_local_backend.sh` | Start FastAPI backend |
| `setup_tunnel.sh` | Create public HTTPS tunnel |
| `start_everything.sh` | Start all services + tunnel |
| `test_services.sh` | Verify all services working |

## 🔧 Service Commands

### Qdrant (Vector Database)
```bash
# Start
docker start qdrant

# Create (first time)
docker run -d -p 6333:6333 -p 6334:6334 \
  -v qdrant_storage:/qdrant/storage \
  --name qdrant qdrant/qdrant

# Check
curl http://localhost:6333/health
```

### Ollama (AI Models)
```bash
# Start
ollama serve

# Pull models
ollama pull mixtral
ollama pull qwen2.5:14b

# Check
ollama list
```

### Backend (FastAPI)
```bash
# Quick start
./scripts/run_local_backend.sh

# Manual
source .venv/bin/activate
cd backend
python app.py

# Check
curl http://localhost:8000/health
```

### Tunnel Options

**Ngrok (Quick Testing)**
```bash
ngrok http 8000
# URL: https://xyz.ngrok-free.app
```

**Cloudflare (Stable)**
```bash
cloudflared tunnel --url http://localhost:8000
# URL: https://xyz.trycloudflare.com
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or find and kill manually
lsof -ti:8000
kill -9 <PID>
```

### Services Not Running
```bash
# Check all services
./scripts/test_services.sh

# Check individual services
docker ps | grep qdrant
curl http://localhost:11434/api/tags
curl http://localhost:8000/health
```

### CORS Errors
Add your tunnel domain to `backend/app.py` CORS origins.

## 📖 Full Documentation

See [docs/local_hosting.md](../docs/local_hosting.md) for:
- Detailed setup instructions
- Tunnel comparison
- Performance optimization
- Advanced configuration
- Complete troubleshooting guide

## 🎯 Expected Result

When everything is working:
- ✅ Backend: http://localhost:8000
- ✅ Public URL: https://your-tunnel.app
- ✅ Frontend: https://assistantstudy.netlify.app
- ✅ JARVIS shows: "AI ONLINE" 🟢

## 📦 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 8000 | http://localhost:8000 |
| Qdrant | 6333 | http://localhost:6333 |
| Ollama | 11434 | http://localhost:11434 |
| Ngrok UI | 4040 | http://localhost:4040 |

## 🔐 Security Notes

- CORS configured for specific domains only
- No public wildcard CORS
- Tunnel URLs are public but services are local
- Add authentication for production use

## 💡 Pro Tips

1. **Keep terminals organized**: Use tmux or separate terminal tabs
2. **Monitor logs**: Check backend terminal for errors
3. **Use stable tunnel**: Cloudflare for long sessions
4. **Backup Qdrant data**: Volume persisted in Docker
5. **Test locally first**: Before exposing via tunnel

## 🆘 Need Help?

1. Run diagnostics: `./scripts/test_services.sh`
2. Check logs in each terminal
3. Verify environment variables
4. Review [full documentation](../docs/local_hosting.md)
