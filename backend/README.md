# StudyPal AI OS - Backend

Complete local AI system for intelligent study assistance.

## 🏗️ Architecture

### Core Services

1. **Whisper** - Local speech-to-text (base model)
2. **Qdrant** - Vector database for semantic memory
3. **Ollama** - Local LLM inference (Mixtral + Qwen)
4. **Sentence-Transformers** - Embedding generation

### Tech Stack

- **FastAPI** - High-performance API framework
- **Python 3.10+** - Core language
- **Docker** - For Qdrant deployment
- **Ollama** - For local LLM inference

---

## 🚀 Quick Start

### 1. Prerequisites

#### Start Qdrant (Vector Database)
```bash
docker run -p 6333:6333 qdrant/qdrant
```

#### Start Ollama (AI Models)
```bash
# Start Ollama server
ollama serve

# Pull required models (in another terminal)
ollama pull mixtral
ollama pull qwen
```

### 2. Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv ../.venv
source ../.venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 3. Start Backend

```bash
# Option 1: Using the startup script
chmod +x start.sh
./start.sh

# Option 2: Direct Python
python app.py

# Option 3: Using uvicorn
uvicorn app:app --reload
```

The server will start at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

---

## 📡 API Endpoints

### Health Check
```bash
GET /health
```
Returns status of all services (Qdrant, Ollama, Whisper)

### 1️⃣ Add Study Materials
```bash
POST /materials/add
Content-Type: application/json

{
  "text": "Deadlocks occur when processes are waiting for resources...",
  "course": "Operating Systems",
  "topic": "Deadlocks"
}
```

### 2️⃣ Upload Audio for Transcription
```bash
POST /audio/upload
Content-Type: multipart/form-data

file: <audio_file.mp3>
course: "Operating Systems"
topic: "Lecture 5"
```

### 3️⃣ Ask Questions (RAG)
```bash
POST /ask
Content-Type: application/json

{
  "question": "Explain what causes deadlocks in operating systems",
  "use_memory": true,
  "top_k": 5
}
```

### 4️⃣ Generate Flashcards
```bash
POST /flashcards/generate
Content-Type: application/json

{
  "topic": "Operating Systems Deadlocks",
  "num_cards": 5,
  "use_memory": true
}
```

### 5️⃣ Create Study Plan
```bash
POST /plan/create
Content-Type: application/json

{
  "subject": "Operating Systems",
  "days": 7,
  "current_knowledge": "Familiar with basic concepts"
}
```

---

## 🧪 Testing

### Test Health Check
```bash
curl http://localhost:8000/health
```

### Test Adding Material
```bash
curl -X POST http://localhost:8000/materials/add \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The four necessary conditions for deadlock are: mutual exclusion, hold and wait, no preemption, and circular wait.",
    "course": "Operating Systems",
    "topic": "Deadlocks"
  }'
```

### Test Question Answering
```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the four conditions for deadlock?",
    "use_memory": true
  }'
```

### Test Flashcard Generation
```bash
curl -X POST http://localhost:8000/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Deadlocks",
    "num_cards": 3,
    "use_memory": true
  }'
```

---

## 📁 Project Structure

```
backend/
├── app.py                      # Main FastAPI application
├── requirements.txt            # Python dependencies
├── start.sh                    # Startup script
├── README.md                   # This file
│
├── services/                   # Core services
│   ├── __init__.py
│   ├── memory_service.py      # Qdrant + embeddings
│   ├── ollama_service.py      # Mixtral + Qwen LLMs
│   └── whisper_service.py     # Audio transcription
│
└── routes/                     # API endpoints
    ├── __init__.py
    ├── audio_routes.py         # Audio upload & transcription
    ├── material_routes.py      # Material management
    └── ai_routes.py            # RAG, flashcards, planning
```

---

## 🔧 Troubleshooting

### Qdrant Connection Issues
```bash
# Check if Qdrant is running
curl http://localhost:6333/collections

# Restart Qdrant
docker restart <qdrant_container_id>
```

### Ollama Connection Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check available models
ollama list

# Pull missing models
ollama pull mixtral
ollama pull qwen
```

### Whisper Model Issues
If Whisper model download fails, manually download:
```bash
python -c "import whisper; whisper.load_model('base')"
```

---

## 🎯 Features

### ✅ Implemented

- [x] Health check with service status
- [x] Material storage with metadata
- [x] Audio transcription + chunking
- [x] Semantic search (RAG)
- [x] AI question answering (Mixtral)
- [x] Flashcard generation (Qwen)
- [x] Study plan creation
- [x] Auto-collection creation
- [x] Batch operations
- [x] Error handling
- [x] Logging
- [x] OpenAPI docs

### 🚀 Production Checklist

- [ ] Add authentication
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Environment variables
- [ ] Database backup
- [ ] Monitoring/logging
- [ ] Docker compose setup
- [ ] Load balancing
- [ ] API versioning

---

## 📊 Performance

- **Whisper base**: ~1 minute audio = 5-10 seconds
- **Embeddings**: ~100 texts = 1-2 seconds
- **Qdrant search**: < 100ms
- **Mixtral response**: 5-30 seconds (depending on complexity)
- **Qwen response**: 3-15 seconds

---

## 📝 Environment Variables

Optional configuration (defaults work out of the box):

```bash
# Qdrant
QDRANT_URL=http://localhost:6333

# Ollama
OLLAMA_URL=http://localhost:11434

# Whisper
WHISPER_MODEL=base  # tiny, base, small, medium, large
```

---

## 🤝 Integration

### With Frontend (Next.js)

```typescript
// Example API call from Next.js
const response = await fetch('http://localhost:8000/ask', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'Explain deadlocks',
    use_memory: true
  })
});

const data = await response.json();
console.log(data.answer);
```

---

## 📚 Documentation

- FastAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Qdrant: https://qdrant.tech/documentation/
- Ollama: https://ollama.ai/

---

## 🎓 Usage Examples

### Building a Study Session

1. **Add your notes:**
   ```bash
   POST /materials/add with course materials
   ```

2. **Upload lecture recordings:**
   ```bash
   POST /audio/upload with audio files
   ```

3. **Ask questions:**
   ```bash
   POST /ask with questions about materials
   ```

4. **Generate flashcards:**
   ```bash
   POST /flashcards/generate for quick review
   ```

5. **Create study plan:**
   ```bash
   POST /plan/create for structured learning
   ```

---

## 🐛 Known Issues

None currently! If you find bugs, please report them.

---

## 📄 License

MIT License - Free for educational and commercial use.

---

**Built with ❤️ for students everywhere**
