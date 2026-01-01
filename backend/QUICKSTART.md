# 🚀 StudyPal AI OS Backend - Quick Start Guide

## Start Backend (Choose One Method)

### Method 1: Direct Python (Recommended)
```bash
cd backend
source ../.venv/bin/activate
python app.py
```

### Method 2: Startup Script
```bash
cd backend
./start.sh
```

---

## Required External Services

### 1. Qdrant (Vector Database)
```bash
# Start with Docker
docker run -p 6333:6333 qdrant/qdrant

# Or install: https://qdrant.tech/documentation/quick-start/
```

### 2. Ollama (AI Models)
```bash
# Start Ollama
ollama serve

# In another terminal, pull models
ollama pull mixtral
ollama pull qwen
```

---

## Test Endpoints

### Health Check
```bash
curl http://localhost:8000/health | jq
```

### Add Material
```bash
curl -X POST http://localhost:8000/materials/add \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your study material here",
    "course": "Course Name",
    "topic": "Topic Name"
  }' | jq
```

### Ask Question
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Your question here",
    "use_memory": true
  }' | jq
```

### Generate Flashcards
```bash
curl -X POST http://localhost:8000/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Your topic",
    "num_cards": 5,
    "use_memory": true
  }' | jq
```

---

## Quick Test

Run all tests at once:
```bash
cd backend
./quick_test.sh
```

Or comprehensive Python test:
```bash
python test_backend.py
```

---

## API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Root:** http://localhost:8000/

---

## Troubleshooting

### Backend won't start
```bash
# Check Python environment
source ../.venv/bin/activate
pip install -r requirements.txt
```

### Qdrant not connecting
```bash
# Check if Qdrant is running
curl http://localhost:6333/collections

# Start Qdrant if needed
docker run -p 6333:6333 qdrant/qdrant
```

### Ollama not connecting
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve

# Ensure models are installed
ollama list
```

---

## File Structure

```
backend/
├── app.py                    # Main FastAPI app
├── requirements.txt          # Dependencies
├── start.sh                  # Startup script
├── quick_test.sh            # Quick test
├── test_backend.py          # Full test suite
├── README.md                # Full documentation
├── IMPLEMENTATION_COMPLETE.md # Implementation details
│
├── services/
│   ├── memory_service.py    # Qdrant + embeddings
│   ├── ollama_service.py    # Mixtral + Qwen
│   └── whisper_service.py   # Audio transcription
│
└── routes/
    ├── audio_routes.py      # Audio endpoints
    ├── material_routes.py   # Material endpoints
    └── ai_routes.py         # AI endpoints
```

---

## Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/materials/add` | POST | Add study material |
| `/materials/stats` | GET | Memory statistics |
| `/audio/upload` | POST | Upload audio file |
| `/ask` | POST | RAG Q&A |
| `/flashcards/generate` | POST | Generate flashcards |
| `/plan/create` | POST | Create study plan |
| `/docs` | GET | Swagger UI |

---

## Environment Check

Backend is working if you see:
```
✅ Backend ready at http://localhost:8000
📚 API docs at http://localhost:8000/docs
```

Services are healthy if `/health` shows:
- `"backend": "online"`
- `"qdrant": { "connected": true }`
- `"ollama": { "connected": true }`
- `"whisper": { "loaded": true }`

---

**Need help?** Check `README.md` or `IMPLEMENTATION_COMPLETE.md` for full details.
