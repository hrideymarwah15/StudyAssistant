"use client"

import { ProgressArc } from "@/lib/analytics/analyticsEngine"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface ProgressArcsProps {
  arcs: ProgressArc[]
  className?: string
}

export function ProgressArcs({ arcs, className = "" }: ProgressArcsProps) {
  const getTrendIcon = (trend: ProgressArc['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: ProgressArc['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {arcs.map((arc, index) => (
        <div key={index} className="p-4 bg-card rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-muted-foreground">{arc.subject}</h4>
            <div className="flex items-center gap-1">
              {getTrendIcon(arc.trend)}
              <span className={`text-xs font-medium ${getTrendColor(arc.trend)}`}>
                {arc.trendValue > 0 ? '+' : ''}{arc.trendValue}
              </span>
            </div>
          </div>

          {/* Progress Arc */}
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-200"
              />
              {/* Progress arc */}
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={arc.color}
                strokeWidth="2"
                strokeDasharray={`${arc.percentage}, 100`}
                className="transition-all duration-300"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: arc.color }}>
                {Math.round(arc.percentage)}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              {arc.current} / {arc.target} {arc.unit}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {arc.trend === 'up' && 'Improving'}
              {arc.trend === 'down' && 'Declining'}
              {arc.trend === 'stable' && 'Stable'}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}