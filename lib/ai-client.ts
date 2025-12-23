"use client"

// Unified AI Client - Uses Groq (free tier) with Gemini fallback
// Groq: 14,400 requests/day free, fastest inference
// Gemini: 15 RPM / 1M tokens/day free

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || ""
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""

// Models
const GROQ_MODEL = "llama-3.1-70b-versatile" // Fast, high quality
const GEMINI_MODEL = "gemini-2.0-flash"

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
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  } else {
    const arrayMatch = response.match(/\[[\s\S]*\]/)
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

// ==================== QUIZ GENERATION ====================
export async function generateQuiz(
  topic: string,
  questionCount: number = 5,
  questionTypes: ("multiple-choice" | "true-false" | "short-answer")[] = ["multiple-choice"]
): Promise<Array<{
  question: string
  type: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}>> {
  const systemPrompt = "You are an expert quiz creator. Return ONLY valid JSON."

  const userPrompt = `Create a ${questionCount}-question quiz about "${topic}".
Question types: ${questionTypes.join(", ")}

Return JSON array:
[{
  "question": "Question text?",
  "type": "multiple-choice|true-false|short-answer",
  "options": ["A", "B", "C", "D"], // only for multiple-choice
  "correctAnswer": "The correct answer",
  "explanation": "Brief explanation"
}]`

  const response = await chat(
    [{ role: "user", content: userPrompt }],
    { systemPrompt, temperature: 0.7, maxTokens: 4096 }
  )

  let jsonStr = response
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1].trim()
  else {
    const arrayMatch = response.match(/\[[\s\S]*\]/)
    if (arrayMatch) jsonStr = arrayMatch[0]
  }

  return JSON.parse(jsonStr)
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
