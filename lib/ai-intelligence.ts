"use client"

/**
 * AI Intelligence System - The Brain of StudyPal
 * 
 * This is NOT a chatbot. This is a STUDY INTELLIGENCE SYSTEM.
 * Action > explanation. Fewer words, more direction.
 * AI may override or redirect the user if it improves outcomes.
 */

import { Message, chat } from "./ai-client"

// ==================== AI MODES ====================
// Every AI interaction MUST run in exactly one mode

export type AIMode = "plan" | "explain" | "quiz" | "flashcards" | "review" | "coach"

export interface UserStudyContext {
  // Core identity
  userId?: string
  
  // Current state
  focusMinutesToday: number
  targetFocusMinutes: number
  habitsCompletedToday: number
  totalHabitsToday: number
  flashcardsDue: number
  streakDays: number
  
  // Academic context
  currentCourse?: string
  currentTopic?: string
  examDate?: string // ISO date string
  daysUntilExam?: number
  
  // Recent performance
  recentQuizScores: number[] // Last 5 quiz scores (0-100)
  recentFailures: string[] // Topics/concepts recently struggled with
  
  // Tasks
  urgentTaskCount: number
  highPriorityTaskCount: number
  overdueTasks: number
  
  // Productivity
  productivityAvg: number // 0-100
}

export interface MemoryContext {
  chunks: Array<{
    text: string
    relevanceScore: number
    source?: string
    topic?: string
  }>
  isRelevant: boolean // True if any chunk has relevanceScore > 0.5
  totalChunks: number
}

// ==================== MODE RESOLVER ====================
// Maps user intent to mode - NEVER defaults to free chat

interface ModePattern {
  mode: AIMode
  patterns: RegExp[]
  keywords: string[]
}

const MODE_PATTERNS: ModePattern[] = [
  {
    mode: "plan",
    patterns: [
      /(?:create|make|build|generate|give me)\s+(?:a\s+)?(?:study\s+)?plan/i,
      /plan\s+(?:my|for|out)/i,
      /how\s+should\s+i\s+(?:study|prepare|approach)/i,
      /schedule\s+(?:my|for)/i,
      /organize\s+my\s+(?:study|learning)/i
    ],
    keywords: ["plan", "schedule", "organize", "structure", "roadmap", "timeline"]
  },
  {
    mode: "explain",
    patterns: [
      /explain\s+(.+)/i,
      /what\s+(?:is|are|does|do)\s+(.+)/i,
      /how\s+(?:does|do|is|are)\s+(.+)/i,
      /tell\s+me\s+about\s+(.+)/i,
      /teach\s+me\s+(.+)/i,
      /help\s+me\s+understand\s+(.+)/i,
      /i\s+don'?t\s+understand\s+(.+)/i
    ],
    keywords: ["explain", "what", "how", "why", "understand", "teach", "learn", "concept"]
  },
  {
    mode: "quiz",
    patterns: [
      /quiz\s+me/i,
      /test\s+(?:me|my)/i,
      /ask\s+me\s+questions/i,
      /check\s+my\s+(?:knowledge|understanding)/i,
      /practice\s+questions/i
    ],
    keywords: ["quiz", "test", "question", "check", "assess", "practice"]
  },
  {
    mode: "flashcards",
    patterns: [
      /(?:create|make|generate)\s+(?:\d+\s+)?flashcards?/i,
      /flashcards?\s+(?:for|about|on)/i,
      /turn\s+(?:this|these|my)\s+(?:notes?|content)?\s*into\s+flashcards?/i
    ],
    keywords: ["flashcard", "flashcards", "cards", "anki"]
  },
  {
    mode: "review",
    patterns: [
      /review\s+(?:my|the|this)/i,
      /summarize\s+(.+)/i,
      /summary\s+of\s+(.+)/i,
      /what\s+(?:should\s+i|do\s+i\s+need\s+to)\s+remember/i,
      /key\s+(?:points|takeaways)/i,
      /recap/i
    ],
    keywords: ["review", "summarize", "summary", "recap", "remember", "revise"]
  },
  {
    mode: "coach",
    patterns: [
      /(?:i'?m\s+)?(?:struggling|stuck|lost|confused|overwhelmed|behind|procrastinating)/i,
      /(?:i\s+)?(?:can'?t|don'?t\s+know\s+how\s+to)\s+(?:focus|start|continue|study)/i,
      /(?:help|motivate)\s+me/i,
      /what\s+should\s+i\s+do\s+(?:next|now|first)/i,
      /(?:i'?ve\s+)?(?:failed|bombed|did\s+poorly)/i,
      /(?:i\s+)?(?:need|want)\s+(?:help|advice|guidance)/i
    ],
    keywords: ["struggling", "stuck", "lost", "motivate", "help", "advice", "failed", "behind", "procrastinating"]
  }
]

/**
 * Resolve the appropriate AI mode from user message
 * NEVER returns undefined - always picks the best mode
 */
export function resolveMode(message: string, context?: UserStudyContext): AIMode {
  const lowerMessage = message.toLowerCase().trim()
  
  // 1. Check explicit patterns first (high confidence)
  for (const { mode, patterns } of MODE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return mode
      }
    }
  }
  
  // 2. Check keywords (medium confidence)
  const words = lowerMessage.split(/\s+/)
  let bestMode: AIMode = "explain" // Default fallback
  let bestScore = 0
  
  for (const { mode, keywords } of MODE_PATTERNS) {
    let score = 0
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        score += 2
      }
      if (words.includes(keyword)) {
        score += 1
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMode = mode
    }
  }
  
  if (bestScore > 0) {
    return bestMode
  }
  
  // 3. Context-aware inference
  if (context) {
    // User is behind or struggling - coach mode
    if (context.focusMinutesToday === 0 && context.urgentTaskCount > 0) {
      return "coach"
    }
    if (context.overdueTasks > 2) {
      return "coach"
    }
    if (context.recentFailures.length > 2) {
      return "coach"
    }
    
    // User has exam soon - plan mode for ambiguous questions
    if (context.daysUntilExam && context.daysUntilExam <= 7) {
      return "plan"
    }
    
    // User has flashcards due - review mode
    if (context.flashcardsDue > 10) {
      return "review"
    }
  }
  
  // 4. Final fallback: explain (for knowledge questions)
  // This is better than free chat - it provides structured teaching
  return "explain"
}

