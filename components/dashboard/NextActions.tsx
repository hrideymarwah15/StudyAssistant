"use client"

import { useState, useEffect } from "react"
import { Play, BookOpen, Target, Loader2, HelpCircle, Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/useAuth"
import { getRecommendationEngine, RecommendationScore } from "@/lib/recommendations/scoreEngine"
import { getUserData } from "@/lib/firestore"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NextActionsProps {
  onStartFocus: () => void
}

export function NextActions({ onStartFocus }: NextActionsProps) {
  const [topAction, setTopAction] = useState<RecommendationScore | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

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
      const recs = engine.getRecommendations(1) // Get only top recommendation
      setTopAction(recs[0] || null)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  // Default action when no recommendations
  const defaultAction: RecommendationScore = {
    id: 'default-focus',
    type: 'focus_session',
    title: 'Start a 25-min focus session',
    description: 'Build momentum with deep work — the best way to make progress.',
    action: { type: 'start_focus' },
    score: 0.9,
    urgency: 0.8,
    importance: 0.9,
    streakImpact: 0.7,
    reasoning: ['Focus sessions build consistency', 'Best time for deep work']
  }

  const action = topAction || defaultAction
  const isFocus = action.action.type === 'start_focus' || action.type === 'focus_session'
  const isNavigation = action.action.type === 'navigate' && action.action.data?.path

  // Compact loading state
  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-green-400" />
          <span className="text-sm text-slate-400">Finding your best next move...</span>
        </div>
      </div>
    )
  }

  const content = (
    <div className="p-4 rounded-xl bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/30 hover:border-green-400/50 transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-green-400" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-green-400 uppercase tracking-wide">
              Next Best Action
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-slate-500 hover:text-slate-300">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    <strong>Why this?</strong><br/>
                    {action.reasoning?.slice(0, 2).join(' • ') || 'AI-ranked based on your goals and habits.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <p className="text-slate-200 font-medium mb-2">
            {action.description || action.title}
          </p>
          
          {/* CTA Button */}
          <Button
            size="sm"
            onClick={isFocus ? onStartFocus : undefined}
            className="bg-green-600 hover:bg-green-500 text-white gap-2"
          >
            {isFocus ? (
              <>
                <Play className="w-4 h-4" />
                Start Focus
              </>
            ) : action.type === 'flashcard_review' ? (
              <>
                <BookOpen className="w-4 h-4" />
                Review Cards
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                {action.title.split(' ').slice(0, 2).join(' ')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  // Wrap in Link if it's a navigation action
  if (isNavigation && !isFocus) {
    return (
      <Link href={action.action.data.path}>
        {content}
      </Link>
    )
  }

  return content
}
