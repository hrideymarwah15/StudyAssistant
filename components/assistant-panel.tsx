"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthContext } from "./auth-provider"
import { useVoiceInput, speak, stopSpeaking, isSpeechRecognitionSupported } from "@/lib/voice"
import { parseCommand, executeCommand, getSuggestedActions, AssistantContext, CommandResult } from "@/lib/assistant"
import { Message } from "@/lib/ai-client"
import { 
  addMemory, 
  getMemories, 
  createConversation, 
  addMessageToConversation,
  getMaterials,
  getFlashcardDecks
} from "@/lib/firestore"
import { askAI, APIError } from "@/lib/api"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  action?: CommandResult["action"]
}

export function AssistantPanel() {
  const { user } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userContext, setUserContext] = useState<AssistantContext>({})
  const [showQuickActions, setShowQuickActions] = useState(true)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Voice input hook
  const { state: voiceState, startListening, stopListening, resetTranscript } = useVoiceInput({
    continuous: false,
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        setInputValue(transcript.trim())
        // Auto-submit on voice input
        handleSubmit(transcript.trim())
      }
    },
    onError: (error) => {
      addAssistantMessage(`Voice error: ${error}`)
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

  // Update current page in context
  useEffect(() => {
    setUserContext(prev => ({ ...prev, currentPage: pathname }))
  }, [pathname])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const addAssistantMessage = useCallback((content: string, action?: CommandResult["action"]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      action
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  const handleSubmit = async (text?: string) => {
    const messageText = (text || inputValue).trim()
    if (!messageText || isProcessing) return

    setInputValue("")
    setShowQuickActions(false)
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
      // First try to use the AI backend for intelligent responses
      let result: CommandResult
      let usedBackend = false

      try {
        const aiResponse = await askAI({
          question: messageText,
          use_memory: true,
          top_k: 5
        })
        
        result = {
          success: true,
          message: aiResponse.answer,
          action: aiResponse.sources_count > 0 ? {
            type: "speak",
            data: { sources: aiResponse.sources }
          } : undefined
        }
        usedBackend = true
      } catch (error) {
        // Fallback to local command parsing if backend fails
        console.warn("AI backend unavailable, using local commands:", error)
        const command = parseCommand(messageText)
        result = await executeCommand(command, userContext)
      }

      // Add assistant response
      const assistantMessage = addAssistantMessage(
        usedBackend ? result.message : result.message, 
        result.action
      )

      // Handle actions
      if (result.action) {
        switch (result.action.type) {
          case "navigate":
            if (result.action.data?.path) {
              setTimeout(() => {
                router.push(result.action!.data.path)
              }, 500)
            }
            break
          case "speak":
            // Text-to-speech for explanations
            speak(result.message, { rate: 1, pitch: 1 })
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
            // Could open a modal or navigate
            break
          case "show_quiz":
            // Could start an inline quiz
            break
        }
      }

      // Save to conversation history
      if (user && conversationId) {
        await addMessageToConversation(conversationId, {
          role: "user",
          content: messageText
        })
        await addMessageToConversation(conversationId, {
          role: "assistant",
          content: result.message
        })
      }

    } catch (error: any) {
      addAssistantMessage(`Sorry, something went wrong: ${error.message}`)
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

  const handleQuickAction = (action: string) => {
    setInputValue(action)
    inputRef.current?.focus()
  }

  const clearChat = () => {
    setMessages([])
    setShowQuickActions(true)
    setConversationId(null)
  }

  const suggestions = getSuggestedActions(userContext)

  if (!user) return null

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? "bg-gray-600 hover:bg-gray-700" 
            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        }`}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Assistant panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">StudyPal AI</h3>
              <p className="text-xs text-white/70">Your study assistant</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Messages area */}
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-800/50">
          {messages.length === 0 && showQuickActions && (
            <div className="space-y-3">
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                👋 Hi! I'm your study assistant. Ask me anything or try:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickAction(suggestion)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.action?.type === "show_flashcards" && msg.action.data?.flashcards && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <p className="text-xs opacity-70">{msg.action.data.flashcards.length} flashcards created</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {voiceState.isListening && (
            <div className="mb-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {voiceState.interimTranscript || "Listening..."}
              </span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex items-center gap-2"
          >
            {/* Voice button */}
            {isSpeechRecognitionSupported() && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2.5 rounded-full transition-colors ${
                  voiceState.isListening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={voiceState.isListening ? "Stop listening" : "Start voice input"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything or give a command..."
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isProcessing}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputValue.trim() || isProcessing}
              className="p-2.5 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>

          {/* Voice not supported message */}
          {!isSpeechRecognitionSupported() && (
            <p className="mt-2 text-xs text-gray-400 text-center">
              Voice input not supported in this browser
            </p>
          )}
        </div>
      </div>
    </>
  )
}
