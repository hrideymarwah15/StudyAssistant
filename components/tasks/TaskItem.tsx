"use client"

import { useState } from "react"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { Task, updateTask } from "@/lib/firestore"
import { useAuthContext } from "@/components/auth-provider"
import { toast } from "sonner"

interface TaskItemProps {
  task: Task
  onTaskUpdate?: (task: Task) => void
  showPriority?: boolean
  compact?: boolean
}

export function TaskItem({ task, onTaskUpdate, showPriority = true, compact = false }: TaskItemProps) {
  const { user } = useAuthContext()
  const [isUpdating, setIsUpdating] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<Task['status']>(task.status)

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-500/10"
      case "high": return "text-orange-500 bg-orange-500/10"
      case "medium": return "text-yellow-500 bg-yellow-500/10"
      default: return "text-blue-500 bg-blue-500/10"
    }
  }

  const handleToggleComplete = async () => {
    if (!user || isUpdating) return

    const newStatus: Task['status'] = optimisticStatus === 'done' ? 'todo' : 'done'
    const previousStatus = optimisticStatus

    // Optimistic update
    setOptimisticStatus(newStatus)
    setIsUpdating(true)

    try {
      const updatedTask = {
        ...task,
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date() : undefined
      }

      await updateTask(task.id, updatedTask)

      // Show success feedback
      toast.success(
        newStatus === 'done' ? 'Task completed! 🎉' : 'Task marked as pending',
        { duration: 2000 }
      )

      // Notify parent component
      onTaskUpdate?.(updatedTask)
    } catch (error) {
      // Revert optimistic update on failure
      setOptimisticStatus(previousStatus)

      toast.error('Failed to update task. Please try again.', {
        duration: 3000,
        action: {
          label: 'Retry',
          onClick: () => handleToggleComplete()
        }
      })

      console.error('Error updating task:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const isCompleted = optimisticStatus === 'done'
  const isInProgress = optimisticStatus === 'in-progress'

  return (
    <div className={`p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group ${
      compact ? 'p-3' : ''
    }`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          disabled={isUpdating}
          className="mt-1.5 flex-shrink-0 transition-colors disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className={`w-4 h-4 ${
              isInProgress ? 'text-blue-500 fill-blue-500/20' : 'text-muted-foreground'
            }`} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-foreground truncate ${
            isCompleted ? 'line-through opacity-60' : ''
          }`}>
            {task.title}
          </p>

          {!compact && (
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
          )}
        </div>

        {showPriority && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  )
}