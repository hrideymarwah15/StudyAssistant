#!/bin/bash
# Quick test script using curl
# Tests all major endpoints of StudyPal AI OS

BASE_URL="http://localhost:8000"

echo "========================================="
echo "🧪 StudyPal AI OS - Quick Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Health Check
echo -e "${BLUE}Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""
echo ""

# Test 2: Add Material
echo -e "${BLUE}Test 2: Add Study Material${NC}"
curl -s -X POST "$BASE_URL/materials/add" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Deadlocks occur when two or more processes are waiting indefinitely for resources held by each other. The four necessary conditions for deadlock are: mutual exclusion, hold and wait, no preemption, and circular wait. All four must be present for a deadlock to occur.",
    "course": "Operating Systems",
    "topic": "Deadlocks",
    "source": "Test Material"
  }' | python3 -m json.tool
echo ""
echo ""

# Test 3: Memory Stats
echo -e "${BLUE}Test 3: Memory Statistics${NC}"
curl -s "$BASE_URL/materials/stats" | python3 -m json.tool
echo ""
echo ""

# Test 4: Ask Question (RAG)
echo -e "${BLUE}Test 4: Ask Question (RAG)${NC}"
curl -s -X POST "$BASE_URL/ask" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the four conditions required for a deadlock?",
    "use_memory": true,
    "top_k": 5
  }' | python3 -m json.tool
echo ""
echo ""

# Test 5: Generate Flashcards
echo -e "${BLUE}Test 5: Generate Flashcards${NC}"
echo "Note: This requires Ollama with qwen model"
curl -s -X POST "$BASE_URL/flashcards/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Deadlocks",
    "num_cards": 3,
    "use_memory": true
  }' | python3 -m json.tool
echo ""
echo ""

# Test 6: Create Study Plan
echo -e "${BLUE}Test 6: Create Study Plan${NC}"
echo "Note: This requires Ollama with mixtral model"
curl -s -X POST "$BASE_URL/plan/create" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Operating Systems Deadlocks",
    "days": 3,
    "current_knowledge": "Beginner",
    "retrieve_materials": true
  }' | python3 -m json.tool
echo ""

echo "========================================="
echo -e "${GREEN}✓ All tests complete!${NC}"
echo "========================================="
echo ""
echo "View API docs at: $BASE_URL/docs"
