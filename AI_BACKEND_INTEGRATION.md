# AI Backend Integration Guide

This document describes the integration between the Next.js frontend and the FastAPI AI backend.

## Backend Services

The backend provides the following AI-powered services:

### 1. **RAG (Retrieval-Augmented Generation)**
- Endpoint: `POST /ai/ask`
- Stores study materials in vector memory (Qdrant)
- Retrieves relevant context for questions
- Generates responses using Ollama (Mixtral-8x7B)

### 2. **Material Processing**
- Endpoint: `POST /materials/add`
- Stores text-based study materials
- Chunks content for efficient retrieval
- Indexes in vector database

### 3. **Audio Transcription**
- Endpoint: `POST /audio/upload`
- Transcribes audio files using Whisper (base model)
- Supports: MP3, WAV, M4A, OGG, FLAC
- Stores transcriptions in vector memory

### 4. **Flashcard Generation**
- Endpoint: `POST /ai/flashcards/generate`
- AI-generated question/answer pairs
- Based on study materials or topics

### 5. **Study Planning**
- Endpoint: `POST /ai/plan/create`
- Intelligent study plan generation
- Considers topics, deadline, hours per day
- Creates structured task list

### 6. **Health Monitoring**
- Endpoint: `GET /health`
- Real-time service status
- Connection health for Qdrant, Ollama, Whisper

## Integration Points

### Dashboard (`/app/dashboard/page.tsx`)
- **Component**: `AISystemHealth`
- **Features**: 
  - Displays real-time backend service status
  - Shows Qdrant vector count
  - Lists available Ollama models
  - Indicates Whisper readiness
  - Auto-refreshes every 30 seconds

### Assistant Panel (`/components/assistant-panel.tsx`)
- **Integration**: RAG-powered Q&A
- **Features**:
  - Queries AI backend with context retrieval
  - Falls back to local commands if backend offline
  - Displays streaming responses

### Material Processor (`/components/materials/MaterialProcessor.tsx`)
- **Integration**: Material upload + audio transcription
- **Features**:
  - Text files → vector storage
  - Audio files → transcription → vector storage
  - Drag-and-drop interface
  - Progress indicators and toast notifications

### Flashcards Page (`/app/flashcards/page.tsx`)
- **Integration**: AI flashcard generation
- **Features**:
  - Generates flashcards from topics
  - Uses stored study materials for context
  - Falls back to manual creation if backend offline

### Study Planner (`/app/planner/page.tsx`)
- **Integration**: AI study plan generation
- **Features**:
  - Creates personalized study plans
  - Parses AI-generated plans into tasks
  - Falls back to template-based plans if offline

## API Client (`/lib/api.ts`)

Centralized API client with the following functions:

```typescript
// Health check
checkHealth(): Promise<HealthResponse>

// Material management
addMaterial(content: string, filename?: string, type?: string): Promise<void>

// Audio processing
uploadAudio(audioFile: File): Promise<AudioTranscriptResponse>

// AI queries
askAI(question: string, context?: string): Promise<AIResponse>

// Flashcard generation
generateFlashcards(params: FlashcardGenerateParams): Promise<FlashcardResponse>

// Study planning
createStudyPlan(params: StudyPlanParams): Promise<StudyPlanResponse>
```

### Error Handling

All functions include:
- Try-catch error handling
- Custom `APIError` class with status codes
- Toast notifications for user feedback
- Graceful fallbacks for offline backend

## Starting the Backend

1. **Prerequisites**:
   ```bash
   # Install dependencies
   cd backend
   pip install -r requirements.txt
   
   # Ensure services are running
   # - Qdrant: docker run -p 6333:6333 qdrant/qdrant
   # - Ollama: ollama serve (with mixtral and qwen2.5:14b pulled)
   ```

2. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```
   Backend will start on `http://localhost:8000`

3. **Verify Services**:
   - Visit `http://localhost:8000/health`
   - Check dashboard for service status indicators

## Configuration

### Environment Variables

Create `.env.local` with:

```env
# Optional - defaults to http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Timeout Settings

The API client uses a 200-second timeout for AI operations to handle:
- Large document processing
- Complex AI model inference
- Audio transcription

Adjust in `/lib/api.ts` if needed:
```typescript
const api = axios.create({
  timeout: 200000, // 200 seconds
})
```

## Fallback Behavior

All integrations gracefully degrade when the backend is offline:

| Feature | Fallback Behavior |
|---------|------------------|
| Ask AI | Local command parsing (open pages, show time) |
| Material Upload | File storage without AI processing |
| Audio Upload | File upload without transcription |
| Flashcards | Manual flashcard creation |
| Study Planner | Template-based plan generation |
| Health Status | Shows "Backend Offline" indicator |

## Testing the Integration

1. **Without Backend**:
   ```bash
   pnpm dev
   ```
   - All features work with fallbacks
   - Dashboard shows "Backend Offline"

2. **With Backend**:
   ```bash
   # Terminal 1: Start backend
   cd backend && python app.py
   
   # Terminal 2: Start frontend
   pnpm dev
   ```
   - Dashboard shows service status
   - AI features fully enabled
   - Upload materials and test RAG queries

## Architecture Decisions

### Why These Integration Points?

1. **No UI Changes**: All components preserve existing styling and structure
2. **Progressive Enhancement**: Features work offline, enhanced when backend available
3. **User Feedback**: Toast notifications for all operations
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Error Resilience**: Try-catch + fallbacks prevent crashes

### Backend vs Frontend AI

- **Backend (Ollama)**: Heavy lifting, RAG, document processing
- **Frontend (Gemini)**: Quick responses, lightweight tasks (if configured)
- Fallback chain: Backend AI → Frontend AI → Local commands

## Troubleshooting

### Backend Not Connecting

1. Check backend is running: `curl http://localhost:8000/health`
2. Check CORS configuration in `backend/app.py`
3. Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Qdrant Connection Issues

```bash
docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

### Ollama Model Issues

```bash
# Pull required models
ollama pull mixtral:8x7b
ollama pull qwen2.5:14b

# Verify models
ollama list
```

### Whisper Loading Slowly

- First load downloads the model (~150MB)
- Subsequent loads are faster
- Check disk space for model cache

## Performance Notes

- **First Request**: May be slow (model loading)
- **Subsequent Requests**: Fast (models cached)
- **Qdrant Indexing**: Async, doesn't block UI
- **Audio Transcription**: ~1-2 minutes for 10 min audio

## Future Enhancements

- [ ] Streaming responses for ask AI
- [ ] Batch material uploads
- [ ] Audio recording directly in browser
- [ ] Model selection in settings
- [ ] Usage analytics and token tracking
