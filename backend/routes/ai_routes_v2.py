"""
AI Routes - Study Intelligence System
Disciplined RAG Pipeline with Mode-Based Processing

This is NOT a chatbot. This is a STUDY INTELLIGENCE SYSTEM.
Action > explanation. Fewer words, more direction.
"""

import logging
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Literal

from services.memory_service import get_memory_service
from services.ollama_service import get_ollama_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ai", tags=["ai"])


# ==================== AI MODES ====================
# Every AI interaction MUST run in exactly one mode

AIMode = Literal["plan", "explain", "quiz", "flashcards", "review", "coach"]

# Relevance threshold for RAG
RELEVANCE_THRESHOLD = 0.5
MAX_CONTEXT_CHUNKS = 5


# ==================== REQUEST/RESPONSE MODELS ====================

class UserStudyContext(BaseModel):
    """User's current study state for context-aware responses"""
    focus_minutes_today: int = 0
    target_focus_minutes: int = 120
    habits_completed_today: int = 0
    total_habits_today: int = 0
    flashcards_due: int = 0
    streak_days: int = 0
    urgent_task_count: int = 0
    overdue_tasks: int = 0
    current_course: Optional[str] = None
    current_topic: Optional[str] = None
    days_until_exam: Optional[int] = None
    recent_failures: List[str] = []


class IntelligentAskRequest(BaseModel):
    """Request model for intelligent AI question answering"""
    message: str = Field(..., min_length=1, description="User message")
    mode: Optional[AIMode] = Field(None, description="Force specific mode (auto-detected if not provided)")
    context: Optional[UserStudyContext] = Field(None, description="User's study context")
    use_memory: bool = Field(True, description="Whether to retrieve context from memory")
    skip_intervention: bool = Field(False, description="Skip intervention checks")


class MemoryChunk(BaseModel):
    """Memory chunk with relevance score"""
    text: str
    relevance_score: float
    source: Optional[str] = None
    topic: Optional[str] = None


class Intervention(BaseModel):
    """AI intervention suggestion"""
    should_intervene: bool
    message: str
    suggested_mode: AIMode
    priority: Literal["high", "medium", "low"]


class ProactiveSuggestion(BaseModel):
    """Proactive suggestion for user"""
    id: str
    message: str
    action: str
    priority: Literal["urgent", "high", "normal"]
    icon: str


class IntelligentAskResponse(BaseModel):
    """Response model for intelligent AI answers"""
    mode: AIMode
    answer: str
    structured_output: Optional[Dict[str, Any]] = None
    intervention: Optional[Intervention] = None
    memory_used: bool
    memory_quality: str  # "strong", "weak", "none"
    chunks_used: int
    suggestions: List[ProactiveSuggestion] = []


class AskRequest(BaseModel):
    """Legacy request model for AI question answering"""
    question: str = Field(..., min_length=1, description="Question to ask")
    use_memory: bool = Field(True, description="Whether to retrieve context from memory")
    top_k: int = Field(5, ge=1, le=20, description="Number of context chunks to retrieve")


class AskResponse(BaseModel):
    """Legacy response model for AI answers"""
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


# ==================== MODE RESOLVER ====================

def resolve_mode(message: str, context: Optional[UserStudyContext] = None) -> AIMode:
    """
    Resolve the appropriate AI mode from user message.
    NEVER returns None - always picks the best mode.
    """
    lower_message = message.lower().strip()
    
    # Plan mode patterns
    plan_patterns = [
        "create a plan", "make a plan", "study plan", "schedule", 
        "organize my study", "how should i study", "roadmap"
    ]
    if any(p in lower_message for p in plan_patterns):
        return "plan"
    
    # Quiz mode patterns
    quiz_patterns = ["quiz me", "test me", "ask me questions", "practice questions", "check my knowledge"]
    if any(p in lower_message for p in quiz_patterns):
        return "quiz"
    
    # Flashcard mode patterns
    if "flashcard" in lower_message or "flash card" in lower_message:
        return "flashcards"
    
    # Review mode patterns
    review_patterns = ["review", "summarize", "summary", "recap", "key points", "what should i remember"]
    if any(p in lower_message for p in review_patterns):
        return "review"
    
    # Coach mode patterns
    coach_patterns = [
        "struggling", "stuck", "lost", "confused", "overwhelmed", "behind",
        "can't focus", "help me", "motivate", "failed", "procrastinating",
        "what should i do"
    ]
    if any(p in lower_message for p in coach_patterns):
        return "coach"
    
    # Explain mode patterns (questions)
    explain_patterns = [
        "explain", "what is", "what are", "how does", "how do", "why",
        "tell me about", "teach me", "help me understand"
    ]
    if any(p in lower_message for p in explain_patterns):
        return "explain"
    
    # Context-aware fallback
    if context:
        if context.focus_minutes_today == 0 and context.urgent_task_count > 0:
            return "coach"
        if context.overdue_tasks > 2:
            return "coach"
        if context.days_until_exam and context.days_until_exam <= 7:
            return "plan"
    
    # Default to explain for knowledge questions
    return "explain"


