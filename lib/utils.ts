import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==================== LEARNING ANALYTICS ====================

export interface LearningSession {
  subject: string
  duration: number // minutes
  score?: number
  date: Date
  type: 'study' | 'practice' | 'review' | 'exam'
}

export interface LearningPattern {
  subject: string
  averageScore: number
  totalTime: number
  sessionsCount: number
  bestTimeOfDay: string
  improvementRate: number // points per session
  recommendedFrequency: number // sessions per week
  weakTopics: string[]
}

export function analyzeLearningPatterns(sessions: LearningSession[]): LearningPattern[] {
  const subjectGroups = sessions.reduce((acc, session) => {
    if (!acc[session.subject]) {
      acc[session.subject] = []
    }
    acc[session.subject].push(session)
    return acc
  }, {} as Record<string, LearningSession[]>)

  return Object.entries(subjectGroups).map(([subject, subjSessions]) => {
    const scores = subjSessions.filter(s => s.score !== undefined).map(s => s.score!)
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    
    const totalTime = subjSessions.reduce((sum, s) => sum + s.duration, 0)
    const sessionsCount = subjSessions.length
    
    // Find best time of day
    const hourGroups = subjSessions.reduce((acc, s) => {
      const hour = s.date.getHours()
      if (!acc[hour]) acc[hour] = []
      acc[hour].push(s)
      return acc
    }, {} as Record<number, LearningSession[]>)
    
    const bestHour = Object.entries(hourGroups)
      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || '9'
    
    const bestTimeOfDay = `${bestHour}:00`

    // Calculate improvement rate
    const sortedByDate = subjSessions
      .filter(s => s.score !== undefined)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    
    let improvementRate = 0
    if (sortedByDate.length >= 2) {
      const firstScore = sortedByDate[0].score!
      const lastScore = sortedByDate[sortedByDate.length - 1].score!
      improvementRate = (lastScore - firstScore) / (sortedByDate.length - 1)
    }

    // Recommended frequency based on current performance
    let recommendedFrequency = 3 // default
    if (averageScore > 90) recommendedFrequency = 2
    else if (averageScore < 70) recommendedFrequency = 5

    // Identify weak topics (mock - in real app, analyze content)
    const weakTopics = averageScore < 80 ? ['Fundamentals', 'Problem solving'] : []

    return {
      subject,
      averageScore,
      totalTime,
      sessionsCount,
      bestTimeOfDay,
      improvementRate,
      recommendedFrequency,
      weakTopics
    }
  })
}

export function predictOptimalStudyTime(patterns: LearningPattern[]): {
  bestDayTime: string
  recommendedDuration: number
  subjectsToFocus: string[]
} {
  // Find most productive time across subjects
  const times = patterns.map(p => p.bestTimeOfDay)
  const bestDayTime = times.sort((a, b) => 
    times.filter(t => t === b).length - times.filter(t => t === a).length
  )[0] || '09:00'

  // Average recommended duration
  const avgDuration = patterns.reduce((sum, p) => sum + (p.totalTime / p.sessionsCount), 0) / patterns.length
  const recommendedDuration = Math.max(25, Math.min(120, avgDuration)) // 25-120 min

  // Subjects needing most attention
  const subjectsToFocus = patterns
    .filter(p => p.averageScore < 85 || p.improvementRate < 2)
    .map(p => p.subject)
    .slice(0, 3)

  return { bestDayTime, recommendedDuration, subjectsToFocus }
}

export function calculateCognitiveLoad(
  studySessions: Array<{ duration: number; startTime: Date; focusScore?: number }>,
  timeWindow: number = 7 // days
): { current: number; optimal: number; status: 'low' | 'optimal' | 'high' | 'overloaded' } {
  const now = new Date()
  const windowStart = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000)

  const recentSessions = studySessions.filter(session =>
    new Date(session.startTime) >= windowStart
  )

  // Calculate total study time in the window
  const totalStudyMinutes = recentSessions.reduce((acc, session) => acc + session.duration, 0)

  // Calculate average focus score
  const avgFocusScore = recentSessions.length > 0
    ? recentSessions.reduce((acc, session) => acc + (session.focusScore || 80), 0) / recentSessions.length
    : 80

  // Optimal study time per week (2 hours/day = 14 hours/week = 840 minutes)
  const optimalMinutes = timeWindow * 2 * 60

  // Cognitive load percentage (adjusted by focus score)
  const baseLoad = (totalStudyMinutes / optimalMinutes) * 100
  const adjustedLoad = baseLoad * (avgFocusScore / 100)

  // Determine status
  let status: 'low' | 'optimal' | 'high' | 'overloaded'
  if (adjustedLoad < 40) status = 'low'
  else if (adjustedLoad < 80) status = 'optimal'
  else if (adjustedLoad < 110) status = 'high'
  else status = 'overloaded'

  return {
    current: Math.min(adjustedLoad, 150), // Cap at 150%
    optimal: 75, // 75% is optimal
    status
  }
}

