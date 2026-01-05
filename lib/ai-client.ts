"use client"

// AI Client - Uses local backend API (Ollama-powered)
// Backend uses Mixtral for reasoning and Qwen2.5 for flashcard generation
// All AI processing happens on the local backend, not through external APIs

// API Keys from environment
const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
const GROQ_MODEL = "mixtral-8x7b-32768"
const GEMINI_MODEL = "gemini-1.5-flash"

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface GeneratedFlashcard {
  front: string
  back: string
}

// Note: This file contains AI client functions that work with external APIs
// For backend-powered AI (recommended), see lib/api.ts

// Sleep helper for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Truncate content intelligently
function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content
  let truncated = content.slice(0, maxChars)
  const lastPeriod = truncated.lastIndexOf('. ')
  const lastNewline = truncated.lastIndexOf('\n')
  const cutPoint = Math.max(lastPeriod, lastNewline)
  if (cutPoint > maxChars * 0.8) {
    truncated = truncated.slice(0, cutPoint + 1)
  }
  return truncated + "\n\n[Content truncated...]"
}

// Fix truncated JSON arrays
function fixTruncatedJson(jsonStr: string): string {
  let fixed = jsonStr.trim()
  
  if (!fixed.startsWith('[')) {
    const arrayStart = fixed.indexOf('[')
    if (arrayStart !== -1) {
      fixed = fixed.slice(arrayStart)
    } else {
      throw new Error("No JSON array found")
    }
  }
  
  let bracketCount = 0
  let inString = false
  let escapeNext = false
  let lastCompleteObject = -1
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    if (escapeNext) { escapeNext = false; continue }
    if (char === '\\') { escapeNext = true; continue }
    if (char === '"') { inString = !inString; continue }
    if (inString) continue
    if (char === '{') bracketCount++
    if (char === '}') {
      bracketCount--
      if (bracketCount === 0) lastCompleteObject = i
    }
  }
  
  if (lastCompleteObject > 0) {
    fixed = fixed.slice(0, lastCompleteObject + 1)
    if (!fixed.endsWith(']')) fixed += ']'
  }
  
  fixed = fixed.replace(/,\s*\]$/, ']')
  fixed = fixed.replace(/,\s*$/, '') + ']'
  if (!fixed.endsWith(']')) fixed += ']'
  
  return fixed
}

// ==================== GROQ API ====================
async function chatWithGroq(messages: Message[], options: ChatOptions = {}): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not configured")
  }

  const allMessages = options.systemPrompt 
    ? [{ role: "system" as const, content: options.systemPrompt }, ...messages]
    : messages

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: allMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4096
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Groq API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

// ==================== GEMINI API ====================
async function chatWithGemini(messages: Message[], options: ChatOptions = {}): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured")
  }

  // Convert messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }))

  // Add system prompt as first user message if provided
  if (options.systemPrompt) {
    contents.unshift({
      role: "user",
      parts: [{ text: `System Instructions: ${options.systemPrompt}` }]
    })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 4096
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

// ==================== UNIFIED CHAT ====================
export async function chat(
  messages: Message[], 
  options: ChatOptions = {}
): Promise<string> {
  const maxRetries = 3
  
  // Try Groq first (faster, more generous free tier)
  if (GROQ_API_KEY) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(Math.pow(2, attempt) * 1000)
        }
        return await chatWithGroq(messages, options)
      } catch (error: any) {
        console.warn(`Groq attempt ${attempt + 1} failed:`, error.message)
        if (error.message?.includes("rate") || error.message?.includes("429")) {
          continue
        }
        break // Non-rate-limit error, try fallback
      }
    }
  }

  // Fallback to Gemini
  if (GEMINI_API_KEY) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(Math.pow(2, attempt) * 1000)
        }
        return await chatWithGemini(messages, options)
      } catch (error: any) {
        console.warn(`Gemini attempt ${attempt + 1} failed:`, error.message)
        if (error.message?.includes("rate") || error.message?.includes("429") || error.message?.includes("exhausted")) {
          continue
        }
        throw error
      }
    }
  }

  throw new Error("No AI provider available. Please configure NEXT_PUBLIC_GROQ_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY")
}

