"use client"

import Navigation from "@/components/navigation"
import { Calendar, CheckCircle, Circle, X, Loader2, Sparkles, Trash2, ChevronDown, ChevronUp, Plus, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getStudyTasks, createStudyTask, toggleTaskComplete, deleteStudyTask, clearPlanTasks,
  getStudyPlans, createStudyPlan, deleteStudyPlan, updatePlanProgress, updatePlanTotalTasks,
  type StudyTask, type StudyPlan 
} from "@/lib/firestore"
import { generatePersonalizedContent } from "@/lib/ai-client"
import { usePersistentTasks } from "@/lib/hooks/usePersistentTasks"

export default function PlannerPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<string | null>(null)
  const [prioritizing, setPrioritizing] = useState(false)
  const [planConfig, setPlanConfig] = useState({
    subject: "",
    examDate: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    hoursPerDay: 2
  })

  const { studyTasks, loadStudyTasks, toggleStudyTask, saving, error } = usePersistentTasks()
  const prioritizeTasks = async (planId: string) => {
    if (!user) return
    setPrioritizing(true)
    
    try {
      const planTasks = studyTasks[planId] || []
      if (planTasks.length === 0) return
      
      // Generate prioritization advice
      const taskList = planTasks.map(t => `${t.title} (${t.priority}, ${t.status})`).join('\n')
      const advice = await generatePersonalizedContent({
        learningStyle: "reading",
        goals: ["Complete tasks efficiently", "Focus on high-impact activities"],
        currentLevel: "intermediate",
        preferredSubjects: []
      }, `Prioritize these study tasks for maximum effectiveness:\n${taskList}`, "explanation")
      
      // Simple prioritization based on priority and status
      const prioritized = [...planTasks].sort((a, b) => {
        // Completed tasks at bottom
        if (a.status === 'completed' && b.status !== 'completed') return 1
        if (b.status === 'completed' && a.status !== 'completed') return -1
        
        // Priority order
        const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 }
        const aPriority = priorityOrder[a.priority] || 0
        const bPriority = priorityOrder[b.priority] || 0
        
        return bPriority - aPriority
      })
      
      // Update the studyTasks in the hook state
      // Note: In a real implementation, we'd update this through the hook
      // For now, we'll reload the tasks
      await loadStudyTasks(planId)
      
      // Show AI advice (could be displayed in UI)
      console.log("AI Prioritization Advice:", advice)
    } catch (error) {
      console.error("Error prioritizing tasks:", error)
    } finally {
      setPrioritizing(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userPlans = await getStudyPlans(currentUser.uid)
          setPlans(userPlans)
          
          // Load tasks for each plan using the persistent hook
          for (const plan of userPlans) {
            await loadStudyTasks(plan.id)
          }
          
          // Auto-expand first plan if exists
          if (userPlans.length > 0) {
            setExpandedPlan(userPlans[0].id)
          }
        } catch (error) {
          console.error("Error loading plans:", error)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleToggleComplete = async (planId: string, taskId: string, currentStatus: boolean) => {
    await toggleStudyTask(taskId, !currentStatus, planId)

    // Update plan progress after successful toggle
    const planTasks = studyTasks[planId] || []
    const newCompletedCount = planTasks.filter((t: StudyTask) => t.completed).length
    await updatePlanProgress(planId, newCompletedCount)

    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, completedTasks: newCompletedCount } : p
    ))
  }

  const handleDeleteTask = async (planId: string, taskId: string) => {
    // Note: The persistent hook doesn't have a delete function yet, so we'll handle this directly
    try {
      await deleteStudyTask(taskId)
      // The hook will automatically update when we reload
      await loadStudyTasks(planId)

      // Update plan totals
      const planTasks = studyTasks[planId] || []
      const newTasks = planTasks.filter(t => t.id !== taskId)
      setPlans(prev => prev.map(p =>
        p.id === planId ? { ...p, totalTasks: newTasks.length } : p
      ))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Delete this entire study plan and all its tasks?")) return
    
    setDeletingPlan(planId)
    try {
      await deleteStudyPlan(planId)
      setPlans(prev => prev.filter(p => p.id !== planId))
      // The hook will automatically update studyTasks state
      if (expandedPlan === planId) {
        setExpandedPlan(null)
      }
    } catch (error) {
      console.error("Error deleting plan:", error)
    } finally {
      setDeletingPlan(null)
    }
  }

  const generateStudyPlan = async () => {
    if (!user || !planConfig.subject || !planConfig.examDate) return
    
    setGenerating(true)
    try {
      const today = new Date()
      const examDate = new Date(planConfig.examDate)
      const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilExam <= 0) {
        alert("Please select a future exam date")
        setGenerating(false)
        return
      }

      // Create the study plan first
      const planId = await createStudyPlan({
        name: planConfig.subject,
        subject: planConfig.subject,
        examDate: examDate,
        difficulty: planConfig.difficulty,
        hoursPerDay: planConfig.hoursPerDay,
        userId: user.uid,
        totalTasks: 0
      })

      // Generate study plan based on difficulty
      const totalDays = Math.min(daysUntilExam, 30) // Max 30 days plan
      const hoursMultiplier = planConfig.difficulty === "easy" ? 0.8 : planConfig.difficulty === "hard" ? 1.3 : 1
      
      // Study plan templates based on difficulty
      const studyPhases = {
        easy: [
          { phase: "Foundation Review", days: 0.3, description: "Review basic concepts and fundamentals" },
          { phase: "Core Content", days: 0.4, description: "Study main topics and key theories" },
          { phase: "Practice", days: 0.2, description: "Practice problems and examples" },
          { phase: "Final Review", days: 0.1, description: "Quick review and rest" }
        ],
        medium: [
          { phase: "Foundation Review", days: 0.2, description: "Review prerequisites and basics" },
          { phase: "Deep Learning", days: 0.35, description: "In-depth study of core concepts" },
          { phase: "Application", days: 0.25, description: "Apply concepts to problems" },
          { phase: "Mock Tests", days: 0.1, description: "Take practice exams" },
          { phase: "Final Review", days: 0.1, description: "Review weak areas" }
        ],
        hard: [
          { phase: "Intensive Foundation", days: 0.15, description: "Rapid review of all prerequisites" },
          { phase: "Advanced Concepts", days: 0.3, description: "Master complex topics" },
          { phase: "Problem Solving", days: 0.25, description: "Solve challenging problems" },
          { phase: "Timed Practice", days: 0.15, description: "Practice under exam conditions" },
          { phase: "Mock Exams", days: 0.1, description: "Full practice exams" },
          { phase: "Final Push", days: 0.05, description: "Last minute review" }
        ]
      }

      const phases = studyPhases[planConfig.difficulty]
      let currentDay = 1
      let totalTasks = 0

      for (const phase of phases) {
        const phaseDays = Math.max(1, Math.round(totalDays * phase.days))
        for (let i = 0; i < phaseDays && currentDay <= totalDays; i++) {
          const taskDate = new Date(today)
          taskDate.setDate(taskDate.getDate() + currentDay - 1)
          
          await createStudyTask({
            title: `${planConfig.subject}: ${phase.phase}`,
            day: currentDay,
            hours: Math.round(planConfig.hoursPerDay * hoursMultiplier * 10) / 10,
            dueDate: taskDate,
            userId: user.uid,
            planId: planId,
            priority: "medium",
            status: "pending"
          })
          currentDay++
          totalTasks++
        }
      }

      // Update plan with total tasks count
      await updatePlanTotalTasks(planId, totalTasks)
      await updatePlanProgress(planId, 0)

      // Reload plans and tasks
      const userPlans = await getStudyPlans(user.uid)
      setPlans(userPlans)

      await loadStudyTasks(planId)

      setExpandedPlan(planId)
      setShowGenerator(false)
      setPlanConfig({ subject: "", examDate: "", difficulty: "medium", hoursPerDay: 2 })
    } catch (error: any) {
      console.error("Error generating plan:", error)
      alert("Failed to generate study plan: " + (error?.message || "Unknown error"))
    } finally {
      setGenerating(false)
    }
  }

  // Calculate overall stats
  const totalTasks = plans.reduce((sum, p) => sum + (p.totalTasks || 0), 0)
  const completedTasks = plans.reduce((sum, p) => sum + (p.completedTasks || 0), 0)
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif font-bold text-slate-100 mb-2">Study Planner</h1>
            <p className="text-slate-400 mb-4">Create and manage study plans for your courses and exams</p>
            <p className="text-slate-400">Manage multiple study plans for your exams</p>
          </div>
          <Button onClick={() => setShowGenerator(true)} className="bg-gradient-to-r from-primary to-purple-600">
            <Plus className="w-4 h-4 mr-2" /> New Plan
          </Button>
        </div>

        {/* Overall Stats */}
        {plans.length > 0 && (
          <div className="mb-8 grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-primary">{plans.length}</p>
              <p className="text-sm text-muted-foreground">Study Plans</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-primary">{totalTasks}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-green-500">{completedTasks}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border text-center">
              <p className="text-2xl font-bold text-primary">{progressPercent}%</p>
              <p className="text-sm text-muted-foreground">Overall Progress</p>
            </div>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No study plans yet</h3>
            <p className="text-muted-foreground mb-6">Create personalized study plans for your upcoming exams</p>
            <Button onClick={() => setShowGenerator(true)} className="bg-gradient-to-r from-primary to-purple-600">
              <Sparkles className="w-4 h-4 mr-2" /> Create Your First Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              const planTasks = studyTasks[plan.id] || []
              const planCompletedCount = planTasks.filter(t => t.completed).length
              const planProgressPercent = planTasks.length > 0
                ? Math.round((planCompletedCount / planTasks.length) * 100)
                : 0
              const isExpanded = expandedPlan === plan.id
              const daysLeft = Math.ceil((plan.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={plan.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Plan Header */}
                  <div 
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <div>
                          <h3 className="font-semibold text-foreground">{plan.name}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              plan.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                              plan.difficulty === "hard" ? "bg-red-500/20 text-red-400" :
                              "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {plan.difficulty}
                            </span>
                            <span>{daysLeft > 0 ? `${daysLeft} days left` : "Exam passed"}</span>
                            <span>{plan.examDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Progress bar */}
                        <div className="hidden md:flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                              style={{ width: `${planProgressPercent}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{planProgressPercent}%</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); prioritizeTasks(plan.id); }}
                          className="text-muted-foreground hover:text-blue-500 p-1 mr-2"
                          disabled={prioritizing}
                          title="AI Smart Sort"
                        >
                          {prioritizing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                          className="text-muted-foreground hover:text-red-500 p-1"
                          disabled={deletingPlan === plan.id}
                        >
                          {deletingPlan === plan.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Plan Tasks */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {planTasks.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading tasks...
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto">
                          {planTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`p-4 border-b border-border last:border-b-0 transition-all ${
                                task.completed 
                                  ? "bg-green-500/5" 
                                  : "hover:bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <button onClick={() => handleToggleComplete(plan.id, task.id, task.completed)}>
                                  {task.completed ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Day {task.day}</span>
                                    <h4 className={`font-medium text-sm ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                      {task.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {task.hours} hours • {task.dueDate.toLocaleDateString()}
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTask(plan.id, task.id)}
                                  className="text-muted-foreground hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Generate Plan Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Generate Study Plan
              </h2>
              <button onClick={() => setShowGenerator(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Subject / Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g., Calculus, Physics, History"
                  value={planConfig.subject}
                  onChange={(e) => setPlanConfig({ ...planConfig, subject: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Exam Date</label>
                <input
                  type="date"
                  value={planConfig.examDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPlanConfig({ ...planConfig, examDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Difficulty Level</label>
                <select
                  value={planConfig.difficulty}
                  onChange={(e) => setPlanConfig({ ...planConfig, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                >
                  <option value="easy">Easy - Light review, flexible schedule</option>
                  <option value="medium">Medium - Balanced study plan</option>
                  <option value="hard">Hard - Intensive preparation</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Hours per Day</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={planConfig.hoursPerDay}
                  onChange={(e) => setPlanConfig({ ...planConfig, hoursPerDay: parseFloat(e.target.value) || 2 })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-primary to-purple-600" 
                onClick={generateStudyPlan}
                disabled={generating || !planConfig.subject || !planConfig.examDate}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