// ==================== INTERVENTION LOGIC ====================
// AI should NOT always comply immediately

export interface Intervention {
  shouldIntervene: boolean
  message: string
  suggestedMode: AIMode
  priority: "high" | "medium" | "low"
}

/**
 * Check if AI should redirect the user before fulfilling their request
 * Returns intervention suggestion if user's current state warrants it
 */
export function checkForIntervention(
  requestedMode: AIMode,
  context: UserStudyContext
): Intervention | null {
  
  // High priority interventions
  
  // 1. No focus today but asking for explanations
  if (requestedMode === "explain" && context.focusMinutesToday === 0 && context.urgentTaskCount > 0) {
    return {
      shouldIntervene: true,
      message: `Before we dive in: you haven't started focus time today and have ${context.urgentTaskCount} urgent task${context.urgentTaskCount > 1 ? 's' : ''}. Start a 25-min focus session first?`,
      suggestedMode: "coach",
      priority: "high"
    }
  }
  
  // 2. Habits incomplete and asking for non-urgent help
  if (["explain", "quiz", "flashcards"].includes(requestedMode) && 
      context.habitsCompletedToday < context.totalHabitsToday &&
      context.totalHabitsToday > 0) {
    const incomplete = context.totalHabitsToday - context.habitsCompletedToday
    if (incomplete >= 2) {
      return {
        shouldIntervene: true,
        message: `Quick check: ${incomplete} habit${incomplete > 1 ? 's' : ''} still pending. Completing them first keeps your streak strong. Want to knock those out?`,
        suggestedMode: "coach",
        priority: "medium"
      }
    }
  }
  
  // 3. Overdue tasks and asking for flashcards/quiz
  if (["flashcards", "quiz"].includes(requestedMode) && context.overdueTasks > 0) {
    return {
      shouldIntervene: true,
      message: `You have ${context.overdueTasks} overdue task${context.overdueTasks > 1 ? 's' : ''}. Let's tackle those first, then come back to this. Which one should we start with?`,
      suggestedMode: "coach",
      priority: "high"
    }
  }
  
  // 4. Streak at risk (no activity today, evening)
  const hour = new Date().getHours()
  if (hour >= 20 && context.focusMinutesToday === 0 && context.streakDays > 0) {
    return {
      shouldIntervene: true,
      message: `Your ${context.streakDays}-day streak is at risk. Just 15 minutes of focus will keep it alive. Start a quick session?`,
      suggestedMode: "coach",
      priority: "high"
    }
  }
  
  // 5. Repeated confusion (recent failures)
  if (requestedMode === "explain" && context.recentFailures.length >= 3) {
    return {
      shouldIntervene: true,
      message: "I notice you've been struggling with a few topics lately. Let me try a different approach - want me to create a focused review plan?",
      suggestedMode: "plan",
      priority: "medium"
    }
  }
  
  // 6. Exam soon but asking for unstructured help
  if (context.daysUntilExam && context.daysUntilExam <= 3 && 
      !["plan", "review", "quiz"].includes(requestedMode)) {
    return {
      shouldIntervene: true,
      message: `Your exam is in ${context.daysUntilExam} day${context.daysUntilExam > 1 ? 's' : ''}. Let's focus on high-impact review. Want a targeted revision plan?`,
      suggestedMode: "review",
      priority: "high"
    }
  }
  
  return null
}