export function generateSpacedRepetitionSchedule(
  items: { id: string; lastReviewed: Date; difficulty: number; correctStreak: number; totalAttempts: number }[],
  currentDate: Date = new Date()
): { itemId: string; nextReview: Date; priority: number; interval: number }[] {
  return items.map(item => {
    const daysSinceReview = Math.floor((currentDate.getTime() - item.lastReviewed.getTime()) / (1000 * 60 * 60 * 24))

    // Enhanced spaced repetition using modified SM-2 algorithm
    const baseIntervals = [1, 3, 7, 14, 30, 60, 120, 240] // Fibonacci-like progression
    const difficultyMultiplier = Math.max(0.5, Math.min(2.0, item.difficulty + 0.5)) // 0.5-2.0 range
    const streakBonus = Math.min(item.correctStreak * 0.1, 1.0) // Up to 10% bonus per correct streak

    // Calculate optimal interval
    let intervalIndex = Math.min(Math.floor(daysSinceReview / 7), baseIntervals.length - 1)
    let interval = baseIntervals[intervalIndex] * difficultyMultiplier * (1 + streakBonus)

    // Cap interval at 1 year for very easy/well-known items
    interval = Math.min(interval, 365)

    const nextReview = new Date(item.lastReviewed)
    nextReview.setDate(nextReview.getDate() + interval)

    // Calculate priority based on multiple factors
    const overdueDays = Math.max(0, currentDate.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24)
    const difficultyPriority = item.difficulty * 2 // Harder items get higher priority
    const overduePriority = overdueDays * 0.5 // Overdue items get priority boost
    const streakPriority = item.correctStreak > 0 ? 0 : 1 // New/incorrect items get priority

    const priority = Math.min(difficultyPriority + overduePriority + streakPriority, 10) // Cap at 10

    return {
      itemId: item.id,
      nextReview,
      priority,
      interval: Math.round(interval)
    }
  }).sort((a, b) => b.priority - a.priority)
}

export function analyzeKnowledgeGaps(
  flashcards: Array<{ id: string; deckId: string; lastReviewed: Date; correctStreak: number; totalAttempts: number; difficulty: number }>,
  studySessions: Array<{ subject: string; startTime: Date; duration: number }>,
  timeWindow: number = 30 // days
): Array<{ topic: string; confidence: number; lastReviewed: Date; recommendedReview: Date; priority: 'low' | 'medium' | 'high' }> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - timeWindow * 24 * 60 * 60 * 1000)

  // Group flashcards by subject/topic (using deckId as proxy)
  const topicGroups = flashcards.reduce((acc, card) => {
    const topic = `Topic_${card.deckId}`
    if (!acc[topic]) acc[topic] = []
    acc[topic].push(card)
    return acc
  }, {} as Record<string, typeof flashcards>)

  const gaps: Array<{ topic: string; confidence: number; lastReviewed: Date; recommendedReview: Date; priority: 'low' | 'medium' | 'high' }> = []

  for (const [topic, cards] of Object.entries(topicGroups)) {
    // Calculate confidence based on performance metrics
    const avgCorrectStreak = cards.reduce((acc, card) => acc + card.correctStreak, 0) / cards.length
    const avgAccuracy = cards.reduce((acc, card) => {
      const accuracy = card.totalAttempts > 0 ? (card.correctStreak / card.totalAttempts) * 100 : 0
      return acc + accuracy
    }, 0) / cards.length

    const confidence = Math.min((avgCorrectStreak * 10 + avgAccuracy) / 2, 100)

    // Find most recent review
    const lastReviewed = cards.reduce((latest, card) =>
      card.lastReviewed > latest ? card.lastReviewed : latest,
      new Date(0)
    )

    // Calculate recommended review date based on confidence and time since last review
    const daysSinceReview = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24))
    const baseInterval = Math.max(1, 7 - Math.floor(confidence / 20)) // 1-7 days based on confidence
    const recommendedReview = new Date(lastReviewed.getTime() + baseInterval * 24 * 60 * 60 * 1000)

    // Determine priority
    let priority: 'low' | 'medium' | 'high' = 'low'
    if (confidence < 50 || daysSinceReview > 14) priority = 'high'
    else if (confidence < 75 || daysSinceReview > 7) priority = 'medium'

    gaps.push({
      topic: topic.replace('Topic_', 'Subject '),
      confidence,
      lastReviewed,
      recommendedReview,
      priority
    })
  }

  // Sort by priority and confidence
  return gaps.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.confidence - b.confidence // Lower confidence first
  })
}
