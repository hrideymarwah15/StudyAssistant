"""
EXAM-GRADE FLASHCARD ENGINE
World-class memory weapon using Qwen2.5 via Ollama

Card Types:
- definition: "What is X?" → core concept
- why: "Why does X happen?" → causation/purpose
- how: "How does X work?" → process/mechanism  
- compare: "Compare X vs Y" → similarities/differences
- trap: "Common mistake about X" → misconception buster
- example: "Give an example of X" → concrete application
- exam: "Exam-style question on X" → test-ready format

Quality Standards:
- ONE concept per card (never multi-fact)
- 2-5 line answers (not essays, not one-liners)
- Exam-style questioning
- Source attribution
- Difficulty adaptive
"""

import logging
import json
import re
import random
from typing import Optional, Dict, Any, List, Literal
from dataclasses import dataclass, asdict
from datetime import datetime

logger = logging.getLogger(__name__)

# Card Types
CardType = Literal["definition", "why", "how", "compare", "trap", "example", "exam"]
Difficulty = Literal["beginner", "intermediate", "advanced", "expert"]

CARD_TYPES: List[CardType] = ["definition", "why", "how", "compare", "trap", "example", "exam"]

# Card type distributions for balanced generation
CARD_TYPE_WEIGHTS = {
    "definition": 0.20,  # 20% - core concepts
    "why": 0.15,         # 15% - reasoning
    "how": 0.15,         # 15% - processes
    "compare": 0.10,     # 10% - contrasts
    "trap": 0.15,        # 15% - misconception busters (crucial for exams)
    "example": 0.10,     # 10% - concrete applications
    "exam": 0.15         # 15% - exam-style questions
}


