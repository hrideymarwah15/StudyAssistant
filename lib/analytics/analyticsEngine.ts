"use client"

import { Task, Course, Habit, DailyStats, StudySession, HabitCompletion } from '@/lib/firestore'

export interface AnalyticsContext {
  userId: string
  tasks: Task[]
  courses: Course[]
  habits: Habit[]
  dailyStats: DailyStats[]
  studySessions: StudySession[]
  dateRange: {
    start: Date
    end: Date
  }
}

export interface ProgressMetrics {
  totalStudyTime: number
  averageDailyStudy: number
  currentStreak: number
  longestStreak: number
  tasksCompleted: number
  tasksCreated: number
  completionRate: number
  habitsCompleted: number
  habitsStreak: number
  coursesActive: number
}

export interface TrendData {
  studyTimeTrend: Array<{ date: string; minutes: number }>
  taskCompletionTrend: Array<{ date: string; completed: number; created: number }>
  habitCompletionTrend: Array<{ date: string; completed: number }>
  productivityTrend: Array<{ date: string; score: number }>
}

export interface HeatmapData {
  date: string
  studyMinutes: number
  tasksCompleted: number
  habitsCompleted: number
  intensity: number // 0-4 scale
}

export interface PredictiveInsights {
  nextWeekPrediction: {
    studyHours: number
    tasksToComplete: number
    habitsToMaintain: number
  }
  riskFactors: Array<{
    type: 'streak' | 'productivity' | 'overdue_tasks' | 'habit_slip'
    severity: 'low' | 'medium' | 'high'
    message: string
    recommendation: string
  }>
  opportunities: Array<{
    type: 'study_time' | 'habit_building' | 'task_focus'
    potential: 'low' | 'medium' | 'high'
    message: string
    action: string
  }>
}

export interface ProgressArc {
  subject: string
  current: number
  target: number
  unit: string
  percentage: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  color: string
}

export class AnalyticsEngine {
  private context: AnalyticsContext

  constructor(context: AnalyticsContext) {
    this.context = context
  }

  updateContext(newContext: Partial<AnalyticsContext>) {
    this.context = { ...this.context, ...newContext }
  }

