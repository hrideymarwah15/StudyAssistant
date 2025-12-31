"use client"

import { chat, generateFlashcards, generateQuiz, summarizeContent, explainConcept, Message } from "./ai-client"
import { getMaterials } from "./firestore"

// ==================== INTENT DETECTION ====================
export type Intent =
  | "create_flashcards"
  | "quiz_me"
  | "explain"
  | "summarize"
  | "navigate"
  | "add_task"
  | "remember"
  | "search_materials"
  | "general_question"
  | "greeting"
  | "help"
  | "unknown"

export interface ParsedCommand {
  intent: Intent
  entities: {
    topic?: string
    count?: number
    difficulty?: "easy" | "medium" | "hard"
    destination?: string
    date?: string
    content?: string
    query?: string
  }
  originalText: string
  confidence: number
}

// Intent patterns for quick local detection
const intentPatterns: { intent: Intent; patterns: RegExp[] }[] = [
  {
    intent: "create_flashcards",
    patterns: [
      /create\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
      /make\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
      /generate\s+(\d+\s+)?flashcards?\s+(about|on|for)\s+(.+)/i,
      /flashcards?\s+(about|on|for)\s+(.+)/i
    ]
  },
  {
    intent: "quiz_me",
    patterns: [
      /quiz\s+me\s+(on|about)\s+(.+)/i,
      /test\s+me\s+(on|about)\s+(.+)/i,
      /ask\s+me\s+questions?\s+(about|on)\s+(.+)/i
    ]
  },
  {
    intent: "explain",
    patterns: [
      /explain\s+(.+)/i,
      /what\s+is\s+(.+)/i,
      /what\s+are\s+(.+)/i,
      /tell\s+me\s+about\s+(.+)/i,
      /how\s+does\s+(.+)\s+work/i
    ]
  },
  {
    intent: "summarize",
    patterns: [
      /summarize\s+(.+)/i,
      /summary\s+of\s+(.+)/i,
      /give\s+me\s+a\s+summary\s+of\s+(.+)/i
    ]
  },
  {
    intent: "navigate",
    patterns: [
      /go\s+to\s+(.+)/i,
      /open\s+(.+)/i,
      /show\s+me\s+(.+)/i,
      /take\s+me\s+to\s+(.+)/i
    ]
  },
  {
    intent: "add_task",
    patterns: [
      /add\s+task\s+(.+)/i,
      /create\s+task\s+(.+)/i,
      /remind\s+me\s+to\s+(.+)/i,
      /schedule\s+(.+)/i
    ]
  },
  {
    intent: "remember",
    patterns: [
      /remember\s+that\s+(.+)/i,
      /note\s+that\s+(.+)/i,
      /save\s+this:\s*(.+)/i,
      /keep\s+in\s+mind\s+(.+)/i
    ]
  },
  {
    intent: "search_materials",
    patterns: [
      /search\s+(for\s+)?(.+)\s+in\s+materials/i,
      /find\s+(.+)\s+in\s+my\s+(notes|materials)/i,
      /do\s+i\s+have\s+(notes|materials)\s+on\s+(.+)/i,
      /what\s+do\s+i\s+have\s+on\s+(.+)/i
    ]
  },
  {
    intent: "greeting",
    patterns: [
      /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy|yo)[\s!?.]*$/i
    ]
  },
  {
    intent: "help",
    patterns: [
      /^(help|what\s+can\s+you\s+do|commands|how\s+do\s+i)[\s?]*$/i,
      /show\s+(me\s+)?help/i
    ]
  }
]

// Page name mappings for navigation
const pageAliases: { [key: string]: string } = {
  "flashcards": "/flashcards",
  "flash cards": "/flashcards",
  "cards": "/flashcards",
  "materials": "/materials",
  "notes": "/materials",
  "documents": "/materials",
  "planner": "/planner",
  "schedule": "/planner",
  "calendar": "/planner",
  "tasks": "/planner",
  "groups": "/groups",
  "study groups": "/groups",
  "support": "/support",
  "help": "/support",
  "home": "/",
  "dashboard": "/",
  "settings": "/settings"
}

// Parse user input into a command
export function parseCommand(input: string): ParsedCommand {
  const trimmedInput = input.trim()
  
  // Check each intent pattern
  for (const { intent, patterns } of intentPatterns) {
    for (const pattern of patterns) {
      const match = trimmedInput.match(pattern)
      if (match) {
        const entities = extractEntities(intent, match, trimmedInput)
        return {
          intent,
          entities,
          originalText: trimmedInput,
          confidence: 0.9
        }
      }
    }
  }

  // Default to general question if no pattern matches
  return {
    intent: "general_question",
    entities: { query: trimmedInput },
    originalText: trimmedInput,
    confidence: 0.5
  }
}

