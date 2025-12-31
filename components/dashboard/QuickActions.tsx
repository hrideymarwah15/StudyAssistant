"use client"

import { useState } from "react"
import { Timer, BookOpen, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { Task } from "@/lib/firestore"

interface QuickActionsProps {
  onStartPomodoro: () => void
  onReviewFlashcards: () => void
  onViewGoals: () => void
  onQuickFocus: () => void
  selectedTask?: Task | null
}

export function QuickActions({
  onStartPomodoro,
  onReviewFlashcards,
  onViewGoals,
  onQuickFocus,
  selectedTask
}: QuickActionsProps) {
  const [showPomodoro, setShowPomodoro] = useState(false)

  const actions = [
    {
      icon: Timer,
      title: "Pomodoro",
      description: "25 min focus session",
      action: () => setShowPomodoro(true),
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10 hover:bg-red-500/20"
    },
    {
      icon: BookOpen,
      title: "Flashcards",
      description: "Review due cards",
      action: onReviewFlashcards,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20"
    },
    {
      icon: Target,
      title: "Goals",
      description: "Track progress",
      action: onViewGoals,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10 hover:bg-green-500/20"
    },
    {
      icon: Zap,
      title: "Quick Focus",
      description: "5 min burst",
      action: onQuickFocus,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 hover:bg-purple-500/20"
    }
  ]

  if (showPomodoro) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Pomodoro Timer</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowPomodoro(false)}>
            ×
          </Button>
        </div>
        <PomodoroTimer
          task={selectedTask}
          onClose={() => setShowPomodoro(false)}
          onSessionComplete={(session) => {
            console.log("Session completed:", session)
          }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Zap className="w-6 h-6 text-primary" />
        <h2 className="text-display-sm text-foreground">Quick Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((action, index) => (
          <Card
            key={index}
            className={`p-4 cursor-pointer transition-all hover:scale-105 ${action.bgColor} border-border/50`}
            onClick={action.action}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <action.icon className={`w-8 h-8 ${action.color}`} />
              <div>
                <h3 className="font-semibold text-sm text-foreground">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}