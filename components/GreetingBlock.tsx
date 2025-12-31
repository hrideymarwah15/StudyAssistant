"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function GreetingBlock() {
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

  return (
    <div className="greeting-block mb-6">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">
        {getGreeting()}, {userName}!
      </h1>
      <p className="text-slate-400 text-sm">
        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}