@dataclass
class ExamGradeFlashcard:
    """World-class flashcard with exam-grade metadata"""
    id: str
    type: CardType
    question: str
    answer: str
    difficulty: Difficulty
    topic: str
    subtopic: Optional[str]
    source: str
    exam_relevance: int  # 1-10 scale
    key_terms: List[str]
    created_at: str
    mistake_prone: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ExamGradeFlashcardEngine:
    """
    World-class flashcard generator using Qwen2.5
    Better than Anki, smarter than Quizlet
    """
    
    def __init__(self, ollama_service):
        self.ollama = ollama_service
        self._card_counter = 0
    
    def _generate_card_id(self) -> str:
        """Generate unique card ID"""
        self._card_counter += 1
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"card_{timestamp}_{self._card_counter}"
    
    def _get_card_type_distribution(self, num_cards: int) -> List[CardType]:
        """Get balanced distribution of card types"""
        distribution = []
        for card_type, weight in CARD_TYPE_WEIGHTS.items():
            count = max(1, int(num_cards * weight))
            distribution.extend([card_type] * count)
        
        # Shuffle and trim/pad to exact count
        random.shuffle(distribution)
        if len(distribution) > num_cards:
            distribution = distribution[:num_cards]
        elif len(distribution) < num_cards:
            # Pad with most important types
            priority_types = ["definition", "trap", "exam"]
            while len(distribution) < num_cards:
                distribution.append(random.choice(priority_types))
        
        return distribution
    
    def _build_generation_prompt(
        self,
        content: str,
        topic: str,
        num_cards: int,
        target_difficulty: Difficulty,
        card_types: List[CardType],
        user_mistakes: Optional[List[str]] = None
    ) -> str:
        """Build the master prompt for Qwen2.5"""
        
        # Distribute card types
        type_counts = {}
        for ct in card_types:
            type_counts[ct] = type_counts.get(ct, 0) + 1
        
        type_instructions = "\n".join([
            f"- {count}x {ctype} cards" for ctype, count in type_counts.items()
        ])
        
        mistake_context = ""
        if user_mistakes:
            mistake_context = f"""
⚠️ USER'S PAST MISTAKES (generate TRAP cards targeting these):
{chr(10).join(f'- {m}' for m in user_mistakes[:5])}
"""
        
        prompt = f'''You are an EXAM-GRADE flashcard generator. Create {num_cards} flashcards from the content below.

📚 TOPIC: {topic}
📊 TARGET DIFFICULTY: {target_difficulty}
{mistake_context}

📋 REQUIRED CARD TYPE DISTRIBUTION:
{type_instructions}

🎯 CARD TYPE DEFINITIONS:
- definition: "What is X?" → Define the core concept clearly
- why: "Why does X happen/exist?" → Explain causation or purpose
- how: "How does X work/happen?" → Describe the process or mechanism
- compare: "Compare X vs Y" or "What's the difference between X and Y?"
- trap: "What's a common misconception about X?" → Bust myths, prevent exam mistakes
- example: "Give an example of X" → Concrete, memorable application
- exam: Exactly like a real exam question would be phrased

✅ STRICT QUALITY RULES:
1. ONE concept per card - NEVER combine multiple facts
2. Answers must be 2-5 lines - not one-liners, not essays
3. Questions must be clear and unambiguous
4. Include key_terms that should trigger recall
5. exam_relevance: 1-10 (10 = almost certainly on exam)

📝 CONTENT TO PROCESS:
{content[:8000]}

🔧 OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {{
    "type": "definition",
    "question": "What is [concept]?",
    "answer": "A clear 2-5 line answer explaining the concept.",
    "difficulty": "{target_difficulty}",
    "topic": "{topic}",
    "subtopic": "specific subtopic or null",
    "exam_relevance": 8,
    "key_terms": ["term1", "term2"],
    "mistake_prone": false
  }}
]

Generate exactly {num_cards} cards. Return ONLY the JSON array, no markdown.'''
        
        return prompt
    
    def _parse_flashcards_response(
        self, 
        response: str, 
        topic: str,
        source: str
    ) -> List[ExamGradeFlashcard]:
        """Parse Qwen's JSON response into ExamGradeFlashcard objects"""
        
        # Clean response - extract JSON if wrapped
        cleaned = response.strip()
        
        # Remove markdown code blocks
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        
        # Try to find JSON array
        match = re.search(r'\[[\s\S]*\]', cleaned)
        if match:
            cleaned = match.group()
        
        try:
            cards_data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse flashcards JSON: {e}")
            logger.error(f"Raw response: {response[:500]}")
            raise ValueError(f"AI returned invalid JSON: {str(e)}")
        
        if not isinstance(cards_data, list):
            raise ValueError("Expected JSON array of flashcards")
        
        flashcards = []
        now = datetime.now().isoformat()
        
        for card_data in cards_data:
            if not isinstance(card_data, dict):
                continue
            
            # Validate required fields
            question = card_data.get("question", "").strip()
            answer = card_data.get("answer", "").strip()
            
            if not question or not answer:
                logger.warning(f"Skipping card with missing question/answer")
                continue
            
            # Extract and validate fields with defaults
            card_type = card_data.get("type", "definition")
            if card_type not in CARD_TYPES:
                card_type = "definition"
            
            difficulty = card_data.get("difficulty", "intermediate")
            if difficulty not in ["beginner", "intermediate", "advanced", "expert"]:
                difficulty = "intermediate"
            
            exam_relevance = card_data.get("exam_relevance", 5)
            if not isinstance(exam_relevance, int) or exam_relevance < 1:
                exam_relevance = 5
            exam_relevance = min(10, max(1, exam_relevance))
            
            key_terms = card_data.get("key_terms", [])
            if not isinstance(key_terms, list):
                key_terms = []
            
            flashcard = ExamGradeFlashcard(
                id=self._generate_card_id(),
                type=card_type,
                question=question,
                answer=answer,
                difficulty=difficulty,
                topic=topic,
                subtopic=card_data.get("subtopic"),
                source=source,
                exam_relevance=exam_relevance,
                key_terms=key_terms,
                created_at=now,
                mistake_prone=card_data.get("mistake_prone", False)
            )
            flashcards.append(flashcard)
        
        if not flashcards:
            raise ValueError("No valid flashcards could be parsed from AI response")
        
        return flashcards
    
    def generate_exam_grade_flashcards(
        self,
        content: str,
        topic: str,
        num_cards: int = 10,
        difficulty: Difficulty = "intermediate",
        source: str = "user_content",
        user_mistakes: Optional[List[str]] = None,
        force_card_types: Optional[List[CardType]] = None
    ) -> List[ExamGradeFlashcard]:
        """
        Generate exam-grade flashcards from content.
        
        Args:
            content: Source material (text, notes, etc.)
            topic: Main topic/subject
            num_cards: Number of cards to generate
            difficulty: Target difficulty level
            source: Content source attribution
            user_mistakes: List of user's past mistakes for TRAP card generation
            force_card_types: Override automatic card type distribution
        
        Returns:
            List of ExamGradeFlashcard objects
        """
        # Determine card type distribution
        if force_card_types and len(force_card_types) == num_cards:
            card_types = force_card_types
        else:
            card_types = self._get_card_type_distribution(num_cards)
        
        # Build prompt
        prompt = self._build_generation_prompt(
            content=content,
            topic=topic,
            num_cards=num_cards,
            target_difficulty=difficulty,
            card_types=card_types,
            user_mistakes=user_mistakes
        )
        
        # Generate with Qwen2.5
        logger.info(f"Generating {num_cards} exam-grade flashcards for topic: {topic}")
        response = self.ollama.ask_qwen(prompt, temperature=0.4)
        
        # Parse response
        flashcards = self._parse_flashcards_response(response, topic, source)
        
        logger.info(f"✓ Generated {len(flashcards)} exam-grade flashcards")
        return flashcards
    
    def generate_trap_cards_from_mistakes(
        self,
        mistakes: List[Dict[str, str]],
        topic: str,
        num_cards: int = 5
    ) -> List[ExamGradeFlashcard]:
        """
        Generate TRAP cards specifically targeting user's past mistakes.
        
        Args:
            mistakes: List of {question, wrong_answer, correct_answer} dicts
            topic: Related topic
            num_cards: Number of trap cards to generate
        
        Returns:
            List of TRAP-type ExamGradeFlashcard objects
        """
        mistakes_text = "\n".join([
            f"Q: {m.get('question', 'Unknown')}\n"
            f"Wrong Answer: {m.get('wrong_answer', 'Unknown')}\n"
            f"Correct Answer: {m.get('correct_answer', 'Unknown')}"
            for m in mistakes[:10]
        ])
        
        prompt = f'''Generate {num_cards} TRAP flashcards to prevent these exact mistakes from happening again.

🚨 USER'S MISTAKES:
{mistakes_text}

📚 TOPIC: {topic}

Create TRAP cards that:
1. Directly address the misconception
2. Explain WHY the wrong answer is wrong
3. Make the correct understanding unforgettable
4. Prevent this exact mistake on future exams

🔧 OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {{
    "type": "trap",
    "question": "What's the common mistake about [concept]?",
    "answer": "Many students incorrectly think [wrong belief]. Actually, [correct understanding] because [reason].",
    "difficulty": "intermediate",
    "topic": "{topic}",
    "subtopic": null,
    "exam_relevance": 9,
    "key_terms": ["term1"],
    "mistake_prone": true
  }}
]

Return ONLY the JSON array.'''
        
        response = self.ollama.ask_qwen(prompt, temperature=0.3)
        return self._parse_flashcards_response(response, topic, "mistake_analysis")
    
    def generate_exam_simulation_cards(
        self,
        topic: str,
        subtopics: List[str],
        exam_format: str = "multiple_choice",
        num_cards: int = 10
    ) -> List[ExamGradeFlashcard]:
        """
        Generate cards that exactly simulate real exam questions.
        
        Args:
            topic: Main exam topic
            subtopics: Specific subtopics to cover
            exam_format: Type of exam (multiple_choice, short_answer, essay)
            num_cards: Number of cards
        
        Returns:
            List of EXAM-type flashcards
        """
        subtopic_list = "\n".join([f"- {st}" for st in subtopics])
        
        prompt = f'''Generate {num_cards} EXAM-STYLE flashcards that could appear on a real {exam_format} exam.

📚 TOPIC: {topic}

📋 SUBTOPICS TO COVER:
{subtopic_list}

Create exam-style questions that:
1. Are phrased exactly like real exam questions
2. Test understanding, not just memorization
3. Include common exam "tricks" students should watch for
4. Cover the most likely exam topics

🔧 OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {{
    "type": "exam",
    "question": "[Exam-style question phrasing]",
    "answer": "[Complete answer with reasoning, 2-5 lines]",
    "difficulty": "advanced",
    "topic": "{topic}",
    "subtopic": "[specific subtopic]",
    "exam_relevance": 10,
    "key_terms": ["term1", "term2"],
    "mistake_prone": false
  }}
]

Return ONLY the JSON array.'''
        
        response = self.ollama.ask_qwen(prompt, temperature=0.5)
        return self._parse_flashcards_response(response, topic, "exam_simulation")
    
    def adaptive_difficulty_adjustment(
        self,
        user_performance: Dict[str, float],
        current_difficulty: Difficulty
    ) -> Difficulty:
        """
        Adjust difficulty based on user's performance.
        
        Args:
            user_performance: {topic: accuracy_percentage}
            current_difficulty: Current difficulty setting
        
        Returns:
            Recommended difficulty level
        """
        avg_accuracy = sum(user_performance.values()) / max(len(user_performance), 1)
        
        difficulty_ladder = ["beginner", "intermediate", "advanced", "expert"]
        current_index = difficulty_ladder.index(current_difficulty)
        
        if avg_accuracy >= 0.90 and current_index < 3:
            # Too easy, increase difficulty
            return difficulty_ladder[current_index + 1]
        elif avg_accuracy <= 0.60 and current_index > 0:
            # Too hard, decrease difficulty
            return difficulty_ladder[current_index - 1]
        else:
            return current_difficulty


# Factory function
def create_flashcard_engine(ollama_service) -> ExamGradeFlashcardEngine:
    """Create a new ExamGradeFlashcardEngine instance"""
    return ExamGradeFlashcardEngine(ollama_service)
