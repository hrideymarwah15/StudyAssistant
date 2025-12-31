"use client"

import { useMemo } from "react"
import { HeatmapData } from "@/lib/analytics/analyticsEngine"

interface StudyHeatmapProps {
  data: HeatmapData[]
  className?: string
}

export function StudyHeatmap({ data, className = "" }: StudyHeatmapProps) {
  const { weeks, maxIntensity } = useMemo(() => {
    const weeks: HeatmapData[][] = []
    let currentWeek: HeatmapData[] = []
    let maxIntensity = 0

    // Group data by weeks (Sunday to Saturday)
    data.forEach((day) => {
      const date = new Date(day.date + 'T00:00:00')
      const dayOfWeek = date.getDay() // 0 = Sunday

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push([...currentWeek])
        currentWeek = []
      }

      currentWeek.push(day)
      maxIntensity = Math.max(maxIntensity, day.intensity)
    })

    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return { weeks, maxIntensity }
  }, [data])

  const getIntensityColor = (intensity: number, maxIntensity: number) => {
    if (intensity === 0) return 'bg-gray-100'

    const ratio = intensity / Math.max(maxIntensity, 1)
    if (ratio >= 0.8) return 'bg-green-500'
    if (ratio >= 0.6) return 'bg-green-400'
    if (ratio >= 0.4) return 'bg-green-300'
    if (ratio >= 0.2) return 'bg-green-200'
    return 'bg-green-100'
  }

  const getTooltipContent = (day: HeatmapData) => {
    const date = new Date(day.date + 'T00:00:00')
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}
${day.studyMinutes > 0 ? `${Math.round(day.studyMinutes)} min study` : 'No study'}
${day.tasksCompleted > 0 ? `${day.tasksCompleted} tasks completed` : ''}
${day.habitsCompleted > 0 ? `${day.habitsCompleted} habits completed` : ''}`.trim()
  }

  return (
    <div className={`p-4 bg-card rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Study Activity</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200"></div>
            <div className="w-3 h-3 rounded-sm bg-green-300"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400"></div>
            <div className="w-3 h-3 rounded-sm bg-green-500"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pr-2">
            <div className="h-6"></div> {/* Spacer for month labels */}
            {['Mon', 'Wed', 'Fri'].map((day) => (
              <div key={day} className="h-3 text-xs text-muted-foreground flex items-center">
                {day}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {weeks.slice(-12).map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {/* Month label for first day of month */}
              <div className="h-6 text-xs text-muted-foreground flex items-center justify-center">
                {week.length > 0 && new Date(week[0].date + 'T00:00:00').getDate() <= 7 &&
                  new Date(week[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
                }
              </div>

              {/* Day cells */}
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-blue-300 hover:ring-offset-1 ${getIntensityColor(day.intensity, maxIntensity)}`}
                  title={getTooltipContent(day)}
                />
              ))}

              {/* Fill empty cells for incomplete weeks */}
              {Array.from({ length: 7 - week.length }).map((_, index) => (
                <div key={`empty-${index}`} className="w-3 h-3 rounded-sm bg-gray-50" />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Click on any cell to see detailed activity for that day</p>
      </div>
    </div>
  )
}