// Extract entities from matched patterns
function extractEntities(
  intent: Intent,
  match: RegExpMatchArray,
  originalText: string
): ParsedCommand["entities"] {
  const entities: ParsedCommand["entities"] = {}

  switch (intent) {
    case "create_flashcards": {
      // Extract count if present
      const countMatch = originalText.match(/(\d+)\s+flashcards?/i)
      if (countMatch) {
        entities.count = parseInt(countMatch[1])
      }
      // Extract topic - last captured group
      entities.topic = match[match.length - 1]?.trim()
      // Extract difficulty
      const diffMatch = originalText.match(/(easy|medium|hard)/i)
      if (diffMatch) {
        entities.difficulty = diffMatch[1].toLowerCase() as "easy" | "medium" | "hard"
      }
      break
    }
    case "quiz_me":
      entities.topic = match[match.length - 1]?.trim()
      break
    case "explain":
      entities.topic = match[1]?.trim()
      break
    case "summarize":
      entities.content = match[1]?.trim()
      break
    case "navigate": {
      const destination = match[1]?.toLowerCase().trim()
      entities.destination = pageAliases[destination] || destination
      break
    }
    case "add_task":
      entities.content = match[1]?.trim()
      break
    case "remember":
      entities.content = match[1]?.trim()
      break
    case "search_materials":
      entities.query = match[match.length - 1]?.trim()
      break
  }

  return entities
}

// ==================== COMMAND EXECUTION ====================
export interface AssistantContext {
  userId?: string
  currentPage?: string
  conversationHistory?: Message[]
  userMaterials?: Array<{ id: string; title: string; subject?: string }>
  userDecks?: Array<{ id: string; name: string }>
}

export interface CommandResult {
  success: boolean
  message: string
  action?: {
    type: "navigate" | "show_flashcards" | "show_quiz" | "speak" | "add_memory" | "none"
    data?: any
  }
  followUp?: string
}

export async function executeCommand(
  command: ParsedCommand,
  context: AssistantContext
): Promise<CommandResult> {
  switch (command.intent) {
    case "greeting":
      return {
        success: true,
        message: getGreeting(),
        action: { type: "speak" }
      }

    case "help":
      return {
        success: true,
        message: getHelpMessage(),
        action: { type: "none" }
      }

    case "navigate":
      if (command.entities.destination) {
        return {
          success: true,
          message: `Taking you to ${command.entities.destination}...`,
          action: {
            type: "navigate",
            data: { path: command.entities.destination }
          }
        }
      }
      return {
        success: false,
        message: "I didn't catch where you want to go. Try saying 'go to flashcards' or 'open planner'."
      }

    case "create_flashcards":
      if (command.entities.topic && context.userId) {
        try {
          const count = command.entities.count || 5
          const difficulty = command.entities.difficulty || "medium"
          
          // Try to find relevant materials for the topic
          const userMaterials = await getMaterials(context.userId)
          const relevantMaterials = userMaterials.filter(m => 
            m.title?.toLowerCase().includes(command.entities.topic!.toLowerCase()) ||
            m.subject?.toLowerCase().includes(command.entities.topic!.toLowerCase()) ||
            m.content?.toLowerCase().includes(command.entities.topic!.toLowerCase())
          )
          
          let content = ""
          let topic = command.entities.topic
          
          if (relevantMaterials.length > 0) {
            // Use the most relevant material's content
            const bestMatch = relevantMaterials[0]
            content = bestMatch.content || ""
            topic = bestMatch.title || bestMatch.subject || command.entities.topic
          }
          
          const flashcards = await generateFlashcards(
            content,
            topic,
            count,
            difficulty
          )
          return {
            success: true,
            message: relevantMaterials.length > 0 
              ? `I've created ${flashcards.length} flashcards about "${topic}" using your study materials.`
              : `I've created ${flashcards.length} flashcards about "${command.entities.topic}".`,
            action: {
              type: "show_flashcards",
              data: { flashcards, topic: command.entities.topic }
            }
          }
        } catch (error: any) {
          return {
            success: false,
            message: `Sorry, I couldn't create flashcards: ${error.message}`
          }
        }
      }
      return {
        success: false,
        message: "What topic would you like flashcards about?"
      }

    case "quiz_me":
      if (command.entities.topic && context.userId) {
        try {
          // Try to find relevant materials for the topic
          const userMaterials = await getMaterials(context.userId)
          const relevantMaterials = userMaterials.filter(m => 
            m.title?.toLowerCase().includes(command.entities.topic!.toLowerCase()) ||
            m.subject?.toLowerCase().includes(command.entities.topic!.toLowerCase()) ||
            m.content?.toLowerCase().includes(command.entities.topic!.toLowerCase())
          )
          
          let content = ""
          let topic = command.entities.topic
          
          if (relevantMaterials.length > 0) {
            // Use the most relevant material's content
            const bestMatch = relevantMaterials[0]
            content = bestMatch.content || ""
            topic = bestMatch.title || bestMatch.subject || command.entities.topic
          }
          
          const quiz = await generateQuiz(content, topic, 5)
          return {
            success: true,
            message: relevantMaterials.length > 0 
              ? `Let's quiz you on "${topic}" using your study materials! I have ${quiz.length} questions ready.`
              : `Let's quiz you on "${command.entities.topic}"! I have ${quiz.length} questions ready.`,
            action: {
              type: "show_quiz",
              data: { quiz, topic: command.entities.topic }
            }
          }
        } catch (error: any) {
          return {
            success: false,
            message: `Sorry, I couldn't create a quiz: ${error.message}`
          }
        }
      }
      return {
        success: false,
        message: "What topic would you like me to quiz you on?"
      }

    case "explain":
      if (command.entities.topic) {
        try {
          const explanation = await explainConcept(command.entities.topic)
          return {
            success: true,
            message: explanation,
            action: { type: "speak" }
          }
        } catch (error: any) {
          return {
            success: false,
            message: `Sorry, I couldn't explain that: ${error.message}`
          }
        }
      }
      return {
        success: false,
        message: "What would you like me to explain?"
      }

    case "summarize":
      if (command.entities.content) {
        try {
          const summary = await summarizeContent(command.entities.content)
          return {
            success: true,
            message: summary,
            action: { type: "speak" }
          }
        } catch (error: any) {
          return {
            success: false,
            message: `Sorry, I couldn't summarize that: ${error.message}`
          }
        }
      }
      return {
        success: false,
        message: "What would you like me to summarize?"
      }

    case "remember":
      if (command.entities.content) {
        return {
          success: true,
          message: `Got it! I'll remember: "${command.entities.content}"`,
          action: {
            type: "add_memory",
            data: { content: command.entities.content, category: "note" }
          }
        }
      }
      return {
        success: false,
        message: "What would you like me to remember?"
      }

    case "search_materials":
      if (command.entities.query && context.userMaterials) {
        const matches = context.userMaterials.filter(m =>
          m.title.toLowerCase().includes(command.entities.query!.toLowerCase()) ||
          m.subject?.toLowerCase().includes(command.entities.query!.toLowerCase())
        )
        if (matches.length > 0) {
          return {
            success: true,
            message: `I found ${matches.length} material(s) related to "${command.entities.query}": ${matches.map(m => m.title).join(", ")}`
          }
        }
        return {
          success: true,
          message: `I didn't find any materials about "${command.entities.query}" in your library.`
        }
      }
      return {
        success: false,
        message: "What are you looking for in your materials?"
      }

    case "add_task":
      return {
        success: true,
        message: `I'll add "${command.entities.content}" to your planner. You can refine it there.`,
        action: {
          type: "navigate",
          data: { path: "/planner", prefill: command.entities.content }
        }
      }

    case "general_question":
    default:
      try {
        const response = await chat([
          { role: "user", content: command.originalText }
        ], {
          systemPrompt: `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant for students. 
Speak in a polite, sophisticated manner like the AI assistant from Iron Man - helpful, slightly witty, and professional.
Be concise and educational. Use phrases like "Certainly, sir/madam", "Right away", "I've analyzed...", "May I suggest..."
${context.currentPage ? `User is currently viewing: ${context.currentPage}` : ""}
${context.userMaterials?.length ? `User's study materials include: ${context.userMaterials.map(m => m.title).join(", ")}` : ""}`
        })
        return {
          success: true,
          message: response,
          action: { type: "speak" }
        }
      } catch (error: any) {
        return {
          success: false,
          message: "I apologize, but I'm experiencing a temporary disruption. Shall I try again?"
        }
      }
  }
}

