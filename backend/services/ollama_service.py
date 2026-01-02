"""
Ollama Service - Local AI Brain
Handles communication with Ollama for Mixtral (reasoning) and Qwen (explanations)
"""

import logging
import requests
import json
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama API configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
OLLAMA_CHAT_URL = f"{OLLAMA_BASE_URL}/api/chat"

# Model configurations
MIXTRAL_MODEL = "mixtral"  # Deep reasoning, complex analysis
QWEN_MODEL = "qwen2.5:14b"  # Clean explanations, flashcard generation


class OllamaService:
    """
    Service for interacting with local Ollama models.
    Provides structured AI responses for study assistance.
    """
    
    def __init__(self):
        """Initialize Ollama service and verify connectivity."""
        try:
            # Test connection
            response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                logger.info(f"✓ Connected to Ollama. Available models: {model_names}")
            else:
                logger.warning("⚠ Ollama connection test returned non-200 status")
        except Exception as e:
            logger.error(f"⚠ Failed to connect to Ollama: {e}")
            logger.info("Make sure Ollama is running: ollama serve")
    
    
    def _generate(self, model: str, prompt: str, system: Optional[str] = None, 
                  temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """
        Internal method to generate text from Ollama.
        
        Args:
            model: Model name (mixtral, qwen, etc.)
            prompt: User prompt
            system: Optional system prompt
            temperature: Sampling temperature (0.0 - 1.0)
            max_tokens: Maximum tokens to generate
        
        Returns:
            Generated text response
        """
        try:
            payload = {
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            
            if system:
                payload["system"] = system
            
            logger.info(f"Calling Ollama with model '{model}'...")
            response = requests.post(
                OLLAMA_GENERATE_URL,
                json=payload,
                timeout=120  # 2 minutes for complex queries
            )
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "").strip()
                logger.info(f"✓ Generated {len(generated_text)} characters")
                return generated_text
            else:
                error_msg = f"Ollama returned status {response.status_code}"
                logger.error(error_msg)
                return f"Error: {error_msg}"
                
        except requests.exceptions.Timeout:
            logger.error("Ollama request timed out")
            return "Error: Request timed out. The model may be processing a complex query."
        except Exception as e:
            logger.error(f"Failed to generate with Ollama: {e}")
            return f"Error: {str(e)}"
    
    
    def ask_mixtral(self, prompt: str, context: Optional[str] = None) -> str:
        """
        Ask Mixtral for deep reasoning and complex analysis.
        Best for: detailed explanations, problem-solving, research.
        
        Args:
            prompt: User question or task
            context: Optional context from memory retrieval
        
        Returns:
            Detailed, well-reasoned response
        """
        system_prompt = """You are a highly intelligent study assistant with deep expertise across all academic subjects.
Your role is to provide thorough, accurate, and insightful explanations.
Break down complex topics step-by-step.
Use examples and analogies when helpful.
Always aim for clarity and educational value."""

        if context:
            full_prompt = f"""CONTEXT FROM MEMORY:
{context}

QUESTION:
{prompt}

Please provide a comprehensive, well-structured answer using the context above."""
        else:
            full_prompt = prompt
        
        return self._generate(
            model=MIXTRAL_MODEL,
            prompt=full_prompt,
            system=system_prompt,
            temperature=0.7,
            max_tokens=2000
        )
    
    
    def ask_qwen(self, prompt: str, temperature: float = 0.3) -> str:
        """
        Ask Qwen for clean, structured explanations.
        Best for: flashcards, summaries, concise answers, JSON generation.
        
        Args:
            prompt: User question or task
            temperature: Lower = more deterministic (default: 0.3)
        
        Returns:
            Clean, structured response
        """
        system_prompt = """You are a precise and efficient study assistant.
Provide clear, concise, and well-formatted answers.
When asked for structured data (like flashcards), return valid JSON.
Focus on educational clarity and accuracy."""

        return self._generate(
            model=QWEN_MODEL,
            prompt=prompt,
            system=system_prompt,
            temperature=temperature,
            max_tokens=1500
        )
    
    
    def generate_flashcards(self, content: str, num_cards: int = 5) -> str:
        """
        Generate flashcards in JSON format using Qwen.
        
        Args:
            content: Source material for flashcard generation
            num_cards: Number of flashcards to generate
        
        Returns:
            JSON string with flashcards array
        """
        prompt = f"""Based on the following content, generate {num_cards} high-quality flashcards for studying.

CONTENT:
{content}

Return ONLY a valid JSON array in this exact format:
[
  {{"question": "What is...", "answer": "..."}},
  {{"question": "Explain...", "answer": "..."}}
]

Make questions clear and answers comprehensive but concise.
Focus on key concepts and important details."""

        response = self.ask_qwen(prompt, temperature=0.3)
        
        # Try to extract JSON if wrapped in markdown
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        
        return response
    
    
    def generate_study_plan(self, subject: str, days: int, current_knowledge: str = "") -> str:
        """
        Generate a day-by-day study plan using Mixtral.
        
        Args:
            subject: Subject to study
            days: Number of days available
            current_knowledge: Optional description of current knowledge level
        
        Returns:
            Structured study plan
        """
        prompt = f"""Create a detailed {days}-day study plan for: {subject}

{f"Current knowledge level: {current_knowledge}" if current_knowledge else ""}

Provide a day-by-day breakdown with:
- Daily topics to cover
- Recommended study duration
- Key concepts to master
- Practice exercises or review activities

Make it realistic and effective for mastery."""

        return self.ask_mixtral(prompt)
    
    
    def summarize_text(self, text: str) -> str:
        """
        Generate concise summary using Qwen.
        
        Args:
            text: Text to summarize
        
        Returns:
            Summary text
        """
        prompt = f"""Summarize the following text concisely, capturing all key points:

{text}

Provide a clear, well-organized summary."""

        return self.ask_qwen(prompt, temperature=0.3)


# Global instance
ollama_service = None

def get_ollama_service() -> OllamaService:
    """
    Get or create singleton OllamaService instance.
    """
    global ollama_service
    if ollama_service is None:
        ollama_service = OllamaService()
    return ollama_service
