"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getCalendarEvents, getHabits, getDailyStats, getCourses, toggleHabitCompletion,
  type Task, type CalendarEvent, type Habit, type DailyStats, type Course
} from "@/lib/firestore"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { Button } from "@/components/ui/button"
import Layout from "@/components/Layout"
import { NextActions } from "@/components/dashboard/NextActions"
import { FocusHero } from "@/components/dashboard/FocusHero"
import { TodayTasks } from "@/components/dashboard/TodayTasks"
import { TodaySchedule } from "@/components/dashboard/TodaySchedule"
import { TodayAtGlance } from "@/components/dashboard/TodayAtGlance"
import { HabitsBlock } from "@/components/dashboard/HabitsBlock"
import { StreakTracker } from "@/components/dashboard/StreakTracker"
import { AISystemHealth } from "@/components/dashboard/AISystemHealth"
import { JarvisAssistant } from "@/components/jarvis-assistant"
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

  const { tasks: allTasks, toggleTask } = usePersistentTasks()

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
    } catch (error) {
      console.error("Error loading dashboard:", error)
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
      {/* 2. Today at a Glance */}
      <TodayAtGlance />

      {/* Streak Tracker */}
      <StreakTracker />

      {/* 3. Next Best Actions */}
      <NextActions onStartFocus={() => setShowPomodoro(true)} />

      {/* 4. Focus Mode */}
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

      {/* 5. Today Tasks */}
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

      {/* 6. Today Schedule */}
      <TodaySchedule events={upcomingEvents} />

      {/* 7. Habits */}
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

      {/* 8. AI System Health */}
      <AISystemHealth />

      {/* 9. JARVIS Dock */}
      <JarvisAssistant
        context={{
          currentPage: 'dashboard',
          todayTasks: allTasks.filter(t =>
            t.status !== 'done' &&
            (t.scheduledDate?.toDateString() === new Date().toDateString() ||
             t.dueDate?.toDateString() === new Date().toDateString() ||
             t.priority === 'urgent')
          ),
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