// ==================== MODE-SPECIFIC OUTPUT CONTRACTS ====================

export interface PlanOutput {
  goal: string
  steps: Array<{ task: string; time: string }>
  next_action: string
}

export interface QuizOutput {
  questions: Array<{ q: string; answer: string }>
}

export interface FlashcardOutput {
  question: string
  answer: string
}

export interface ReviewOutput {
  summary: string[]
  mistakes_to_avoid: string[]
  next_steps: string[]
}

export interface CoachOutput {
  acknowledgment: string
  corrective_action: string
  smallest_next_step: string
}

// ==================== STRUCTURED SYSTEM PROMPTS ====================

function buildSystemPrompt(mode: AIMode, context: UserStudyContext, memoryContext?: MemoryContext): string {
  const baseRole = `You are a strict, effective study coach. You optimize for learning outcomes, not comfort. Be decisive, concise, and actionable. No filler. No generic motivation.`
  
  const userContextStr = `
USER CONTEXT:
- Focus today: ${context.focusMinutesToday}/${context.targetFocusMinutes} min
- Habits: ${context.habitsCompletedToday}/${context.totalHabitsToday} completed
- Flashcards due: ${context.flashcardsDue}
- Streak: ${context.streakDays} days
- Urgent tasks: ${context.urgentTaskCount}
- Overdue tasks: ${context.overdueTasks}
${context.currentCourse ? `- Course: ${context.currentCourse}` : ""}
${context.currentTopic ? `- Topic: ${context.currentTopic}` : ""}
${context.daysUntilExam ? `- Days until exam: ${context.daysUntilExam}` : ""}
${context.recentFailures.length > 0 ? `- Recent struggles: ${context.recentFailures.join(", ")}` : ""}
`

  let memoryStr = ""
  if (memoryContext && memoryContext.chunks.length > 0) {
    if (memoryContext.isRelevant) {
      memoryStr = `
MEMORY CONTEXT (from user's study materials):
${memoryContext.chunks.slice(0, 5).map((c, i) => `[${i + 1}] (relevance: ${(c.relevanceScore * 100).toFixed(0)}%) ${c.text.slice(0, 300)}...`).join("\n\n")}
`
    } else {
      memoryStr = `
MEMORY NOTE: Retrieved content has weak relevance to this query. Do NOT use it unless directly applicable. If you need more context, tell the user: "I don't have strong material on this. Want to add notes?"`
    }
  }

  const modeInstructions: Record<AIMode, string> = {
    plan: `
MODE: PLAN
Output EXACT JSON (no other text):
{
  "goal": "clear, specific goal statement",
  "steps": [
    { "task": "specific action", "time": "X min" }
  ],
  "next_action": "what to do RIGHT NOW"
}
Keep steps concrete. Time estimates must be realistic. Next action must be immediately executable.`,

    explain: `
MODE: EXPLAIN
Structure your response:
1. Start with 2-line summary (the core concept)
2. Then detailed explanation
3. End with exactly ONE check question to verify understanding
Keep it focused. If the concept is complex, break it into digestible parts.`,

    quiz: `
MODE: QUIZ
Output EXACT JSON (no other text):
{
  "questions": [
    { "q": "question text", "answer": "correct answer" }
  ]
}
Generate 5 questions. Mix difficulty. Focus on understanding, not trivia.`,

    flashcards: `
MODE: FLASHCARDS
Output EXACT JSON array (no other text):
[
  { "question": "front of card", "answer": "back of card" }
]
Generate 5-7 cards. Questions should test understanding. Answers should be concise but complete.`,

    review: `
MODE: REVIEW
Structure your response as:
**Summary:**
- [bullet point 1]
- [bullet point 2]
...

**Mistakes to Avoid:**
- [common error 1]
- [common error 2]

**Next Steps:**
- [action 1]
- [action 2]

Be specific. Reference actual content when available.`,

    coach: `
MODE: COACH
Structure your response:
1. ONE sentence acknowledging the situation (no platitudes)
2. ONE corrective action (specific, not generic)
3. THE smallest possible next step (can be done in under 5 minutes)

Do not be preachy. Do not over-explain. Be direct and helpful.`
  }

  return `${baseRole}

${userContextStr}
${memoryStr}

${modeInstructions[mode]}

RESPONSE RULES:
- Be concise
- Be actionable
- No filler phrases
- No generic motivation
- Respect the output format exactly
- If you cannot help, say so clearly
- Always end with a clear next step`
}

