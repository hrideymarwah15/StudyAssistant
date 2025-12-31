"use client"

import { Zap, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Task } from "@/lib/firestore"
import { EmptyState } from "@/components/ui/EmptyState"
import { TaskItem } from "@/components/tasks/TaskItem"

interface TodayTasksProps {
  tasks: Task[]
  onTaskClick: (task: Task) => void
  onTaskUpdate?: (task: Task) => void
}

export function TodayTasks({ tasks, onTaskClick, onTaskUpdate }: TodayTasksProps) {

  return (
    <div className="p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-display-sm text-foreground flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Today's Tasks
        </h3>
        <Link href="/planner" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks for today"
          description="Let AI plan your day or add tasks manually to stay productive."
          action={{
            label: "Let AI plan my day",
            onClick: () => {
              // TODO: Open JARVIS with prefilled prompt for planning the day
              console.log("Open JARVIS for day planning")
            }
          }}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} onClick={() => onTaskClick(task)} className="cursor-pointer">
              <TaskItem
                task={task}
                onTaskUpdate={onTaskUpdate}
                showPriority={true}
                compact={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}