// ==================== FLASHCARD GENERATION ====================
export async function generateFlashcards(
  content: string,
  topic: string,
  count: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<GeneratedFlashcard[]> {
  const maxContentChars = 80000 // ~20k tokens
  const processedContent = content ? truncateContent(content.trim(), maxContentChars) : ""

  const difficultyPrompts = {
    easy: "Create simple, straightforward questions with concise answers suitable for beginners.",
    medium: "Create balanced questions that test understanding with moderately detailed answers.",
    hard: "Create challenging questions that require deep understanding with comprehensive answers."
  }

  const systemPrompt = "You are an expert educator creating flashcards. Return ONLY valid JSON arrays, no other text."

  const userPrompt = processedContent && processedContent.length > 50
    ? `Create ${count} flashcards based ONLY on this study material:

"""
${processedContent}
"""

${topic ? `Topic: ${topic}` : ""}
Difficulty: ${difficulty} - ${difficultyPrompts[difficulty]}

Return ONLY a JSON array: [{"front": "Question?", "back": "Answer"}]
CRITICAL: Only use information from the provided material.`
    : `Create ${count} flashcards about "${topic}".
Difficulty: ${difficulty} - ${difficultyPrompts[difficulty]}
Return ONLY a JSON array: [{"front": "Question?", "back": "Answer"}]`

  const response = await chat(
    [{ role: "user", content: userPrompt }],
    { systemPrompt, temperature: 0.7, maxTokens: 8192 }
  )

  // Parse JSON from response
  let jsonStr = response
  
  // Clean the response to remove markdown formatting and backticks
  const cleanResponse = response
    .replace(/```(?:json)?\s*/g, '')  // Remove opening code block markers
    .replace(/```\s*$/g, '')          // Remove closing code block markers
    .replace(/`/g, '')                // Remove any remaining backticks
    .trim()
  
  // Try to extract JSON from cleaned response
  const jsonMatch = cleanResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  } else {
    const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (arrayMatch) jsonStr = arrayMatch[0]
  }

  let flashcards: GeneratedFlashcard[]
  try {
    flashcards = JSON.parse(jsonStr)
  } catch {
    jsonStr = fixTruncatedJson(jsonStr)
    flashcards = JSON.parse(jsonStr)
  }

  if (!Array.isArray(flashcards)) {
    throw new Error("Invalid response format")
  }

  return flashcards.filter(card => card.front && card.back).slice(0, count)
}

// ==================== ASSISTANT QUICK RESPONSES ====================
export async function getAssistantResponse(
  userMessage: string,
  context?: {
    conversationHistory?: Message[]
    userMaterials?: string[]
    currentPage?: string
  }
): Promise<string> {
  const systemPrompt = `You are StudyPal AI, a helpful student assistant. You help with:
- Answering study questions
- Explaining concepts
- Creating flashcards and quizzes
- Managing study schedules
- Providing encouragement and study tips

Be concise, friendly, and educational. If asked to create flashcards or perform actions, acknowledge the request and explain what you'll do.

${context?.currentPage ? `The user is currently on the ${context.currentPage} page.` : ""}
${context?.userMaterials?.length ? `The user has materials on: ${context.userMaterials.join(", ")}` : ""}`

  const messages: Message[] = [
    ...(context?.conversationHistory || []),
    { role: "user", content: userMessage }
  ]

  return chat(messages, { systemPrompt, temperature: 0.7, maxTokens: 1024 })
}

// ==================== SUMMARIZATION ====================
export async function summarizeContent(
  content: string,
  style: "brief" | "detailed" | "bullet-points" = "bullet-points"
): Promise<string> {
  const processedContent = truncateContent(content, 50000)
  
  const stylePrompts = {
    brief: "Provide a 2-3 sentence summary.",
    detailed: "Provide a comprehensive summary covering all key points.",
    "bullet-points": "Provide a summary as bullet points highlighting key concepts."
  }

  return chat([{
    role: "user",
    content: `Summarize this content. ${stylePrompts[style]}

Content:
"""
${processedContent}
"""`
  }], { temperature: 0.5, maxTokens: 2048 })
}

// ==================== EXPLAIN CONCEPT ====================
export async function explainConcept(
  concept: string,
  level: "beginner" | "intermediate" | "advanced" = "intermediate"
): Promise<string> {
  const levelPrompts = {
    beginner: "Explain like I'm 10 years old, using simple language and analogies.",
    intermediate: "Explain for a college student, with some technical detail.",
    advanced: "Explain in depth with technical terminology and nuances."
  }

  return chat([{
    role: "user",
    content: `Explain: "${concept}"\n\n${levelPrompts[level]}`
  }], { temperature: 0.7, maxTokens: 2048 })
}

// ==================== GENERATE STUDY PLAN ====================
export interface StudyPlanItem {
  topic: string
  duration: number // in minutes
  resources: string[]
  priority: "high" | "medium" | "low"
}

export async function generateStudyPlan(
  subject: string,
  goals: string[],
  availableTime: number, // in hours per week
  currentLevel: "beginner" | "intermediate" | "advanced" = "intermediate",
  deadline?: Date
): Promise<StudyPlanItem[]> {
  const deadlineStr = deadline ? `Deadline: ${deadline.toDateString()}` : ""
  
  const prompt = `Create a detailed study plan for ${subject} with the following goals: ${goals.join(", ")}.
Available study time: ${availableTime} hours per week.
Current level: ${currentLevel}.
${deadlineStr}

Return a JSON array of study plan items with this structure:
[
  {
    "topic": "Topic name",
    "duration": 60,
    "resources": ["Resource 1", "Resource 2"],
    "priority": "high"
  }
]

Make the plan realistic, progressive, and optimized for spaced repetition.`

  const response = await chat([{
    role: "user",
    content: prompt
  }], { temperature: 0.3, maxTokens: 4096 })

  try {
    // Clean the response by removing markdown code blocks and backticks
    let cleanResponse = response.trim()
    
    // Remove markdown code block markers
    cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    
    // Remove any remaining backticks
    cleanResponse = cleanResponse.replace(/`/g, '')
    
    // Try to find JSON array if response contains extra text
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanResponse = jsonMatch[0]
    }
    
    return JSON.parse(cleanResponse)
  } catch (e) {
    console.error("Failed to parse study plan JSON:", e)
    console.error("Raw response:", response)
    return []
  }
}

