"use client"

import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Plus, Check, X, Target, TrendingUp, Calendar, Flame, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import {
  getHabits, createHabit, toggleHabitCompletion,
  type Habit
} from "@/lib/firestore"

export default function HabitsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily" as "daily" | "weekly",
    targetCount: 1,
    color: "#3b82f6"
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          let userHabits = await getHabits(currentUser.uid)

          // Create sample habits if none exist
          if (userHabits.length === 0) {
            const sampleHabits = [
              {
                name: "Daily Study Session",
                description: "Complete at least 1 hour of focused study",
                frequency: "daily" as const,
                targetCount: 1,
                color: "#3b82f6",
                userId: currentUser.uid,
                isArchived: false
              },
              {
                name: "Review Flashcards",
                description: "Review 10 flashcards using spaced repetition",
                frequency: "daily" as const,
                targetCount: 1,
                color: "#10b981",
                userId: currentUser.uid,
                isArchived: false
              },
              {
                name: "Practice Problems",
                description: "Solve 5 practice problems in your subject",
                frequency: "daily" as const,
                targetCount: 1,
                color: "#f59e0b",
                userId: currentUser.uid,
                isArchived: false
              }
            ]

            // Create the sample habits
            for (const habit of sampleHabits) {
              await createHabit(habit)
            }

            // Reload habits to get the created ones with IDs
            userHabits = await getHabits(currentUser.uid)
          }

          setHabits(userHabits)
        } catch (error) {
          console.error("Error loading habits:", error)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleCreateHabit = async () => {
    if (!user || !newHabit.name.trim()) return

    setCreating(true)
    try {
      await createHabit({
        userId: user.uid,
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        frequency: newHabit.frequency,
        targetCount: newHabit.targetCount,
        color: newHabit.color,
        isArchived: false
      })

      // Reload habits
      const updatedHabits = await getHabits(user.uid)
      setHabits(updatedHabits)

      // Reset form
      setNewHabit({
        name: "",
        description: "",
        frequency: "daily",
        targetCount: 1,
        color: "#3b82f6"
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error("Error creating habit:", error)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleCompletion = async (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      await toggleHabitCompletion(habitId, today)
      // Reload habits to get updated completion status
      const updatedHabits = await getHabits(user!.uid)
      setHabits(updatedHabits)
    } catch (error) {
      console.error("Error toggling habit completion:", error)
    }
  }

  const isCompletedToday = (habit: Habit) => {
    const today = new Date().toISOString().split('T')[0]
    return habit.completions?.some(c => c.date === today && c.completed) || false
  }

  const getTargetLabel = (habit: Habit) => {
    const { targetCount, frequency } = habit
    if (targetCount === 1) {
      return frequency === 'daily' ? 'Once per day' : 'Once per week'
    } else {
      return frequency === 'daily' ? `${targetCount} times per day` : `${targetCount} times per week`
    }
  }

  const getCompletionRate = (habit: Habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0
    const completed = habit.completions.filter(c => c.completed).length
    return Math.round((completed / habit.completions.length) * 100)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout 
      title="Habits" 
      subtitle="Build and maintain consistent study routines"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-slate-400">Build consistent study routines and track your progress</p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
            <Plus className="w-4 h-4 mr-2" />
            New Habit
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-slate-400">Total Habits</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">{habits.length}</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-400">Completed Today</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {habits.filter(h => isCompletedToday(h)).length}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-slate-400">Avg Completion</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {habits.length > 0 ? Math.round(habits.reduce((acc, h) => acc + getCompletionRate(h), 0) / habits.length) : 0}%
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-slate-400">Longest Streak</span>
            </div>
            <p className="text-2xl font-bold text-slate-100">
              {habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak || 0)) : 0}
            </p>
          </div>
        </div>

        {/* Habits List */}
        <div className="space-y-4">
          {habits.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Getting Started with Habits</h3>
              <p className="text-slate-400 mb-6">
                We've added some sample habits to help you get started. Complete them daily to build streaks and improve your study routine!
              </p>
              <div className="bg-slate-800/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="text-sm text-slate-300 mb-2">💡 Pro tip: Building streaks increases motivation!</p>
                <p className="text-xs text-slate-400">Studies show that maintaining habits for 21+ days significantly improves long-term retention.</p>
              </div>
            </div>
          ) : (
            habits.map((habit) => (
              <div key={habit.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleCompletion(habit.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCompletedToday(habit)
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {isCompletedToday(habit) && <Check className="w-4 h-4" />}
                    </button>

                    <div>
                      <h3 className="font-semibold text-slate-100">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-sm text-slate-400">{habit.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>{habit.frequency}</span>
                        <span>•</span>
                        <span>Target: {getTargetLabel(habit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-slate-100">
                        {habit.currentStreak || 0}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Current streak</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Completion Rate</span>
                    <span>{getCompletionRate(habit)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${getCompletionRate(habit)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      {/* Create Habit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-100">Create New Habit</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Habit Name</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400"
                  placeholder="e.g., Study for 1 hour daily"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Description (optional)</label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-400 resize-none"
                  rows={3}
                  placeholder="Describe your habit..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Frequency</label>
                  <select
                    value={newHabit.frequency}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Target Count</label>
                  <input
                    type="number"
                    min={1}
                    value={newHabit.targetCount}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, targetCount: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateHabit}
                  disabled={!newHabit.name.trim() || creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Habit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}