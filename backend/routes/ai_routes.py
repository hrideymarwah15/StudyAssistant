"""
AI Routes - Retrieval Augmented Generation Pipeline
Handles intelligent question answering, flashcard generation, and study planning
"""

import logging
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

from services.memory_service import get_memory_service
from services.ollama_service import get_ollama_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ai", tags=["ai"])


# ==================== REQUEST/RESPONSE MODELS ====================

class AskRequest(BaseModel):
    """Request model for AI question answering"""
    question: str = Field(..., min_length=1, description="Question to ask")
    use_memory: bool = Field(True, description="Whether to retrieve context from memory")
    top_k: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")


class AskResponse(BaseModel):
    """Response model for AI answers"""
    answer: str
    context_used: bool
    sources_count: int
    sources: Optional[List[Dict[str, Any]]] = None


class FlashcardRequest(BaseModel):
    """Request model for flashcard generation"""
    text: Optional[str] = Field(None, description="Source text for flashcards")
    topic: Optional[str] = Field(None, description="Topic to generate flashcards about")
    num_cards: int = Field(5, ge=1, le=20, description="Number of flashcards to generate")
    use_memory: bool = Field(True, description="Retrieve content from memory if no text provided")


class Flashcard(BaseModel):
    """Individual flashcard model"""
    question: str
    answer: str


class FlashcardResponse(BaseModel):
    """Response model for flashcard generation"""
    flashcards: List[Flashcard]
    count: int
    source: str


class StudyPlanRequest(BaseModel):
    """Request model for study plan generation"""
    subject: str = Field(..., min_length=1, description="Subject to create plan for")
    days: int = Field(..., ge=1, le=365, description="Number of days available")
    current_knowledge: Optional[str] = Field(None, description="Current knowledge level")
    retrieve_materials: bool = Field(True, description="Retrieve relevant materials from memory")


class StudyPlanResponse(BaseModel):
    """Response model for study plan"""
    plan: str
    subject: str
    days: int
    materials_used: int


# ==================== ENDPOINTS ====================