# ==================== INTERVENTION LOGIC ====================

def check_intervention(mode: AIMode, context: UserStudyContext) -> Optional[Intervention]:
    """
    Check if AI should redirect the user before fulfilling their request.
    """
    import datetime
    hour = datetime.datetime.now().hour
    
    # No focus today but asking for explanations
    if mode == "explain" and context.focus_minutes_today == 0 and context.urgent_task_count > 0:
        return Intervention(
            should_intervene=True,
            message=f"Before we dive in: you haven't started focus time today and have {context.urgent_task_count} urgent task{'s' if context.urgent_task_count > 1 else ''}. Start a 25-min focus session first?",
            suggested_mode="coach",
            priority="high"
        )
    
    # Overdue tasks
    if mode in ["flashcards", "quiz"] and context.overdue_tasks > 0:
        return Intervention(
            should_intervene=True,
            message=f"You have {context.overdue_tasks} overdue task{'s' if context.overdue_tasks > 1 else ''}. Let's tackle those first. Which one should we start with?",
            suggested_mode="coach",
            priority="high"
        )
    
    # Streak at risk
    if hour >= 20 and context.focus_minutes_today == 0 and context.streak_days > 0:
        return Intervention(
            should_intervene=True,
            message=f"Your {context.streak_days}-day streak is at risk. Just 15 minutes of focus will keep it alive. Start a quick session?",
            suggested_mode="coach",
            priority="high"
        )
    
    # Exam soon
    if context.days_until_exam and context.days_until_exam <= 3 and mode not in ["plan", "review", "quiz"]:
        return Intervention(
            should_intervene=True,
            message=f"Your exam is in {context.days_until_exam} day{'s' if context.days_until_exam > 1 else ''}. Let's focus on high-impact review. Want a targeted revision plan?",
            suggested_mode="review",
            priority="high"
        )
    
    return None


# ==================== PROACTIVE SUGGESTIONS ====================

def get_proactive_suggestions(context: UserStudyContext) -> List[ProactiveSuggestion]:
    """Generate proactive suggestions based on user state."""
    import datetime
    suggestions = []
    hour = datetime.datetime.now().hour
    
    # No focus today
    if context.focus_minutes_today == 0 and 8 <= hour <= 22:
        suggestions.append(ProactiveSuggestion(
            id="no-focus",
            message=f"Start 25-min focus{' on ' + context.current_course if context.current_course else ''}",
            action="Help me start a focused study session",
            priority="urgent" if context.urgent_task_count > 0 else "high",
            icon="🎯"
        ))
    
    # Flashcards due
    if context.flashcards_due > 0:
        suggestions.append(ProactiveSuggestion(
            id="flashcards-due",
            message=f"Review {context.flashcards_due} flashcard{'s' if context.flashcards_due > 1 else ''} due",
            action="Let's review my due flashcards",
            priority="urgent" if context.flashcards_due > 20 else "normal",
            icon="🃏"
        ))
    
    # Overdue tasks
    if context.overdue_tasks > 0:
        suggestions.append(ProactiveSuggestion(
            id="overdue-tasks",
            message=f"{context.overdue_tasks} overdue task{'s' if context.overdue_tasks > 1 else ''} - let's catch up",
            action="Help me prioritize my overdue tasks",
            priority="urgent",
            icon="⚠️"
        ))
    
    # Streak at risk
    if context.streak_days > 0 and context.focus_minutes_today == 0 and hour >= 18:
        suggestions.append(ProactiveSuggestion(
            id="streak-risk",
            message=f"Keep your {context.streak_days}-day streak alive",
            action="Help me do a quick study session to keep my streak",
            priority="urgent" if hour >= 21 else "high",
            icon="🔥"
        ))
    
    # Sort by priority and return top 3
    priority_order = {"urgent": 0, "high": 1, "normal": 2}
    suggestions.sort(key=lambda x: priority_order[x.priority])
    return suggestions[:3]


