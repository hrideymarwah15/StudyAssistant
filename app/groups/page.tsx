"use client"

import Navigation from "@/components/navigation"
import { StudyGroups } from "@/components/groups/StudyGroups"

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <StudyGroups />
      </main>
    </div>
  )
}
