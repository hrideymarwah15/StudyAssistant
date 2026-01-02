"use client"

import { useMemo } from "react"
import { 
  Calendar, CheckCircle2, Play, Plus, 
  Sparkles, BookOpen, ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Task, CalendarEvent, Habit } from "@/lib/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TodayBlockProps {
  tasks: Task[]
  events: CalendarEvent[]
  habits: Habit[]
  focusMinutes?: number
  targetMinutes?: number
  flashcardsDue?: number
  onStartFocus: () => void
  onTaskClick: (task: Task) => void
  onTaskToggle: (taskId: string, done: boolean) => void
  onHabitToggle: (habitId: string) => void
  onOpenJarvis?: () => void
}

export function TodayBlock({
  tasks,
  events,
  habits,
  focusMinutes = 0,
  targetMinutes = 120,
  flashcardsDue = 0,
  onStartFocus,
  onTaskClick,
  onTaskToggle,
  onHabitToggle,
  onOpenJarvis
}: TodayBlockProps) {
  const router = useRouter()
  const todayDateStr = new Date().toISOString().split('T')[0]
  
  // Calculate stats
  const pendingTasks = tasks.filter(t => t.status !== 'done').length
  const completedHabits = habits.filter(h => 
    h.completions?.some(c => c.date === todayDateStr && c.completed)
  ).length
  const totalHabits = habits.length
  const habitsRemaining = totalHabits - completedHabits

  // Priority styling
  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-500"
      case "high": return "border-l-orange-500"
      case "medium": return "border-l-yellow-500"
      default: return "border-l-slate-600"
    }
  }

  // Get next task to focus on
  const nextTask = tasks.find(t => t.status !== 'done')

  return (
    <div className="space-y-4">
      {/* UNIFIED ACTION BAR - Focus, Tasks, Flashcards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Focus Progress - Primary CTA */}
        <button
          onClick={onStartFocus}
          className="group p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/30 hover:border-blue-400/50 hover:from-blue-600/30 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Play className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">Focus</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{focusMinutes}</span>
            <span className="text-slate-400 text-sm">/ {targetMinutes} min</span>
          </div>
          <p className="text-xs text-blue-400 mt-1 font-medium">Start 25-min session →</p>
        </button>

        {/* Tasks Pending - Secondary CTA */}
        <button
          onClick={() => nextTask ? onTaskClick(nextTask) : router.push('/planner')}
          className="group p-4 rounded-xl bg-gradient-to-br from-yellow-600/10 to-orange-800/5 border border-yellow-500/20 hover:border-yellow-400/40 transition-all text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-sm font-medium text-slate-300">Tasks</span>
            </div>
            <ArrowRight className="w-4 h-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">{pendingTasks}</span>
            <span className="text-slate-400 text-sm">pending</span>
          </div>
          <p className="text-xs text-yellow-400 mt-1 font-medium">
            {pendingTasks > 0 ? "Do next task →" : "Add tasks →"}
          </p>
        </button>

        {/* Flashcards Due - Tertiary CTA */}
        <Link href="/flashcards" className="block">
          <div className="group p-4 rounded-xl bg-gradient-to-br from-purple-600/10 to-purple-800/5 border border-purple-500/20 hover:border-purple-400/40 transition-all text-left h-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Cards</span>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">{flashcardsDue}</span>
              <span className="text-slate-400 text-sm">due</span>
            </div>
            <p className="text-xs text-purple-400 mt-1 font-medium">
              {flashcardsDue > 0 ? "Review now →" : "Create cards →"}
            </p>
          </div>
        </Link>
      </div>

      {/* TASKS + HABITS COMPACT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks List - Compact */}
        <Card className="p-4 bg-slate-800/40 border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Today's Tasks</span>
            <Link href="/planner" className="text-xs text-blue-400 hover:text-blue-300">
              All →
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-slate-500 text-sm mb-3">No tasks scheduled</p>
              <div className="flex gap-2 justify-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-8"
                  onClick={() => router.push('/planner')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add 3 tasks
                </Button>
                {onOpenJarvis && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-xs h-8 text-purple-400"
                    onClick={onOpenJarvis}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI plan
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {tasks.slice(0, 5).map(task => (
                <div 
                  key={task.id}
                  className={`group flex items-center gap-2 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer border-l-2 ${getPriorityStyle(task.priority)} transition-all`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskToggle(task.id, task.status !== 'done')
                    }}
                    className={`w-4 h-4 rounded border flex-shrink-0 ${
                      task.status === 'done' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-slate-500 hover:border-blue-400'
                    } flex items-center justify-center`}
                  >
                    {task.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <span 
                    onClick={() => onTaskClick(task)}
                    className={`text-sm flex-1 truncate ${
                      task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {task.title}
                  </span>
                  {task.status !== 'done' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                        onStartFocus()
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-500/20 rounded"
                      title="Focus on this"
                    >
                      <Play className="w-3 h-3 text-blue-400" />
                    </button>
                  )}
                </div>
              ))}
              {tasks.length > 5 && (
                <Link 
                  href="/planner" 
                  className="block text-center text-xs text-slate-400 hover:text-blue-400 py-1"
                >
                  +{tasks.length - 5} more
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Habits - Visual Progress */}
        <Card className="p-4 bg-slate-800/40 border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">Daily Habits</span>
            <Link href="/habits" className="text-xs text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>
          
          {habits.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-slate-500 text-sm mb-3">Build consistency</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs h-8"
                onClick={() => router.push('/habits')}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add first habit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                    style={{ width: `${totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {completedHabits}/{totalHabits}
                </span>
              </div>
              
              {/* Habit pills */}
              <div className="flex flex-wrap gap-2">
                {habits.map(habit => {
                  const isCompleted = habit.completions?.some(
                    c => c.date === todayDateStr && c.completed
                  )
                  return (
                    <button
                      key={habit.id}
                      onClick={() => onHabitToggle(habit.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-orange-500/50'
                      }`}
                    >
                      {isCompleted && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {habit.name}
                    </button>
                  )
                })}
              </div>
              
              {habitsRemaining > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  {habitsRemaining} remaining • Keep going!
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* SCHEDULE - Minimal inline */}
      {events.length > 0 && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
          <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div className="flex-1 flex items-center gap-4 overflow-x-auto">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="text-slate-500 font-mono text-xs">
                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-slate-300">{event.title}</span>
              </div>
            ))}
          </div>
          <Link href="/calendar" className="text-xs text-blue-400 hover:text-blue-300 flex-shrink-0">
            Calendar →
          </Link>
        </div>
      )}
    </div>
  )
}
