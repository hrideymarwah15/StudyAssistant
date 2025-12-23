"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onerror: ((event: Event & { error: string }) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onstart: (() => void) | null
  onend: (() => void) | null
  onspeechend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export interface VoiceInputState {
  isListening: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  isSupported: boolean
}

export interface UseVoiceInputOptions {
  continuous?: boolean
  language?: string
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
}

// Check if speech recognition is supported
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

// Main hook for voice input
export function useVoiceInput(options: UseVoiceInputOptions = {}): {
  state: VoiceInputState
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
} {
  const {
    continuous = false,
    language = "en-US",
    onResult,
    onError,
    onStart,
    onEnd
  } = options

  const [state, setState] = useState<VoiceInputState>({
    isListening: false,
    transcript: "",
    interimTranscript: "",
    error: null,
    isSupported: false
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const transcriptRef = useRef("")
  
  // Store callbacks in refs to avoid re-running useEffect
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  const onStartRef = useRef(onStart)
  const onEndRef = useRef(onEnd)
  
  // Update refs when callbacks change
  useEffect(() => {
    onResultRef.current = onResult
    onErrorRef.current = onError
    onStartRef.current = onStart
    onEndRef.current = onEnd
  })

  // Initialize speech recognition - only run once
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, isSupported: false }))
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    const recognition = new SpeechRecognition()
    recognition.continuous = continuous
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }))
      onStartRef.current?.()
    }

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }))
      onEndRef.current?.()
    }

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error)
      setState(prev => ({ ...prev, error: errorMessage, isListening: false }))
      onErrorRef.current?.(errorMessage)
    }

    recognition.onresult = (event) => {
      let interimTranscript = ""
      let finalTranscript = transcriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcript = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcript + " "
          transcriptRef.current = finalTranscript
          onResultRef.current?.(transcript.trim(), true)
        } else {
          interimTranscript += transcript
          onResultRef.current?.(transcript, false)
        }
      }

      setState(prev => ({
        ...prev,
        transcript: finalTranscript.trim(),
        interimTranscript
      }))
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [continuous, language]) // Only re-run when these change, not callbacks

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      transcriptRef.current = ""
      setState(prev => ({ ...prev, transcript: "", interimTranscript: "", error: null }))
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error starting speech recognition:", error)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    transcriptRef.current = ""
    setState(prev => ({ ...prev, transcript: "", interimTranscript: "" }))
  }, [])

  return {
    state,
    startListening,
    stopListening,
    resetTranscript
  }
}

// Helper to get human-readable error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case "no-speech":
      return "No speech detected. Please try again."
    case "audio-capture":
      return "No microphone found. Please check your audio settings."
    case "not-allowed":
      return "Microphone access denied. Please allow microphone access."
    case "network":
      return "Network error. Please check your connection."
    case "aborted":
      return "Speech recognition was aborted."
    case "language-not-supported":
      return "Language not supported."
    case "service-not-allowed":
      return "Speech recognition service not allowed."
    default:
      return `Speech recognition error: ${error}`
  }
}

// Text-to-Speech utility
export interface SpeakOptions {
  rate?: number // 0.1 to 10, default 1
  pitch?: number // 0 to 2, default 1
  volume?: number // 0 to 1, default 1
  voice?: SpeechSynthesisVoice | null
  lang?: string
}

export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 1.1
    utterance.pitch = options.pitch ?? 1.1
    utterance.volume = options.volume ?? 0.9
    utterance.lang = options.lang ?? "en-US"

    // Try to find a female voice for smoother sound
    if (!options.voice) {
      const voices = window.speechSynthesis.getVoices()
      // Prefer: Samantha (macOS), Google UK Female, Microsoft Zira, any female voice
      const femaleVoice = voices.find(v => 
        v.name.includes("Samantha") || 
        v.name.includes("Female") || 
        v.name.includes("Zira") ||
        v.name.includes("Karen") ||
        v.name.includes("Moira") ||
        v.name.includes("Fiona") ||
        v.name.includes("Victoria") ||
        v.name.includes("Google UK English Female")
      ) || voices.find(v => v.lang.startsWith("en"))
      
      if (femaleVoice) {
        utterance.voice = femaleVoice
      }
    } else {
      utterance.voice = options.voice
    }

    utterance.onend = () => resolve()
    utterance.onerror = (event) => {
      // Don't reject on cancel - it's expected behavior
      if (event.error === 'canceled' || event.error === 'interrupted') {
        resolve()
      } else {
        reject(new Error(event.error))
      }
    }

    window.speechSynthesis.speak(utterance)
  })
}

// Get available voices
export function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

// Stop speaking
export function stopSpeaking(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

// Check if currently speaking
export function isSpeaking(): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false
  return window.speechSynthesis.speaking
}
