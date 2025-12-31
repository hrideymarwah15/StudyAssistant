"use client"

import Navigation from "@/components/navigation"
import { AdvancedLearningTools } from "@/components/advanced-learning/AdvancedLearningTools"

export default function AdvancedLearningPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AdvancedLearningTools />
      </main>
    </div>
  )
}