"use client"

import { useState, useEffect } from "react"
import { Play, BookOpen, Plus, Zap, CheckCircle2, Target, Flame, Clock, Brain, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { getRecommendationEngine, RecommendationScore } from "@/lib/recommendations/scoreEngine"
import { getUserData } from "@/lib/firestore"

interface NextActionsProps {
  onStartFocus: () => void
}

const getActionIcon = (type: string) => {
  switch (type) {
    case 'task': return <CheckCircle2 className="w-5 h-5 text-blue-500" />
    case 'habit': return <Flame className="w-5 h-5 text-orange-500" />
    case 'focus_session': return <Play className="w-5 h-5 text-green-500" />
    case 'flashcard_review': return <BookOpen className="w-5 h-5 text-purple-500" />
    case 'study_planning': return <Target className="w-5 h-5 text-cyan-500" />
    default: return <Zap className="w-5 h-5 text-yellow-500" />
  }
}

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return { greeting: "Morning momentum", suggestion: "Start strong with a focus session" }
  if (hour < 17) return { greeting: "Afternoon push", suggestion: "Great time for deep work" }
  if (hour < 21) return { greeting: "Evening review", suggestion: "Review and consolidate learning" }
  return { greeting: "Night owl mode", suggestion: "Light review before rest" }
}

export function NextActions({ onStartFocus }: NextActionsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const timeContext = getTimeOfDayGreeting()

  useEffect(() => {
    if (user) {
      loadRecommendations()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadRecommendations = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userData = await getUserData(user.uid)

      const context = {
        tasks: userData.tasks || [],
        courses: userData.courses || [],
        habits: userData.habits || [],
        dailyStats: userData.dailyStats || undefined,
        currentTime: new Date(),
        userStreak: userData.userStreak || 0
      }

      const engine = getRecommendationEngine(context)
      const recs = engine.getRecommendations(3)
      setRecommendations(recs)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (rec: RecommendationScore) => {
    if (rec.action.type === 'start_focus' || rec.type === 'focus_session') {
      onStartFocus()
    }
    // Navigation handled by Link wrapper
  }

  // Fallback actions when no recommendations or loading
  const defaultActions = [
    {
      id: 'default-focus',
      type: 'focus_session' as const,
      title: 'Start 25-min Focus',
      description: 'Build momentum with deep work',
      action: { type: 'start_focus' },
      score: 0.9,
      urgency: 0.8,
      importance: 0.9,
      streakImpact: 0.7,
      reasoning: ['Perfect time for focused work']
    },
    {
      id: 'default-flashcards',
      type: 'flashcard_review' as const,
      title: 'Review flashcards',
      description: 'Strengthen your memory',
      action: { type: 'navigate', data: { path: '/flashcards' } },
      score: 0.8,
      urgency: 0.6,
      importance: 0.8,
      streakImpact: 0.5,
      reasoning: ['Spaced repetition boosts retention']
    },
    {
      id: 'default-plan',
      type: 'study_planning' as const,
      title: 'Plan tomorrow',
      description: 'Stay ahead of your schedule',
      action: { type: 'navigate', data: { path: '/planner' } },
      score: 0.7,
      urgency: 0.5,
      importance: 0.7,
      streakImpact: 0.4,
      reasoning: ['Planning reduces stress']
    }
  ]

  const displayActions = recommendations.length > 0 ? recommendations : defaultActions

  return (
    <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-card via-card to-primary/5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Next Best Actions</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{timeContext.greeting}</span>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">{timeContext.suggestion}</p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Analyzing your best next steps...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayActions.map((rec, index) => {
            const isNavigation = rec.action.type === 'navigate' && rec.action.data?.path
            const isFocus = rec.action.type === 'start_focus' || rec.type === 'focus_session'
            
            // Generate verb-based action label
            const getActionLabel = () => {
              switch (rec.type) {
                case 'focus_session': return 'Start Focus'
                case 'flashcard_review': return 'Review Cards'
                case 'study_planning': return 'Open Planner'
                case 'task': return 'View Task'
                case 'habit': return 'Complete Habit'
                default: return 'Take Action'
              }
            }
            
            const content = (
              <div 
                className={`p-4 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-all text-left border border-slate-700/50 hover:border-blue-500/50 cursor-pointer group ${index === 0 ? 'ring-1 ring-blue-500/30' : ''}`}
                onClick={isFocus ? onStartFocus : undefined}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getActionIcon(rec.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                      {rec.title}
                    </p>
                    <p className="text-sm text-slate-400 line-clamp-2">{rec.description}</p>
                    {rec.reasoning && rec.reasoning.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.reasoning.slice(0, 2).map((reason, i) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Verb-based action badge */}
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                    index === 0 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {getActionLabel()}
                  </span>
                </div>
              </div>
            )

            if (isNavigation && !isFocus) {
              return (
                <Link key={rec.id} href={rec.action.data.path}>
                  {content}
                </Link>
              )
            }

            return <div key={rec.id}>{content}</div>
          })}
        </div>
      )}
    </div>
  )
}