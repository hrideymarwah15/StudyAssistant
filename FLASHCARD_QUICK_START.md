# 🎯 EXAM-GRADE FLASHCARD SYSTEM - QUICK START

## ✅ DEPLOYMENT STATUS: LIVE

**Frontend**: https://assistantstudy.netlify.app  
**Backend**: localhost:8000 (with Cloudflare tunnel)  
**Status**: All systems operational

---

## 🚀 QUICK START GUIDE

### 1. Access the Flashcard System

1. Visit https://assistantstudy.netlify.app
2. Log in with your account
3. Navigate to **Flashcards** from the sidebar

### 2. Create Your First Exam-Grade Deck

```
Click "Create Deck" → Enter name & subject → Create
```

### 3. Generate Exam-Grade Flashcards

**Method 1: Standard Generation**
1. Open a deck
2. Click "AI Generate" button
3. Select "Standard" mode
4. Enter topic (e.g., "Photosynthesis")
5. Choose difficulty: beginner/intermediate/advanced/expert
6. Set number of cards (1-50)
7. Click "Generate" → Preview → "Save to Deck"

**Method 2: TRAP Cards (Mistake-Driven)**
1. Review cards and mark failures ("Again" button)
2. After 3+ failures on a topic, you'll see a suggestion
3. Click "Generate TRAP Cards"
4. System creates targeted misconception-busting cards

**Method 3: Exam Simulation**
1. Click "AI Generate" → "Exam Sim" mode
2. Enter main topic
3. Add subtopics to cover
4. Select exam format (multiple choice/short answer/essay)
5. Generate exam-style practice questions

---

## 🎓 STUDYING WITH SRS

### Review Interface

1. Click on a deck to start studying
2. Read the question
3. Click or press SPACE to reveal answer
4. Rate your recall with 4 buttons:

```
[1] Again   → +1 day   (Failed - needs immediate review)
[2] Hard    → +3 days  (Struggled - needs more practice)
[3] Good    → +7 days  (Understood - normal progression)
[4] Easy    → +15 days (Mastered - accelerate spacing)
```

### Card Type Guide

Each card shows a **type badge** indicating its purpose:

- 🔵 **DEFINITION**: "What is X?" - Core concepts
- 🟣 **WHY**: "Why does X happen?" - Causation/purpose
- 🟢 **HOW**: "How does X work?" - Processes/mechanisms
- 🟡 **COMPARE**: "Compare X vs Y" - Similarities/differences
- 🔴 **TRAP**: "Common mistake about X" - Misconception busters
- 🟠 **EXAMPLE**: "Give an example" - Concrete applications
- 🩷 **EXAM**: Exam-style questions - Test-ready format

### Understanding Card Metadata

- **Difficulty**: beginner/intermediate/advanced/expert
- **Exam Relevance**: 1-10 scale (10 = almost certainly on exam)
- **Interval**: Days until next review
- **🚨 Watch out!**: Appears on mistake-prone cards

---

## 💪 ADVANCED FEATURES

### Mistake Tracking

The system automatically:
- Tracks every "Again" press
- Identifies patterns in your failures
- Suggests TRAP card generation after 3+ failures
- Stores data in localStorage (offline-ready)

### Adaptive Difficulty

- System adjusts card difficulty based on your performance
- High accuracy (>90%) → Harder cards suggested
- Low accuracy (<60%) → Easier cards suggested
- Tracked per topic for precision

### Priority Scheduling

Cards are prioritized by:
1. **Overdue status** (3x weight)
2. **Exam relevance** (0.5x per point)
3. **Mistake-prone flag** (2x weight)
4. **TRAP cards** (1.5x weight)
5. **Upcoming exam** (3x for EXAM-type cards)

---

## 🔧 KEYBOARD SHORTCUTS

While reviewing:
- `SPACE` or `ENTER` → Flip card
- `1` → Rate "Again"
- `2` → Rate "Hard"
- `3` → Rate "Good"
- `4` → Rate "Easy"
- `←` → Previous card
- `→` → Next card

---

## 📊 TRACKING YOUR PROGRESS

### Session Stats
During review, you'll see:
- Current card position (e.g., 5/20)
- Correct/Incorrect count
- Real-time accuracy percentage

### Deck Progress
- **New Cards**: Never reviewed
- **Learning Cards**: Interval < 21 days
- **Mastered Cards**: Interval ≥ 21 days
- **Due Cards**: Ready for review today
- **Overdue Cards**: Past due date

---

## 🎯 EXAM PREPARATION TIPS

### 2 Weeks Before Exam
1. Generate EXAM-type cards for practice
2. Focus on high exam_relevance cards (8-10)
3. Review overdue and due cards daily
4. Generate TRAP cards from mistakes

### 1 Week Before Exam
1. Prioritize EXAM and TRAP card types
2. Do full deck reviews (not just due cards)
3. Generate exam simulation cards
4. Track weak subtopics

### Day Before Exam
1. Review all TRAP cards
2. Focus on cards with exam_relevance 9-10
3. Do a full practice session
4. Review key_terms from all cards

---

## 🐛 TROUBLESHOOTING

### "Failed to generate flashcards"
- **Cause**: Backend not running or Ollama not loaded
- **Fix**: Check backend logs, ensure Ollama has Qwen2.5:14b model

### Cards not saving
- **Cause**: Firebase connection issue
- **Fix**: Check internet connection, verify Firebase config

### TRAP card suggestion not appearing
- **Cause**: Need 3+ failures on same topic
- **Fix**: Keep reviewing and marking failures with "Again"

### AI generation taking too long
- **Cause**: Ollama processing complex prompt
- **Fix**: Wait 10-20 seconds, reduce num_cards if needed

---

## 🔗 API ENDPOINTS (For Developers)

```bash
# Standard exam-grade generation
POST /ai/flashcards/exam-grade
{
  "topic": "Photosynthesis",
  "num_cards": 10,
  "difficulty": "intermediate",
  "use_memory": true
}

# TRAP card generation
POST /ai/flashcards/trap-cards
{
  "mistakes": [{"question": "...", "wrong_answer": "...", "correct_answer": "..."}],
  "topic": "Biology",
  "num_cards": 5
}

# Exam simulation
POST /ai/flashcards/exam-simulation
{
  "topic": "Chemistry",
  "subtopics": ["Atomic Structure", "Bonding"],
  "exam_format": "multiple_choice",
  "num_cards": 10
}
```

---

## 📈 BEST PRACTICES

1. **Quality over Quantity**: Better to master 10 cards than barely know 100
2. **Be Honest with Ratings**: Mark "Again" if you struggled at all
3. **Review Daily**: Even just 5-10 cards maintains momentum
4. **Use All Card Types**: Each type targets different cognitive patterns
5. **Trust the SRS**: Don't manually review mastered cards too often
6. **Generate TRAP Cards**: They're the secret weapon for exam success

---

## 🎉 YOU'RE READY!

Your exam-grade flashcard system is now active and ready to help you ace your exams.

**Key Advantages:**
- ✅ Stronger than Anki (7 card types, adaptive difficulty)
- ✅ Smarter than Quizlet (mistake-driven learning, SRS)
- ✅ Exam-focused (relevance scoring, EXAM cards)
- ✅ AI-powered (Qwen2.5 for quality generation)
- ✅ Offline-ready (localStorage persistence)

Start studying and watch your retention skyrocket! 🚀

---

**Questions?** Check the API docs at http://localhost:8000/docs
**Issues?** Check backend logs at /tmp/backend.log
