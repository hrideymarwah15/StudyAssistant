"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Calendar, Clock, CheckCircle2, Play, Plus, Zap, 
  Target, ChevronRight, Sparkles, Timer, ListTodo,
  Sun, Moon, Sunrise, Sunset
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Task, CalendarEvent, Habit } from "@/lib/firestore"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface TodayBlockProps {
  tasks: Task[]
  events: CalendarEvent[]
  habits: Habit[]
  onStartFocus: () => void
  onTaskClick: (task: Task) => void
  onTaskToggle: (taskId: string, done: boolean) => void
  onHabitToggle: (habitId: string) => void
  onOpenJarvis?: () => void
}

// Time of day context
const getTimeContext = () => {
  const hour = new Date().getHours()
  if (hour < 6) return { icon: Moon, label: "Late night", suggestion: "Consider getting some rest", period: "night" }
  if (hour < 12) return { icon: Sunrise, label: "Morning", suggestion: "Perfect for deep work", period: "morning" }
  if (hour < 17) return { icon: Sun, label: "Afternoon", suggestion: "Stay focused & hydrated", period: "afternoon" }
  if (hour < 21) return { icon: Sunset, label: "Evening", suggestion: "Review and consolidate", period: "evening" }
  return { icon: Moon, label: "Night", suggestion: "Light review before rest", period: "night" }
}

// Analyze schedule for gaps
const analyzeSchedule = (events: CalendarEvent[]) => {
  const now = new Date()
  const currentHour = now.getHours()
  
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  // Find next event
  const nextEvent = sortedEvents.find(e => new Date(e.startTime) > now)
  const minutesToNext = nextEvent 
    ? Math.round((new Date(nextEvent.startTime).getTime() - now.getTime()) / (1000 * 60))
    : null

  // Calculate free time
  let freeMinutes = 0
  if (!nextEvent && currentHour < 21) {
    freeMinutes = (21 - currentHour) * 60
  } else if (nextEvent && minutesToNext) {
    freeMinutes = minutesToNext
  }

  return {
    nextEvent,
    minutesToNext,
    freeMinutes,
    suggestion: freeMinutes >= 60 
      ? `${Math.floor(freeMinutes / 60)}h free - perfect for deep work`
      : freeMinutes >= 25
        ? `${freeMinutes} min window - do a pomodoro`
        : nextEvent
          ? "Event coming up soon"
          : "Open schedule - plan your day"
  }
}

