"""
Audio Routes - Speech to Text Pipeline
Handles audio uploads, transcription, and memory storage
"""

import logging
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

from services.whisper_service import get_whisper_service
from services.memory_service import get_memory_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/audio", tags=["audio"])

# Temporary directory for audio files
TEMP_DIR = "/tmp/studypal_audio"
os.makedirs(TEMP_DIR, exist_ok=True)


class AudioTranscriptResponse(BaseModel):
    """Response model for audio transcription"""
    transcript: str
    stored_chunks: int
    language: str
    chunks: Optional[list] = None


@router.post("/upload", response_model=AudioTranscriptResponse)
async def upload_audio(
    file: UploadFile = File(...),
    store_in_memory: bool = True,
    course: Optional[str] = None,
    topic: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload audio file for transcription and optional memory storage.
    
    Flow:
    1. Save uploaded audio to temp file
    2. Transcribe using Whisper
    3. Chunk transcript into meaningful segments
    4. Store chunks in Qdrant memory
    5. Return transcript and metadata
    
    Args:
        file: Audio file (wav, mp3, m4a, etc.)
        store_in_memory: Whether to store chunks in memory (default: True)
        course: Optional course name for metadata
        topic: Optional topic for metadata
    
    Returns:
        Transcript, stored chunk count, and language
    """
    temp_path = None
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Generate unique temp filename
        file_extension = os.path.splitext(file.filename)[1] or ".wav"
        temp_filename = f"{uuid.uuid4()}{file_extension}"
        temp_path = os.path.join(TEMP_DIR, temp_filename)
        
        # Save uploaded file
        logger.info(f"Saving uploaded audio: {file.filename}")
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"✓ Audio saved to {temp_path}")
        
        # Transcribe and chunk
        whisper = get_whisper_service()
        result = whisper.transcribe_and_chunk(temp_path)
        
        transcript = result["transcript"]
        chunks = result["chunks"]
        language = result["language"]
        
        logger.info(f"✓ Transcription complete: {len(chunks)} chunks")
        
        # Store in memory if requested
        stored_count = 0
        if store_in_memory and chunks:
            memory = get_memory_service()
            
            # Build metadata
            metadata = {
                "source": "audio",
                "filename": file.filename,
                "language": language
            }
            if course:
                metadata["course"] = course
            if topic:
                metadata["topic"] = topic
            
            # Store chunks in batch
            point_ids = memory.add_texts_batch(chunks, metadata=metadata)
            stored_count = len(point_ids)
            
            logger.info(f"✓ Stored {stored_count} chunks in memory")
        
        return {
            "transcript": transcript,
            "stored_chunks": stored_count,
            "language": language,
            "chunks": chunks if not store_in_memory else None
        }
        
    except Exception as e:
        logger.error(f"Failed to process audio: {e}")
        raise HTTPException(status_code=500, detail=f"Audio processing failed: {str(e)}")
    
    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
                logger.info(f"✓ Cleaned up temp file: {temp_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file: {e}")


@router.get("/health")
async def audio_health() -> Dict[str, str]:
    """
    Health check for audio service.
    """
    try:
        whisper = get_whisper_service()
        return {
            "status": "healthy",
            "service": "audio",
            "whisper_loaded": whisper.model is not None
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