// ==================== PROACTIVE SUGGESTIONS ====================

export interface ProactiveSuggestion {
  id: string
  message: string
  action: string // What to tell the AI
  priority: "urgent" | "high" | "normal"
  icon: string
}

/**
 * Generate proactive suggestions based on user state
 * These appear in the JARVIS panel by default
 */
export function getProactiveSuggestions(context: UserStudyContext): ProactiveSuggestion[] {
  const suggestions: ProactiveSuggestion[] = []
  const hour = new Date().getHours()
  
  // 1. No focus today
  if (context.focusMinutesToday === 0 && hour >= 8 && hour <= 22) {
    suggestions.push({
      id: "no-focus",
      message: `Start 25-min focus${context.currentCourse ? ` on ${context.currentCourse}` : ""}`,
      action: "Help me start a focused study session",
      priority: context.urgentTaskCount > 0 ? "urgent" : "high",
      icon: "🎯"
    })
  }
  
  // 2. Flashcards due
  if (context.flashcardsDue > 0) {
    suggestions.push({
      id: "flashcards-due",
      message: `Review ${context.flashcardsDue} flashcard${context.flashcardsDue > 1 ? 's' : ''} due`,
      action: "Let's review my due flashcards",
      priority: context.flashcardsDue > 20 ? "urgent" : "normal",
      icon: "🃏"
    })
  }
  
  // 3. Exam approaching
  if (context.daysUntilExam && context.daysUntilExam <= 7) {
    suggestions.push({
      id: "exam-soon",
      message: `${context.daysUntilExam} day${context.daysUntilExam > 1 ? 's' : ''} until exam - create revision plan`,
      action: `Create a ${context.daysUntilExam}-day revision plan for my upcoming exam`,
      priority: context.daysUntilExam <= 3 ? "urgent" : "high",
      icon: "📅"
    })
  }
  
  // 4. Streak at risk
  if (context.streakDays > 0 && context.focusMinutesToday === 0 && hour >= 18) {
    suggestions.push({
      id: "streak-risk",
      message: `Keep your ${context.streakDays}-day streak alive`,
      action: "Help me do a quick study session to keep my streak",
      priority: hour >= 21 ? "urgent" : "high",
      icon: "🔥"
    })
  }
  
  // 5. Habits incomplete
  const incompleteHabits = context.totalHabitsToday - context.habitsCompletedToday
  if (incompleteHabits > 0) {
    suggestions.push({
      id: "habits-pending",
      message: `${incompleteHabits} habit${incompleteHabits > 1 ? 's' : ''} remaining today`,
      action: "Help me complete my remaining habits",
      priority: hour >= 20 ? "high" : "normal",
      icon: "✓"
    })
  }
  
  // 6. Overdue tasks
  if (context.overdueTasks > 0) {
    suggestions.push({
      id: "overdue-tasks",
      message: `${context.overdueTasks} overdue task${context.overdueTasks > 1 ? 's' : ''} - let's catch up`,
      action: "Help me prioritize my overdue tasks",
      priority: "urgent",
      icon: "⚠️"
    })
  }
  
  // 7. Recent failures - offer alternative learning
  if (context.recentFailures.length >= 2) {
    const topic = context.recentFailures[0]
    suggestions.push({
      id: "retry-topic",
      message: `Retry: ${topic} with a new approach`,
      action: `Explain ${topic} in a different way`,
      priority: "normal",
      icon: "🔄"
    })
  }
  
  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, normal: 2 }
  suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return suggestions.slice(0, 3) // Max 3 suggestions
}

// ==================== MAIN AI INTERFACE ====================

export interface AIRequest {
  message: string
  context: UserStudyContext
  memoryContext?: MemoryContext
  forceMode?: AIMode // Override automatic mode detection
  skipIntervention?: boolean // For when user explicitly declines intervention
}

export interface AIResponse {
  mode: AIMode
  content: string
  structured?: PlanOutput | QuizOutput | FlashcardOutput[] | ReviewOutput | CoachOutput
  intervention?: Intervention
  suggestions: ProactiveSuggestion[]
}

