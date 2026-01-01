# Quick Start: AI-Enhanced Study Assistant

## What's New? 🎉

Your study assistant now has a powerful AI backend with:
- **RAG (Retrieval-Augmented Generation)**: Ask questions about your study materials
- **Audio Transcription**: Upload lecture recordings, get instant transcripts
- **AI Flashcards**: Generate flashcards from your materials
- **Smart Study Plans**: AI-powered personalized study schedules
- **Real-time Health Monitoring**: See backend service status on dashboard

## Quick Setup

### 1. Start the Backend (Optional - features work without it)

```bash
# Terminal 1: Start backend
cd backend
python app.py
```

Backend starts on `http://localhost:8000`

### 2. Start the Frontend

```bash
# Terminal 2: Start Next.js
pnpm dev
```

Frontend starts on `http://localhost:3000`

### 3. Check Health Status

- Visit the **Dashboard**
- Look for the "AI System Status" card
- ✅ Green = All services online
- ⚠️ Yellow = Some services degraded  
- ❌ Red = Backend offline (features use fallbacks)

## Try It Out

### 1. Upload Study Material

1. Go to **Materials** page
2. Drag & drop a PDF, TXT, or audio file
3. See it process and store in AI memory
4. Check dashboard - vector count increases

### 2. Ask Questions

1. Click the chat icon (bottom right)
2. Type: "What are the main topics in my materials?"
3. Get AI-powered answers with context retrieval

### 3. Generate Flashcards

1. Go to **Flashcards** page
2. Click "Generate with AI"
3. Enter a topic from your materials
4. Get instant question/answer pairs

### 4. Create Study Plan

1. Go to **Planner** page
2. Click "Generate AI Study Plan"
3. Enter: topics, deadline, hours per day
4. Get a personalized schedule

## Backend Services Explained

Your AI backend runs three key services:

### Qdrant (Vector Database)
- **What**: Stores your study materials as searchable vectors
- **Where**: `http://localhost:6333`
- **Why**: Enables semantic search and context retrieval

### Ollama (AI Models)
- **What**: Runs large language models locally
- **Models**: 
  - Mixtral-8x7B (question answering)
  - Qwen2.5:14b (embeddings)
- **Where**: `http://localhost:11434`
- **Why**: Privacy-first AI without sending data to cloud

### Whisper (Speech-to-Text)
- **What**: Transcribes audio lectures and recordings
- **Model**: Base model (~150MB)
- **Why**: Convert audio study materials to searchable text

## No Backend? No Problem!

All features work without the backend:
- **Materials**: Files store locally
- **Ask AI**: Uses local commands or Gemini (if configured)
- **Flashcards**: Manual creation
- **Study Plans**: Template-based generation

The app automatically detects backend status and adjusts.

## Troubleshooting

### "Backend Offline" on Dashboard

**Option 1**: Start the backend
```bash
cd backend && python app.py
```

**Option 2**: Continue without AI features (fallbacks work fine)

### Backend Starts But Services Fail

Check required services:

```bash
# Start Qdrant
docker run -p 6333:6333 qdrant/qdrant

# Start Ollama (separate terminal)
ollama serve

# Pull models
ollama pull mixtral:8x7b
ollama pull qwen2.5:14b
```

### Slow First Request

- First AI request loads models into memory (~30s)
- Subsequent requests are fast
- This is normal behavior

## Configuration

### Custom Backend URL

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Disable Backend

Don't start `backend/app.py` - frontend works normally with fallbacks.

## What's Preserved

✅ All existing UI and styling  
✅ All Firebase functionality  
✅ All manual features (tasks, calendar, habits)  
✅ All navigation and layouts  

The backend integration is purely additive - nothing was removed or redesigned.

## Need Help?

See [AI_BACKEND_INTEGRATION.md](./AI_BACKEND_INTEGRATION.md) for detailed documentation.

---

**Pro Tip**: Upload a few PDFs or lecture notes, then try asking "Summarize my study materials" in the chat. The AI will use context from your uploaded materials to provide relevant answers! 🚀
