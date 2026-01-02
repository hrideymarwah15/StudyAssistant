"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "./auth-provider"
import { useVoiceInput, speak, stopSpeaking, isSpeechRecognitionSupported } from "@/lib/voice"
import { parseCommand, executeCommand, getSuggestedActions, AssistantContext, CommandResult } from "@/lib/assistant"
import { getCommandParser, ParsedCommand, CommandContext } from "@/lib/jarvis/commandParser"
import { getCommandExecutor } from "@/lib/jarvis/commandExecutor"
import { Message } from "@/lib/ai-client"
import { 
  addMemory, 
  getMaterials,
  getFlashcardDecks,
  createFlashcardDeck,
  addFlashcard,
  type FlashcardDeck,
  type Task,
  type Course,
  type Habit,
  type DailyStats
} from "@/lib/firestore"
import { 
  askAI, 
  generateFlashcards, 
  createStudyPlan, 
  isBackendAvailable, 
  intelligentAsk,
  type AskResponse,
  type IntelligentAskResponse,
  type AIMode,
  type UserStudyContext,
  type ProactiveSuggestion
} from "@/lib/api"
import { BookOpen, Target, Lightbulb, Navigation, Wifi, WifiOff, Zap, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: CommandResult["action"]
  mode?: AIMode // Track which AI mode generated this
  isIntervention?: boolean // Whether this was an intervention
}

interface JarvisAssistantProps {
  context?: {
    currentPage?: string
    todayTasks?: Task[]
    courses?: Course[]
    habits?: Habit[]
    dailyStats?: DailyStats
    flashcardsDue?: number
  }
}

