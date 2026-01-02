"""
StudyPal AI OS - FastAPI Backend
Complete local AI system for intelligent study assistance
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routers
from routes import audio_routes, material_routes, ai_routes
from routes import ai_routes_v2  # New intelligent AI system

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Initializes services on startup and cleans up on shutdown.
    """
    # Startup
    logger.info("=" * 60)
    logger.info("🚀 Starting StudyPal AI OS Backend")
    logger.info("=" * 60)
    
    # Pre-load services (lazy initialization will happen on first use)
    logger.info("Services will be initialized on first request")
    logger.info("- Whisper: Speech to Text (base model)")
    logger.info("- Qdrant: Vector Memory (localhost:6333)")
    logger.info("- Ollama: AI Brain (Mixtral + Qwen)")
    logger.info("- Embeddings: sentence-transformers/all-MiniLM-L6-v2")
    
    logger.info("=" * 60)
    logger.info("✅ Backend ready at http://localhost:8000")
    logger.info("📚 API docs at http://localhost:8000/docs")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down StudyPal AI OS Backend")


# Create FastAPI application
app = FastAPI(
    title="StudyPal AI OS",
    description="""
    Complete local AI system for intelligent study assistance.
    
    ## Features
    
    ### 🎤 Audio Intelligence
    - Upload audio files for transcription (Whisper)
    - Automatic chunking and memory storage
    - Support for lectures, recordings, voice notes
    
    ### 📚 Materials Management
    - Add study materials and notes to long-term memory
    - Semantic search with vector embeddings
    - Organize by course, topic, source
    
    ### 🧠 AI Assistance
    - RAG-powered question answering (Mixtral)
    - Flashcard generation from any content (Qwen)
    - Personalized study plan creation
    - Context-aware responses from your knowledge base
    
    ## Architecture
    - **Whisper**: Local speech-to-text (base model)
    - **Qdrant**: Vector database for semantic memory
    - **Ollama**: Local LLM inference (Mixtral + Qwen)
    - **Sentence-Transformers**: Embedding generation
    
    ## Getting Started
    1. Ensure Qdrant is running: `docker run -p 6333:6333 qdrant/qdrant`
    2. Ensure Ollama is running: `ollama serve`
    3. Pull required models: `ollama pull mixtral && ollama pull qwen`
    4. Start backend: `uvicorn app:app --reload`
    """,
    version="1.0.0",
    lifespan=lifespan
)


# Configure CORS for frontend integration
# Only allow specific origins for security
import os

ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js dev
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://assistantstudy.netlify.app",  # Production frontend
    "https://*.ngrok-free.app",  # Ngrok tunnels
    "https://*.trycloudflare.com",  # Cloudflare tunnels
]

# Add custom frontend URL from environment
custom_frontend = os.getenv("FRONTEND_URL")
if custom_frontend:
    ALLOWED_ORIGINS.append(custom_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex=r"https://.*\.ngrok-free\.app|https://.*\.trycloudflare\.com",
)


# Mount routers
app.include_router(audio_routes.router)
app.include_router(material_routes.router)
app.include_router(ai_routes.router)
app.include_router(ai_routes_v2.router)  # New intelligent AI system


# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with system information.
    """
    return {
        "service": "StudyPal AI OS",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": {
            "audio": "/audio/upload",
            "materials": "/materials/add",
            "ask": "/ai/ask",
            "intelligent_ask": "/ai/intelligent-ask",  # New intelligent endpoint
            "flashcards": "/ai/flashcards/generate",
            "study_plan": "/ai/plan/create"
        },
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    Verifies all services: Qdrant, Ollama, Whisper
    """
    try:
        from services.memory_service import get_memory_service
        from services.ollama_service import get_ollama_service
        from services.whisper_service import get_whisper_service
        import requests
        
        health_status = {
            "backend": "online",
            "status": "healthy",
            "services": {}
        }
        
        # Check Qdrant (Memory Service)
        try:
            memory = get_memory_service()
            stats = memory.get_collection_stats()
            health_status["services"]["qdrant"] = {
                "status": "healthy",
                "connected": True,
                "collection": stats.get("collection_name", "studypal"),
                "vectors_count": stats.get("vectors_count", 0),
                "url": "http://localhost:6333"
            }
        except Exception as e:
            health_status["services"]["qdrant"] = {
                "status": "unhealthy",
                "connected": False,
                "error": str(e),
                "message": "Start Qdrant: docker run -p 6333:6333 qdrant/qdrant"
            }
        
        # Check Ollama
        try:
            ollama = get_ollama_service()
            # Try to get available models
            try:
                response = requests.get("http://localhost:11434/api/tags", timeout=2)
                if response.status_code == 200:
                    models_data = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models_data]
                    health_status["services"]["ollama"] = {
                        "status": "healthy",
                        "connected": True,
                        "models": model_names,
                        "url": "http://localhost:11434"
                    }
                else:
                    health_status["services"]["ollama"] = {
                        "status": "degraded",
                        "connected": True,
                        "error": f"Status code: {response.status_code}"
                    }
            except:
                health_status["services"]["ollama"] = {
                    "status": "unhealthy",
                    "connected": False,
                    "error": "Cannot connect to Ollama",
                    "message": "Start Ollama: ollama serve"
                }
        except Exception as e:
            health_status["services"]["ollama"] = {
                "status": "unhealthy",
                "connected": False,
                "error": str(e)
            }
        
        # Check Whisper
        try:
            whisper = get_whisper_service()
            health_status["services"]["whisper"] = {
                "status": "healthy",
                "loaded": True,
                "model": "base"
            }
        except Exception as e:
            health_status["services"]["whisper"] = {
                "status": "unhealthy",
                "loaded": False,
                "error": str(e)
            }
        
        # Determine overall status
        service_statuses = [svc.get("status") for svc in health_status["services"].values()]
        if all(s == "healthy" for s in service_statuses):
            health_status["status"] = "healthy"
        elif any(s == "unhealthy" for s in service_statuses):
            health_status["status"] = "degraded"
        else:
            health_status["status"] = "operational"
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "backend": "online",
            "status": "error",
            "error": str(e)
        }


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Handle 404 errors"""
    return {
        "error": "Endpoint not found",
        "path": str(request.url),
        "available_endpoints": [
            "/docs",
            "/audio/upload",
            "/materials/add",
            "/ask",
            "/flashcards/generate",
            "/plan/create"
        ]
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Handle 500 errors"""
    logger.error(f"Internal error: {exc}")
    return {
        "error": "Internal server error",
        "message": "An unexpected error occurred. Check server logs for details."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["venv/*", ".venv/*", "__pycache__/*", "*.pyc"],
        log_level="info"
    )
