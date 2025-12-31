"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Brain,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  BookOpen,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  PieChart,
  Activity,
  Timer,
  Star,
  Flame
} from "lucide-react"
import { calculateCognitiveLoad, analyzeKnowledgeGaps } from "@/lib/utils"
import {
  getFlashcardDecks,
  getStudySessions,
  getDailyStats,
  type FlashcardDeck,
  type Flashcard,
  type StudySession,
  type DailyStats
} from "@/lib/firestore"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"

interface LearningPath {
  id: string
  name: string
  subject: string
  progress: number
  estimatedCompletion: Date
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  skills: string[]
  nextMilestone: string
}

interface CognitiveLoad {
  current: number
  optimal: number
  status: 'low' | 'optimal' | 'high' | 'overloaded'
}

interface KnowledgeGap {
  topic: string
  confidence: number
  lastReviewed: Date
  recommendedReview: Date
  priority: 'low' | 'medium' | 'high'
}

interface AdvancedLearningToolsProps {
  className?: string
}

export function AdvancedLearningTools({ className = "" }: AdvancedLearningToolsProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])

  // Advanced learning state
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([])
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad>({ current: 0, optimal: 70, status: 'optimal' })
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([])
  const [optimalStudyTime, setOptimalStudyTime] = useState<Date | null>(null)
  const [predictedProgress, setPredictedProgress] = useState<number>(0)

  // Health check function
  const checkApiHealth = async (): Promise<boolean> => {
    try {
      // Simple health check - try to access a basic API endpoint
      const response = await fetch('/api/health', { method: 'GET' })
      return response.ok
    } catch {
      return false
    }
  }

  // Retry mechanism with exponential backoff
  const loadDataWithRetry = async (userId: string, attempt: number = 1): Promise<void> => {
    const maxRetries = 3
    const baseDelay = 1000 // 1 second

    try {
      // Health check before attempting to load data
      const isHealthy = await checkApiHealth()
      if (!isHealthy && attempt === 1) {
        throw new Error('API service unavailable')
      }

      // Load existing data
      const [decks, sessions] = await Promise.all([
        getFlashcardDecks(userId),
        getStudySessions(userId)
      ])

      // For now, skip daily stats as they require a specific date
      // TODO: Implement proper daily stats fetching
      setFlashcardDecks(decks)
      setStudySessions(sessions)
      setDailyStats([])

      // Generate advanced learning insights
      await generateLearningInsights(decks, sessions, [])

      setError(null)
      setRetryCount(0)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
        setTimeout(() => loadDataWithRetry(userId, attempt + 1), delay)
        setRetryCount(attempt)
      } else {
        setError(`Failed to load learning data: ${errorMessage}`)
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        setLoading(true)
        setError(null)
        await loadDataWithRetry(currentUser.uid)
      } else {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const generateLearningInsights = async (
    decks: FlashcardDeck[],
    sessions: StudySession[],
    stats: DailyStats[]
  ) => {
    // Generate learning paths based on flashcard decks
    const paths: LearningPath[] = decks.map(deck => ({
      id: deck.id,
      name: deck.name,
      subject: deck.subject,
      progress: Math.random() * 100, // Mock progress calculation
      estimatedCompletion: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      difficulty: (['beginner', 'intermediate', 'advanced'] as const)[Math.floor(Math.random() * 3)],
      skills: ['Critical Thinking', 'Memory Retention', 'Problem Solving'].slice(0, Math.floor(Math.random() * 3) + 1),
      nextMilestone: "Complete chapter review"
    }))
    setLearningPaths(paths)

    // Calculate cognitive load using real algorithm
    const cognitiveLoadData = calculateCognitiveLoad(sessions.map(s => ({
      duration: s.duration,
      startTime: new Date(s.startTime),
      focusScore: 80 + Math.random() * 20 // Mock focus scores
    })))
    setCognitiveLoad(cognitiveLoadData)

    // Analyze knowledge gaps using mock data for now
    const mockFlashcards = decks.flatMap(deck =>
      Array.from({ length: 5 }, (_, i) => ({
        id: `${deck.id}_${i}`,
        deckId: deck.id,
        lastReviewed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        correctStreak: Math.floor(Math.random() * 5),
        totalAttempts: Math.floor(Math.random() * 10) + 1,
        difficulty: Math.floor(Math.random() * 3) + 1
      }))
    )

    const gaps = analyzeKnowledgeGaps(
      mockFlashcards,
      sessions.map(s => ({
        subject: 'General', // Mock subject
        startTime: new Date(s.startTime),
        duration: s.duration
      }))
    )
    setKnowledgeGaps(gaps.slice(0, 5))

    // Calculate optimal study time based on performance patterns
    const bestTimes = stats
      .filter(s => s.totalStudyMinutes > 0)
      .map(s => ({ time: new Date(s.date).getHours(), performance: s.totalStudyMinutes }))
      .sort((a, b) => b.performance - a.performance)

    if (bestTimes.length > 0) {
      const bestHour = bestTimes[0].time
      const optimalTime = new Date()
      optimalTime.setHours(bestHour, 0, 0, 0)
      setOptimalStudyTime(optimalTime)
    }

    // Predict progress based on current trajectory
    const recentProgress = stats.slice(-7).reduce((acc, s) => acc + s.totalStudyMinutes, 0) / 7
    const predicted = Math.min(recentProgress * 1.2, 120) // 20% improvement prediction
    setPredictedProgress(predicted)
  }

  const getCognitiveLoadColor = (status: string) => {
    switch (status) {
      case 'low': return 'text-blue-500'
      case 'optimal': return 'text-green-500'
      case 'high': return 'text-yellow-500'
      case 'overloaded': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        {retryCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Retrying... (Attempt {retryCount}/3)
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Learning Tools</h3>
        <p className="text-muted-foreground mb-4 max-w-md">{error}</p>
        <Button
          onClick={() => {
            if (user) {
              setLoading(true)
              setError(null)
              loadDataWithRetry(user.uid)
            }
          }}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Advanced Learning Tools
          </h2>
          <p className="text-muted-foreground">AI-powered learning optimization and insights</p>
        </div>
      </div>

      <Tabs defaultValue="paths" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="cognitive">Cognitive Load</TabsTrigger>
          <TabsTrigger value="gaps">Knowledge Gaps</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="paths" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {learningPaths.map((path) => (
              <Card key={path.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{path.name}</CardTitle>
                    <Badge variant={path.difficulty === 'advanced' ? 'destructive' : 'secondary'}>
                      {path.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{path.subject}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(path.progress)}%</span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {path.skills.map((skill) => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Next: {path.nextMilestone}</p>
                    <p>Est. completion: {path.estimatedCompletion.toLocaleDateString()}</p>
                  </div>

                  <Button size="sm" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Cognitive Load Monitor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {Math.round(cognitiveLoad.current)}%
                </div>
                <div className={`text-lg font-medium ${getCognitiveLoadColor(cognitiveLoad.status)}`}>
                  {cognitiveLoad.status.charAt(0).toUpperCase() + cognitiveLoad.status.slice(1)} Load
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Load</span>
                  <span>Optimal (70%)</span>
                </div>
                <div className="relative">
                  <Progress value={cognitiveLoad.current} className="h-3" />
                  <div
                    className="absolute top-0 h-3 w-1 bg-green-500 rounded"
                    style={{ left: `${cognitiveLoad.optimal}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-semibold">Study Time</div>
                  <div className="text-sm text-muted-foreground">2.5h today</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Zap className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="font-semibold">Focus Score</div>
                  <div className="text-sm text-muted-foreground">85%</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Brain className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-semibold">Retention</div>
                  <div className="text-sm text-muted-foreground">92%</div>
                </div>
              </div>

              {cognitiveLoad.status === 'overloaded' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">High Cognitive Load Detected</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    Consider taking a break or reducing study intensity to prevent burnout.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Knowledge Gap Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Areas that need attention based on your learning patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {knowledgeGaps.map((gap, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{gap.topic}</h4>
                        <Badge className={getPriorityColor(gap.priority)}>
                          {gap.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Confidence: {Math.round(gap.confidence)}%</span>
                        <span>Last reviewed: {gap.lastReviewed.toLocaleDateString()}</span>
                        <span>Review by: {gap.recommendedReview.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Progress Prediction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    +{Math.round(predictedProgress)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Predicted improvement this week
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current</span>
                    <span>Predicted</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>75%</span>
                    <span>{Math.round(75 + predictedProgress)}%</span>
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">On Track</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    You're performing above average. Keep it up!
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Optimal Study Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {optimalStudyTime ? (
                  <>
                    <div className="text-center">
                      <div className="text-3xl font-bold mb-2">
                        {optimalStudyTime.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Best time for focused study
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Performance</span>
                        <span>95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>

                    <Button className="w-full">
                      <Timer className="w-4 h-4 mr-2" />
                      Schedule Study Session
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Not enough data to determine optimal study time
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievement Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Star className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <div className="font-semibold">Consistency Streak</div>
                  <div className="text-sm text-muted-foreground">7 days predicted</div>
                  <div className="text-xs text-yellow-600 mt-1">85% chance</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="font-semibold">Subject Mastery</div>
                  <div className="text-sm text-muted-foreground">Mathematics</div>
                  <div className="text-xs text-blue-600 mt-1">Next 2 weeks</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Flame className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="font-semibold">Study Milestone</div>
                  <div className="text-sm text-muted-foreground">100 hours</div>
                  <div className="text-xs text-purple-600 mt-1">This month</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}