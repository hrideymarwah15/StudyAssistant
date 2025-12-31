"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Target, Flame, TrendingUp, CheckCircle2, Play } from "lucide-react"
import { RecommendationEngine, RecommendationScore, getRecommendationEngine } from "@/lib/recommendations/scoreEngine"
import { useAuth } from "@/lib/hooks/useAuth"
import { getUserData } from "@/lib/firestore"
import { useRouter } from "next/navigation"

interface TodayAtGlanceProps {
  className?: string
}

export function TodayAtGlance({ className }: TodayAtGlanceProps) {
  const [recommendations, setRecommendations] = useState<RecommendationScore[]>([])
  const [loading, setLoading] = useState(true)
  const [engine, setEngine] = useState<RecommendationEngine | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      loadRecommendations()
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

      const recommendationEngine = getRecommendationEngine(context)
      setEngine(recommendationEngine)

      const recs = recommendationEngine.getRecommendations(4) // Show top 4
      setRecommendations(recs)
    } catch (error) {
      console.error("Failed to load recommendations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecommendationAction = (recommendation: RecommendationScore) => {
    switch (recommendation.action.type) {
      case 'navigate':
        if (recommendation.action.data?.path) {
          router.push(recommendation.action.data.path)
        }
        break
      case 'toggle_habit':
        // Handle habit toggle - would integrate with habit system
        console.log("Toggle habit:", recommendation.action.data?.habitId)
        break
      case 'start_focus':
        // Handle focus session start
        console.log("Start focus session:", recommendation.action.data)
        break
      default:
        console.log("Unknown action:", recommendation.action)
    }

    // Refresh recommendations after action
    if (engine) {
      const recs = engine.getRecommendations(4)
      setRecommendations(recs)
    }
  }

  const getRecommendationIcon = (type: RecommendationScore['type']) => {
    switch (type) {
      case 'task': return <Target className="h-4 w-4" />
      case 'habit': return <Flame className="h-4 w-4" />
      case 'focus_session': return <Play className="h-4 w-4" />
      case 'study_planning': return <TrendingUp className="h-4 w-4" />
      default: return <CheckCircle2 className="h-4 w-4" />
    }
  }

  const getRecommendationColor = (score: number) => {
    if (score >= 0.8) return "bg-red-100 text-red-800 border-red-200"
    if (score >= 0.6) return "bg-orange-100 text-orange-800 border-orange-200"
    if (score >= 0.4) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-green-100 text-green-800 border-green-200"
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today at a Glance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today at a Glance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>All caught up! Great job staying on top of your studies.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getRecommendationIcon(rec.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">
                        {rec.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getRecommendationColor(rec.score)}`}
                    >
                      {Math.round(rec.score * 100)}%
                    </Badge>
                  </div>

                  {rec.reasoning.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rec.reasoning.slice(0, 2).map((reason, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={() => handleRecommendationAction(rec)}
                  >
                    Take Action
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => router.push('/planner')}
          >
            View Full Planner
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}