// ==================== HELPERS ====================
function getGreeting(): string {
  const hour = new Date().getHours()
  let timeGreeting = "Good day"
  if (hour < 12) timeGreeting = "Good morning"
  else if (hour < 17) timeGreeting = "Good afternoon"
  else timeGreeting = "Good evening"
  
  const greetings = [
    `${timeGreeting}. JARVIS at your service. How may I assist with your studies today?`,
    `${timeGreeting}. All systems operational. What shall we work on?`,
    `${timeGreeting}. I'm ready to help optimize your learning experience.`
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

function getHelpMessage(): string {
  return `Certainly. Here are my capabilities:

📚 **Flashcard Generation**: "Create 10 flashcards about photosynthesis"
🧠 **Knowledge Testing**: "Quiz me on World War 2"
💡 **Concept Explanation**: "Explain quantum entanglement"
📝 **Content Summarization**: "Summarize [paste content]"
📍 **App Navigation**: "Go to planner" or "Open materials"
✅ **Task Management**: "Add task: Study for math exam"
🔖 **Memory Storage**: "Remember that the test is on Friday"
🔍 **Material Search**: "What do I have on biology?"

Simply state your request naturally, and I shall endeavor to assist.`
}

// Quick action suggestions based on context
export function getSuggestedActions(context: AssistantContext): string[] {
  const suggestions: string[] = []
  
  switch (context.currentPage) {
    case "flashcards":
      suggestions.push("Create flashcards about...")
      suggestions.push("Quiz me on my decks")
      break
    case "materials":
      suggestions.push("Summarize my notes")
      suggestions.push("Create flashcards from materials")
      break
    case "planner":
      suggestions.push("What's due this week?")
      suggestions.push("Add a study task")
      break
    default:
      suggestions.push("Create flashcards")
      suggestions.push("Quiz me")
      suggestions.push("Explain a concept")
  }
  
  return suggestions
}
