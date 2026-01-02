"use client"

import { useState, useEffect } from "react"
import { Flame, Trophy } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { useAuth } from "@/lib/hooks/useAuth"

interface StreakData {
  currentStreak: number
  longestStreak: number
  totalDays: number
  lastActiveDate: string
  milestones: number[]
}

export function StreakTracker() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    lastActiveDate: "",
    milestones: []
  })
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (user) {
      loadStreakData()
    }
  }, [user])

  const loadStreakData = async () => {
    if (!user) return

    try {
      const streakRef = doc(db, "streaks", user.uid)
      const streakDoc = await getDoc(streakRef)

      if (streakDoc.exists()) {
        const data = streakDoc.data() as StreakData
        setStreak(data)
        await updateDailyStreak(data)
      } else {
        const newStreak: StreakData = {
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0,
          lastActiveDate: "",
          milestones: []
        }
        await setDoc(streakRef, newStreak)
        setStreak(newStreak)
      }
    } catch (error) {
      console.error("Error loading streak:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateDailyStreak = async (currentData: StreakData) => {
    if (!user) return

    const today = new Date().toDateString()
    const lastActive = new Date(currentData.lastActiveDate).toDateString()

    if (today === lastActive) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    let newStreak = currentData.currentStreak
    
    if (lastActive === yesterdayStr) {
      newStreak = currentData.currentStreak + 1
    } else if (currentData.lastActiveDate) {
      newStreak = 1
    } else {
      newStreak = 1
    }

    const newLongestStreak = Math.max(newStreak, currentData.longestStreak)
    const newTotalDays = currentData.totalDays + 1
    const newMilestones = [...currentData.milestones]

    const milestones = [7, 30, 60, 100, 365]
    for (const milestone of milestones) {
      if (newStreak === milestone && !newMilestones.includes(milestone)) {
        newMilestones.push(milestone)
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 5000)
      }
    }

    const updatedStreak: StreakData = {
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalDays: newTotalDays,
      lastActiveDate: today,
      milestones: newMilestones
    }

    const streakRef = doc(db, "streaks", user.uid)
    await setDoc(streakRef, updatedStreak)
    setStreak(updatedStreak)
  }

  const getNextMilestone = () => {
    const milestones = [7, 30, 60, 100, 365]
    return milestones.find(m => m > streak.currentStreak) || 365
  }

  const getDaysToMilestone = () => {
    return getNextMilestone() - streak.currentStreak
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  // Don't render if no streak yet
  if (streak.currentStreak === 0 && streak.totalDays === 0) {
    return null
  }

  // Compact inline banner
  return (
    <div className="relative flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/5 border border-orange-500/20">
      {/* Celebration flash */}
      {showCelebration && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 animate-pulse rounded-lg flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-500 animate-bounce mr-2" />
          <span className="text-yellow-400 font-medium">New Milestone!</span>
        </div>
      )}
      
      {/* Streak info */}
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-medium text-orange-400">{streak.currentStreak}-day streak</span>
        {getDaysToMilestone() <= 7 && (
          <span className="text-xs text-slate-500">
            • {getDaysToMilestone()}d to {getNextMilestone()}-day milestone
          </span>
        )}
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>Best: {streak.longestStreak}</span>
        <span>Total: {streak.totalDays}</span>
      </div>
    </div>
  )
}
