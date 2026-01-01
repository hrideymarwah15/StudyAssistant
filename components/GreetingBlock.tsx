"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Flame, Target, Zap } from "lucide-react"

interface GreetingBlockProps {
  todayTarget?: string
  streakDays?: number
}

export default function GreetingBlock({ todayTarget, streakDays = 0 }: GreetingBlockProps) {
  const [user, setUser] = useState<User | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const userName = user?.displayName || user?.email?.split("@")[0] || "Student"

  // Generate smart target suggestion based on time
  const getSmartTarget = () => {
    const hour = currentTime.getHours()
    if (todayTarget) return todayTarget
    if (hour < 12) return "2h deep work on your priority subject"
    if (hour < 17) return "Complete pending tasks + review notes"
    return "Light review + plan tomorrow"
  }

  return (
    <div className="greeting-block mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">
            {getGreeting()}, {userName}!
          </h1>
          <p className="text-slate-400 text-sm">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        {/* Streak badge */}
        {streakDays > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-orange-400 text-sm font-medium">
              {streakDays}-day streak
            </span>
          </div>
        )}
      </div>
      
      {/* Actionable target subheading */}
      <div className="mt-3 flex items-center gap-2 text-slate-300">
        <Target className="w-4 h-4 text-blue-400" />
        <span className="text-sm">
          <span className="text-slate-400">Today's target:</span>{" "}
          <span className="font-medium">{getSmartTarget()}</span>
        </span>
      </div>
    </div>
  )
}
