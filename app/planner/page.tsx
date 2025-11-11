"use client"

import Navigation from "@/components/navigation"
import { Calendar, CheckCircle, Circle, ChevronRight } from "lucide-react"
import { useState } from "react"

export default function PlannerPage() {
  const [tasks, setTasks] = useState([
    { id: 1, day: 1, title: "Chapter 1-3 Review", completed: true, hours: 2 },
    { id: 2, day: 2, title: "Practice Problems Set A", completed: true, hours: 2.5 },
    { id: 3, day: 3, title: "Chapter 4 Deep Dive", completed: false, hours: 3 },
    { id: 4, day: 4, title: "Mock Exam 1", completed: false, hours: 4 },
  ])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Exam Prep Scheduler</h1>
          <p className="text-muted-foreground">Your personalized 14-day study roadmap</p>
        </div>

        {/* Schedule Info */}
        <div className="mb-8 p-6 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Exam Date: February 28, 2024</h3>
          </div>
          <p className="text-muted-foreground">14 days remaining • 3.5 hours average daily study time</p>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="p-6 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <button className="mt-1">
                  {task.completed ? (
                    <CheckCircle className="w-6 h-6 text-primary" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                  )}
                </button>
                <div className="flex-1">
                  <h4
                    className={`font-semibold mb-1 ${task.completed ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    Day {task.day}: {task.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{task.hours} hours • 3 subtasks</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg bg-card border border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">2/4</p>
            <p className="text-muted-foreground">Tasks Completed</p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">4.5h</p>
            <p className="text-muted-foreground">Study Time Today</p>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border text-center">
            <p className="text-3xl font-bold text-primary mb-2">50%</p>
            <p className="text-muted-foreground">Progress to Exam</p>
          </div>
        </div>
      </div>
    </main>
  )
}
