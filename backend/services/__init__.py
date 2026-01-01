"""
Services package for StudyPal AI OS
"""

from .memory_service import get_memory_service, MemoryService
from .ollama_service import get_ollama_service, OllamaService
from .whisper_service import get_whisper_service, WhisperService

__all__ = [
    "get_memory_service",
    "MemoryService",
    "get_ollama_service",
    "OllamaService",
    "get_whisper_service",
    "WhisperService",
]