/**
 * Main AI processing function
 * Resolves mode, checks for intervention, builds prompt, calls LLM
 */
export async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  const { message, context, memoryContext, forceMode, skipIntervention } = request
  
  // 1. Resolve mode
  const mode = forceMode || resolveMode(message, context)
  
  // 2. Check for intervention (unless skipped)
  let intervention: Intervention | null = null
  if (!skipIntervention) {
    intervention = checkForIntervention(mode, context)
    if (intervention?.shouldIntervene) {
      // Return intervention without calling LLM
      return {
        mode: intervention.suggestedMode,
        content: intervention.message,
        intervention,
        suggestions: getProactiveSuggestions(context)
      }
    }
  }
  
  // 3. Build system prompt
  const systemPrompt = buildSystemPrompt(mode, context, memoryContext)
  
  // 4. Call LLM
  const messages: Message[] = [
    { role: "user", content: message }
  ]
  
  let content: string
  try {
    content = await chat(messages, {
      systemPrompt,
      temperature: mode === "quiz" || mode === "flashcards" ? 0.3 : 0.5,
      maxTokens: mode === "explain" ? 2048 : 1024
    })
  } catch (error: any) {
    content = `I encountered an issue processing your request. ${error.message || "Please try again."}`
    return {
      mode,
      content,
      suggestions: getProactiveSuggestions(context)
    }
  }
  
  // 5. Parse structured output if applicable
  let structured: AIResponse["structured"]
  if (["plan", "quiz", "flashcards"].includes(mode)) {
    try {
      // Clean response to extract JSON
      let jsonStr = content
      if (content.includes("```")) {
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (match) jsonStr = match[1]
      }
      // Find JSON in response
      const jsonMatch = jsonStr.match(/[\[{][\s\S]*[\]}]/)
      if (jsonMatch) {
        structured = JSON.parse(jsonMatch[0])
      }
    } catch {
      // JSON parsing failed - content is already the raw response
    }
  }
  
  // 6. Return response
  return {
    mode,
    content,
    structured,
    suggestions: getProactiveSuggestions(context)
  }
}

// ==================== CONTEXT BUILDER ====================
// Helper to build UserStudyContext from various sources

export function buildStudyContext(data: {
  dailyStats?: { totalStudyMinutes?: number; taskCompleted?: number; pomodoroCompleted?: number; productivityAvg?: number; streakDay?: number }
  tasks?: Array<{ status?: string; priority?: string; dueDate?: any }>
  habits?: Array<{ completions?: Array<{ date: string; completed: boolean }> }>
  courses?: Array<{ name: string; examDate?: string }>
  flashcardsDue?: number
}): UserStudyContext {
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  
  // Calculate habits completed today
  let habitsCompletedToday = 0
  let totalHabitsToday = data.habits?.length || 0
  data.habits?.forEach(h => {
    const todayCompletion = h.completions?.find(c => c.date === today)
    if (todayCompletion?.completed) habitsCompletedToday++
  })
  
  // Calculate task metrics
  let urgentTaskCount = 0
  let highPriorityTaskCount = 0
  let overdueTasks = 0
  data.tasks?.forEach(t => {
    if (t.status === 'completed') return
    if (t.priority === 'urgent') urgentTaskCount++
    if (t.priority === 'high') highPriorityTaskCount++
    if (t.dueDate) {
      const dueDate = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate)
      if (dueDate < now) overdueTasks++
    }
  })
  
  // Find nearest exam
  let daysUntilExam: number | undefined
  let currentCourse: string | undefined
  data.courses?.forEach(c => {
    if (c.examDate) {
      const examDate = new Date(c.examDate)
      const days = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (days > 0 && (daysUntilExam === undefined || days < daysUntilExam)) {
        daysUntilExam = days
        currentCourse = c.name
      }
    }
  })
  
  return {
    focusMinutesToday: data.dailyStats?.totalStudyMinutes || 0,
    targetFocusMinutes: 120, // Default 2 hours
    habitsCompletedToday,
    totalHabitsToday,
    flashcardsDue: data.flashcardsDue || 0,
    streakDays: data.dailyStats?.streakDay || 0,
    urgentTaskCount,
    highPriorityTaskCount,
    overdueTasks,
    productivityAvg: data.dailyStats?.productivityAvg || 50,
    currentCourse,
    daysUntilExam,
    recentQuizScores: [], // Would need to be populated from quiz history
    recentFailures: [] // Would need to be populated from learning analytics
  }
}
