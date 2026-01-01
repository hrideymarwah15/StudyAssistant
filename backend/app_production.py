"""
Simplified backend for production deployment
This version works without Ollama/Qdrant for initial deployment
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from typing import Optional, List, Dict

app = FastAPI(title="Study Assistant API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class QuestionRequest(BaseModel):
    question: str
    context: Optional[str] = None

class FlashcardRequest(BaseModel):
    topic: str
    count: int = 5

class StudyPlanRequest(BaseModel):
    subject: str
    duration_weeks: int
    hours_per_day: int

class MaterialUploadResponse(BaseModel):
    success: bool
    message: str
    material_id: Optional[str] = None

# Health Check
@app.get("/health")
async def health_check():
    """Check API health status"""
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "qdrant": "not configured",
            "ollama": "not configured", 
            "whisper": "not configured"
        },
        "message": "Basic API running. AI services need configuration."
    }

# AI Q&A Endpoint
@app.post("/ai/ask")
async def ask_question(request: QuestionRequest):
    """Answer questions using AI (mock response for deployment)"""
    return {
        "success": True,
        "answer": f"This is a demo response. To enable full AI capabilities, please configure Ollama and Qdrant in your Render dashboard environment variables. Your question was: '{request.question}'",
        "sources": []
    }

# Flashcard Generation
@app.post("/ai/flashcards")
async def generate_flashcards(request: FlashcardRequest):
    """Generate flashcards (mock data for deployment)"""
    flashcards = [
        {
            "front": f"Sample question about {request.topic} #{i+1}",
            "back": f"Sample answer for {request.topic} #{i+1}",
            "topic": request.topic
        }
        for i in range(request.count)
    ]
    
    return {
        "success": True,
        "flashcards": flashcards,
        "message": "Demo flashcards generated. Configure AI services for intelligent generation."
    }

# Study Plan Generation
@app.post("/ai/study-plan")
async def create_study_plan(request: StudyPlanRequest):
    """Generate study plan (mock data for deployment)"""
    weeks = []
    for week in range(request.duration_weeks):
        weeks.append({
            "week": week + 1,
            "topic": f"{request.subject} - Week {week + 1}",
            "daily_hours": request.hours_per_day,
            "goals": [
                f"Study core concepts of {request.subject}",
                f"Complete {request.hours_per_day} hours of practice",
                "Review and test understanding"
            ]
        })
    
    return {
        "success": True,
        "plan": {
            "subject": request.subject,
            "duration_weeks": request.duration_weeks,
            "weeks": weeks
        },
        "message": "Demo study plan generated. Configure AI services for personalized plans."
    }

# Material Upload
@app.post("/materials/upload")
async def upload_material(file: UploadFile = File(...)):
    """Upload study material (basic validation only)"""
    allowed_types = ["application/pdf", "text/plain", "audio/mpeg", "audio/wav"]
    
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    return {
        "success": True,
        "message": f"File '{file.filename}' uploaded successfully. Configure Qdrant for vector storage.",
        "material_id": f"demo_{file.filename}"
    }

# Material Stats
@app.get("/materials/stats")
async def get_material_stats():
    """Get material statistics"""
    return {
        "total_materials": 0,
        "total_vectors": 0,
        "storage_used": "0 MB",
        "message": "Configure Qdrant to enable material storage"
    }

# Audio Transcription
@app.post("/audio/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio file (placeholder)"""
    return {
        "success": True,
        "transcription": "Audio transcription requires Whisper configuration.",
        "message": "Configure Whisper model for audio transcription"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Study Assistant API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
