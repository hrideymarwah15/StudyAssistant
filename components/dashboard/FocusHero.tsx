"use client"

import { useState } from "react"
import { Play, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Course, Task } from "@/lib/firestore"

interface FocusHeroProps {
  courses: Course[]
  todayTasks: Task[]
  onStartFocus: (courseId: string, taskId: string) => void
  onAddQuickTask: () => void
}

export function FocusHero({ courses, todayTasks, onStartFocus, onAddQuickTask }: FocusHeroProps) {
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedTask, setSelectedTask] = useState("")
  const [showValidation, setShowValidation] = useState(false)

  const handleStartFocus = () => {
    if (!selectedCourse || !selectedTask) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    onStartFocus(selectedCourse, selectedTask)
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
      <div className="flex items-center gap-3 mb-2">
        <Play className="w-6 h-6 text-primary" />
        <h2 className="text-display-sm text-foreground">Focus Mode</h2>
      </div>
      <p className="text-body-sm text-muted-foreground mb-4">Deep work sessions tied to your tasks</p>

      {showValidation && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-600 dark:text-red-400">
            Please select both a course and task before starting focus mode.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Select Task</label>
          <div className="flex gap-2">
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a task...</option>
              {todayTasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="px-3" onClick={onAddQuickTask}>
              + Add quick task
            </Button>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleStartFocus} className="flex-1">
            <Play className="w-4 h-4 mr-2" /> Start 25 min Focus
          </Button>
          <Button variant="outline" className="px-4">
            Custom session
          </Button>
        </div>
      </div>
    </div>
  )
}