export function TodayBlock({
  tasks,
  events,
  habits,
  onStartFocus,
  onTaskClick,
  onTaskToggle,
  onHabitToggle,
  onOpenJarvis
}: TodayBlockProps) {
  const router = useRouter()
  const timeContext = getTimeContext()
  const scheduleAnalysis = useMemo(() => analyzeSchedule(events), [events])
  const todayDateStr = new Date().toISOString().split('T')[0]
  
  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const totalTasks = tasks.length
  const completedHabits = habits.filter(h => 
    h.completions?.some(c => c.date === todayDateStr && c.completed)
  ).length
  const totalHabits = habits.length

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.startTime)
    return formatTime(start)
  }

  // Get event type styling
  const getEventStyle = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "class": return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "exam": return "bg-red-500/20 text-red-400 border-red-500/30"
      case "assignment": return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "focus": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      default: return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    }
  }

  // Priority task styling
  const getPriorityStyle = (priority?: string) => {
    switch (priority) {
      case "urgent": return "border-l-red-500"
      case "high": return "border-l-orange-500"
      case "medium": return "border-l-yellow-500"
      default: return "border-l-slate-500"
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Today Header with Target */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-blue-900/20 border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left side - Greeting and Target */}
          <div className="flex-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <timeContext.icon className="w-4 h-4" />
              <span>{timeContext.label}</span>
              <span className="text-slate-600">•</span>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Today's Target
            </h2>
            
            {/* Smart target suggestion */}
            <p className="text-slate-300 text-sm">
              {totalTasks > 0 
                ? `Complete ${Math.min(3, totalTasks)} tasks • ${totalHabits > 0 ? `${totalHabits - completedHabits} habits left` : ''}`
                : "Add tasks to set your daily target"}
            </p>
            
            {/* AI Suggestion pill */}
            {scheduleAnalysis.freeMinutes >= 25 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{scheduleAnalysis.suggestion}</span>
              </div>
            )}
          </div>
          
          {/* Right side - Quick Action */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={onStartFocus}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
            >
              <Play className="w-4 h-4" />
              Start 25min Focus
            </Button>
            {onOpenJarvis && (
              <Button 
                variant="outline"
                onClick={onOpenJarvis}
                className="border-slate-600 hover:bg-slate-700 gap-2"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                Plan My Day
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Daily Progress</span>
            <span className="text-slate-300 font-medium">
              {completedTasks + completedHabits} / {totalTasks + totalHabits} completed
            </span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ 
                width: `${(totalTasks + totalHabits) > 0 
                  ? ((completedTasks + completedHabits) / (totalTasks + totalHabits)) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Three Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks Column */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-yellow-500" />
              <h3 className="font-semibold text-white text-sm">Tasks</h3>
              {totalTasks > 0 && (
                <Badge variant="secondary" className="text-xs bg-slate-700">
                  {completedTasks}/{totalTasks}
                </Badge>
              )}
            </div>
            <Link href="/planner" className="text-xs text-blue-400 hover:text-blue-300">
              View All →
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm mb-3">No tasks yet</p>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs"
                  onClick={() => router.push('/planner')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add 3 Quick Tasks
                </Button>
                {onOpenJarvis && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full text-xs text-purple-400 hover:text-purple-300"
                    onClick={onOpenJarvis}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Let AI Plan My Day
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 4).map(task => (
                <div 
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`p-2.5 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer border-l-2 ${getPriorityStyle(task.priority)} transition-all`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskToggle(task.id, task.status !== 'done')
                      }}
                      className={`mt-0.5 w-4 h-4 rounded border ${
                        task.status === 'done' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-slate-500 hover:border-blue-400'
                      } flex items-center justify-center flex-shrink-0`}
                    >
                      {task.status === 'done' && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
                      }`}>
                        {task.title}
                      </p>
                      {task.course && (
                        <p className="text-xs text-slate-500 truncate">{task.course}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {tasks.length > 4 && (
                <Link 
                  href="/planner" 
                  className="block text-center text-xs text-slate-400 hover:text-blue-400 py-1"
                >
                  +{tasks.length - 4} more tasks
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Schedule Column */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-white text-sm">Schedule</h3>
              {events.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-slate-700">
                  {events.length}
                </Badge>
              )}
            </div>
            <Link href="/calendar" className="text-xs text-blue-400 hover:text-blue-300">
              Full Calendar →
            </Link>
          </div>
          
          {events.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm mb-3">Open schedule today</p>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs"
                  onClick={() => router.push('/calendar')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create Focus Block
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full text-xs text-slate-400"
                  onClick={() => router.push('/calendar')}
                >
                  Add Class / Exam
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 4).map(event => (
                <div 
                  key={event.id}
                  className={`p-2.5 rounded-lg border ${getEventStyle(event.type)} transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono opacity-80 w-14 flex-shrink-0">
                      {formatEventTime(event)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {event.type}
                    </Badge>
                  </div>
                </div>
              ))}
              {events.length > 4 && (
                <Link 
                  href="/calendar" 
                  className="block text-center text-xs text-slate-400 hover:text-blue-400 py-1"
                >
                  +{events.length - 4} more events
                </Link>
              )}
            </div>
          )}
        </Card>

        {/* Habits Column */}
        <Card className="p-4 bg-slate-800/50 border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold text-white text-sm">Habits</h3>
              {totalHabits > 0 && (
                <Badge variant="secondary" className="text-xs bg-slate-700">
                  {completedHabits}/{totalHabits}
                </Badge>
              )}
            </div>
            <Link href="/habits" className="text-xs text-blue-400 hover:text-blue-300">
              Manage →
            </Link>
          </div>
          
          {habits.length === 0 ? (
            <div className="py-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm mb-3">Build daily habits</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs"
                onClick={() => router.push('/habits')}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add First Habit
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {habits.slice(0, 4).map(habit => {
                const isCompleted = habit.completions?.some(
                  c => c.date === todayDateStr && c.completed
                )
                return (
                  <div 
                    key={habit.id}
                    onClick={() => onHabitToggle(habit.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                      isCompleted 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-500 hover:border-orange-400'
                      }`}>
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${
                        isCompleted ? 'text-green-400' : 'text-white'
                      }`}>
                        {habit.name}
                      </span>
                    </div>
                  </div>
                )
              })}
              
              {/* Habit progress ring */}
              {totalHabits > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-center gap-3">
                  <div className="relative w-12 h-12">
                    <svg className="w-12 h-12 -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-slate-700"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(completedHabits / totalHabits) * 125.6} 125.6`}
                        className="text-orange-500 transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {Math.round((completedHabits / totalHabits) * 100)}%
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-white">
                      {completedHabits === totalHabits ? "All done! 🎉" : `${totalHabits - completedHabits} left`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {completedHabits === totalHabits ? "Perfect streak" : "Keep going!"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