# ==================== MODE-SPECIFIC PROMPTS ====================

def build_system_prompt(mode: AIMode, context: Optional[UserStudyContext], memory_chunks: List[Dict]) -> str:
    """Build disciplined system prompt based on mode and context."""
    
    base_role = """You are a strict, effective study coach. You optimize for learning outcomes, not comfort.
Be decisive, concise, and actionable. No filler. No generic motivation."""

    context_str = ""
    if context:
        context_str = f"""
USER CONTEXT:
- Focus today: {context.focus_minutes_today}/{context.target_focus_minutes} min
- Habits: {context.habits_completed_today}/{context.total_habits_today} completed
- Flashcards due: {context.flashcards_due}
- Streak: {context.streak_days} days
- Urgent tasks: {context.urgent_task_count}
- Overdue: {context.overdue_tasks}
{f'- Course: {context.current_course}' if context.current_course else ''}
{f'- Days until exam: {context.days_until_exam}' if context.days_until_exam else ''}
"""

    memory_str = ""
    if memory_chunks:
        strong_chunks = [c for c in memory_chunks if c.get('score', 0) >= RELEVANCE_THRESHOLD]
        if strong_chunks:
            memory_str = "\nMEMORY CONTEXT (from user's study materials):\n"
            for i, chunk in enumerate(strong_chunks[:MAX_CONTEXT_CHUNKS], 1):
                score = chunk.get('score', 0)
                text = chunk.get('text', '')[:400]
                memory_str += f"[{i}] (relevance: {score*100:.0f}%) {text}...\n\n"
        else:
            memory_str = "\nMEMORY NOTE: Retrieved content has weak relevance. If you need user's notes, say: \"I don't have strong material on this. Want to add notes?\"\n"

    mode_instructions = {
        "plan": """
MODE: PLAN
Output EXACT JSON (no other text):
{
  "goal": "clear, specific goal statement",
  "steps": [{"task": "specific action", "time": "X min"}],
  "next_action": "what to do RIGHT NOW"
}
Keep steps concrete. Time estimates realistic. Next action immediately executable.""",

        "explain": """
MODE: EXPLAIN
Structure:
1. Start with 2-line summary (the core concept)
2. Then detailed explanation
3. End with exactly ONE check question to verify understanding
Keep it focused. If complex, break into digestible parts.""",

        "quiz": """
MODE: QUIZ
Output EXACT JSON (no other text):
{"questions": [{"q": "question text", "answer": "correct answer"}]}
Generate 5 questions. Mix difficulty. Focus on understanding, not trivia.""",

        "flashcards": """
MODE: FLASHCARDS
Output EXACT JSON array (no other text):
[{"question": "front of card", "answer": "back of card"}]
Generate 5-7 cards. Questions test understanding. Answers concise but complete.""",

        "review": """
MODE: REVIEW
Structure:
**Summary:**
- [bullet 1]
- [bullet 2]

**Mistakes to Avoid:**
- [error 1]
- [error 2]

**Next Steps:**
- [action 1]
- [action 2]
Be specific. Reference actual content when available.""",

        "coach": """
MODE: COACH
Structure:
1. ONE sentence acknowledging the situation (no platitudes)
2. ONE corrective action (specific, not generic)
3. THE smallest possible next step (under 5 minutes)
Do not be preachy. Do not over-explain. Be direct."""
    }

    return f"""{base_role}

{context_str}
{memory_str}

{mode_instructions[mode]}

RESPONSE RULES:
- Be concise
- Be actionable
- No filler phrases
- No generic motivation
- Respect output format exactly
- If you cannot help, say so clearly
- Always end with clear next step"""


