"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "./auth-provider"
import { useVoiceInput, speak, stopSpeaking, isSpeechRecognitionSupported } from "@/lib/voice"
import { parseCommand, executeCommand, getSuggestedActions, AssistantContext, CommandResult } from "@/lib/assistant"
import { Message } from "@/lib/ai-client"
import { 
  addMemory, 
  getMaterials,
  getFlashcardDecks,
  createFlashcardDeck,
  addFlashcard,
  type FlashcardDeck
} from "@/lib/firestore"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: CommandResult["action"]
}

export function JarvisAssistant() {
  const { user } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [userContext, setUserContext] = useState<AssistantContext>({})
  const [isInitialized, setIsInitialized] = useState(false)
  const [showWaveform, setShowWaveform] = useState(false)
  const [userDecks, setUserDecks] = useState<FlashcardDeck[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voice input hook
  const { state: voiceState, startListening, stopListening, resetTranscript } = useVoiceInput({
    continuous: false,
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        setInputValue(transcript.trim())
        handleSubmit(transcript.trim())
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
    
    // Speak the response (FRIDAY style - female voice, faster)
    try {
      speak(content, { rate: 1.15, pitch: 1.1, volume: 0.9 }).catch(() => {})
    } catch {}
    
    return message
  }, [])

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
      const command = parseCommand(messageText)
      const result = await executeCommand(command, userContext)

      addAssistantMessage(result.message, result.action)

      // Handle actions
      if (result.action) {
        switch (result.action.type) {
          case "navigate":
            if (result.action.data?.path) {
              setTimeout(() => {
                router.push(result.action!.data.path)
              }, 1000)
            }
            break
          case "add_memory":
            if (user && result.action.data) {
              await addMemory({
                userId: user.uid,
                content: result.action.data.content,
                category: result.action.data.category || "note"
              })
            }
            break
          case "show_flashcards":
            // Save flashcards to user's library
            if (user && result.action.data?.flashcards) {
              try {
                const topic = result.action.data.topic || "AI Generated"
                // Create a new deck or use existing
                let deckId: string
                const existingDeck = userDecks.find(d => d.name.toLowerCase() === topic.toLowerCase())
                
                if (existingDeck) {
                  deckId = existingDeck.id
                } else {
                  deckId = await createFlashcardDeck({
                    name: topic,
                    subject: topic,
                    userId: user.uid
                  })
                  // Refresh decks
                  const updatedDecks = await getFlashcardDecks(user.uid)
                  setUserDecks(updatedDecks)
                }
                
                // Add all flashcards to the deck
                for (const card of result.action.data.flashcards) {
                  await addFlashcard({
                    front: card.front,
                    back: card.back,
                    difficulty: "medium",
                    deckId,
                    userId: user.uid
                  })
                }
                
                // Notify user
                addAssistantMessage(`Excellent. I've added ${result.action.data.flashcards.length} flashcards to your "${topic}" deck. You may review them in the Flashcards section whenever you're ready.`)
              } catch (err) {
                console.error("Error saving flashcards:", err)
                addAssistantMessage("I generated the flashcards but encountered a slight issue saving them to your library. Shall I try again?")
              }
            }
            break
        }
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
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-500/20 animate-ping" />
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-cyan-500/10 animate-pulse" />
          
          {/* Main orb */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-cyan-500/50 flex items-center justify-center overflow-hidden">
            {/* Inner glow */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-300/50 to-transparent" />
            
            {/* Core */}
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-white via-cyan-200 to-cyan-400 shadow-inner flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/80 animate-pulse" />
            </div>
          </div>
          
          {/* Hover text */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
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
        <div className={`relative h-full ${isFullscreen ? "" : "max-h-[600px]"} bg-slate-950/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col`}>
          
          {/* Animated border glow */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 animate-shimmer" />
          </div>

          {/* Header */}
          <div className="relative px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/50 via-cyan-950/30 to-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* JARVIS Logo */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full bg-cyan-300/80 ${isProcessing ? "animate-pulse" : ""}`}>
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-white/60 to-transparent" />
                    </div>
                  </div>
                  {isProcessing && (
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping" />
                  )}
                </div>
                
                <div>
                  <h3 className="font-bold text-cyan-400 tracking-wider font-mono text-sm">J.A.R.V.I.S</h3>
                  <p className="text-[10px] text-cyan-600 font-mono tracking-widest">STUDY ASSISTANT v2.0</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Status indicator */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/20">
                  <div className={`w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-400 animate-pulse" : "bg-emerald-400"}`} />
                  <span className="text-[10px] text-cyan-400 font-mono">
                    {isProcessing ? "PROCESSING" : "ONLINE"}
                  </span>
                </div>
                
                {/* Fullscreen toggle */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-cyan-500"
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
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Voice waveform visualization */}
            {showWaveform && (
              <div className="mt-3 flex items-center justify-center gap-1 h-8">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 50}ms`,
                      animationDuration: `${300 + Math.random() * 200}ms`
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Messages area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isFullscreen ? "max-h-none" : "max-h-80"}`}>
            {/* HUD-style decorations */}
            <div className="absolute top-20 left-4 w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent" />
            <div className="absolute top-20 right-4 w-px h-8 bg-gradient-to-b from-cyan-500/50 to-transparent" />

            {messages.length === 0 && (
              <div className="space-y-4">
                {/* Quick action grid */}
                <div className="grid grid-cols-2 gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInputValue(suggestion)
                        inputRef.current?.focus()
                      }}
                      className="group relative px-3 py-3 rounded-lg bg-cyan-950/30 border border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-900/30 transition-all text-left overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      <span className="text-xs text-cyan-300 font-mono">{suggestion}</span>
                    </button>
                  ))}
                </div>

                {/* Capabilities list */}
                <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-cyan-500/10">
                  <h4 className="text-xs font-mono text-cyan-500 mb-3 tracking-wider">CAPABILITIES</h4>
                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Generate flashcards from any topic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Quiz you on your study materials</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Explain complex concepts simply</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Navigate and control the app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>Remember important information</span>
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
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl rounded-br-md"
                      : "bg-slate-800/80 border border-cyan-500/20 text-cyan-100 rounded-2xl rounded-bl-md"
                  } px-4 py-3 relative overflow-hidden`}
                >
                  {msg.role === "assistant" && (
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                  )}
                  
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-cyan-500">JARVIS</span>
                      <span className="text-[10px] text-slate-500">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  
                  {msg.action?.type === "show_flashcards" && msg.action.data?.flashcards && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-xs opacity-70 font-mono">
                        {msg.action.data.flashcards.length} FLASHCARDS GENERATED
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-800/80 border border-cyan-500/20 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-cyan-500">PROCESSING</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="relative p-4 border-t border-cyan-500/20 bg-slate-900/50">
            {/* Voice listening indicator */}
            {voiceState.isListening && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-cyan-950 border border-cyan-500/50 rounded-full flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-cyan-300 font-mono">
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
              {/* Voice button */}
              {isSpeechRecognitionSupported() && (
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`relative p-3 rounded-xl transition-all ${
                    voiceState.isListening
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-900/50 hover:border-cyan-500/50"
                  }`}
                >
                  {voiceState.isListening && (
                    <div className="absolute inset-0 rounded-xl border border-red-500 animate-ping" />
                  )}
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
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
                  className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-sm text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/30 font-mono"
                  disabled={isProcessing}
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 animate-shimmer" />
                </div>
              </div>

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </form>

            {/* Footer info */}
            <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500 font-mono">
              <span>POWERED BY AI • {new Date().toLocaleDateString()}</span>
              <button onClick={clearChat} className="hover:text-cyan-400 transition-colors">
                CLEAR MEMORY
              </button>
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
