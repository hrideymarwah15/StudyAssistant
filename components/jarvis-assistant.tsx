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
import { BookOpen, Target, Lightbulb, Navigation } from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: CommandResult["action"]
}

interface JarvisAssistantProps {
  context?: {
    currentPage?: string
    todayTasks?: Task[]
    courses?: Course[]
    habits?: Habit[]
    dailyStats?: DailyStats
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true)
      // Jarvis greeting
      setTimeout(() => {
        addAssistantMessage("Good " + getTimeOfDay() + ", I'm JARVIS, your intelligent study assistant. How may I help you today?")
      }, 500)
    }
  }, [isOpen, isInitialized])

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

  const handleSubmit = async (text?: string) => {
    const messageText = (text || inputValue).trim()
    if (!messageText || isProcessing) return

    setInputValue("")
    setIsProcessing(true)
    stopSpeaking()

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Use new command parser and executor
      const commandParser = getCommandParser()
      const commandExecutor = getCommandExecutor()

      const commandContext: CommandContext = {
        userId: user?.uid || '',
        currentPage: pathname,
        recentActions: [], // Could be populated from message history
        userPreferences: {}, // Could be loaded from user settings
        availableData: {
          tasks: context?.todayTasks,
          courses: context?.courses,
          habits: context?.habits
        }
      }

      const parsedCommand = commandParser.parseCommand(messageText, commandContext)
      const result = await commandExecutor.executeCommand(parsedCommand, commandContext)

      addAssistantMessage(result.message)

      // Handle actions from new executor
      if (result.data) {
        // Handle navigation actions
        if (result.data.path) {
          setTimeout(() => {
            router.push(result.data.path)
          }, 1000)
        }

        // Handle task creation
        if (result.data.taskId && parsedCommand.intent === 'task.create') {
          // Could refresh tasks here
        }

        // Handle habit completion
        if (result.data.habitId && parsedCommand.intent === 'habit.complete') {
          // Could refresh habits here
        }
      }

      // Handle multi-step command continuation
      if (result.requiresUserInput) {
        // For now, just acknowledge - could be enhanced to handle follow-up questions
        addAssistantMessage("What would you like to do next?", {
          type: "none",
          data: { commandId: result.nextStep }
        })
      }
    } catch (error: any) {
      addAssistantMessage(`I apologize, but I encountered an error: ${error.message}`)
    } finally {
      setIsProcessing(false)
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
    addAssistantMessage("Memory cleared. How may I assist you?")
  }

  const suggestions = getSuggestedActions(userContext)

  if (!user) return null

  return (
    <>
      {/* Floating trigger orb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 group transition-all duration-500 ${
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open JARVIS"
      >
        <div className="relative">
          {/* Outer glow rings */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-400/20 animate-ping" />
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-blue-400/10 animate-pulse" />
          
          {/* Main orb */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 shadow-lg shadow-blue-500/30 flex items-center justify-center overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-300/50 to-transparent" />
            
            {/* Core */}
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-white via-blue-100 to-blue-200 shadow-inner flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/90 animate-pulse" />
            </div>
          </div>
          
          {/* Hover text */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
            JARVIS
          </span>
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
                  <h3 className="font-bold text-blue-600 tracking-wider font-mono text-sm">Study AI Assistant</h3>
                  <p className="text-[10px] text-blue-500 font-mono tracking-widest">J.A.R.V.I.S - Intelligent Study Companion</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-200/50">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-600 font-mono">
                    ACTIVE
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
            <div className="mt-3 text-xs text-blue-600 font-mono px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-200/30">
              💬 Ask me anything about your studies • 🎯 Get personalized help • 📚 Create study materials
            </div>
          </div>

          {/* Dynamic Context Chips */}
          <div className="px-5 py-3 border-b border-gray-200/50 bg-blue-50/30">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-blue-600 font-mono font-semibold">CONTEXT:</span>
              {userContext.currentPage && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200/50">
                  📍 {userContext.currentPage}
                </span>
              )}
              {context?.todayTasks && context.todayTasks.length > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200/50">
                  ✅ {context.todayTasks.length} tasks today
                </span>
              )}
              {context?.courses && context.courses.length > 0 && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200/50">
                  📚 {context.courses.length} courses
                </span>
              )}
              {context?.habits && context.habits.length > 0 && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium border border-orange-200/50">
                  🎯 {context.habits.length} habits
                </span>
              )}
              {(!userContext.currentPage && (!context?.todayTasks || context.todayTasks.length === 0) && (!context?.courses || context.courses.length === 0)) && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200/50">
                  🌟 Ready to help with your studies
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
              <div className="space-y-6">
                {/* Quick Action Pills - Organized by Category */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold">📝 CREATE STUDY MATERIALS</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSubmit(context?.courses?.length ? "Create flashcards for my courses" : "Create flashcards for today's topic")}
                        className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 transition-all hover:scale-105 border border-blue-200/50"
                      >
                        🃏 Flashcards
                      </button>
                      <button
                        onClick={() => handleSubmit(context?.todayTasks?.length ? "Generate a quiz for my today's tasks" : "Generate a quiz for what I learned today")}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-all hover:scale-105 border border-green-200/50"
                      >
                        ❓ Quiz Me
                      </button>
                      <button
                        onClick={() => handleSubmit("Create a study plan for this week")}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-all hover:scale-105 border border-purple-200/50"
                      >
                        📅 Study Plan
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold">🎯 GET HELP & EXPLANATIONS</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSubmit("Explain this concept simply")}
                        className="px-3 py-2 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-all hover:scale-105 border border-orange-200/50"
                      >
                        💡 Explain Concept
                      </button>
                      <button
                        onClick={() => handleSubmit("Help me understand this problem")}
                        className="px-3 py-2 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200 transition-all hover:scale-105 border border-red-200/50"
                      >
                        🤔 Problem Help
                      </button>
                      <button
                        onClick={() => handleSubmit("Give me study tips")}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-200 transition-all hover:scale-105 border border-indigo-200/50"
                      >
                        💪 Study Tips
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold">⚡ QUICK ACTIONS</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleSubmit(context?.todayTasks?.length ? "Start a 25-minute focus session on my first task" : "Start a 25-minute focus session")}
                        className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium hover:bg-emerald-200 transition-all hover:scale-105 border border-emerald-200/50"
                      >
                        ⏱️ Focus Timer
                      </button>
                      <button
                        onClick={() => handleSubmit("Review my progress this week")}
                        className="px-3 py-2 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium hover:bg-cyan-200 transition-all hover:scale-105 border border-cyan-200/50"
                      >
                        📊 Progress Review
                      </button>
                      <button
                        onClick={() => handleSubmit("What's my study streak?")}
                        className="px-3 py-2 bg-pink-100 text-pink-700 rounded-full text-xs font-medium hover:bg-pink-200 transition-all hover:scale-105 border border-pink-200/50"
                      >
                        🔥 Study Streak
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enhanced Capabilities Section */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/30">
                  <h4 className="text-xs font-mono text-blue-600 mb-3 tracking-wider font-semibold">🚀 JARVIS CAPABILITIES</h4>
                  <div className="grid grid-cols-1 gap-3 text-xs text-gray-600">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Generate flashcards, quizzes, and study plans from any topic</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Target className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Provide personalized explanations and problem-solving help</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>Track your progress and suggest optimal study strategies</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>Navigate the app and control study sessions with voice commands</span>
                    </div>
                  </div>
                </div>
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
                      : "bg-white/90 border border-gray-200/50 text-gray-800 rounded-2xl rounded-bl-md shadow-sm"
                  } px-4 py-3 relative overflow-hidden`}
                >
                  {msg.role === "assistant" && (
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                  )}
                  
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-blue-600">JARVIS</span>
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
