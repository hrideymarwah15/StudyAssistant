"use client"

import { Task, Course, Habit, DailyStats } from "@/lib/firestore"

export interface RecommendationScore {
  id: string
  type: 'task' | 'flashcard_review' | 'habit' | 'focus_session' | 'study_planning'
  title: string
  description: string
  score: number
  urgency: number
  importance: number
  streakImpact: number
  reasoning: string[]
  action: {
    type: string
    data?: any
  }
}

export interface RecommendationContext {
  tasks: Task[]
  courses: Course[]
  habits: Habit[]
  dailyStats?: DailyStats
  currentTime: Date
  userStreak?: number
}

export class RecommendationEngine {
  private context: RecommendationContext
  private cache: Map<string, { recommendations: RecommendationScore[], timestamp: number }>
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor(context: RecommendationContext) {
    this.context = context
    this.cache = new Map()
  }

  updateContext(newContext: Partial<RecommendationContext>) {
    this.context = { ...this.context, ...newContext }
    // Invalidate cache when context changes
    this.cache.clear()
  }

  getRecommendations(limit: number = 5): RecommendationScore[] {
    const cacheKey = this.getCacheKey()
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.recommendations.slice(0, limit)
    }

    const recommendations = this.calculateRecommendations()
    const sorted = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    this.cache.set(cacheKey, { recommendations: sorted, timestamp: Date.now() })
    return sorted
  }

  private getCacheKey(): string {
    const { tasks, habits, dailyStats, currentTime } = this.context
    return `${tasks.length}-${habits.length}-${dailyStats?.totalStudyMinutes || 0}-${currentTime.getHours()}`
  }

  private calculateRecommendations(): RecommendationScore[] {
    const recommendations: RecommendationScore[] = []

    // Task-based recommendations
    recommendations.push(...this.generateTaskRecommendations())

    // Habit-based recommendations
    recommendations.push(...this.generateHabitRecommendations())

    // Study planning recommendations
    recommendations.push(...this.generateStudyPlanningRecommendations())

    // Focus session recommendations
    recommendations.push(...this.generateFocusRecommendations())

    return recommendations
  }

  private generateTaskRecommendations(): RecommendationScore[] {
    const recommendations: RecommendationScore[] = []
    const now = this.context.currentTime
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (const task of this.context.tasks) {
      if (task.status === 'done') continue

      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const urgency = this.calculateUrgency(dueDate, now)
      const importance = this.calculateTaskImportance(task)
      const streakImpact = this.calculateStreakImpact(task)

      const score = (urgency * 0.4) + (importance * 0.4) + (streakImpact * 0.2)

      if (score > 0.3) { // Only include meaningful recommendations
        const reasoning = []
        if (urgency > 0.7) reasoning.push("Due soon")
        if (importance > 0.7) reasoning.push("High priority")
        if (streakImpact > 0.5) reasoning.push("Maintains study streak")

        recommendations.push({
          id: `task-${task.id}`,
          type: 'task',
          title: `Complete: ${task.title}`,
          description: task.description || "Focus on this important task",
          score,
          urgency,
          importance,
          streakImpact,
          reasoning,
          action: {
            type: 'navigate',
            data: { path: '/planner', filter: 'task', taskId: task.id }
          }
        })
      }
    }

    return recommendations
  }

  private generateHabitRecommendations(): RecommendationScore[] {
    const recommendations: RecommendationScore[] = []
    const now = this.context.currentTime
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    for (const habit of this.context.habits) {
      const todayCompletions = habit.completions.filter(
        c => c.date === today.toISOString().split('T')[0] && c.completed
      )

      if (todayCompletions.length > 0) continue // Already completed today

      const streakImpact = habit.currentStreak > 0 ? Math.min(habit.currentStreak / 7, 1) : 0
      const importance = habit.frequency === 'daily' ? 0.8 : 0.6
      const urgency = this.calculateHabitUrgency(habit, today)

      const score = (urgency * 0.3) + (importance * 0.3) + (streakImpact * 0.4)

      if (score > 0.4) {
        const reasoning = []
        if (streakImpact > 0.7) reasoning.push(`${habit.currentStreak} day streak at risk`)
        if (urgency > 0.8) reasoning.push("Due today")
        if (importance > 0.7) reasoning.push("Daily habit")

        recommendations.push({
          id: `habit-${habit.id}`,
          type: 'habit',
          title: `Complete: ${habit.name}`,
          description: habit.description || "Build consistency with this habit",
          score,
          urgency,
          importance,
          streakImpact,
          reasoning,
          action: {
            type: 'toggle_habit',
            data: { habitId: habit.id }
          }
        })
      }
    }

    return recommendations
  }

  private generateStudyPlanningRecommendations(): RecommendationScore[] {
    const recommendations: RecommendationScore[] = []
    const { dailyStats, tasks, currentTime } = this.context

    // Check if user has studied enough today
    const studyMinutes = dailyStats?.totalStudyMinutes || 0
    const targetMinutes = 120 // 2 hours target

    if (studyMinutes < targetMinutes * 0.5) { // Less than half target
      const urgency = Math.max(0, 1 - (studyMinutes / targetMinutes))
      const importance = 0.8
      const streakImpact = this.context.userStreak ? Math.min(this.context.userStreak / 30, 1) : 0

      const score = (urgency * 0.4) + (importance * 0.4) + (streakImpact * 0.2)

      recommendations.push({
        id: 'study-planning-today',
        type: 'study_planning',
        title: 'Plan study session for today',
        description: `You've studied ${Math.round(studyMinutes / 60 * 10) / 10}h today. Aim for ${targetMinutes / 60}h total.`,
        score,
        urgency,
        importance,
        streakImpact,
        reasoning: [
          studyMinutes === 0 ? "No study time logged today" : "Below daily study target",
          "Consistent study builds better retention"
        ],
        action: {
          type: 'navigate',
          data: { path: '/planner', action: 'schedule_study' }
        }
      })
    }

    // Check for upcoming deadlines
    const upcomingTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      const daysUntilDue = Math.ceil((dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilDue <= 7 && daysUntilDue > 0
    })

    if (upcomingTasks.length > 0) {
      recommendations.push({
        id: 'upcoming-deadlines',
        type: 'study_planning',
        title: 'Review upcoming deadlines',
        description: `${upcomingTasks.length} task${upcomingTasks.length > 1 ? 's' : ''} due in the next week`,
        score: 0.7,
        urgency: 0.6,
        importance: 0.8,
        streakImpact: 0.3,
        reasoning: [
          "Prepare ahead for better performance",
          `${upcomingTasks.length} deadline${upcomingTasks.length > 1 ? 's' : ''} approaching`
        ],
        action: {
          type: 'navigate',
          data: { path: '/planner', filter: 'upcoming' }
        }
      })
    }

    return recommendations
  }

  private generateFocusRecommendations(): RecommendationScore[] {
    const recommendations: RecommendationScore[] = []
    const { dailyStats, currentTime } = this.context

    const studyMinutes = dailyStats?.totalStudyMinutes || 0
    const sessionsToday = dailyStats?.pomodoroCompleted || 0

    // Recommend focus session if haven't had one recently
    const hoursSinceLastSession = 2 // Simplified - in real app, track actual session times

    if (hoursSinceLastSession >= 2 && studyMinutes < 180) { // Less than 3 hours total
      const urgency = Math.min(hoursSinceLastSession / 4, 1) // Increases over time
      const importance = 0.7
      const streakImpact = 0.4

      const score = (urgency * 0.4) + (importance * 0.4) + (streakImpact * 0.2)

      recommendations.push({
        id: 'focus-session',
        type: 'focus_session',
        title: 'Start a focus session',
        description: '25 minutes of deep, distraction-free work',
        score,
        urgency,
        importance,
        streakImpact,
        reasoning: [
          hoursSinceLastSession >= 4 ? "It's been a while since your last focus session" : "Ready for focused work",
          "Deep work sessions improve learning efficiency"
        ],
        action: {
          type: 'start_focus',
          data: { duration: 25 }
        }
      })
    }

    return recommendations
  }

  private calculateUrgency(dueDate: Date | null, now: Date): number {
    if (!dueDate) return 0.3 // Default medium urgency for tasks without due dates

    const timeDiff = dueDate.getTime() - now.getTime()
    const hoursUntilDue = timeDiff / (1000 * 60 * 60)

    if (hoursUntilDue < 0) return 1.0 // Overdue - maximum urgency
    if (hoursUntilDue <= 24) return 0.9 // Due within 24 hours
    if (hoursUntilDue <= 72) return 0.7 // Due within 3 days
    if (hoursUntilDue <= 168) return 0.5 // Due within a week
    return 0.2 // Due later
  }

  private calculateTaskImportance(task: Task): number {
    let importance = 0.5 // Base importance

    // Priority-based importance
    switch (task.priority) {
      case 'urgent': importance += 0.3; break
      case 'high': importance += 0.2; break
      case 'medium': importance += 0.1; break
    }

    // Course weight (if available)
    if (task.course) {
      // Could add course-based importance logic here if needed
      importance += 0.05 // Slight boost for tasks with courses
    }

    return Math.min(importance, 1.0)
  }

  private calculateStreakImpact(task: Task): number {
    // Simplified streak calculation - in real app, this would be more sophisticated
    const userStreak = this.context.userStreak || 0
    return userStreak > 0 ? Math.min(userStreak / 10, 0.5) : 0
  }

  private calculateHabitUrgency(habit: Habit, today: Date): number {
    const todayStr = today.toISOString().split('T')[0]
    const completedToday = habit.completions.some(
      c => c.date === todayStr && c.completed
    )

    if (completedToday) return 0

    // Higher urgency for daily habits and longer streaks
    let urgency = habit.frequency === 'daily' ? 0.8 : 0.6
    urgency += Math.min(habit.currentStreak / 7, 0.2) // Bonus for streaks

    return Math.min(urgency, 1.0)
  }
}

// Singleton instance for the app
let recommendationEngine: RecommendationEngine | null = null

export function getRecommendationEngine(context: RecommendationContext): RecommendationEngine {
  if (!recommendationEngine) {
    recommendationEngine = new RecommendationEngine(context)
  } else {
    recommendationEngine.updateContext(context)
  }
  return recommendationEngine
}

export function invalidateRecommendationCache() {
  if (recommendationEngine) {
    recommendationEngine['cache'].clear()
  }
}