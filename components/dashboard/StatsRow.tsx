"use client"

import { Clock, CheckCircle2, Flame, Target } from "lucide-react"
import Link from "next/link"
import { DailyStats, Habit } from "@/lib/firestore"

interface StatsRowProps {
  dailyStats: DailyStats | null
  todayHabitsCompleted: number
  totalHabits: number
}

export function StatsRow({ dailyStats, todayHabitsCompleted, totalHabits }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Link href="/analytics?tab=study-time" className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-center">
        <div className="flex items-center justify-center mb-2">
          <Clock className="w-6 h-6 text-blue-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {dailyStats?.totalStudyMinutes ? Math.round(dailyStats.totalStudyMinutes / 60 * 10) / 10 : 0}h
        </p>
        <p className="text-sm text-muted-foreground">Study time</p>
        <p className="text-xs text-muted-foreground">Track your progress</p>
      </Link>

      <Link href="/planner?filter=completed" className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-center">
        <div className="flex items-center justify-center mb-2">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {dailyStats?.taskCompleted || 0}
        </p>
        <p className="text-sm text-muted-foreground">Tasks completed</p>
        <p className="text-xs text-muted-foreground">Stay on track</p>
      </Link>

      <Link href="/habits" className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-center">
        <div className="flex items-center justify-center mb-2">
          <Flame className="w-6 h-6 text-orange-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {dailyStats?.streakDay || 0}
        </p>
        <p className="text-sm text-muted-foreground">Day streak</p>
        <p className="text-xs text-muted-foreground">Build consistency</p>
      </Link>

      <Link href="/habits?filter=today" className="p-4 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors text-center">
        <div className="flex items-center justify-center mb-2">
          <Target className="w-6 h-6 text-purple-500" />
        </div>
        <p className="text-2xl font-bold text-foreground">
          {todayHabitsCompleted}/{totalHabits}
        </p>
        <p className="text-sm text-muted-foreground">Habits done</p>
        <p className="text-xs text-muted-foreground">Daily routines</p>
      </Link>
    </div>
  )
}