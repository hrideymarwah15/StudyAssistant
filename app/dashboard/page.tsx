"use client"

import Navigation from "@/components/navigation"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getTasks, getCalendarEvents, getHabits, getDailyStats, getCourses,
  type Task, type CalendarEvent, type Habit, type DailyStats, type Course
} from "@/lib/firestore"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { 
  Clock, Calendar, CheckCircle2, Target, Flame, BookOpen, 
  ChevronRight, Play, Plus, TrendingUp, Zap, Coffee
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showPomodoro, setShowPomodoro] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)

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
  }, [router])

  const loadDashboardData = async (userId: string) => {
    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)

      const [tasks, events, userHabits, stats, userCourses] = await Promise.all([
        getTasks(userId),
        getCalendarEvents(userId, { start: today, end: endOfDay }),
        getHabits(userId),
        getDailyStats(userId, todayStr),
        getCourses(userId)
      ])

      // Filter today's tasks
      const todaysTasks = tasks.filter(t => 
        t.status !== 'done' && 
        (t.scheduledDate?.toDateString() === today.toDateString() || 
         t.dueDate?.toDateString() === today.toDateString() ||
         t.priority === 'urgent')
      ).slice(0, 5)

      setTodayTasks(todaysTasks)
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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              {getGreeting()}, {user?.displayName?.split(' ')[0] || 'Student'}
            </h1>
            <p className="text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => setShowPomodoro(!showPomodoro)}>
              <Play className="w-4 h-4 mr-2" /> Focus Mode
            </Button>
            <Link href="/planner">
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats?.totalStudyMinutes ? Math.round(dailyStats.totalStudyMinutes / 60 * 10) / 10 : 0}h
                </p>
                <p className="text-xs text-muted-foreground">Study time today</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats?.taskCompleted || 0}
                </p>
                <p className="text-xs text-muted-foreground">Tasks completed</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats?.streakDay || 0}
                </p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {todayHabitsCompleted}/{habits.length}
                </p>
                <p className="text-xs text-muted-foreground">Habits done</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Focus & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Focus Task Card */}
            {focusTask && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-primary font-medium mb-1">Current Focus</p>
                    <h2 className="text-xl font-bold text-foreground">{focusTask.title}</h2>
                    {focusTask.course && (
                      <p className="text-sm text-muted-foreground mt-1">{focusTask.course}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(focusTask.priority)}`}>
                    {focusTask.priority}
                  </span>
                </div>

                {focusTask.subtasks && focusTask.subtasks.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ 
                            width: `${(focusTask.subtasks.filter(s => s.completed).length / focusTask.subtasks.length) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {focusTask.subtasks.filter(s => s.completed).length}/{focusTask.subtasks.length}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setShowPomodoro(true)} className="flex-1">
                    <Play className="w-4 h-4 mr-2" /> Start Focus Session
                  </Button>
                  <Button variant="outline">
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Today's Tasks
                </h3>
                <Link href="/planner" className="text-sm text-primary hover:underline">
                  View all
                </Link>
              </div>

              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks scheduled for today</p>
                  <Link href="/planner">
                    <Button variant="link" className="mt-2">Add a task</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map(task => (
                    <div 
                      key={task.id}
                      className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                      onClick={() => setFocusTask(task)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${
                          task.status === 'done' ? 'bg-green-500' :
                          task.status === 'in-progress' ? 'bg-blue-500' : 'bg-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-foreground truncate ${
                            task.status === 'done' ? 'line-through opacity-60' : ''
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {task.course && (
                              <span className="text-xs text-muted-foreground">{task.course}</span>
                            )}
                            {task.estimatedMinutes && (
                              <span className="text-xs text-muted-foreground">
                                ~{task.estimatedMinutes}min
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Classes/Events */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Schedule
                </h3>
                <Link href="/calendar" className="text-sm text-primary hover:underline">
                  Full calendar
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No events scheduled for today</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
                      <div className={`w-1 h-12 rounded-full ${getEventTypeColor(event.type)}`} />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground capitalize">
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Habits, Stats, Quick Actions */}
          <div className="space-y-6">
            {/* Pomodoro Widget */}
            {showPomodoro && (
              <div className="p-6 rounded-2xl bg-card border border-border">
                <PomodoroTimer 
                  task={focusTask} 
                  onClose={() => setShowPomodoro(false)}
                  compact
                />
              </div>
            )}

            {/* Habits */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-500" />
                  Daily Habits
                </h3>
                <Link href="/habits" className="text-sm text-primary hover:underline">
                  Manage
                </Link>
              </div>

              {habits.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No habits set up yet</p>
                  <Link href="/habits">
                    <Button variant="link" size="sm">Add habits</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 5).map(habit => {
                    const isCompletedToday = habit.completions.some(
                      c => c.date === todayDateStr && c.completed
                    )
                    return (
                      <div 
                        key={habit.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                          isCompletedToday ? 'bg-green-500/10' : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div 
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompletedToday 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-muted-foreground'
                          }`}
                        >
                          {isCompletedToday && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`flex-1 text-sm ${isCompletedToday ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                          {habit.name}
                        </span>
                        {habit.currentStreak > 0 && (
                          <span className="text-xs text-orange-500 flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {habit.currentStreak}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/flashcards">
                  <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-foreground">Flashcards</p>
                  </div>
                </Link>
                <Link href="/materials">
                  <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-center">
                    <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-sm text-foreground">Materials</p>
                  </div>
                </Link>
                <Link href="/analytics">
                  <div className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-foreground">Analytics</p>
                  </div>
                </Link>
                <div 
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-center"
                  onClick={() => setShowPomodoro(true)}
                >
                  <Coffee className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-sm text-foreground">Pomodoro</p>
                </div>
              </div>
            </div>

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
                      <span className="text-sm text-foreground flex-1">{course.name}</span>
                      {course.code && (
                        <span className="text-xs text-muted-foreground">{course.code}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
