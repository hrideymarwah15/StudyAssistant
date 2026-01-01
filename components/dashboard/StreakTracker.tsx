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
    if (currentStreak >= 365) return "🌟 You're unstoppable! 1 year streak!"
    if (currentStreak >= 100) return "🔥 Century club! 100+ days!"
    if (currentStreak >= 60) return "💪 Two months strong!"
    if (currentStreak >= 30) return "🎯 One month streak!"
    if (currentStreak >= 7) return "⚡ Week warrior!"
    if (currentStreak >= 3) return "🚀 Building momentum!"
    return "💫 Keep going!"
  }

  const getNextMilestone = () => {
    const milestones = [7, 30, 60, 100, 365]
    return milestones.find(m => m > streak.currentStreak) || 365
  }

  const getStreakColor = () => {
    if (streak.currentStreak >= 30) return "text-orange-500"
    if (streak.currentStreak >= 7) return "text-yellow-500"
    return "text-gray-400"
  }

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card className="p-6 bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20 relative overflow-hidden">
        {showCelebration && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-yellow-500/20 to-orange-500/20 animate-pulse z-10 flex items-center justify-center">
            <div className="text-center">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-2 animate-bounce" />
              <p className="text-2xl font-bold text-orange-500">New Milestone!</p>
              <p className="text-lg">{streak.currentStreak} days strong! 🎉</p>
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className={`w-6 h-6 ${getStreakColor()}`} />
              <h3 className="text-2xl font-bold">{streak.currentStreak} Day Streak</h3>
            </div>
            <p className="text-sm text-muted-foreground">{getMilestoneMessage()}</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Target className="w-3 h-3" />
            Next: {getNextMilestone()}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{streak.longestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
          <div className="text-center">
            <Calendar className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{streak.totalDays}</p>
            <p className="text-xs text-muted-foreground">Total Days</p>
          </div>
          <div className="text-center">
            <Award className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{streak.milestones.length}</p>
            <p className="text-xs text-muted-foreground">Milestones</p>
          </div>
        </div>

        {streak.milestones.length > 0 && (
          <div className="pt-4 border-t border-orange-500/20">
            <p className="text-xs text-muted-foreground mb-2">Achievements</p>
            <div className="flex flex-wrap gap-2">
              {streak.milestones.sort((a, b) => b - a).map((milestone) => (
                <Badge key={milestone} variant="secondary" className="gap-1">
                  <Trophy className="w-3 h-3" />
                  {milestone}d
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Progress to next milestone */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{streak.currentStreak} days</span>
            <span>{getNextMilestone()} days</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${(streak.currentStreak / getNextMilestone()) * 100}%` }}
            />
          </div>
        </div>
      </Card>
    </>
  )
}