// ==================== GENERATE QUIZ ====================
export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: "easy" | "medium" | "hard"
}

export async function generateQuiz(
  contentOrTopic: string,
  topicOrQuestionCount?: string | number,
  questionCountOrDifficulty?: number | "easy" | "medium" | "hard",
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<QuizQuestion[]> {
  let content: string
  let topic: string
  let questionCount: number = 10

  // Handle overloads
  if (typeof topicOrQuestionCount === 'string') {
    // generateQuiz(content, topic, questionCount?, difficulty?)
    content = contentOrTopic
    topic = topicOrQuestionCount
    if (typeof questionCountOrDifficulty === 'number') {
      questionCount = questionCountOrDifficulty
    }
  } else {
    // generateQuiz(topic, questionCount?, difficulty?)
    content = contentOrTopic // use topic as content
    topic = contentOrTopic
    if (typeof topicOrQuestionCount === 'number') {
      questionCount = topicOrQuestionCount
    }
    if (typeof questionCountOrDifficulty === 'string') {
      difficulty = questionCountOrDifficulty
    }
  }

  const processedContent = truncateContent(content, 30000)
  
  const prompt = `Generate a ${questionCount}-question multiple-choice quiz on "${topic}" based on this content.
Difficulty level: ${difficulty}

Return a JSON array with this exact structure:
[
  {
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "difficulty": "${difficulty}"
  }
]

Ensure questions test understanding, not just memorization. Make options plausible but clearly distinguishable.

Content:
"""
${processedContent}
"""`

  const response = await chat([{
    role: "user",
    content: prompt
  }], { temperature: 0.4, maxTokens: 6144 })

  try {
    // Clean the response by removing markdown code blocks and backticks
    let cleanResponse = response.trim()
    
    // Remove markdown code block markers
    cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    
    // Remove any remaining backticks
    cleanResponse = cleanResponse.replace(/`/g, '')
    
    // Try to find JSON array if response contains extra text
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanResponse = jsonMatch[0]
    }
    
    return JSON.parse(cleanResponse)
  } catch (e) {
    console.error("Failed to parse quiz JSON:", e)
    console.error("Raw response:", response)
    return []
  }
}

// ==================== ANALYZE LEARNING PATTERNS ====================
export interface LearningAnalysis {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  predictedImprovement: number // percentage
  optimalStudyTimes: string[]
}

export async function analyzeLearningPatterns(
  userHistory: {
    subject: string
    score: number
    timeSpent: number
    date: Date
  }[]
): Promise<LearningAnalysis> {
  const historyStr = userHistory.map(h => 
    `${h.subject}: ${h.score}% in ${h.timeSpent}min on ${h.date.toDateString()}`
  ).join('\n')

  const prompt = `Analyze this learning history and provide insights:

${historyStr}

Return a JSON object with:
{
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1"],
  "recommendations": ["Recommendation 1"],
  "predictedImprovement": 15,
  "optimalStudyTimes": ["Morning 9-11 AM", "Evening 7-9 PM"]
}

Focus on patterns, time management, and subject-specific advice.`

  const response = await chat([{
    role: "user",
    content: prompt
  }], { temperature: 0.2, maxTokens: 2048 })

  try {
    // Clean the response by removing markdown code blocks and backticks
    let cleanResponse = response.trim()
    
    // Remove markdown code block markers
    cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    
    // Remove any remaining backticks
    cleanResponse = cleanResponse.replace(/`/g, '')
    
    // Try to find JSON object if response contains extra text
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanResponse = jsonMatch[0]
    }
    
    return JSON.parse(cleanResponse)
  } catch (e) {
    console.error("Failed to parse analysis JSON:", e)
    console.error("Raw response:", response)
    return {
      strengths: [],
      weaknesses: [],
      recommendations: [],
      predictedImprovement: 0,
      optimalStudyTimes: []
    }
  }
}

