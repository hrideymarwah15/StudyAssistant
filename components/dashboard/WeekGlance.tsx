"use client"

import { Clock, CheckCircle2, Flame, Calendar } from "lucide-react"

export function WeekGlance() {
  return (
    <div className="mb-8 p-6 rounded-xl bg-card border border-border">
      <h2 className="text-display-sm text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-green-500" />
        This Week at a Glance
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-muted/50 text-center border border-border">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-foreground">24h / 30h</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-center border border-border">
          <div className="flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-lg font-bold text-foreground">8 / 12</p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 text-center border border-border">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-lg font-bold text-foreground">5 / 7</p>
        </div>
      </div>
    </div>
  )
}