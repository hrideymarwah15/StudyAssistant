"use client"

import { useState } from "react"
import { Target, Flame, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Habit } from "@/lib/firestore"

interface HabitsBlockProps {
  habits: Habit[]
  onToggleHabit: (habitId: string) => void
  onManageHabits: () => void
  onAddHabit: () => void
}

const HABIT_TEMPLATES = [
  { name: "Read for 30 minutes", description: "Build consistent reading habits", color: "#3b82f6" },
  { name: "Exercise daily", description: "Stay active and healthy", color: "#10b981" },
  { name: "Meditate 10 minutes", description: "Mental clarity and focus", color: "#8b5cf6" },
  { name: "Review flashcards", description: "Reinforce learning", color: "#f59e0b" },
  { name: "Plan tomorrow", description: "Stay organized and prepared", color: "#ef4444" },
  { name: "No phone after 9 PM", description: "Better sleep quality", color: "#06b6d4" }
]

export function HabitsBlock({ habits, onToggleHabit, onManageHabits, onAddHabit }: HabitsBlockProps) {
  const [showTemplates, setShowTemplates] = useState(false)
  const todayDateStr = new Date().toISOString().split('T')[0]

  const todayHabitsCompleted = habits.filter(h =>
    h.completions.some(c => c.date === todayDateStr && c.completed)
  ).length

  const handleTemplateSelect = (template: typeof HABIT_TEMPLATES[0]) => {
    // This would typically create the habit, but for now we'll just close the modal
    setShowTemplates(false)
    onAddHabit()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-display-sm text-foreground">Daily Habits</h2>
          {habits.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {todayHabitsCompleted}/{habits.length} completed
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onManageHabits}>
            Manage
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {habits.length === 0 ? (
        <Card className="p-6 text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Start Building Habits</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Small daily actions compound into big results. Start with one habit today.
          </p>
          <Button onClick={() => setShowTemplates(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Habit
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {habits.slice(0, 5).map(habit => {
            const isCompletedToday = habit.completions.some(
              c => c.date === todayDateStr && c.completed
            )
            return (
              <Card
                key={habit.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isCompletedToday ? 'bg-green-500/5 border-green-500/20' : 'hover:bg-muted/50'
                }`}
                onClick={() => onToggleHabit(habit.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCompletedToday
                        ? 'bg-green-500 border-green-500'
                        : 'border-muted-foreground hover:border-primary'
                    }`}
                  >
                    {isCompletedToday && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium ${isCompletedToday ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {habit.name}
                    </span>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground">{habit.description}</p>
                    )}
                  </div>
                  {habit.currentStreak > 0 && (
                    <div className="flex items-center gap-1 text-orange-500">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm font-medium">{habit.currentStreak}</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Habit Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Choose a Habit Template</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  ×
                </Button>
              </div>
              <div className="space-y-3">
                {HABIT_TEMPLATES.map((template, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-border hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: template.color }}
                      />
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={onAddHabit}>
                  Create Custom Habit
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}