"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, Trophy, Target, TrendingUp, Calendar, Award } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, getDoc } from "firebase/firestore"
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
        
        // Check if we need to update streak for today
        await updateDailyStreak(data)
      } else {
        // Initialize streak data
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

    // Already updated today
    if (today === lastActive) return

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()

    let newStreak = currentData.currentStreak
    
    // Check if streak continues or breaks
    if (lastActive === yesterdayStr) {
      // Streak continues
      newStreak = currentData.currentStreak + 1
    } else if (currentData.lastActiveDate) {
      // Streak broken, restart
      newStreak = 1
    } else {
      // First day
      newStreak = 1
    }

    const newLongestStreak = Math.max(newStreak, currentData.longestStreak)
    const newTotalDays = currentData.totalDays + 1
    const newMilestones = [...currentData.milestones]

    // Check for milestone achievements
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

  const getMilestoneMessage = () => {
    const { currentStreak } = streak
    if (currentStreak >= 365) return "You're unstoppable! 1 year streak!"
    if (currentStreak >= 100) return "Century club! 100+ days!"
    if (currentStreak >= 60) return "Two months strong!"
    if (currentStreak >= 30) return "One month streak!"
    if (currentStreak >= 7) return "Week warrior!"
    if (currentStreak >= 3) return "Building momentum!"
    return "Start your streak today!"
  }

  const getNextMilestone = () => {
    const milestones = [7, 30, 60, 100, 365]
    return milestones.find(m => m > streak.currentStreak) || 365
  }

  const getDaysToMilestone = () => {
    return getNextMilestone() - streak.currentStreak
  }

  const getStreakEmoji = () => {
    if (streak.currentStreak >= 100) return "🌟"
    if (streak.currentStreak >= 60) return "💪"
    if (streak.currentStreak >= 30) return "🎯"
    if (streak.currentStreak >= 7) return "⚡"
    if (streak.currentStreak >= 3) return "🚀"
    return "💫"
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/20 animate-pulse">
        <div className="h-6 w-48 bg-slate-700 rounded"></div>
      </div>
    )
  }

  // Compact motivational banner style
  return (
    <>
      <div className="relative p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border border-orange-500/20 overflow-hidden">
        {/* Celebration overlay */}
        {showCelebration && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-yellow-500/30 to-orange-500/30 animate-pulse z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-1 animate-bounce" />
              <p className="text-lg font-bold text-orange-400">New Milestone! {streak.currentStreak} days! 🎉</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left - Streak info */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl">
              {getStreakEmoji()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-xl font-bold text-white">{streak.currentStreak}-day streak</span>
              </div>
              <p className="text-sm text-slate-400">
                {getDaysToMilestone()} days to {getNextMilestone()}-day milestone 🔥
              </p>
            </div>
          </div>

          {/* Right - Quick stats */}
          <div className="flex items-center gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-white">{streak.longestStreak}</p>
              <p className="text-xs text-slate-500">Best</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-lg font-bold text-white">{streak.totalDays}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div>
              <p className="text-lg font-bold text-white">{streak.milestones.length}</p>
              <p className="text-xs text-slate-500">🏆</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 pt-3 border-t border-orange-500/20">
          <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min((streak.currentStreak / getNextMilestone()) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