# ==================== ENDPOINTS ====================

@router.post("/intelligent-ask", response_model=IntelligentAskResponse)
async def intelligent_ask(request: IntelligentAskRequest) -> Dict[str, Any]:
    """
    Intelligent RAG Pipeline with mode-based processing.
    
    Flow:
    1. Resolve AI mode from message
    2. Check for intervention based on user context
    3. Retrieve relevant memory (with quality filter)
    4. Build mode-specific prompt
    5. Generate disciplined response
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Build context with defaults
        ctx = request.context or UserStudyContext()
        
        # 1. Resolve mode
        mode = request.mode or resolve_mode(request.message, ctx)
        logger.info(f"Resolved mode: {mode}")
        
        # 2. Check intervention
        intervention = None
        if not request.skip_intervention:
            intervention = check_intervention(mode, ctx)
            if intervention and intervention.should_intervene:
                logger.info(f"Intervention triggered: {intervention.priority}")
                return {
                    "mode": intervention.suggested_mode,
                    "answer": intervention.message,
                    "structured_output": None,
                    "intervention": intervention.model_dump(),
                    "memory_used": False,
                    "memory_quality": "none",
                    "chunks_used": 0,
                    "suggestions": [s.model_dump() for s in get_proactive_suggestions(ctx)]
                }
        
        # 3. Retrieve memory with quality filter
        memory_chunks = []
        memory_quality = "none"
        
        if request.use_memory:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.message, top_k=MAX_CONTEXT_CHUNKS)
                
                if search_results:
                    memory_chunks = search_results
                    strong_chunks = [c for c in search_results if c.get('score', 0) >= RELEVANCE_THRESHOLD]
                    memory_quality = "strong" if strong_chunks else "weak"
                    logger.info(f"Memory: {len(search_results)} chunks, quality: {memory_quality}")
            except Exception as e:
                logger.warning(f"Memory retrieval failed: {e}")
        
        # 4. Build prompt and generate response
        ollama = get_ollama_service()
        system_prompt = build_system_prompt(mode, ctx, memory_chunks)
        
        # Use appropriate model based on mode
        if mode in ["plan", "explain", "coach"]:
            answer = ollama.ask_mixtral(request.message, context=system_prompt)
        else:
            # Quiz, flashcards, review - use Qwen for structured output
            answer = ollama.ask_qwen(
                f"{system_prompt}\n\nUSER: {request.message}",
                temperature=0.3
            )
        
        # 5. Try to parse structured output
        structured_output = None
        if mode in ["plan", "quiz", "flashcards"]:
            try:
                # Clean response to extract JSON
                json_str = answer
                if "```" in answer:
                    import re
                    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', answer)
                    if match:
                        json_str = match.group(1)
                
                # Find JSON in response
                json_match = re.search(r'[\[{][\s\S]*[\]}]', json_str)
                if json_match:
                    structured_output = json.loads(json_match.group(0))
            except Exception as e:
                logger.warning(f"Could not parse structured output: {e}")
        
        return {
            "mode": mode,
            "answer": answer,
            "structured_output": structured_output,
            "intervention": intervention.model_dump() if intervention else None,
            "memory_used": len(memory_chunks) > 0,
            "memory_quality": memory_quality,
            "chunks_used": len([c for c in memory_chunks if c.get('score', 0) >= RELEVANCE_THRESHOLD]),
            "suggestions": [s.model_dump() for s in get_proactive_suggestions(ctx)]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process intelligent ask: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.post("/ask", response_model=AskResponse)
async def ask_question(request: AskRequest) -> Dict[str, Any]:
    """
    Legacy RAG Pipeline: Ask questions with memory-augmented responses.
    Maintained for backward compatibility.
    """
    try:
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        context_text = None
        sources = []
        
        # Retrieve relevant context with quality filter
        if request.use_memory:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.question, top_k=request.top_k)
                
                if search_results:
                    # Filter by relevance threshold
                    strong_results = [r for r in search_results if r.get('score', 0) >= RELEVANCE_THRESHOLD]
                    
                    if strong_results:
                        context_parts = []
                        for idx, result in enumerate(strong_results[:MAX_CONTEXT_CHUNKS], 1):
                            context_parts.append(f"[{idx}] {result['text']}")
                            sources.append({
                                "text_preview": result['text'][:200] + "..." if len(result['text']) > 200 else result['text'],
                                "metadata": result.get('metadata', {}),
                                "relevance_score": round(result['score'], 3)
                            })
                        
                        context_text = "\n\n".join(context_parts)
                        logger.info(f"✓ Retrieved {len(strong_results)} relevant chunks (threshold: {RELEVANCE_THRESHOLD})")
                    else:
                        logger.info("Retrieved chunks below relevance threshold")
            except Exception as e:
                logger.warning(f"Memory retrieval failed: {e}")
        
        # Generate answer
        ollama = get_ollama_service()
        
        # Add weak memory warning if applicable
        if context_text is None and request.use_memory:
            answer = ollama.ask_mixtral(
                prompt=request.question,
                context="Note: I don't have strong study material on this topic in your notes. The answer is based on general knowledge."
            )
            answer += "\n\n💡 *I don't have strong material on this in your notes. Want to add some?*"
        else:
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
    Generate flashcards with strict output format.
    """
    try:
        content = None
        source = "provided_text"
        
        if request.text:
            content = request.text
            source = "provided_text"
        elif request.topic and request.use_memory:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.topic, top_k=10)
                
                # Filter by relevance
                strong_results = [r for r in search_results if r.get('score', 0) >= RELEVANCE_THRESHOLD]
                
                if strong_results:
                    content_parts = [result['text'] for result in strong_results[:5]]
                    content = "\n\n".join(content_parts)
                    source = f"memory_retrieval ({len(strong_results)} chunks)"
                    logger.info(f"✓ Retrieved content for topic: {request.topic}")
                else:
                    content = f"Generate flashcards about: {request.topic}"
                    source = "topic_only (weak memory match)"
            except Exception as e:
                logger.warning(f"Memory retrieval failed: {e}")
                content = f"Generate flashcards about: {request.topic}"
                source = "topic_only"
        elif request.topic:
            content = f"Generate flashcards about: {request.topic}"
            source = "topic_only"
        else:
            raise HTTPException(status_code=400, detail="Either 'text' or 'topic' must be provided")
        
        # Generate with strict format
        ollama = get_ollama_service()
        flashcards_json = ollama.generate_flashcards(content, num_cards=request.num_cards)
        
        try:
            flashcards_data = json.loads(flashcards_json)
            
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
            
            return {
                "flashcards": flashcards,
                "count": len(flashcards),
                "source": source
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse flashcards JSON: {e}")
            raise HTTPException(status_code=500, detail="Failed to parse flashcards")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate flashcards: {e}")
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")


@router.post("/plan/create", response_model=StudyPlanResponse)
async def create_study_plan(request: StudyPlanRequest) -> Dict[str, Any]:
    """
    Generate study plan with strict JSON output format.
    """
    try:
        if not request.subject or not request.subject.strip():
            raise HTTPException(status_code=400, detail="Subject cannot be empty")
        
        materials_count = 0
        enhanced_knowledge = request.current_knowledge or ""
        
        if request.retrieve_materials:
            try:
                memory = get_memory_service()
                search_results = memory.search(request.subject, top_k=5)
                
                # Filter by relevance
                strong_results = [r for r in search_results if r.get('score', 0) >= RELEVANCE_THRESHOLD]
                
                if strong_results:
                    materials_count = len(strong_results)
                    material_summaries = [f"- {r['text'][:150]}" for r in strong_results[:3]]
                    
                    if enhanced_knowledge:
                        enhanced_knowledge += f"\n\nAvailable study materials:\n" + "\n".join(material_summaries)
                    else:
                        enhanced_knowledge = "Available study materials:\n" + "\n".join(material_summaries)
            except Exception as e:
                logger.warning(f"Failed to retrieve materials: {e}")
        
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
    """Health check for AI service."""
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
