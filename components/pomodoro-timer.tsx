"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, RotateCcw, Settings, X, Volume2, VolumeX, Coffee, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  getPomodoroSettings, savePomodoroSettings, logPomodoroSession,
  type PomodoroSettings, type Task 
} from "@/lib/firestore"
import { useAuthContext } from "./auth-provider"
import { analyzeLearningPatterns, generatePersonalizedContent } from "@/lib/ai-client"
import { AmbientPlayer } from "@/components/ambient-player"

interface PomodoroTimerProps {
  task?: Task | null
  onClose?: () => void
  compact?: boolean
  onSessionComplete?: (session: { duration: number; type: "work" | "break" }) => void
}

const DEFAULT_SETTINGS: Omit<PomodoroSettings, "userId"> = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  soundEnabled: true,
  notificationsEnabled: true
}

export function PomodoroTimer({ task, onClose, compact = false, onSessionComplete }: PomodoroTimerProps) {
  const { user } = useAuthContext()
  const [settings, setSettings] = useState<Omit<PomodoroSettings, "userId">>(DEFAULT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [mode, setMode] = useState<"work" | "short-break" | "long-break">("work")
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [streak, setStreak] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startTimeRef = useRef<Date | null>(null)
  const [aiInsights, setAiInsights] = useState<{
    optimalWorkTime: string
    recommendedBreakActivity: string
    productivityTips: string[]
  } | null>(null)

  // Load settings
  useEffect(() => {
    if (user) {
      getPomodoroSettings(user.uid).then(saved => {
        if (saved) {
          setSettings(saved)
          setTimeLeft(saved.workDuration * 60)
        }
      })

      // Generate AI insights
      generatePersonalizedContent({
        learningStyle: "visual",
        goals: ["Improve focus", "Complete tasks efficiently"],
        currentLevel: "intermediate",
        preferredSubjects: ["Study", "Work"]
      }, "productivity techniques", "explanation").then(content => {
        // Mock insights based on content
        setAiInsights({
          optimalWorkTime: "9:00 AM - 11:00 AM",
          recommendedBreakActivity: "Take a 5-minute walk or do stretching exercises",
          productivityTips: [
            "Maintain consistent sleep schedule",
            "Stay hydrated during work sessions",
            "Use the 2-minute rule for small tasks"
          ]
        })
      }).catch(() => {
        // Fallback insights
        setAiInsights({
          optimalWorkTime: "Morning hours",
          recommendedBreakActivity: "Light exercise or meditation",
          productivityTips: ["Stay focused", "Take regular breaks", "Track progress"]
        })
      })
    }
  }, [user])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft])

  const [isAlertVisible, setIsAlertVisible] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Initialize audio context for better sound playback
  useEffect(() => {
    const initAudio = () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('Audio context not supported')
      }
    }

    // Initialize on user interaction to comply with browser policies
    const handleUserInteraction = () => {
      initAudio()
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }

    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])

  // Play enhanced audio alert
  const playAudioAlert = useCallback(() => {
    if (!settings.soundEnabled) return

    try {
      // Create a more noticeable beep sound
      if (audioContextRef.current) {
        const context = audioContextRef.current
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(context.destination)

        oscillator.frequency.setValueAtTime(800, context.currentTime)
        oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1)

        gainNode.gain.setValueAtTime(0.3, context.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)

        oscillator.start(context.currentTime)
        oscillator.stop(context.currentTime + 0.5)
      } else if (audioRef.current) {
        // Fallback to audio element
        audioRef.current.play().catch(() => {})
      }
    } catch (error) {
      console.warn('Audio playback failed:', error)
    }
  }, [settings.soundEnabled])

  // Show visual alert with animation
  const showVisualAlert = useCallback((message: string) => {
    setAlertMessage(message)
    setIsAlertVisible(true)

    // Clear any existing timeout
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current)
    }

    // Auto-hide after 5 seconds
    alertTimeoutRef.current = setTimeout(() => {
      setIsAlertVisible(false)
    }, 5000)
  }, [])

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false)

    // Enhanced audio alert
    playAudioAlert()

    // Browser notification
    if (settings.notificationsEnabled && "Notification" in window) {
      if (Notification.permission === "granted") {
        const notification = new Notification(
          mode === "work" ? "🎉 Focus Session Complete!" : "☕ Break Time Over!",
          {
            body: mode === "work"
              ? `Great work! Take a ${sessionsCompleted + 1 >= settings.sessionsBeforeLongBreak ? 'long' : 'short'} break.`
              : "Time to get back to work!",
            icon: "/icon.svg",
            badge: "/icon.svg",
            requireInteraction: true, // Keep notification visible until user interacts
            silent: false // Ensure sound plays even if system notifications are on
          }
        )

        // Auto-close notification after 10 seconds
        setTimeout(() => notification.close(), 10000)
      } else if (Notification.permission === "default") {
        // Request permission if not asked yet
        Notification.requestPermission()
      }
    }

    // Visual alert
    const alertMsg = mode === "work"
      ? `🎉 Session Complete! ${sessionsCompleted + 1 >= settings.sessionsBeforeLongBreak ? 'Long break time!' : 'Short break earned!'}`
      : "⚡ Break's over! Ready to focus?"
    showVisualAlert(alertMsg)

    // Log session
    if (user && startTimeRef.current && mode === "work") {
      const duration = settings.workDuration
      const sessionData: any = {
        userId: user.uid,
        startTime: startTimeRef.current,
        endTime: new Date(),
        plannedDuration: duration,
        actualDuration: duration,
        type: mode,
        completed: true,
        interrupted: false
      }
      
      // Only include taskId and course if task exists
      if (task?.id) sessionData.taskId = task.id
      if (task?.course) sessionData.course = task.course
      
      await logPomodoroSession(sessionData)
      setTotalWorkTime(prev => prev + duration)
      setSessionsCompleted(prev => prev + 1)
      setStreak(prev => prev + 1)
      onSessionComplete?.({ duration, type: "work" })
    }

    // Auto-transition
    if (mode === "work") {
      const nextMode = (sessionsCompleted + 1) % settings.sessionsBeforeLongBreak === 0 
        ? "long-break" 
        : "short-break"
      setMode(nextMode)
      setTimeLeft(nextMode === "long-break" ? settings.longBreakDuration * 60 : settings.shortBreakDuration * 60)
      if (settings.autoStartBreaks) {
        setTimeout(() => {
          setIsRunning(true)
          startTimeRef.current = new Date()
        }, 1000)
      }
    } else {
      setMode("work")
      setTimeLeft(settings.workDuration * 60)
      if (settings.autoStartWork) {
        setTimeout(() => {
          setIsRunning(true)
          startTimeRef.current = new Date()
        }, 1000)
      }
    }
  }, [mode, settings, sessionsCompleted, user, task, onSessionComplete])

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = new Date()
      // Request notification permission
      if (settings.notificationsEnabled && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission()
      }
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(
      mode === "work" 
        ? settings.workDuration * 60 
        : mode === "short-break" 
          ? settings.shortBreakDuration * 60 
          : settings.longBreakDuration * 60
    )
    startTimeRef.current = null
  }

  const switchMode = (newMode: "work" | "short-break" | "long-break") => {
    setIsRunning(false)
    setMode(newMode)
    setTimeLeft(
      newMode === "work" 
        ? settings.workDuration * 60 
        : newMode === "short-break" 
          ? settings.shortBreakDuration * 60 
          : settings.longBreakDuration * 60
    )
  }

  const updateSettings = async (newSettings: Partial<Omit<PomodoroSettings, "userId">>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    if (user) {
      await savePomodoroSettings({ ...updated, userId: user.uid })
    }
    // Update current timer if not running
    if (!isRunning) {
      if (newSettings.workDuration && mode === "work") {
        setTimeLeft(newSettings.workDuration * 60)
      }
      if (newSettings.shortBreakDuration && mode === "short-break") {
        setTimeLeft(newSettings.shortBreakDuration * 60)
      }
      if (newSettings.longBreakDuration && mode === "long-break") {
        setTimeLeft(newSettings.longBreakDuration * 60)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = mode === "work" 
    ? 1 - (timeLeft / (settings.workDuration * 60))
    : mode === "short-break"
      ? 1 - (timeLeft / (settings.shortBreakDuration * 60))
      : 1 - (timeLeft / (settings.longBreakDuration * 60))

  const getModeColor = () => {
    switch (mode) {
      case "work": return "from-red-500 to-orange-500"
      case "short-break": return "from-green-500 to-emerald-500"
      case "long-break": return "from-blue-500 to-cyan-500"
    }
  }

  const getModeIcon = () => {
    switch (mode) {
      case "work": return <Brain className="w-5 h-5" />
      case "short-break": return <Coffee className="w-5 h-5" />
      case "long-break": return <Coffee className="w-5 h-5" />
    }
  }

  if (compact) {
    return (
      <div className="relative">
        {/* Hidden audio element */}
        <audio ref={audioRef} src="/notification.mp3" preload="auto" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <span className="text-sm font-medium capitalize">
              {mode.replace('-', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className="p-1 hover:bg-slate-700 rounded"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Timer display */}
        <div className="text-center mb-4">
          <div className="text-4xl font-mono font-bold text-slate-100 mb-2">
            {formatTime(timeLeft)}
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getModeColor()} transition-all duration-1000`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={resetTimer}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            size="sm"
            onClick={toggleTimer}
            className={`bg-gradient-to-r ${getModeColor()} text-white`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-4 mt-4 text-xs text-slate-400">
          <span>{sessionsCompleted} sessions</span>
          <span>•</span>
          <span>{Math.round(totalWorkTime)} min focused</span>
          <span>•</span>
          <span>{streak} day streak</span>
        </div>
      </div>
    )
  }

  // Full version
  return (
    <>
      <div className="relative">
      {/* Hidden audio element */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-100">Focus Timer</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Task info */}
      {task && (
        <div className="mb-6 p-4 rounded-xl bg-card border border-border">
          <p className="text-sm text-muted-foreground">Working on:</p>
          <p className="font-medium text-foreground">{task.title}</p>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "work", label: "Focus", icon: Brain },
          { id: "short-break", label: "Short Break", icon: Coffee },
          { id: "long-break", label: "Long Break", icon: Coffee }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === id 
                ? `bg-gradient-to-r ${
                    id === "work" ? "from-red-500 to-orange-500" :
                    id === "short-break" ? "from-green-500 to-emerald-500" :
                    "from-blue-500 to-cyan-500"
                  } text-white`
                : "bg-slate-700 text-slate-400 hover:text-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs sm:text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="flex justify-center mb-8">
        <div className="relative w-64 h-64">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {mode === "work" && (
                  <>
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#f97316" />
                  </>
                )}
                {mode === "short-break" && (
                  <>
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#10b981" />
                  </>
                )}
                {mode === "long-break" && (
                  <>
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </>
                )}
              </linearGradient>
            </defs>
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold text-slate-100">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-slate-400 capitalize mt-2">
              {mode.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="lg"
          onClick={resetTimer}
          className="w-14 h-14 rounded-full p-0"
        >
          <RotateCcw className="w-6 h-6" />
        </Button>
        <Button 
          size="lg"
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full p-0 bg-gradient-to-r ${getModeColor()} hover:opacity-90 text-white shadow-lg`}
        >
          {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          className="w-14 h-14 rounded-full p-0"
        >
          {settings.soundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
        </Button>
      </div>

      {/* Session stats */}
      <div className="flex justify-center gap-8 text-center">
        <div>
          <p className="text-2xl font-bold text-slate-100">{sessionsCompleted}</p>
          <p className="text-xs text-slate-400">Sessions</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-100">{Math.round(totalWorkTime)}</p>
          <p className="text-xs text-slate-400">Minutes focused</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-100">{streak}</p>
          <p className="text-xs text-slate-400">Day streak</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-100">
            {sessionsCompleted % settings.sessionsBeforeLongBreak}/{settings.sessionsBeforeLongBreak}
          </p>
          <p className="text-xs text-slate-400">Until long break</p>
        </div>
      </div>

      {/* AI Insights */}
      {aiInsights && (
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <h3 className="font-medium text-slate-100 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            AI Productivity Insights
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Optimal work time</p>
              <p className="font-medium text-foreground">{aiInsights.optimalWorkTime}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Recommended break activity</p>
              <p className="font-medium text-foreground">{aiInsights.recommendedBreakActivity}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">Productivity tips</p>
              <ul className="space-y-1">
                {aiInsights.productivityTips.map((tip, i) => (
                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Sounds */}
      <div className="mt-6">
        <AmbientPlayer isActive={isRunning && mode === "work"} />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-6 p-4 rounded-xl bg-card border border-border space-y-4">
          <h3 className="font-medium text-foreground">Timer Settings</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Focus (min)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) => updateSettings({ workDuration: parseInt(e.target.value) || 25 })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Short Break</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSettings({ shortBreakDuration: parseInt(e.target.value) || 5 })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                min={1}
                max={30}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Long Break</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => updateSettings({ longBreakDuration: parseInt(e.target.value) || 15 })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
                min={1}
                max={60}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => updateSettings({ autoStartBreaks: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-foreground">Auto-start breaks</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartWork}
                onChange={(e) => updateSettings({ autoStartWork: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-foreground">Auto-start focus after break</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-foreground">Desktop notifications</span>
            </label>
          </div>
        </div>
      )}
    </div>

    {/* Visual Alert Overlay */}
    {isAlertVisible && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-bounce max-w-md mx-4 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-semibold">{alertMessage}</p>
          <button
            onClick={() => setIsAlertVisible(false)}
            className="mt-3 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors pointer-events-auto"
          >
            Dismiss
          </button>
        </div>
      </div>
    )}
    </>
  )
}
