"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getCalendarEvents, getHabits, getDailyStats, getCourses, toggleHabitCompletion,
  type Task, type CalendarEvent, type Habit, type DailyStats, type Course
} from "@/lib/firestore"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import Layout from "@/components/Layout"
import { TodayBlock } from "@/components/dashboard/TodayBlock"
import { NextActions } from "@/components/dashboard/NextActions"
import { StreakTracker } from "@/components/dashboard/StreakTracker"
import { AISystemHealth } from "@/components/dashboard/AISystemHealth"
import { JarvisAssistant } from "@/components/jarvis-assistant"
import { usePersistentTasks } from "@/lib/hooks/usePersistentTasks"
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)

  const { tasks: allTasks, toggleTask } = usePersistentTasks()

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

      setUpcomingEvents(events.slice(0, 4))
      setHabits(userHabits)
      setDailyStats(stats)
      setCourses(userCourses)

      // Set focus task to highest priority incomplete task
      const todaysTasks = allTasks.filter(t =>
        t.status !== 'done' &&
        (t.scheduledDate?.toDateString() === today.toDateString() ||
         t.dueDate?.toDateString() === today.toDateString() ||
         t.priority === 'urgent')
      ).slice(0, 5)
      
      const highPriorityTask = todaysTasks.find(t => t.status === 'in-progress') || todaysTasks[0]
      if (highPriorityTask) setFocusTask(highPriorityTask)
    } catch (error) {
      console.error("Error loading dashboard:", error)
    }
  }

  // Get today's tasks
  const todaysTasks = allTasks.filter(t =>
    t.scheduledDate?.toDateString() === new Date().toDateString() ||
    t.dueDate?.toDateString() === new Date().toDateString() ||
    t.priority === 'urgent'
  ).slice(0, 8)

  // Handle task toggle
  const handleTaskToggle = async (taskId: string, done: boolean) => {
    try {
      await toggleTask(taskId, done)
      toast.success(done ? "Task completed! 🎉" : "Task reopened")
    } catch {
      toast.error("Failed to update task")
    }
  }

  // Handle habit toggle
  const handleHabitToggle = async (habitId: string) => {
    if (!user) return
    try {
      await toggleHabitCompletion(user.uid, habitId)
      const updatedHabits = await getHabits(user.uid)
      setHabits(updatedHabits)
      
      const habit = habits.find(h => h.id === habitId)
      const todayDateStr = new Date().toISOString().split('T')[0]
      const wasCompleted = habit?.completions?.some(c => c.date === todayDateStr && c.completed)
      
      toast.success(wasCompleted ? "Habit unchecked" : "Habit completed! 💪")
    } catch (error) {
      console.error("Error toggling habit:", error)
      toast.error("Failed to update habit")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <Layout 
      title="Dashboard" 
      subtitle="Your study command center – track progress, start sessions, and get AI-powered insights"
    >
      {/* Combined Today Block - Focus, Tasks, Flashcards, Habits */}
      <TodayBlock
        tasks={todaysTasks}
        events={upcomingEvents}
        habits={habits}
        focusMinutes={dailyStats?.totalStudyMinutes || 0}
        targetMinutes={120}
        flashcardsDue={0}
        onStartFocus={() => setShowPomodoro(true)}
        onTaskClick={setFocusTask}
        onTaskToggle={handleTaskToggle}
        onHabitToggle={handleHabitToggle}
      />

      {/* Streak Tracker - Compact motivational banner */}
      <div className="mt-4">
        <StreakTracker />
      </div>

      {/* Next Best Action - Single AI recommendation */}
      <div className="mt-4">
        <NextActions onStartFocus={() => setShowPomodoro(true)} />
      </div>

      {/* AI System Health - Minimal inline status */}
      <div className="mt-4">
        <AISystemHealth />
      </div>

      {/* JARVIS AI Coach - Single floating instance */}
      <JarvisAssistant
        context={{
          currentPage: 'dashboard',
          todayTasks: todaysTasks,
          courses,
          habits,
          dailyStats: dailyStats || undefined
        }}
      />

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