@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest) -> Dict[str, Any]:
    """
    RAG Pipeline: Ask questions with memory-augmented responses.
    
    Flow:
    1. Search Qdrant for relevant context (top 5 matches)
    2. Build structured prompt with context
    3. Send to Mixtral for reasoning
    4. Return answer with source information
    
    Args:
        request: Question and retrieval parameters
    
    Returns:
        AI-generated answer with context sources
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        context_text = None
        sources = []
        
        # Retrieve relevant context from memory
        if request.use_memory:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.question, top_k=request.top_k)
                
                if search_results:
                    # Build context from search results
                    context_parts = []
                    for idx, result in enumerate(search_results, 1):
                        context_parts.append(f"[{idx}] {result['text']}")
                        sources.append({
                            "text_preview": result['text'][:200] + "..." if len(result['text']) > 200 else result['text'],
                            "metadata": result.get('metadata', {}),
                            "relevance_score": round(result['score'], 3)
                        })
                    
                    context_text = "\n\n".join(context_parts)
                    logger.info(f"✓ Retrieved {len(search_results)} relevant chunks")
            except Exception as e:
                logger.warning(f"Memory retrieval failed, proceeding without context: {e}")
        
        # Generate answer using Mixtral
        ollama = get_ollama_service()
        answer = ollama.ask_mixtral(
            prompt=request.question,
            context=context_text
        )
        
        return {
            "answer": answer,
            "context_used": context_text is not None,
            "sources_count": len(sources),
            "sources": sources if sources else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process question: {e}")
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")


@router.post("/flashcards/generate", response_model=FlashcardResponse)
async def generate_flashcards(request: FlashcardRequest) -> Dict[str, Any]:
    """
    Generate flashcards from text or topic.
    
    Flow:
    1. If text provided, use it directly
    2. If topic provided, retrieve relevant content from memory
    3. Ask Qwen to generate structured flashcards in JSON
    4. Parse and return flashcard array
    
    Args:
        request: Source text/topic and generation parameters
    
    Returns:
        Array of flashcards with questions and answers
    """
    try:
        content = None
        source = "provided_text"
        
        # Determine content source
        if request.text:
            content = request.text
            source = "provided_text"
        elif request.topic and request.use_memory:
            # Retrieve content from memory
            try:
                memory = get_memory_service()
                search_results = memory.search(request.topic, top_k=10)
                
                if search_results:
                    # Combine retrieved content
                    content_parts = [result['text'] for result in search_results]
                    content = "\n\n".join(content_parts)
                    source = f"memory_retrieval ({len(search_results)} chunks)"
                    logger.info(f"✓ Retrieved content for topic: {request.topic}")
                else:
                    # No content found, generate from topic directly
                    content = f"Generate flashcards about: {request.topic}"
                    source = "topic_only"
            except Exception as e:
                logger.warning(f"Memory retrieval failed: {e}")
                content = f"Generate flashcards about: {request.topic}"
                source = "topic_only"
        elif request.topic:
            content = f"Generate flashcards about: {request.topic}"
            source = "topic_only"
        else:
            raise HTTPException(
                status_code=400,
                detail="Either 'text' or 'topic' must be provided"
            )
        
        # Generate flashcards using Qwen
        ollama = get_ollama_service()
        flashcards_json = ollama.generate_flashcards(content, num_cards=request.num_cards)
        
        # Parse JSON response
        try:
            flashcards_data = json.loads(flashcards_json)
            
            # Validate structure
            if not isinstance(flashcards_data, list):
                raise ValueError("Expected JSON array of flashcards")
            
            flashcards = []
            for card in flashcards_data:
                if isinstance(card, dict) and "question" in card and "answer" in card:
                    flashcards.append({
                        "question": card["question"],
                        "answer": card["answer"]
                    })
            
            if not flashcards:
                raise ValueError("No valid flashcards generated")
            
            logger.info(f"✓ Generated {len(flashcards)} flashcards")
            
            return {
                "flashcards": flashcards,
                "count": len(flashcards),
                "source": source
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse flashcards JSON: {e}")
            logger.error(f"Raw response: {flashcards_json}")
            raise HTTPException(
                status_code=500,
                detail="Failed to parse flashcards. AI response was not valid JSON."
            )
        except ValueError as e:
            logger.error(f"Invalid flashcard structure: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate flashcards: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")


@router.post("/plan/create", response_model=StudyPlanResponse)
async def create_study_plan(request: StudyPlanRequest) -> Dict[str, Any]:
    """
    Generate comprehensive study plan.
    
    Flow:
    1. Optionally retrieve relevant materials from memory
    2. Generate day-by-day study plan using Mixtral
    3. Return structured plan
    
    Args:
        request: Subject, duration, and current knowledge
    
    Returns:
        Detailed study plan
    """
    try:
        if not request.subject or not request.subject.strip():
            raise HTTPException(status_code=400, detail="Subject cannot be empty")
        
        materials_count = 0
        enhanced_knowledge = request.current_knowledge or ""
        
        # Retrieve relevant materials from memory
        if request.retrieve_materials:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.subject, top_k=5)
                
                if search_results:
                    materials_count = len(search_results)
                    # Add material context to knowledge description
                    material_summaries = []
                    for result in search_results[:3]:  # Use top 3
                        preview = result['text'][:150]
                        material_summaries.append(f"- {preview}")
                    
                    if enhanced_knowledge:
                        enhanced_knowledge += f"\n\nAvailable study materials:\n" + "\n".join(material_summaries)
                    else:
                        enhanced_knowledge = "Available study materials:\n" + "\n".join(material_summaries)
                    
                    logger.info(f"✓ Retrieved {materials_count} relevant materials")
            except Exception as e:
                logger.warning(f"Failed to retrieve materials: {e}")
        
        # Generate study plan
        ollama = get_ollama_service()
        plan = ollama.generate_study_plan(
            subject=request.subject,
            days=request.days,
            current_knowledge=enhanced_knowledge
        )
        
        return {
            "plan": plan,
            "subject": request.subject,
            "days": request.days,
            "materials_used": materials_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create study plan: {e}")
        raise HTTPException(status_code=500, detail=f"Study plan creation failed: {str(e)}")


@router.get("/health")
async def ai_health() -> Dict[str, str]:
    """
    Health check for AI service.
    """
    try:
        ollama = get_ollama_service()
        memory = get_memory_service()
        return {
            "status": "healthy",
            "service": "ai",
            "ollama": "connected",
            "memory": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
