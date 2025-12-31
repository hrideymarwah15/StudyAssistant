"use client"

import { RecommendationScore } from "@/lib/recommendations/scoreEngine"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info, TrendingUp, Clock, Target, Zap } from "lucide-react"

interface RecommendationTooltipProps {
  recommendation: RecommendationScore
  children: React.ReactNode
}

export function RecommendationTooltip({ recommendation, children }: RecommendationTooltipProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100"
    if (score >= 60) return "bg-yellow-100"
    return "bg-red-100"
  }

  const getFactorIcon = (factor: string) => {
    switch (factor.toLowerCase()) {
      case 'urgency':
        return <Clock className="w-3 h-3" />
      case 'importance':
        return <Target className="w-3 h-3" />
      case 'streak':
        return <TrendingUp className="w-3 h-3" />
      default:
        return <Info className="w-3 h-3" />
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" className="w-80 p-0">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Recommendation Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <Badge className={`${getScoreBg(recommendation.score)} ${getScoreColor(recommendation.score)} border-0`}>
                  {recommendation.score}/100
                </Badge>
              </div>

              {/* Contributing Factors */}
              <div>
                <h4 className="text-sm font-medium mb-2">Contributing Factors</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getFactorIcon('urgency')}
                      <span>Urgency</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{recommendation.urgency}</span>
                      <Badge variant="outline" className="text-xs">
                        40% weight
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getFactorIcon('importance')}
                      <span>Importance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{recommendation.importance}</span>
                      <Badge variant="outline" className="text-xs">
                        40% weight
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {getFactorIcon('streak')}
                      <span>Streak Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{recommendation.streakImpact}</span>
                      <Badge variant="outline" className="text-xs">
                        20% weight
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              {recommendation.reasoning && recommendation.reasoning.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Why This Recommendation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {recommendation.reasoning.map((reason, index) => (
                      <li key={index}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Type: {recommendation.type}</span>
                  <span>ID: {recommendation.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}