  calculateProgressMetrics(): ProgressMetrics {
    const { tasks, habits, dailyStats, studySessions, dateRange } = this.context

    // Filter data by date range
    const filteredTasks = tasks.filter(t =>
      t.createdAt >= dateRange.start && t.createdAt <= dateRange.end
    )
    const filteredStats = dailyStats.filter(s =>
      s.date >= dateRange.start && s.date <= dateRange.end
    )
    const filteredSessions = studySessions.filter(s =>
      s.startTime >= dateRange.start && s.startTime <= dateRange.end
    )

    // Calculate metrics
    const totalStudyTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0)
    const daysInRange = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))
    const averageDailyStudy = totalStudyTime / Math.max(daysInRange, 1)

    // Calculate streaks
    const streaks = this.calculateStreaks(filteredStats)
    const currentStreak = streaks.current
    const longestStreak = streaks.longest

    // Task metrics
    const tasksCompleted = filteredTasks.filter(t => t.status === 'done').length
    const tasksCreated = filteredTasks.length
    const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0

    // Habit metrics
    const habitsCompleted = habits.reduce((sum, h) => {
      const completions = h.completions.filter(c =>
        c.date >= this.formatDate(dateRange.start) &&
        c.date <= this.formatDate(dateRange.end) &&
        c.completed
      )
      return sum + completions.length
    }, 0)

    const habitsStreak = habits.length > 0 ?
      habits.reduce((sum, h) => sum + h.currentStreak, 0) / habits.length : 0

    return {
      totalStudyTime,
      averageDailyStudy,
      currentStreak,
      longestStreak,
      tasksCompleted,
      tasksCreated,
      completionRate,
      habitsCompleted,
      habitsStreak,
      coursesActive: this.context.courses.length
    }
  }

  generateTrendData(): TrendData {
    const { dailyStats, tasks, dateRange } = this.context
    const days = this.getDaysInRange(dateRange.start, dateRange.end)

    const studyTimeTrend = days.map(date => {
      const dayStats = dailyStats.find(s => this.formatDate(s.date) === date)
      return {
        date,
        minutes: dayStats?.totalStudyMinutes || 0
      }
    })

    const taskCompletionTrend = days.map(date => {
      const dayTasks = tasks.filter(t =>
        this.formatDate(t.createdAt) === date || (t.completedAt && this.formatDate(t.completedAt) === date)
      )
      const completed = dayTasks.filter(t => t.status === 'done').length
      const created = dayTasks.length

      return { date, completed, created }
    })

    const habitCompletionTrend = days.map(date => {
      const completed = this.context.habits.reduce((sum, h) => {
        const completion = h.completions.find(c => c.date === date && c.completed)
        return sum + (completion ? 1 : 0)
      }, 0)

      return { date, completed }
    })

    const productivityTrend = days.map(date => {
      const dayStats = dailyStats.find(s => this.formatDate(s.date) === date)
      return {
        date,
        score: dayStats?.productivityAvg || 0
      }
    })

    return {
      studyTimeTrend,
      taskCompletionTrend,
      habitCompletionTrend,
      productivityTrend
    }
  }

  generateHeatmapData(): HeatmapData[] {
    const { dailyStats, tasks, habits, dateRange } = this.context
    const days = this.getDaysInRange(dateRange.start, dateRange.end)

    return days.map(date => {
      const dayStats = dailyStats.find(s => this.formatDate(s.date) === date)
      const dayTasks = tasks.filter(t =>
        (t.completedAt && this.formatDate(t.completedAt) === date) ||
        (t.dueDate && this.formatDate(t.dueDate) === date)
      )
      const dayHabits = habits.reduce((sum, h) => {
        const completion = h.completions.find(c => c.date === date && c.completed)
        return sum + (completion ? 1 : 0)
      }, 0)

      const studyMinutes = dayStats?.totalStudyMinutes || 0
      const tasksCompleted = dayTasks.filter(t => t.status === 'done').length

      // Calculate intensity (0-4 scale)
      let intensity = 0
      if (studyMinutes > 0) intensity++
      if (studyMinutes >= 60) intensity++ // 1+ hours
      if (tasksCompleted > 0) intensity++
      if (dayHabits > 0) intensity++
      if (studyMinutes >= 120 || tasksCompleted >= 3 || dayHabits >= habits.length) intensity = Math.min(intensity + 1, 4)

      return {
        date,
        studyMinutes,
        tasksCompleted,
        habitsCompleted: dayHabits,
        intensity
      }
    })
  }

  generatePredictiveInsights(): PredictiveInsights {
    const metrics = this.calculateProgressMetrics()
    const trends = this.generateTrendData()

    // Calculate next week prediction
    const avgStudyTime = trends.studyTimeTrend.reduce((sum, d) => sum + d.minutes, 0) / trends.studyTimeTrend.length
    const avgTasksCompleted = trends.taskCompletionTrend.reduce((sum, d) => sum + d.completed, 0) / trends.taskCompletionTrend.length
    const avgHabitsCompleted = trends.habitCompletionTrend.reduce((sum, d) => sum + d.completed, 0) / trends.habitCompletionTrend.length

    const nextWeekPrediction = {
      studyHours: Math.round((avgStudyTime * 7) / 60 * 10) / 10,
      tasksToComplete: Math.round(avgTasksCompleted * 7),
      habitsToMaintain: Math.round(avgHabitsCompleted * 7 / Math.max(this.context.habits.length, 1))
    }

    // Identify risk factors
    const riskFactors: Array<{
      type: 'streak' | 'productivity' | 'overdue_tasks' | 'habit_slip'
      severity: 'low' | 'medium' | 'high'
      message: string
      recommendation: string
    }> = []

    if (metrics.currentStreak < 3) {
      riskFactors.push({
        type: 'streak' as const,
        severity: metrics.currentStreak === 0 ? 'high' : 'medium',
        message: `Study streak is ${metrics.currentStreak === 0 ? 'broken' : 'weak'} (${metrics.currentStreak} days)`,
        recommendation: 'Start a study session today to rebuild momentum'
      })
    }

    const overdueTasks = this.context.tasks.filter(t =>
      t.dueDate && t.dueDate < new Date() && t.status !== 'done'
    )
    if (overdueTasks.length > 0) {
      riskFactors.push({
        type: 'overdue_tasks' as const,
        severity: overdueTasks.length > 3 ? 'high' : 'medium',
        message: `${overdueTasks.length} tasks are overdue`,
        recommendation: 'Focus on completing overdue tasks to reduce stress'
      })
    }

    const slippingHabits = this.context.habits.filter(h => h.currentStreak < 3)
    if (slippingHabits.length > 0) {
      riskFactors.push({
        type: 'habit_slip' as const,
        severity: slippingHabits.length > this.context.habits.length / 2 ? 'high' : 'medium',
        message: `${slippingHabits.length} habit${slippingHabits.length > 1 ? 's' : ''} at risk of breaking`,
        recommendation: 'Complete habits today to maintain consistency'
      })
    }

    // Identify opportunities
    const opportunities: Array<{
      type: 'study_time' | 'habit_building' | 'task_focus'
      potential: 'low' | 'medium' | 'high'
      message: string
      action: string
    }> = []

    if (metrics.averageDailyStudy < 90) { // Less than 1.5 hours
      opportunities.push({
        type: 'study_time' as const,
        potential: metrics.averageDailyStudy < 30 ? 'high' : 'medium',
        message: 'Study time could be increased for better retention',
        action: 'Aim for 2 hours of focused study daily'
      })
    }

    if (metrics.habitsStreak < 5 && this.context.habits.length > 0) {
      opportunities.push({
        type: 'habit_building' as const,
        potential: 'medium',
        message: 'Building stronger habit streaks will improve consistency',
        action: 'Focus on maintaining daily habits for the next week'
      })
    }

    if (metrics.completionRate < 70) {
      opportunities.push({
        type: 'task_focus' as const,
        potential: 'high',
        message: 'Task completion rate could be improved',
        action: 'Break large tasks into smaller, manageable steps'
      })
    }

    return {
      nextWeekPrediction,
      riskFactors,
      opportunities
    }
  }

  generateProgressArcs(): ProgressArc[] {
    const metrics = this.calculateProgressMetrics()
    const trends = this.generateTrendData()

    const arcs: ProgressArc[] = []

    // Study Time Arc
    const weeklyStudyGoal = 14 * 60 // 14 hours per week
    const weeklyStudyActual = metrics.totalStudyTime
    arcs.push({
      subject: 'Weekly Study Time',
      current: weeklyStudyActual,
      target: weeklyStudyGoal,
      unit: 'minutes',
      percentage: Math.min((weeklyStudyActual / weeklyStudyGoal) * 100, 100),
      trend: this.calculateTrend(trends.studyTimeTrend.map(d => d.minutes)),
      trendValue: this.calculateTrendValue(trends.studyTimeTrend.map(d => d.minutes)),
      color: weeklyStudyActual >= weeklyStudyGoal ? '#10b981' : weeklyStudyActual >= weeklyStudyGoal * 0.7 ? '#f59e0b' : '#ef4444'
    })

    // Task Completion Arc
    const weeklyTaskGoal = 10 // 10 tasks per week
    const weeklyTasksCompleted = metrics.tasksCompleted
    arcs.push({
      subject: 'Weekly Tasks',
      current: weeklyTasksCompleted,
      target: weeklyTaskGoal,
      unit: 'tasks',
      percentage: Math.min((weeklyTasksCompleted / weeklyTaskGoal) * 100, 100),
      trend: this.calculateTrend(trends.taskCompletionTrend.map(d => d.completed)),
      trendValue: this.calculateTrendValue(trends.taskCompletionTrend.map(d => d.completed)),
      color: weeklyTasksCompleted >= weeklyTaskGoal ? '#10b981' : weeklyTasksCompleted >= weeklyTaskGoal * 0.7 ? '#f59e0b' : '#ef4444'
    })

    // Habit Consistency Arc
    const habitGoal = this.context.habits.length * 7 // All habits every day for a week
    const habitActual = metrics.habitsCompleted
    arcs.push({
      subject: 'Habit Consistency',
      current: habitActual,
      target: habitGoal,
      unit: 'completions',
      percentage: Math.min((habitActual / habitGoal) * 100, 100),
      trend: this.calculateTrend(trends.habitCompletionTrend.map(d => d.completed)),
      trendValue: this.calculateTrendValue(trends.habitCompletionTrend.map(d => d.completed)),
      color: habitActual >= habitGoal ? '#10b981' : habitActual >= habitGoal * 0.7 ? '#f59e0b' : '#ef4444'
    })

    // Study Streak Arc
    const streakGoal = 30 // 30 day streak goal
    arcs.push({
      subject: 'Study Streak',
      current: metrics.currentStreak,
      target: streakGoal,
      unit: 'days',
      percentage: Math.min((metrics.currentStreak / streakGoal) * 100, 100),
      trend: metrics.currentStreak > 0 ? 'up' : 'stable',
      trendValue: metrics.currentStreak,
      color: metrics.currentStreak >= streakGoal ? '#10b981' : metrics.currentStreak >= streakGoal * 0.5 ? '#f59e0b' : '#ef4444'
    })

    return arcs
  }

  private calculateStreaks(dailyStats: DailyStats[]): { current: number; longest: number } {
    if (dailyStats.length === 0) return { current: 0, longest: 0 }

    // Sort by date
    const sortedStats = dailyStats.sort((a, b) => a.date.getTime() - b.date.getTime())

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = sortedStats.length - 1; i >= 0; i--) {
      const stat = sortedStats[i]
      if (stat.totalStudyMinutes > 0) {
        tempStreak++
        if (i === sortedStats.length - 1) currentStreak = tempStreak
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak
        tempStreak = 0
      }
    }

    if (tempStreak > longestStreak) longestStreak = tempStreak

    return { current: currentStreak, longest: longestStreak }
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable'

    const recent = values.slice(-7) // Last 7 days
    const previous = values.slice(-14, -7) // Previous 7 days

    if (recent.length === 0 || previous.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length

    const change = ((recentAvg - previousAvg) / Math.max(previousAvg, 1)) * 100

    if (change > 10) return 'up'
    if (change < -10) return 'down'
    return 'stable'
  }

  private calculateTrendValue(values: number[]): number {
    if (values.length < 2) return 0

    const recent = values.slice(-7)
    const previous = values.slice(-14, -7)

    if (recent.length === 0 || previous.length === 0) return 0

    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length
    const previousAvg = previous.reduce((sum, v) => sum + v, 0) / previous.length

    return Math.round(recentAvg - previousAvg)
  }

  private getDaysInRange(start: Date, end: Date): string[] {
    const days: string[] = []
    const current = new Date(start)

    while (current <= end) {
      days.push(this.formatDate(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }
}

// Singleton instance
let analyticsEngine: AnalyticsEngine | null = null

export function getAnalyticsEngine(context: AnalyticsContext): AnalyticsEngine {
  if (!analyticsEngine) {
    analyticsEngine = new AnalyticsEngine(context)
  } else {
    analyticsEngine.updateContext(context)
  }
  return analyticsEngine
}

export function createAnalyticsContext(
  userId: string,
  tasks: Task[],
  courses: Course[],
  habits: Habit[],
  dailyStats: DailyStats[],
  studySessions: StudySession[],
  days: number = 30
): AnalyticsContext {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)

  return {
    userId,
    tasks,
    courses,
    habits,
    dailyStats,
    studySessions,
    dateRange: { start, end }
  }
}