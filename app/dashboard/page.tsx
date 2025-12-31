"use client"

import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getCalendarEvents, getHabits, getDailyStats, getCourses, toggleHabitCompletion,
  type Task, type CalendarEvent, type Habit, type DailyStats, type Course
} from "@/lib/firestore"
import { analyzeLearningPatterns, generateStudyPlan, type LearningAnalysis, type StudyPlanItem } from "@/lib/ai-client"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import {
  Clock, Calendar, CheckCircle2, Target, Flame, BookOpen,
  ChevronRight, Play, Plus, TrendingUp, Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Layout from "@/components/Layout"
import { NextActions } from "@/components/dashboard/NextActions"
import { FocusHero } from "@/components/dashboard/FocusHero"
import { StatsRow } from "@/components/dashboard/StatsRow"
import { WeekGlance } from "@/components/dashboard/WeekGlance"
import { TodayTasks } from "@/components/dashboard/TodayTasks"
import { TodaySchedule } from "@/components/dashboard/TodaySchedule"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { TodayAtGlance } from "@/components/dashboard/TodayAtGlance"
import { HabitsBlock } from "@/components/dashboard/HabitsBlock"
import { usePersistentTasks } from "@/lib/hooks/usePersistentTasks"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<LearningAnalysis | null>(null)
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([])
  const [showAiInsights, setShowAiInsights] = useState(false)

  const { tasks: allTasks, toggleTask, saving: taskSaving, error: taskError } = usePersistentTasks()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await loadDashboardData(currentUser.uid)
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router, allTasks])

  const loadDashboardData = async (userId: string) => {
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const [events, userHabits, stats, userCourses] = await Promise.all([
        getCalendarEvents(userId, { start: today, end: endOfDay }),
        getHabits(userId),
        getDailyStats(userId, todayStr),
        getCourses(userId)
      ])

      // Filter today's tasks from the persistent tasks hook
      const todaysTasks = allTasks.filter(t =>
        t.status !== 'done' &&
        (t.scheduledDate?.toDateString() === today.toDateString() ||
         t.dueDate?.toDateString() === today.toDateString() ||
         t.priority === 'urgent')
      ).slice(0, 5)

      setUpcomingEvents(events.slice(0, 4))
      setHabits(userHabits)
      setDailyStats(stats)
      setCourses(userCourses)

      // Set focus task to highest priority incomplete task
      const highPriorityTask = todaysTasks.find(t => t.status === 'in-progress') || todaysTasks[0]
      if (highPriorityTask) setFocusTask(highPriorityTask)

      // Generate AI insights
      try {
        // Mock history for analysis (in real app, get from firestore)
        const mockHistory = [
          { subject: "Mathematics", score: 85, timeSpent: 120, date: new Date() },
          { subject: "Physics", score: 78, timeSpent: 90, date: new Date() },
          { subject: "Chemistry", score: 92, timeSpent: 100, date: new Date() }
        ]
        const analysis = await analyzeLearningPatterns(mockHistory)
        setAiAnalysis(analysis)

        // Generate study plan based on courses
        if (userCourses.length > 0) {
          const plan = await generateStudyPlan(
            userCourses[0].name,
            ["Master fundamentals", "Practice problems", "Review weekly"],
            10, // 10 hours/week
            "intermediate"
          )
          setStudyPlan(plan)
        }
      } catch (error) {
        console.error("Error generating AI insights:", error)
      }
    } catch (error) {
      console.error("Error loading dashboard:", error)
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-500/10"
      case "high": return "text-orange-500 bg-orange-500/10"
      case "medium": return "text-yellow-500 bg-yellow-500/10"
      default: return "text-blue-500 bg-blue-500/10"
    }
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "class": return "bg-blue-500"
      case "exam": return "bg-red-500"
      case "assignment": return "bg-orange-500"
      case "focus": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const todayDateStr = new Date().toISOString().split('T')[0]
  const todayHabitsCompleted = habits.filter(h => 
    h.completions.some(c => c.date === todayDateStr && c.completed)
  ).length

  return (
    <Layout 
      title="Dashboard" 
      subtitle="Your study command center – track progress, start sessions, and get AI-powered insights"
    >
      <NextActions onStartFocus={() => setShowPomodoro(true)} />

      <StatsRow
        dailyStats={dailyStats}
        todayHabitsCompleted={todayHabitsCompleted}
        totalHabits={habits.length}
      />

      <WeekGlance />

        {/* Main Grid Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <FocusHero
              courses={courses}
              todayTasks={allTasks.filter((t: Task) =>
                t.status !== 'done' &&
                (t.scheduledDate?.toDateString() === new Date().toDateString() ||
                 t.dueDate?.toDateString() === new Date().toDateString() ||
                 t.priority === 'urgent')
              ).slice(0, 5)}
              onStartFocus={(courseId, taskId) => {
                const filteredTasks = allTasks.filter((t: Task) =>
                  t.status !== 'done' &&
                  (t.scheduledDate?.toDateString() === new Date().toDateString() ||
                   t.dueDate?.toDateString() === new Date().toDateString() ||
                   t.priority === 'urgent')
                ).slice(0, 5)
                const selectedTask = filteredTasks.find((t: Task) => t.id === taskId)
                setFocusTask(selectedTask || null)
                setShowPomodoro(true)
              }}
              onAddQuickTask={() => setFocusTask(null)}
            />

            <TodayAtGlance />

            <TodayTasks
              tasks={allTasks.filter(t =>
                t.status !== 'done' &&
                (t.scheduledDate?.toDateString() === new Date().toDateString() ||
                 t.dueDate?.toDateString() === new Date().toDateString() ||
                 t.priority === 'urgent')
              ).slice(0, 5)}
              onTaskClick={setFocusTask}
              onTaskUpdate={async (updatedTask) => {
                // Use the persistent tasks hook to update
                if (updatedTask.status === 'done') {
                  await toggleTask(updatedTask.id, true)
                } else {
                  await toggleTask(updatedTask.id, false)
                }
              }}
            />

            <TodaySchedule events={upcomingEvents} />

            <QuickActions
              onStartPomodoro={() => setShowPomodoro(true)}
              onReviewFlashcards={() => router.push('/flashcards')}
              onViewGoals={() => router.push('/analytics')}
              onQuickFocus={() => setShowPomodoro(true)}
              selectedTask={focusTask}
            />

            <HabitsBlock
              habits={habits}
              onToggleHabit={async (habitId) => {
                if (!user) return
                try {
                  await toggleHabitCompletion(user.uid, habitId)
                  // Refresh habits
                  const updatedHabits = await getHabits(user.uid)
                  setHabits(updatedHabits)
                } catch (error) {
                  console.error("Error toggling habit:", error)
                }
              }}
              onManageHabits={() => router.push('/habits')}
              onAddHabit={() => router.push('/habits')}
            />

            {/* Courses Quick View */}
            {courses.length > 0 && (
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">My Courses</h3>
                <div className="space-y-2">
                  {courses.slice(0, 4).map(course => (
                    <div 
                      key={course.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: course.color || '#6366f1' }}
                      />
                      <span className="text-sm text-slate-100 flex-1">{course.name}</span>
                      {course.code && (
                        <span className="text-xs text-slate-400">{course.code}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="space-y-6">
            {/* Additional sidebar content can go here */}
          </div>
        </div>

        {/* Pomodoro Timer Modal */}
        {showPomodoro && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <PomodoroTimer
                task={focusTask}
                onClose={() => setShowPomodoro(false)}
              />
            </div>
          </div>
        )}
      </Layout>
    )
}
