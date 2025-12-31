"use client"

import { Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { CalendarEvent } from "@/lib/firestore"
import { EmptyState } from "@/components/ui/EmptyState"

interface TodayScheduleProps {
  events: CalendarEvent[]
}

export function TodaySchedule({ events }: TodayScheduleProps) {
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

  return (
    <div className="p-6 rounded-2xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-display-sm text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Today's Schedule
        </h3>
        <Link href="/calendar" className="text-sm text-primary hover:underline">
          Full calendar
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nothing scheduled today"
          description="Add classes, exams, or focus sessions to your calendar."
          action={{
            label: "Add to Calendar",
            onClick: () => {
              // TODO: Open calendar with today prefilled
              console.log("Open calendar for today")
            }
          }}
        />
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className={`w-1 h-12 rounded-full ${getEventTypeColor(event.type)}`} />
              <div className="flex-1">
                <p className="font-medium text-foreground">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  {event.location && ` • ${event.location}`}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground capitalize">
                {event.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}