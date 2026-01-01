#!/usr/bin/env python3
"""
Test Suite for StudyPal AI OS Backend
Tests all endpoints and service integrations
"""

import requests
import json
import sys
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

# Colors for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg: str):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg: str):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg: str):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg: str):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")

def test_health_check() -> bool:
    """Test health check endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        data = response.json()
        
        print_info(f"Status: {response.status_code}")
        print_info(f"Backend: {data.get('backend', 'unknown')}")
        
        # Check services
        services = data.get('services', {})
        
        # Qdrant
        qdrant = services.get('qdrant', {})
        if qdrant.get('connected'):
            print_success(f"Qdrant: Connected ({qdrant.get('vectors_count', 0)} vectors)")
        else:
            print_warning(f"Qdrant: Not connected - {qdrant.get('message', '')}")
        
        # Ollama
        ollama = services.get('ollama', {})
        if ollama.get('connected'):
            models = ollama.get('models', [])
            print_success(f"Ollama: Connected (models: {', '.join(models)})")
        else:
            print_warning(f"Ollama: Not connected - {ollama.get('message', '')}")
        
        # Whisper
        whisper = services.get('whisper', {})
        if whisper.get('loaded'):
            print_success(f"Whisper: Loaded ({whisper.get('model', 'unknown')} model)")
        else:
            print_error(f"Whisper: Not loaded - {whisper.get('error', '')}")
        
        return response.status_code == 200
        
    except Exception as e:
        print_error(f"Health check failed: {e}")
        return False


def test_add_material() -> Dict[str, Any]:
    """Test adding study material"""
    print("\n" + "="*60)
    print("TEST 2: Add Study Material")
    print("="*60)
    
    try:
        payload = {
            "text": "Deadlocks occur when two or more processes are waiting for resources held by each other. The four necessary conditions are: mutual exclusion, hold and wait, no preemption, and circular wait.",
            "course": "Operating Systems",
            "topic": "Deadlocks",
            "source": "Lecture Notes"
        }
        
        print_info(f"Adding material: {payload['topic']}")
        response = requests.post(
            f"{BASE_URL}/materials/add",
            json=payload,
            timeout=10
        )
        
        data = response.json()
        
        if response.status_code == 200:
            print_success(f"Material added successfully")
            print_info(f"Point ID: {data.get('point_id', 'unknown')}")
            return data
        else:
            print_error(f"Failed: {data.get('detail', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print_error(f"Add material failed: {e}")
        return {}


def test_ask_question() -> Dict[str, Any]:
    """Test RAG question answering"""
    print("\n" + "="*60)
    print("TEST 3: RAG Question Answering")
    print("="*60)
    
    try:
        payload = {
            "question": "What are the four conditions required for a deadlock to occur?",
            "use_memory": True,
            "top_k": 5
        }
        
        print_info(f"Asking: {payload['question']}")
        response = requests.post(
            f"{BASE_URL}/ask",
            json=payload,
            timeout=60
        )
        
        data = response.json()
        
        if response.status_code == 200:
            print_success("Question answered successfully")
            print_info(f"Context used: {data.get('context_used', False)}")
            print_info(f"Sources: {data.get('sources_count', 0)}")
            print("\nAnswer Preview:")
            print("-" * 60)
            answer = data.get('answer', '')
            print(answer[:300] + "..." if len(answer) > 300 else answer)
            print("-" * 60)
            return data
        else:
            print_error(f"Failed: {data.get('detail', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print_error(f"Ask question failed: {e}")
        return {}


def test_generate_flashcards() -> Dict[str, Any]:
    """Test flashcard generation"""
    print("\n" + "="*60)
    print("TEST 4: Flashcard Generation")
    print("="*60)
    
    try:
        payload = {
            "topic": "Operating Systems Deadlocks",
            "num_cards": 3,
            "use_memory": True
        }
        
        print_info(f"Generating flashcards for: {payload['topic']}")
        response = requests.post(
            f"{BASE_URL}/flashcards/generate",
            json=payload,
            timeout=60
        )
        
        data = response.json()
        
        if response.status_code == 200:
            print_success(f"Generated {data.get('count', 0)} flashcards")
            print_info(f"Source: {data.get('source', 'unknown')}")
            
            flashcards = data.get('flashcards', [])
            for i, card in enumerate(flashcards[:2], 1):  # Show first 2
                print(f"\nFlashcard {i}:")
                print(f"Q: {card['question']}")
                print(f"A: {card['answer'][:100]}...")
            
            return data
        else:
            print_error(f"Failed: {data.get('detail', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print_error(f"Generate flashcards failed: {e}")
        return {}


def test_create_study_plan() -> Dict[str, Any]:
    """Test study plan creation"""
    print("\n" + "="*60)
    print("TEST 5: Study Plan Creation")
    print("="*60)
    
    try:
        payload = {
            "subject": "Operating Systems Deadlocks",
            "days": 3,
            "current_knowledge": "Beginner level",
            "retrieve_materials": True
        }
        
        print_info(f"Creating {payload['days']}-day plan for: {payload['subject']}")
        response = requests.post(
            f"{BASE_URL}/plan/create",
            json=payload,
            timeout=60
        )
        
        data = response.json()
        
        if response.status_code == 200:
            print_success("Study plan created successfully")
            print_info(f"Materials used: {data.get('materials_used', 0)}")
            print("\nPlan Preview:")
            print("-" * 60)
            plan = data.get('plan', '')
            print(plan[:400] + "..." if len(plan) > 400 else plan)
            print("-" * 60)
            return data
        else:
            print_error(f"Failed: {data.get('detail', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print_error(f"Create study plan failed: {e}")
        return {}


def test_memory_stats() -> Dict[str, Any]:
    """Test memory statistics"""
    print("\n" + "="*60)
    print("TEST 6: Memory Statistics")
    print("="*60)
    
    try:
        response = requests.get(f"{BASE_URL}/materials/stats", timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            stats = data.get('stats', {})
            print_success("Memory stats retrieved")
            print_info(f"Collection: {stats.get('collection_name', 'unknown')}")
            print_info(f"Vectors: {stats.get('vectors_count', 0)}")
            print_info(f"Points: {stats.get('points_count', 0)}")
            return data
        else:
            print_error(f"Failed: {data.get('detail', 'Unknown error')}")
            return {}
            
    except Exception as e:
        print_error(f"Get memory stats failed: {e}")
        return {}


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 StudyPal AI OS - Backend Test Suite")
    print("="*60)
    
    # Check if server is running
    try:
        response = requests.get(BASE_URL, timeout=5)
        print_success(f"Backend server is running at {BASE_URL}")
    except:
        print_error(f"Cannot connect to backend at {BASE_URL}")
        print_info("Make sure the server is running: python app.py")
        sys.exit(1)
    
    # Run tests
    tests = [
        ("Health Check", test_health_check),
        ("Add Material", test_add_material),
        ("Ask Question", test_ask_question),
        ("Generate Flashcards", test_generate_flashcards),
        ("Create Study Plan", test_create_study_plan),
        ("Memory Stats", test_memory_stats),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            result = test_func()
            results[name] = result is not None and (
                isinstance(result, bool) and result or
                isinstance(result, dict) and len(result) > 0
            )
        except Exception as e:
            print_error(f"Test '{name}' crashed: {e}")
            results[name] = False
    
    # Summary
    print("\n" + "="*60)
    print("📊 Test Summary")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, success in results.items():
        if success:
            print_success(f"{name}: PASSED")
        else:
            print_error(f"{name}: FAILED")
    
    print("\n" + "="*60)
    print(f"Results: {passed}/{total} tests passed")
    print("="*60)
    
    if passed == total:
        print_success("🎉 All tests passed!")
        sys.exit(0)
    else:
        print_warning(f"⚠️  {total - passed} test(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    main()
