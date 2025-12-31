"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, TrendingUp, Clock, Target, BookOpen, BarChart3, PieChart, Activity, Loader2, Brain, Eye } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { toggleHabitCompletion } from "@/lib/firestore"
import { toast } from "sonner"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  getDailyStats, getStudySessions, getPomodoroSessions,
  type DailyStats, type StudySession, type PomodoroSession
} from "@/lib/firestore"
import { getAnalyticsEngine, createAnalyticsContext, type ProgressMetrics, type HeatmapData, type ProgressArc, type PredictiveInsights } from "@/lib/analytics/analyticsEngine"
import { getTasks, getCourses, getHabits } from "@/lib/firestore"
import { StudyHeatmap } from "@/components/analytics/StudyHeatmap"
import { ProgressArcs } from "@/components/analytics/ProgressArcs"
import { PredictiveInsightsComponent } from "@/components/analytics/PredictiveInsights"
import { RecommendationTooltip } from "@/components/analytics/RecommendationTooltip"
import { getRecommendationEngine } from "@/lib/recommendations/scoreEngine"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AnalyticsData {
  progressMetrics: ProgressMetrics
  heatmapData: HeatmapData[]
  progressArcs: ProgressArc[]
  insights: PredictiveInsights
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([])
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week")

  // New analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  const handleRecommendationClick = async (recommendation: any) => {
    try {
      switch (recommendation.action.type) {
        case 'navigate':
          const { path, filter, taskId } = recommendation.action.data
          let url = path
          if (filter) {
            url += `?filter=${filter}`
            if (taskId) {
              url += `&taskId=${taskId}`
            }
          }
          router.push(url)
          break

        case 'toggle_habit':
          const today = new Date().toISOString().split('T')[0]
          await toggleHabitCompletion(recommendation.action.data.habitId, today)
          toast.success(`Completed habit: ${recommendation.title}`)
          // Refresh recommendations
          setTimeout(() => {
            window.location.reload()
          }, 1000)
          break

        case 'start_focus':
          // Navigate to dashboard where pomodoro timer is available
          router.push('/dashboard')
          toast.info('Starting focus session...', {
            description: 'Navigate to the dashboard to begin your 25-minute focus session.'
          })
          break

        default:
          toast.error('Action not implemented yet')
      }
    } catch (error) {
      console.error('Error handling recommendation action:', error)
      toast.error('Failed to complete action')
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          // Get date range
          const endDate = new Date()
          const startDate = new Date()
          if (timeRange === "week") {
            startDate.setDate(endDate.getDate() - 7)
          } else if (timeRange === "month") {
            startDate.setMonth(endDate.getMonth() - 1)
          } else {
            startDate.setFullYear(endDate.getFullYear() - 1)
          }

          // For now, just get the last 7 days of stats since we don't have a generic range function
          // TODO: Create a getStatsInRange function
          const [sessions, pomodoro] = await Promise.all([
            getStudySessions(currentUser.uid, { start: startDate, end: endDate }),
            getPomodoroSessions(currentUser.uid, { start: startDate, end: endDate })
          ])

          // Get daily stats for the last 7 days (simplified for now)
          const dailyStatsPromises = []
          for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            dailyStatsPromises.push(getDailyStats(currentUser.uid, dateStr))
          }
          
          const dailyStatsResults = await Promise.all(dailyStatsPromises)
          const stats = dailyStatsResults.filter(stat => stat !== null) as DailyStats[]

          // Get additional data for analytics
          const [tasks, courses, habits] = await Promise.all([
            getTasks(currentUser.uid),
            getCourses(currentUser.uid),
            getHabits(currentUser.uid)
          ])

          setDailyStats(stats)
          setStudySessions(sessions)
          setPomodoroSessions(pomodoro)

          // Create analytics context and generate analytics
          const analyticsContext = createAnalyticsContext(
            currentUser.uid,
            tasks,
            courses,
            habits,
            stats,
            sessions,
            30 // 30 days
          )
          const analyticsEngine = getAnalyticsEngine(analyticsContext)

          // Generate comprehensive analytics data with error handling
          let analytics: AnalyticsData = {
            progressMetrics: { totalStudyTime: 0, averageDailyStudy: 0, currentStreak: 0, longestStreak: 0, tasksCompleted: 0, tasksCreated: 0, completionRate: 0, habitsCompleted: 0, habitsStreak: 0, coursesActive: 0 },
            heatmapData: [],
            progressArcs: [],
            insights: {
              nextWeekPrediction: { studyHours: 0, tasksToComplete: 0, habitsToMaintain: 0 },
              riskFactors: [],
              opportunities: []
            }
          }

          try {
            const generatedAnalytics = {
              progressMetrics: analyticsEngine.calculateProgressMetrics(),
              heatmapData: analyticsEngine.generateHeatmapData(),
              progressArcs: analyticsEngine.generateProgressArcs(),
              insights: analyticsEngine.generatePredictiveInsights()
            }

            // Validate and sanitize data
            analytics = {
              progressMetrics: generatedAnalytics.progressMetrics || analytics.progressMetrics,
              heatmapData: Array.isArray(generatedAnalytics.heatmapData) ? generatedAnalytics.heatmapData : [],
              progressArcs: Array.isArray(generatedAnalytics.progressArcs) ? generatedAnalytics.progressArcs : [],
              insights: generatedAnalytics.insights || analytics.insights
            }
          } catch (analyticsError) {
            console.error("Error generating analytics data:", analyticsError)
            // Use fallback analytics data
          }
          setAnalyticsData(analytics)

          // Get recommendations for transparency
          // For now, we'll create mock recommendations since we need more context data
          const mockRecommendations = [
            {
              id: '1',
              type: 'task' as const,
              title: 'Review Math Flashcards',
              description: 'You have 25 flashcards due for review',
              score: 85,
              urgency: 0.9,
              importance: 0.8,
              streakImpact: 0.7,
              reasoning: ['High urgency due to due date approaching', 'Strong performance streak to maintain'],
              action: { type: 'flashcard_review' }
            },
            {
              id: '2',
              type: 'task' as const,
              title: 'Complete Physics Assignment',
              description: 'Physics homework due tomorrow',
              score: 78,
              urgency: 0.95,
              importance: 0.7,
              streakImpact: 0.6,
              reasoning: ['Due tomorrow with high academic importance'],
              action: { type: 'task_completion' }
            }
          ]
          setRecommendations(mockRecommendations)
        } catch (error) {
          console.error("Error loading analytics:", error)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router, timeRange])

  // Calculate metrics
  const totalStudyTime = studySessions.reduce((sum, s) => sum + s.duration, 0)
  const totalPomodoroSessions = pomodoroSessions.filter(p => p.type === "work").length
  const totalFocusTime = pomodoroSessions
    .filter(p => p.type === "work" && p.completed)
    .reduce((sum, p) => sum + (p.actualDuration || p.plannedDuration), 0)

  const avgSessionLength = studySessions.length > 0
    ? Math.round(totalStudyTime / studySessions.length)
    : 0

  const completionRate = pomodoroSessions.length > 0
    ? Math.round((pomodoroSessions.filter(p => p.completed).length / pomodoroSessions.length) * 100)
    : 0

  const mostProductiveDay = dailyStats.length > 0
    ? dailyStats.reduce((max, stat) =>
        (stat.totalStudyMinutes || 0) > (max.totalStudyMinutes || 0) ? stat : max
      )
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              Deep Analytics
            </h1>
            <p className="text-muted-foreground mb-2">AI-powered insights into your study patterns</p>
            <p className="text-muted-foreground">Predictive analytics, progress tracking, and personalized recommendations</p>
          </div>

          <div className="flex gap-2">
            {["week", "month", "year"].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range as any)}
                className="capitalize"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Study Time</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(totalStudyTime / 60)}h {totalStudyTime % 60}m
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Focus Sessions</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{totalPomodoroSessions}</p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Avg Session</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{avgSessionLength} min</p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-2xl font-bold text-foreground cursor-help">{completionRate}%</p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        <strong>How it's calculated:</strong><br />
                        Tasks completed ÷ Tasks created × 100<br />
                        Based on your task completion history over the selected time period.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Progress Arcs */}
            {analyticsData?.progressArcs && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Subject Progress</h2>
                <ProgressArcs arcs={analyticsData.progressArcs} />
              </div>
            )}

            {/* Study Heatmap */}
            {analyticsData?.heatmapData && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Study Activity Heatmap</h2>
                <StudyHeatmap data={analyticsData.heatmapData} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Progress Arcs - Detailed View */}
            {analyticsData?.progressArcs && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Detailed Progress Tracking</h2>
                <ProgressArcs arcs={analyticsData.progressArcs} />
              </div>
            )}

          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Predictive Insights */}
            {analyticsData?.insights && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Predictive Insights
                </h2>
                <PredictiveInsightsComponent insights={analyticsData.insights} />
              </div>
            )}

            {/* Recommendations with Transparency */}
            {recommendations.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Personalized Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 6).map((rec, index) => (
                    <RecommendationTooltip key={index} recommendation={rec}>
                      <div
                        className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleRecommendationClick(rec)}
                      >
                        <h4 className="font-medium mb-2">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Type: {rec.type}</span>
                          <span className="text-xs font-medium">Score: {rec.score}/100</span>
                        </div>
                      </div>
                    </RecommendationTooltip>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-6">
            {/* Study Heatmap - Full View */}
            {analyticsData?.heatmapData && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Complete Activity Patterns</h2>
                <StudyHeatmap data={analyticsData.heatmapData} />
              </div>
            )}

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}