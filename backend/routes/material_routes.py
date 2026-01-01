"""
Material Routes - Study Materials Management
Handles adding notes, documents, and study materials to memory
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from services.memory_service import get_memory_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/materials", tags=["materials"])


class MaterialAddRequest(BaseModel):
    """Request model for adding material"""
    text: str = Field(..., min_length=1, description="Material content text")
    course: Optional[str] = Field(None, description="Course name")
    topic: Optional[str] = Field(None, description="Topic or chapter")
    source: Optional[str] = Field(None, description="Source (textbook, lecture, etc.)")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")


class MaterialAddResponse(BaseModel):
    """Response model for material addition"""
    success: bool
    message: str
    point_id: str


class MaterialBatchAddRequest(BaseModel):
    """Request model for adding multiple materials"""
    materials: list[MaterialAddRequest] = Field(..., min_items=1)


class MaterialBatchAddResponse(BaseModel):
    """Response model for batch material addition"""
    success: bool
    message: str
    stored_count: int
    point_ids: list[str]


@router.post("/add", response_model=MaterialAddResponse)
async def add_material(request: MaterialAddRequest) -> Dict[str, Any]:
    """
    Add study material or notes to memory.
    
    Flow:
    1. Validate input text
    2. Build metadata dictionary
    3. Generate embeddings
    4. Store in Qdrant
    5. Return success confirmation
    
    Args:
        request: Material content and metadata
    
    Returns:
        Success status and point ID
    """
    try:
        # Validate text
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text content cannot be empty")
        
        # Build comprehensive metadata
        metadata = request.metadata.copy() if request.metadata else {}
        
        if request.course:
            metadata["course"] = request.course
        if request.topic:
            metadata["topic"] = request.topic
        if request.source:
            metadata["source"] = request.source
        
        # Default source if not specified
        if "source" not in metadata:
            metadata["source"] = "manual_entry"
        
        # Store in memory
        memory = get_memory_service()
        point_id = memory.add_text(request.text, metadata=metadata)
        
        logger.info(f"✓ Material stored with ID: {point_id}")
        
        return {
            "success": True,
            "message": "Material successfully added to memory",
            "point_id": point_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add material: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add material: {str(e)}")


@router.post("/add-batch", response_model=MaterialBatchAddResponse)
async def add_materials_batch(request: MaterialBatchAddRequest) -> Dict[str, Any]:
    """
    Add multiple study materials in batch for efficiency.
    
    Args:
        request: List of materials with metadata
    
    Returns:
        Success status and stored count
    """
    try:
        if not request.materials:
            raise HTTPException(status_code=400, detail="No materials provided")
        
        memory = get_memory_service()
        point_ids = []
        
        for material in request.materials:
            # Build metadata
            metadata = material.metadata.copy() if material.metadata else {}
            
            if material.course:
                metadata["course"] = material.course
            if material.topic:
                metadata["topic"] = material.topic
            if material.source:
                metadata["source"] = material.source
            
            if "source" not in metadata:
                metadata["source"] = "manual_entry"
            
            # Store individual material
            point_id = memory.add_text(material.text, metadata=metadata)
            point_ids.append(point_id)
        
        logger.info(f"✓ Batch stored {len(point_ids)} materials")
        
        return {
            "success": True,
            "message": f"Successfully stored {len(point_ids)} materials",
            "stored_count": len(point_ids),
            "point_ids": point_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to add materials in batch: {e}")
        raise HTTPException(status_code=500, detail=f"Batch add failed: {str(e)}")


@router.get("/stats")
async def get_memory_stats() -> Dict[str, Any]:
    """
    Get statistics about stored materials.
    
    Returns:
        Memory collection statistics
    """
    try:
        memory = get_memory_service()
        stats = memory.get_collection_stats()
        return {
            "success": True,
            "stats": stats
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/health")
async def materials_health() -> Dict[str, str]:
    """
    Health check for materials service.
    """
    try:
        memory = get_memory_service()
        stats = memory.get_collection_stats()
        return {
            "status": "healthy",
            "service": "materials",
            "collection_status": stats.get("status", "unknown")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
