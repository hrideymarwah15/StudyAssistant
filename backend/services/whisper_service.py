"""
Whisper Service - Speech to Text
Handles audio transcription using OpenAI Whisper (local)
"""

import logging
import whisper
import os
from typing import List, Dict, Any
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WhisperService:
    """
    Service for audio transcription using Whisper.
    Converts speech to text and chunks into meaningful segments.
    """
    
    def __init__(self, model_name: str = "base"):
        """
        Initialize Whisper service with specified model.
        
        Args:
            model_name: Whisper model size (tiny, base, small, medium, large)
                       'base' is recommended for balance of speed/accuracy
        """
        try:
            logger.info(f"Loading Whisper model '{model_name}'...")
            self.model = whisper.load_model(model_name)
            logger.info(f"✓ Whisper model '{model_name}' loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            raise
    
    
    def transcribe(self, audio_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file to text.
        
        Args:
            audio_path: Path to audio file
        
        Returns:
            Dictionary with transcript and segments
        """
        try:
            if not os.path.exists(audio_path):
                raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
            logger.info(f"Transcribing audio file: {audio_path}")
            
            # Transcribe with Whisper
            result = self.model.transcribe(
                audio_path,
                fp16=False,  # Use FP32 for CPU compatibility
                language="en"  # Can be set to None for auto-detect
            )
            
            full_text = result["text"].strip()
            segments = result.get("segments", [])
            
            logger.info(f"✓ Transcription complete: {len(full_text)} characters")
            
            return {
                "transcript": full_text,
                "segments": segments,
                "language": result.get("language", "en")
            }
            
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {e}")
            raise
    
    
    def chunk_transcript(self, transcript: str, chunk_size: int = 500) -> List[str]:
        """
        Split transcript into meaningful chunks for memory storage.
        Attempts to split on sentence boundaries.
        
        Args:
            transcript: Full transcript text
            chunk_size: Target size for each chunk (characters)
        
        Returns:
            List of text chunks
        """
        try:
            # Split into sentences
            sentences = re.split(r'(?<=[.!?])\s+', transcript)
            
            chunks = []
            current_chunk = ""
            
            for sentence in sentences:
                # If adding this sentence would exceed chunk_size and we have content
                if len(current_chunk) + len(sentence) > chunk_size and current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    current_chunk += " " + sentence if current_chunk else sentence
            
            # Add final chunk
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            
            logger.info(f"✓ Split transcript into {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Failed to chunk transcript: {e}")
            # Fallback: return as single chunk
            return [transcript]
    
    
    def transcribe_and_chunk(self, audio_path: str, chunk_size: int = 500) -> Dict[str, Any]:
        """
        Complete pipeline: transcribe audio and split into chunks.
        
        Args:
            audio_path: Path to audio file
            chunk_size: Target chunk size
        
        Returns:
            Dictionary with full transcript and chunks
        """
        # Transcribe
        transcription = self.transcribe(audio_path)
        
        # Chunk
        chunks = self.chunk_transcript(
            transcription["transcript"],
            chunk_size=chunk_size
        )
        
        return {
            "transcript": transcription["transcript"],
            "language": transcription["language"],
            "chunks": chunks,
            "num_chunks": len(chunks)
        }


# Global instance
whisper_service = None

def get_whisper_service() -> WhisperService:
    """
    Get or create singleton WhisperService instance.
    Lazy loading to avoid model loading on import.
    """
    global whisper_service
    if whisper_service is None:
        whisper_service = WhisperService(model_name="base")
    return whisper_service