export function JarvisAssistant({ context }: JarvisAssistantProps = {}) {
  const { user } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [userContext, setUserContext] = useState<AssistantContext>({
    currentPage: context?.currentPage || pathname,
    conversationHistory: [],
    userMaterials: [],
    userDecks: []
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const [showWaveform, setShowWaveform] = useState(false)
  const [userDecks, setUserDecks] = useState<FlashcardDeck[]>([])
  const [isVoiceNotesMode, setIsVoiceNotesMode] = useState(false)
  const [voiceNotes, setVoiceNotes] = useState<string>("")
  const [speakOnlyIntro, setSpeakOnlyIntro] = useState(false)
  const [globalVoiceActive, setGlobalVoiceActive] = useState(false)
  const [backendOnline, setBackendOnline] = useState(false)
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([])
  const [pendingIntervention, setPendingIntervention] = useState<{message: string; originalRequest: string} | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check backend status on mount
  useEffect(() => {
    const checkBackend = async () => {
      const online = await isBackendAvailable()
      setBackendOnline(online)
    }
    checkBackend()
    // Check every 30 seconds
    const interval = setInterval(checkBackend, 30000)
    return () => clearInterval(interval)
  }, [])

  // Voice input hook
  const { state: voiceState, startListening, stopListening, resetTranscript } = useVoiceInput({
    continuous: true, // Changed to continuous for notes
    onResult: (transcript, isFinal) => {
      if (isVoiceNotesMode) {
        setVoiceNotes(prev => prev + (isFinal ? transcript : ""))
        if (isFinal) {
          addAssistantMessage(`Voice note added: "${transcript}"`)
        }
      } else {
        if (isFinal && transcript.trim()) {
          setInputValue(transcript.trim())
          handleSubmit(transcript.trim())
        }
      }
    },
    onError: (error) => {
      addAssistantMessage(`Voice recognition error: ${error}`)
    }
  })

  // Load user context
  useEffect(() => {
    async function loadContext() {
      if (!user) return
      
      try {
        const [materials, decks] = await Promise.all([
          getMaterials(user.uid),
          getFlashcardDecks(user.uid)
        ])
        
        setUserDecks(decks)
        setUserContext({
          userId: user.uid,
          currentPage: pathname,
          userMaterials: materials.map(m => ({ id: m.id, title: m.title, subject: m.subject })),
          userDecks: decks.map(d => ({ id: d.id, name: d.name }))
        })
      } catch (error) {
        console.error("Error loading context:", error)
      }
    }
    
    loadContext()
  }, [user, pathname])

  useEffect(() => {
    setUserContext(prev => ({ ...prev, currentPage: pathname }))
  }, [pathname])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Global voice activation for "gemini"
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) return

    let globalRecognition: any = null

    const startGlobalListening = () => {
      if (globalRecognition) return

      globalRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
      globalRecognition.continuous = true
      globalRecognition.interimResults = false
      globalRecognition.lang = "en-US"

      globalRecognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
        
        if (transcript.includes("gemini") || transcript.includes("jarvis") || transcript.includes("hey jarvis")) {
          setIsOpen(true)
          setGlobalVoiceActive(true)
          globalRecognition.stop()
          
          // Start the main voice input
          setTimeout(() => {
            startListening()
            setShowWaveform(true)
          }, 500)
        }
      }

      globalRecognition.onend = () => {
        setGlobalVoiceActive(false)
        // Restart global listening if not activated
        setTimeout(startGlobalListening, 1000)
      }

      globalRecognition.start()
    }

    if (!isOpen) {
      startGlobalListening()
    }

    return () => {
      if (globalRecognition) {
        globalRecognition.stop()
      }
    }
  }, [isOpen, startListening])

  // Stop speaking when component unmounts or closes
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking()
    }
  }, [isOpen])

  // Generate disciplined contextual greeting (Study Intelligence System)
  const getContextualGreeting = () => {
    const studyContext = buildStudyContext()
    const hour = new Date().getHours()
    
    // Concise status line
    const statusParts: string[] = []
    if ((studyContext.focus_minutes_today || 0) > 0) {
      statusParts.push(`${studyContext.focus_minutes_today}m focused`)
    }
    if ((studyContext.streak_days || 0) > 0) {
      statusParts.push(`${studyContext.streak_days} day streak`)
    }
    const statusLine = statusParts.length > 0 ? `📊 ${statusParts.join(" • ")}` : ""
    
    // Backend status (compact)
    const backendNote = backendOnline 
      ? "🟢 AI online"
      : "🟡 Offline mode"
    
    // Single most important action
    let action = ""
    const focusMinutes = studyContext.focus_minutes_today || 0
    const overdue = studyContext.overdue_tasks || 0
    const urgent = studyContext.urgent_task_count || 0
    const flashcards = studyContext.flashcards_due || 0
    const streak = studyContext.streak_days || 0
    
    if (overdue > 0) {
      action = `⚠️ ${overdue} overdue task${overdue > 1 ? 's' : ''}. Let's catch up.`
    } else if (urgent > 0 && focusMinutes === 0) {
      action = `🎯 ${urgent} urgent task${urgent > 1 ? 's' : ''}. Start a focus session?`
    } else if (studyContext.days_until_exam && studyContext.days_until_exam <= 7) {
      action = `📅 ${studyContext.days_until_exam} day${studyContext.days_until_exam > 1 ? 's' : ''} until exam. Need a revision plan?`
    } else if (flashcards > 10) {
      action = `🃏 ${flashcards} flashcards due. Review them now?`
    } else if (hour >= 20 && focusMinutes === 0 && streak > 0) {
      action = `🔥 Your streak is at risk. 15 minutes will save it.`
    } else if (focusMinutes === 0 && hour >= 8 && hour <= 22) {
      action = "Ready to start a focus session?"
    } else {
      action = "What should we work on?"
    }
    
    return `${backendNote}${statusLine ? ` • ${statusLine}` : ""}\n\n${action}`
  }

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true)
      // Jarvis greeting with contextual awareness
      setTimeout(() => {
        addAssistantMessage(getContextualGreeting())
      }, 500)
    }
  }, [isOpen, isInitialized, context])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Update waveform state based on voice
  useEffect(() => {
    setShowWaveform(voiceState.isListening)
  }, [voiceState.isListening])

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "morning"
    if (hour < 17) return "afternoon"
    return "evening"
  }

  const addAssistantMessage = useCallback((content: string, action?: CommandResult["action"]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, message])
    
    // Determine what to speak
    let speakText = content
    if (speakOnlyIntro) {
      // Extract introduction/summary (first sentence or first 100 characters)
      const firstSentence = content.split(/[.!?]/)[0]
      if (firstSentence && firstSentence.length > 10) {
        speakText = firstSentence + (firstSentence.length < content.length ? "..." : "")
      } else {
        // Fallback to first 100 characters
        speakText = content.length > 100 ? content.substring(0, 100) + "..." : content
      }
    }
    
    // Speak the response (softer, more natural voice)
    try {
      speak(speakText, { rate: 1.0, pitch: 1.0, volume: 0.7 }).catch(() => {})
    } catch {}
    
    return message
  }, [speakOnlyIntro])

  // Build study context for intelligent AI
  const buildStudyContext = useCallback((): UserStudyContext => {
    const today = new Date().toISOString().split('T')[0]
    
    // Calculate habits completed today
    let habitsCompletedToday = 0
    let totalHabitsToday = context?.habits?.length || 0
    context?.habits?.forEach(h => {
      const todayCompletion = h.completions?.find((c: { date: string; completed: boolean }) => c.date === today)
      if (todayCompletion?.completed) habitsCompletedToday++
    })
    
    // Calculate task metrics
    let urgentTaskCount = 0
    let overdueTasks = 0
    const now = new Date()
    context?.todayTasks?.forEach(t => {
      if (t.status === 'done') return
      if (t.priority === 'urgent') urgentTaskCount++
      if (t.dueDate) {
        const dueDate = (t.dueDate as any).toDate ? (t.dueDate as any).toDate() : new Date(t.dueDate)
        if (dueDate < now) overdueTasks++
      }
    })
    
    // Find nearest exam
    let daysUntilExam: number | undefined
    let currentCourse: string | undefined
    context?.courses?.forEach(c => {
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
      focus_minutes_today: context?.dailyStats?.totalStudyMinutes || 0,
      target_focus_minutes: 120,
      habits_completed_today: habitsCompletedToday,
      total_habits_today: totalHabitsToday,
      flashcards_due: context?.flashcardsDue || 0,
      streak_days: context?.dailyStats?.streakDay || 0,
      urgent_task_count: urgentTaskCount,
      overdue_tasks: overdueTasks,
      current_course: currentCourse,
      days_until_exam: daysUntilExam,
      recent_failures: []
    }
  }, [context])

  const handleSubmit = async (text?: string, skipIntervention: boolean = false) => {
    const messageText = (text || inputValue).trim()
    if (!messageText || isProcessing) return

    setInputValue("")
    setIsProcessing(true)
    stopSpeaking()
    setPendingIntervention(null)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // ==================== INTELLIGENT AI SYSTEM ====================
      // Try to use the new intelligent AI endpoint if backend is online
      if (backendOnline) {
        try {
          const studyContext = buildStudyContext()
          
          // Call intelligent AI endpoint
          const result = await intelligentAsk({
            message: messageText,
            context: studyContext,
            use_memory: true,
            skip_intervention: skipIntervention
          })
          
          // Handle intervention
          if (result.intervention?.should_intervene && !skipIntervention) {
            // Store the intervention and original request
            setPendingIntervention({
              message: result.intervention.message,
              originalRequest: messageText
            })
            
            // Add intervention message
            const interventionMessage: ChatMessage = {
              id: Date.now().toString(),
              role: "assistant",
              content: result.answer,
              timestamp: new Date(),
              mode: result.mode,
              isIntervention: true
            }
            setMessages(prev => [...prev, interventionMessage])
            
            // Speak the intervention
            try {
              speak(result.answer, { rate: 1.0, pitch: 1.0, volume: 0.7 }).catch(() => {})
            } catch {}
            
            // Update proactive suggestions
            if (result.suggestions) {
              setProactiveSuggestions(result.suggestions)
            }
            
            setIsProcessing(false)
            return
          }
          
          // Format response based on mode
          let formattedResponse = result.answer
          
          // Add memory quality indicator
          if (result.memory_used) {
            if (result.memory_quality === "strong") {
              formattedResponse += `\n\n💡 _Based on ${result.chunks_used} source${result.chunks_used > 1 ? 's' : ''} from your materials_`
            } else if (result.memory_quality === "weak") {
              formattedResponse += `\n\n⚠️ _Limited material found on this topic. Consider adding more notes._`
            }
          }
          
          // Add mode badge
          const modeBadges: Record<AIMode, string> = {
            plan: "📋",
            explain: "💡",
            quiz: "📝",
            flashcards: "🃏",
            review: "📖",
            coach: "🎯"
          }
          
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: formattedResponse,
            timestamp: new Date(),
            mode: result.mode
          }
          setMessages(prev => [...prev, assistantMessage])
          
          // Speak the response
          const firstSentence = result.answer.split(/[.!?]/)[0]
          const speakText = speakOnlyIntro && firstSentence.length > 10 
            ? firstSentence + "..." 
            : result.answer.length > 150 
              ? result.answer.substring(0, 150) + "..." 
              : result.answer
          try {
            speak(speakText, { rate: 1.0, pitch: 1.0, volume: 0.7 }).catch(() => {})
          } catch {}
          
          // Handle structured output for flashcards mode
          if (result.mode === "flashcards" && result.structured_output && Array.isArray(result.structured_output)) {
            toast.success(`Created ${result.structured_output.length} flashcards!`)
          }
          
          // Update proactive suggestions
          if (result.suggestions) {
            setProactiveSuggestions(result.suggestions)
          }
          
          setIsProcessing(false)
          return
          
        } catch (error: any) {
          console.warn("Intelligent AI failed, falling back to legacy:", error)
          // Fall through to legacy processing
        }
      }

      // ==================== LEGACY FALLBACK ====================
      const lowerMessage = messageText.toLowerCase()
      
      const isFlashcardRequest = lowerMessage.includes("flashcard") || 
                                  lowerMessage.includes("flash card")

      const isStudyPlanRequest = lowerMessage.includes("study plan") || 
                                  lowerMessage.includes("learning plan") ||
                                  lowerMessage.includes("create a plan")

      // Try legacy backend endpoints
      if (backendOnline) {
        try {
          if (isFlashcardRequest) {
            const topic = messageText.replace(/flashcard|flash card|create|generate|make|for|about|on/gi, "").trim() || "general knowledge"
            
            toast.loading("Generating flashcards...", { id: "flashcards" })
            const result = await generateFlashcards({
              topic,
              num_cards: 5,
              use_memory: true
            })
            toast.success(`Created ${result.count} flashcards!`, { id: "flashcards" })
            
            addAssistantMessage(`🃏 Created ${result.count} flashcards on "${topic}".\n\nPreview:\n${result.flashcards.slice(0, 2).map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}${result.count > 2 ? `\n\n...and ${result.count - 2} more.` : ""}`, {
              type: "navigate",
              data: { path: "/flashcards" }
            })
            return
          } else if (isStudyPlanRequest) {
            const subject = messageText.replace(/study plan|learning plan|create|a|plan|for|about|on/gi, "").trim() || "general studies"
            
            toast.loading("Creating study plan...", { id: "studyplan" })
            const result = await createStudyPlan({
              subject,
              days: 7,
              retrieve_materials: true
            })
            toast.success("Plan created!", { id: "studyplan" })
            
            addAssistantMessage(`📋 ${result.days}-day plan for ${result.subject}:\n\n${result.plan}${result.materials_used > 0 ? `\n\n_Used ${result.materials_used} of your materials._` : ""}`)
            return
          } else {
            // General AI question
            const result = await askAI({
              question: messageText,
              use_memory: true,
              top_k: 5
            })
            
            let response = result.answer
            if (result.context_used && result.sources_count > 0) {
              response += `\n\n💡 _Based on ${result.sources_count} source${result.sources_count > 1 ? 's' : ''} from your materials_`
            }
            
            addAssistantMessage(response)
            return
          }
        } catch (error: any) {
          console.error("Backend AI error:", error)
          toast.dismiss("ai-thinking")
          toast.dismiss("flashcards")
          toast.dismiss("studyplan")
        }
      }

      // ==================== LOCAL COMMAND PROCESSING ====================
      const commandParser = getCommandParser()
      const commandExecutor = getCommandExecutor()

      const commandContext: CommandContext = {
        userId: user?.uid || '',
        currentPage: pathname,
        recentActions: [],
        userPreferences: {},
        availableData: {
          tasks: context?.todayTasks,
          courses: context?.courses,
          habits: context?.habits
        }
      }

      const parsedCommand = commandParser.parseCommand(messageText, commandContext)
      const result = await commandExecutor.executeCommand(parsedCommand, commandContext)

      addAssistantMessage(result.message)

      if (result.data?.path) {
        setTimeout(() => router.push(result.data.path), 1000)
      }

    } catch (error: any) {
      addAssistantMessage(`Error: ${error.message}. Try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle continuing after intervention
  const handleContinueAnyway = () => {
    if (pendingIntervention) {
      handleSubmit(pendingIntervention.originalRequest, true)
      setPendingIntervention(null)
    }
  }

  const handleVoiceToggle = () => {
    if (voiceState.isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }

  const clearChat = () => {
    setMessages([])
    setPendingIntervention(null)
    addAssistantMessage("Ready. What should we work on?")
  }

  const suggestions = getSuggestedActions(userContext)

  if (!user) return null

  return (
    <>
      {/* Compact floating trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-300 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI Coach"
      >
        <div className="relative flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 border border-slate-700 shadow-lg hover:bg-slate-700 transition-all">
          {/* Status dot */}
          <div className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className="text-sm font-medium text-white">Ask AI</span>
        </div>
      </button>

      {/* Main JARVIS Panel */}
      <div
        className={`fixed z-50 transition-all duration-500 ease-out ${
          isFullscreen 
            ? "inset-4" 
            : "bottom-6 right-6 w-[420px] max-w-[calc(100vw-3rem)]"
        } ${
          isOpen 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        }`}
      >
        <div className={`relative h-full ${isFullscreen ? "" : "max-h-[600px]"} bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-2xl overflow-hidden flex flex-col`}>
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 animate-shimmer" />
          </div>

          {/* Enhanced Header */}
          <div className="relative px-5 py-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* JARVIS Logo */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full bg-blue-300/80 ${isProcessing ? "animate-pulse" : ""}`}>
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-white/60 to-transparent" />
                    </div>
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-blue-600 text-sm">AI Coach</h3>
                  <p className="text-[10px] text-slate-500">
                    {backendOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Backend status indicator */}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${backendOnline ? "bg-green-50 border border-green-200/50" : "bg-amber-50 border border-amber-200/50"}`}>
                  {backendOnline ? (
                    <Wifi className="w-3 h-3 text-green-500" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-amber-500" />
                  )}
                  <span className={`text-[10px] font-mono ${backendOnline ? "text-green-600" : "text-amber-600"}`}>
                    {backendOnline ? "AI ONLINE" : "LOCAL MODE"}
                  </span>
                </div>

                {/* Fullscreen toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>

                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                  title="Close JARVIS"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Voice instruction */}
            <div className="mt-2 text-xs text-slate-500 px-3 py-1.5 bg-slate-50/50 rounded-lg">
              Ask me anything • Create flashcards • Get study help
            </div>
          </div>

          {/* Context indicator - more compact */}
          <div className="px-4 py-2 border-b border-gray-200/50 bg-slate-50/30">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Context:</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px]">
                {userContext.currentPage || 'dashboard'}
              </span>
              {context?.todayTasks && context.todayTasks.length > 0 && (
                <span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px]">
                  {context.todayTasks.length} tasks
                </span>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isFullscreen ? "max-h-none" : "max-h-80"}`}>
            {/* Decorative elements */}
            <div className="absolute top-20 left-4 w-px h-8 bg-gradient-to-b from-blue-400/30 to-transparent" />
            <div className="absolute top-20 right-4 w-px h-8 bg-gradient-to-b from-blue-400/30 to-transparent" />

            {messages.length === 0 && (
              <div className="space-y-4">
                {/* Proactive Suggestions - Study Intelligence System */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide">What's Next</h4>
                  
                  {/* Dynamic suggestions from AI or computed locally */}
                  <div className="space-y-2">
                    {proactiveSuggestions.length > 0 ? (
                      // Use suggestions from intelligent AI system
                      proactiveSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => handleSubmit(suggestion.action)}
                          className={`w-full p-3 text-left rounded-lg border transition-all group ${
                            suggestion.priority === 'urgent' 
                              ? 'bg-red-50 hover:bg-red-100 border-red-200/50' 
                              : suggestion.priority === 'high'
                                ? 'bg-amber-50 hover:bg-amber-100 border-amber-200/50'
                                : 'bg-blue-50 hover:bg-blue-100 border-blue-200/50'
                          }`}
                        >
                          <p className={`text-sm font-medium ${
                            suggestion.priority === 'urgent' 
                              ? 'text-red-700' 
                              : suggestion.priority === 'high'
                                ? 'text-amber-700'
                                : 'text-slate-700'
                          }`}>
                            {suggestion.icon} {suggestion.message}
                          </p>
                        </button>
                      ))
                    ) : (
                      // Fallback local suggestions
                      <>
                        {context?.todayTasks && context.todayTasks.some(t => t.priority === 'urgent' || t.priority === 'high') ? (
                          <button
                            onClick={() => handleSubmit("Help me prioritize my tasks and start a focus session")}
                            className="w-full p-3 bg-amber-50 hover:bg-amber-100 text-left rounded-lg border border-amber-200/50 transition-all"
                          >
                            <p className="text-sm font-medium text-amber-700">
                              🎯 Start focus session on priority tasks
                            </p>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubmit("Help me plan my next study session")}
                            className="w-full p-3 bg-blue-50 hover:bg-blue-100 text-left rounded-lg border border-blue-200/50 transition-all"
                          >
                            <p className="text-sm text-slate-700">
                              📋 Plan next study session
                            </p>
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleSubmit("Generate flashcards from my recent notes")}
                          className="w-full p-3 bg-purple-50 hover:bg-purple-100 text-left rounded-lg border border-purple-200/50 transition-all"
                        >
                          <p className="text-sm text-slate-700">
                            🃏 Generate flashcards
                          </p>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Backend offline notice */}
                {!backendOnline && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/50 text-xs text-amber-700">
                    <p className="font-medium">AI features limited</p>
                    <p className="text-amber-600 mt-0.5">Start the backend to enable AI-powered planning & flashcard generation.</p>
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-sm"
                      : msg.isIntervention
                        ? "bg-amber-50 border border-amber-200 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"
                        : "bg-white/90 border border-gray-200/50 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"
                  } px-4 py-3 relative overflow-hidden`}
                >
                  {msg.role === "assistant" && (
                    <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${msg.isIntervention ? 'via-amber-400/50' : 'via-blue-400/30'} to-transparent`} />
                  )}
                  
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1">
                      {msg.isIntervention && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                      <span className={`text-[10px] font-mono ${msg.isIntervention ? 'text-amber-600' : 'text-blue-600'}`}>
                        {msg.isIntervention ? 'INTERVENTION' : msg.mode?.toUpperCase() || 'AI'}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {msg.action?.type === "show_flashcards" && msg.action.data?.flashcards && (
                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                      <p className="text-xs text-gray-600 font-mono">
                        {msg.action.data.flashcards.length} FLASHCARDS GENERATED
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Intervention continue button */}
            {pendingIntervention && !isProcessing && (
              <div className="flex justify-center">
                <button
                  onClick={handleContinueAnyway}
                  className="px-4 py-2 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                >
                  Continue with original request anyway →
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white/90 border border-gray-200/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-600">PROCESSING</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Notes Section */}
          {isVoiceNotesMode && (
            <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-mono text-blue-600">VOICE NOTES</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVoiceNotes("")}
                    className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    CLEAR
                  </button>
                  <button
                    onClick={() => setIsVoiceNotesMode(false)}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    EXIT
                  </button>
                </div>
              </div>
              <div className="bg-white/80 border border-gray-200/50 rounded-lg p-3 min-h-[100px] text-sm text-gray-800 whitespace-pre-wrap">
                {voiceNotes || "Start speaking to add voice notes..."}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="relative p-4 border-t border-gray-200/50 bg-gray-50/80">
            {/* Suggested Commands */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Suggested Commands</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const commandParser = getCommandParser()
                  const commandContext: CommandContext = {
                    userId: user?.uid || '',
                    currentPage: pathname,
                    availableData: {
                      tasks: context?.todayTasks,
                      courses: context?.courses,
                      habits: context?.habits
                    }
                  }
                  const suggestions = commandParser.getSuggestedCommands(commandContext)

                  return suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmit(suggestion)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))
                })()}
              </div>
            </div>

            {/* Voice listening indicator */}
            {voiceState.isListening && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-white border border-gray-300 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-700 font-mono">
                  {voiceState.interimTranscript || "LISTENING..."}
                </span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSubmit()
              }}
              className="flex items-center gap-3"
            >
              {/* Voice toggle button */}
              {isSpeechRecognitionSupported() && (
                <button
                  type="button"
                  onClick={() => {
                    if (isVoiceNotesMode) {
                      setIsVoiceNotesMode(false)
                    } else if (voiceState.isListening) {
                      stopListening()
                    } else {
                      setIsVoiceNotesMode(true)
                      startListening()
                      setShowWaveform(true)
                    }
                  }}
                  className={`relative p-3 rounded-xl transition-all ${
                    isVoiceNotesMode || voiceState.isListening
                      ? "bg-red-100 text-red-600 border border-red-300"
                      : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  }`}
                  title={isVoiceNotesMode ? "Exit Voice Notes Mode" : voiceState.isListening ? "Stop Listening" : "Start Voice Input"}
                >
                  {isVoiceNotesMode || voiceState.isListening ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 000 2h6a1 1 0 000-2H9z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Text input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Speak or type a command..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 font-mono shadow-sm"
                  disabled={isProcessing}
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 animate-shimmer" />
                </div>
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            {/* Footer info */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-gray-500 font-mono">
              <span>POWERED BY AI • {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </>
  )
}
