"use client"

import { useState, useEffect, useMemo } from "react"
import { Play, Plus, Sparkles, Clock, Zap, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Course, Task } from "@/lib/firestore"

interface FocusHeroProps {
  courses: Course[]
  todayTasks: Task[]
  onStartFocus: (courseId: string, taskId: string) => void
  onAddQuickTask: () => void
}

// AI-powered task priority scoring
const getTaskPriorityScore = (task: Task): number => {
  let score = 0
  
  // Priority weight
  if (task.priority === 'urgent') score += 40
  else if (task.priority === 'high') score += 30
  else if (task.priority === 'medium') score += 20
  else score += 10
  
  // Due date urgency
  if (task.dueDate) {
    const hoursUntilDue = (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntilDue < 0) score += 50 // Overdue
    else if (hoursUntilDue < 24) score += 35
    else if (hoursUntilDue < 48) score += 25
    else if (hoursUntilDue < 168) score += 15 // Within a week
  }
  
  // Time of day optimization
  const hour = new Date().getHours()
  const isDeepWorkTime = hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16
  if (isDeepWorkTime && task.estimatedMinutes && task.estimatedMinutes >= 45) {
    score += 15 // Prefer longer tasks during optimal focus times
  }
  
  // In-progress tasks get boost
  if (task.status === 'in-progress') score += 20
  
  return score
}

const getAISuggestion = (tasks: Task[], courses: Course[]) => {
  if (tasks.length === 0) {
    return {
      message: "No tasks scheduled. Add a quick task to start focusing!",
      suggestedTask: null,
      suggestedCourse: courses[0] || null
    }
  }
  
  const scoredTasks = tasks.map(t => ({ task: t, score: getTaskPriorityScore(t) }))
  scoredTasks.sort((a, b) => b.score - a.score)
  
  const topTask = scoredTasks[0].task
  const hour = new Date().getHours()
  
  let message = ""
  if (topTask.priority === 'urgent' || (topTask.dueDate && new Date(topTask.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000))) {
    message = `⚡ "${topTask.title}" needs attention soon!`
  } else if (hour >= 9 && hour <= 11) {
    message = `🧠 Morning peak focus — tackle "${topTask.title}" now`
  } else if (hour >= 14 && hour <= 16) {
    message = `💪 Afternoon deep work — "${topTask.title}" is ready`
  } else if (hour >= 20) {
    message = `🌙 Light review time — work on "${topTask.title}"`
  } else {
    message = `📋 Recommended: "${topTask.title}"`
  }
  
  return {
    message,
    suggestedTask: topTask,
    suggestedCourse: courses.find(c => c.id === topTask.course) || courses[0] || null
  }
}

export function FocusHero({ courses, todayTasks, onStartFocus, onAddQuickTask }: FocusHeroProps) {
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedTask, setSelectedTask] = useState("")
  const [showValidation, setShowValidation] = useState(false)
  const [sessionLength, setSessionLength] = useState(25)

  // AI suggestion
  const aiSuggestion = useMemo(() => getAISuggestion(todayTasks, courses), [todayTasks, courses])

  // Auto-select AI suggestion
  useEffect(() => {
    if (aiSuggestion.suggestedTask && !selectedTask) {
      setSelectedTask(aiSuggestion.suggestedTask.id)
    }
    if (aiSuggestion.suggestedCourse && !selectedCourse) {
      setSelectedCourse(aiSuggestion.suggestedCourse.id)
    }
  }, [aiSuggestion, selectedTask, selectedCourse])

  const handleStartFocus = () => {
    if (!selectedTask) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    onStartFocus(selectedCourse, selectedTask)
  }

  const handleQuickStart = () => {
    if (aiSuggestion.suggestedTask) {
      onStartFocus(
        aiSuggestion.suggestedCourse?.id || "",
        aiSuggestion.suggestedTask.id
      )
    } else {
      onAddQuickTask()
    }
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Focus Mode</h2>
            <p className="text-sm text-muted-foreground">Deep work sessions tied to your tasks</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="text-muted-foreground">AI-optimized</span>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      {aiSuggestion.message && (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground flex-1">{aiSuggestion.message}</p>
          {aiSuggestion.suggestedTask && (
            <Button size="sm" variant="ghost" onClick={handleQuickStart} className="text-primary hover:bg-primary/10">
              Quick Start
            </Button>
          )}
        </div>
      )}

      {showValidation && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Please select a task before starting focus mode.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Course (optional)</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Any course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Task to focus on</label>
          <select
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a task...</option>
            {todayTasks.map(task => (
              <option key={task.id} value={task.id}>
                {task.priority === 'urgent' ? '🔴 ' : task.priority === 'high' ? '🟠 ' : ''}
                {task.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Session Length */}
      <div className="mb-4">
        <label className="text-sm font-medium text-foreground mb-2 block">Session length</label>
        <div className="flex gap-2">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => setSessionLength(mins)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sessionLength === mins
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleStartFocus} className="flex-1 h-11">
          <Play className="w-4 h-4 mr-2" /> Start {sessionLength} min Focus
        </Button>
        <Button variant="outline" className="px-4 h-11" onClick={onAddQuickTask}>
          <Plus className="w-4 h-4 mr-2" /> Quick Task
        </Button>
      </div>
    </div>
  )
}