// ==================== GENERATE PERSONALIZED CONTENT ====================
export async function generatePersonalizedContent(
  userProfile: {
    learningStyle: "visual" | "auditory" | "kinesthetic" | "reading"
    goals: string[]
    currentLevel: string
    preferredSubjects: string[]
  },
  topic: string,
  contentType: "summary" | "examples" | "practice" | "explanation"
): Promise<string> {
  const stylePrompts = {
    visual: "Include diagrams, charts, and visual analogies",
    auditory: "Use storytelling and audio-friendly explanations",
    kinesthetic: "Include hands-on examples and practical applications",
    reading: "Provide detailed written explanations with references"
  }

  const typePrompts = {
    summary: "Create a concise summary",
    examples: "Provide practical examples and case studies",
    practice: "Generate practice problems and exercises",
    explanation: "Explain the concept in depth"
  }

  const prompt = `Create ${contentType} content for "${topic}" tailored to:
- Learning style: ${userProfile.learningStyle} (${stylePrompts[userProfile.learningStyle]})
- Goals: ${userProfile.goals.join(", ")}
- Current level: ${userProfile.currentLevel}
- Preferred subjects: ${userProfile.preferredSubjects.join(", ")}

${typePrompts[contentType]}

Make it engaging, personalized, and effective for this learner.`

  return chat([{
    role: "user",
    content: prompt
  }], { temperature: 0.6, maxTokens: 3072 })
}
