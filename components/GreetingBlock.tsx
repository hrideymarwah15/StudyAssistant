"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Flame } from "lucide-react"

interface GreetingBlockProps {
  todayTarget?: string
  streakDays?: number
  focusMinutes?: number
  targetMinutes?: number
}

export default function GreetingBlock({ 
  todayTarget, 
  streakDays = 0,
  focusMinutes = 0,
  targetMinutes = 120
}: GreetingBlockProps) {
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
    if (hour < 12) return "2h deep work • DSA + Math"
    if (hour < 17) return "Complete priority tasks • review notes"
    return "Light review • plan tomorrow"
  }

  // Calculate days to next milestone
  const getNextMilestone = () => {
    const milestones = [7, 14, 30, 60, 100]
    const next = milestones.find(m => m > streakDays)
    return next ? next - streakDays : 0
  }

  return (
    <div className="greeting-block mb-4">
      {/* Single line: Greeting + Streak */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            {getGreeting()}, {userName.toUpperCase()}!
          </h1>
          <span className="text-slate-500 text-sm hidden sm:inline">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        {/* Compact streak indicator */}
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 text-orange-400 text-sm font-medium">
            <Flame className="w-4 h-4" />
            <span>{streakDays}-day streak</span>
            {getNextMilestone() > 0 && getNextMilestone() <= 5 && (
              <span className="text-slate-500 text-xs">• {getNextMilestone()}d to milestone</span>
            )}
          </div>
        )}
      </div>
      
      {/* Target line - concise */}
      <p className="text-slate-400 text-sm mt-1">
        Target: <span className="text-slate-300">{getSmartTarget()}</span>
      </p>
    </div>
  )
}
