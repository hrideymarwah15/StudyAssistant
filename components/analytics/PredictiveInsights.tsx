"use client"

import { PredictiveInsights } from "@/lib/analytics/analyticsEngine"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, Target, Clock, Zap } from "lucide-react"

interface PredictiveInsightsProps {
  insights: PredictiveInsights
  className?: string
}

export function PredictiveInsightsComponent({ insights, className = "" }: PredictiveInsightsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getSeverityIcon = (type: string) => {
    switch (type) {
      case 'streak':
      case 'habit_slip':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'overdue_tasks':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'study_time':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'habit_building':
        return <Target className="w-5 h-5 text-blue-500" />
      case 'task_focus':
        return <Zap className="w-5 h-5 text-purple-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const allInsights = [
    ...insights.riskFactors.map(risk => ({ ...risk, category: 'risk' as const, severity: risk.severity })),
    ...insights.opportunities.map(opp => ({ ...opp, category: 'opportunity' as const, severity: opp.potential }))
  ]

  if (allInsights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">No predictive insights available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Next Week Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Next Week Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{insights.nextWeekPrediction.studyHours}h</p>
              <p className="text-sm text-muted-foreground">Study Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{insights.nextWeekPrediction.tasksToComplete}</p>
              <p className="text-sm text-muted-foreground">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{insights.nextWeekPrediction.habitsToMaintain}</p>
              <p className="text-sm text-muted-foreground">Habits</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors and Opportunities */}
      {allInsights.map((insight, index) => (
        <Card key={index} className={`border-2 ${getSeverityColor((insight as any).severity || (insight as any).potential || 'low')}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              {getSeverityIcon(insight.type)}
              <span className="capitalize">{insight.category}</span>
              <Badge variant="outline" className="ml-auto">
                {(insight as any).severity || (insight as any).potential}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{insight.message}</p>
            <p className="text-sm text-muted-foreground">{(insight as any).recommendation || (insight as any).action}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}