"use client"

import { Calendar, Clock, Sparkles, Plus, Zap } from "lucide-react"
import Link from "next/link"
import { CalendarEvent } from "@/lib/firestore"
import { EmptyState } from "@/components/ui/EmptyState"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"

interface TodayScheduleProps {
  events: CalendarEvent[]
}

// AI-powered schedule analysis
const analyzeSchedule = (events: CalendarEvent[]) => {
  const now = new Date()
  const currentHour = now.getHours()
  
  // Find gaps in schedule for focus time suggestions
  const gaps: { start: number; end: number; duration: number }[] = []
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
  
  // Check morning gap (9am to first event)
  if (sortedEvents.length > 0) {
    const firstEventHour = new Date(sortedEvents[0].startTime).getHours()
    if (firstEventHour > 9) {
      gaps.push({ start: 9, end: firstEventHour, duration: firstEventHour - 9 })
    }
  }
  
  // Check gaps between events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const endTime = new Date(sortedEvents[i].endTime).getHours()
    const nextStartTime = new Date(sortedEvents[i + 1].startTime).getHours()
    if (nextStartTime - endTime >= 1) {
      gaps.push({ start: endTime, end: nextStartTime, duration: nextStartTime - endTime })
    }
  }
  
  // Check evening gap (last event to 9pm)
  if (sortedEvents.length > 0) {
    const lastEventEnd = new Date(sortedEvents[sortedEvents.length - 1].endTime).getHours()
    if (lastEventEnd < 21) {
      gaps.push({ start: lastEventEnd, end: 21, duration: 21 - lastEventEnd })
    }
  }
  
  // Find best focus slot based on time of day
  const focusableGaps = gaps.filter(g => g.duration >= 1 && g.start > currentHour)
  const bestGap = focusableGaps.find(g => 
    (g.start >= 9 && g.start <= 11) || // Morning peak
    (g.start >= 14 && g.start <= 16)   // Afternoon peak
  ) || focusableGaps[0]
  
  // Upcoming event
  const nextEvent = sortedEvents.find(e => new Date(e.startTime) > now)
  const minutesToNext = nextEvent 
    ? Math.round((new Date(nextEvent.startTime).getTime() - now.getTime()) / (1000 * 60))
    : null

  return {
    gaps,
    bestGap,
    nextEvent,
    minutesToNext,
    suggestion: bestGap 
      ? `${bestGap.duration}h focus window at ${bestGap.start > 12 ? bestGap.start - 12 : bestGap.start}${bestGap.start >= 12 ? 'pm' : 'am'}`
      : events.length === 0 
        ? "Wide open day - perfect for deep work!"
        : "Busy day - squeeze in short sessions"
  }
}

export function TodaySchedule({ events }: TodayScheduleProps) {
  const analysis = useMemo(() => analyzeSchedule(events), [events])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "class": return "bg-blue-500"
      case "exam": return "bg-red-500"
      case "assignment": return "bg-orange-500"
      case "focus": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  const isEventNow = (event: CalendarEvent) => {
    const now = new Date()
    return new Date(event.startTime) <= now && new Date(event.endTime) >= now
  }

  const isEventSoon = (event: CalendarEvent) => {
    const now = new Date()
    const startTime = new Date(event.startTime)
    const minutesUntil = (startTime.getTime() - now.getTime()) / (1000 * 60)
    return minutesUntil > 0 && minutesUntil <= 30
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-foreground">Today's Schedule</h3>
        </div>
        <Link href="/calendar" className="text-sm text-primary hover:underline">
          Full calendar
        </Link>
      </div>

      {/* AI Schedule Insight */}
      {analysis.suggestion && (
        <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{analysis.suggestion}</span>
          </div>
          {analysis.bestGap && (
            <Button size="sm" variant="ghost" className="text-primary text-xs">
              Schedule Focus
            </Button>
          )}
        </div>
      )}

      {/* Next Up Alert */}
      {analysis.nextEvent && analysis.minutesToNext && analysis.minutesToNext <= 60 && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
          analysis.minutesToNext <= 15 
            ? 'bg-orange-500/10 border border-orange-500/20' 
            : 'bg-muted/50'
        }`}>
          <Clock className={`w-4 h-4 ${analysis.minutesToNext <= 15 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          <span className="text-sm">
            <strong>{analysis.nextEvent.title}</strong> in {analysis.minutesToNext} min
          </span>
        </div>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing scheduled today"
          description="Wide open for deep work! Add classes, exams, or focus sessions."
          action={{
            label: "Add to Calendar",
            onClick: () => {
              window.location.href = '/calendar'
            }
          }}
        />
      ) : (
        <div className="space-y-2">
          {events.map(event => {
            const isNow = isEventNow(event)
            const isSoon = isEventSoon(event)
            
            return (
              <div 
                key={event.id} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isNow 
                    ? 'bg-primary/10 border border-primary/30 ring-1 ring-primary/20' 
                    : isSoon
                      ? 'bg-orange-500/5 border border-orange-500/20'
                      : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className={`w-1 h-12 rounded-full ${getEventTypeColor(event.type)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{event.title}</p>
                    {isNow && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        NOW
                      </span>
                    )}
                    {isSoon && !isNow && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded capitalize ${
                  isNow ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {event.type}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}