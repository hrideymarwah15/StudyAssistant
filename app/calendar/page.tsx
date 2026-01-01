"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import Layout from "@/components/Layout"
import { 
  ChevronLeft, ChevronRight, Plus, Clock, MapPin, Calendar as CalendarIcon,
  Video, Code2, BookOpen, FlaskConical, Users, Repeat, X, Check, Edit2, Brain, Coffee
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
  getTimeBlocks, createTimeBlock, deleteTimeBlock,
  type CalendarEvent, type TimeBlock
} from "@/lib/firestore"

// Time slots for day view (6 AM to 11 PM)
const TIME_SLOTS = Array.from({ length: 18 }, (_, i) => i + 6)

// Days of week
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Event type colors
const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  class: "bg-blue-500/20 border-blue-500 text-blue-400",
  lab: "bg-purple-500/20 border-purple-500 text-purple-400",
  assignment: "bg-orange-500/20 border-orange-500 text-orange-400",
  exam: "bg-red-500/20 border-red-500 text-red-400",
  "study-session": "bg-green-500/20 border-green-500 text-green-400",
  contest: "bg-yellow-500/20 border-yellow-500 text-yellow-400",
  meeting: "bg-cyan-500/20 border-cyan-500 text-cyan-400",
  focus: "bg-pink-500/20 border-pink-500 text-pink-400",
  break: "bg-indigo-500/20 border-indigo-500 text-indigo-400",
  other: "bg-gray-500/20 border-gray-500 text-gray-400"
}

const EVENT_ICONS: Record<CalendarEvent["type"], React.ReactNode> = {
  class: <BookOpen className="w-3 h-3" />,
  lab: <FlaskConical className="w-3 h-3" />,
  assignment: <Clock className="w-3 h-3" />,
  exam: <BookOpen className="w-3 h-3" />,
  "study-session": <Clock className="w-3 h-3" />,
  contest: <Code2 className="w-3 h-3" />,
  meeting: <Users className="w-3 h-3" />,
  focus: <Brain className="w-3 h-3" />,
  break: <Coffee className="w-3 h-3" />,
  other: <CalendarIcon className="w-3 h-3" />
}

interface EventModalProps {
  event?: CalendarEvent | null
  date?: Date
  onClose: () => void
  onSave: (event: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => void
  onDelete?: () => void
}

function EventModal({ event, date, onClose, onSave, onDelete }: EventModalProps) {
  const [title, setTitle] = useState(event?.title || "")
  const [type, setType] = useState<CalendarEvent["type"]>(event?.type || "class")
  const [course, setCourse] = useState(event?.course || "")
  const [startTime, setStartTime] = useState(
    event?.startTime 
      ? new Date(event.startTime).toTimeString().slice(0, 5) 
      : "09:00"
  )
  const [endTime, setEndTime] = useState(
    event?.endTime 
      ? new Date(event.endTime).toTimeString().slice(0, 5) 
      : "10:00"
  )
  const [location, setLocation] = useState(event?.location || "")
  const [isOnline, setIsOnline] = useState(event?.isOnline || false)
  const [meetingLink, setMeetingLink] = useState(event?.meetingLink || "")
  const [isRecurring, setIsRecurring] = useState(event?.isRecurring || false)
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly">(event?.recurrence?.frequency || "weekly")
  const [recurringDays, setRecurringDays] = useState<number[]>(event?.recurrence?.daysOfWeek || [date?.getDay() || 1])
  const [eventDate, setEventDate] = useState(
    event?.startTime 
      ? new Date(event.startTime).toISOString().split("T")[0]
      : date?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const startDateTime = new Date(`${eventDate}T${startTime}`)
    const endDateTime = new Date(`${eventDate}T${endTime}`)
    onSave({
      title,
      type,
      course: course || undefined,
      description: undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      isAllDay: false,
      isRecurring,
      recurrence: isRecurring ? {
        frequency,
        daysOfWeek: recurringDays,
        endDate: undefined
      } : undefined,
      location: location || undefined,
      isOnline,
      meetingLink: meetingLink || undefined,
      color: undefined,
      reminders: undefined
    })
  }

  const toggleRecurringDay = (day: number) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {event ? "Edit Event" : "New Event"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm text-muted-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border focus:ring-2 focus:ring-primary"
              placeholder="Data Structures Lecture"
              required
            />
          </div>

          {/* Type and Course */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEvent["type"])}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border"
              >
                <option value="class">Class</option>
                <option value="lab">Lab</option>
                <option value="assignment">Assignment Due</option>
                <option value="exam">Exam</option>
                <option value="study-session">Study Session</option>
                <option value="contest">Contest (CP)</option>
                <option value="meeting">Meeting</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Course (optional)</label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border"
                placeholder="CS301"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Start</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border"
                required
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">End</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-muted border border-border"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Online event</span>
            </label>
            {isOnline ? (
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-muted border border-border"
                placeholder="https://meet.google.com/..."
              />
            ) : (
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-muted border border-border"
                placeholder="Room 301, CS Building"
              />
            )}
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">Recurring event</span>
              <Repeat className="w-4 h-4 text-muted-foreground" />
            </label>
            {isRecurring && (
              <div className="space-y-3 pl-6">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-4 py-2 rounded-xl bg-muted border border-border"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                </select>
                {frequency !== "daily" && (
                  <div className="flex gap-2">
                    {DAYS.map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleRecurringDay(i)}
                        className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                          recurringDays.includes(i)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {day.charAt(0)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="flex-1"
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {event ? "Save Changes" : "Create Event"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuthContext()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  // Load events
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        // Get date range for current view
        const start = viewMode === "week" 
          ? getWeekStart(currentDate)
          : getMonthStart(currentDate)
        const end = viewMode === "week"
          ? new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
          : getMonthEnd(currentDate)

        const [eventsData, blocksData] = await Promise.all([
          getCalendarEvents(user.uid, { start, end }),
          getTimeBlocks(user.uid, currentDate)
        ])

        // Add fallback events if none found
        let finalEvents = eventsData
        if (eventsData.length === 0) {
          const today = new Date()
          finalEvents = [
            {
              id: 'sample-1',
              userId: user.uid,
              title: 'Math Class',
              type: 'class' as const,
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0),
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 10, 30),
              description: 'Calculus lecture',
              location: 'Room 101',
              isAllDay: false,
              isRecurring: false,
              createdAt: new Date()
            },
            {
              id: 'sample-2',
              userId: user.uid,
              title: 'Study Session',
              type: 'study-session' as const,
              startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 19, 0),
              endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 21, 0),
              description: 'Review for upcoming exam',
              isAllDay: false,
              isRecurring: false,
              createdAt: new Date()
            }
          ]
        }

        setEvents(finalEvents)
        setTimeBlocks(blocksData)
      } catch (error) {
        console.error("Error loading calendar:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, currentDate, viewMode])

  // Date utilities
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const getMonthStart = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  const getMonthEnd = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  }

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (viewMode === "week") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get week days
  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate)
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [currentDate])

  // Get month days
  const monthDays = useMemo(() => {
    const start = getMonthStart(currentDate)
    const end = getMonthEnd(currentDate)
    const startDay = start.getDay()
    const days: (Date | null)[] = []

    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }

    return days
  }, [currentDate])

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  // Handle event creation/editing
  const handleSaveEvent = async (eventData: Omit<CalendarEvent, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user) return

    try {
      if (selectedEvent) {
        await updateCalendarEvent(selectedEvent.id, eventData)
        setEvents(prev => prev.map(e => 
          e.id === selectedEvent.id ? { ...e, ...eventData } : e
        ))
      } else {
        const id = await createCalendarEvent({
          ...eventData,
          userId: user.uid
        })
        const newEvent: CalendarEvent = {
          id,
          userId: user.uid,
          ...eventData,
          createdAt: new Date()
        }
        setEvents(prev => [...prev, newEvent])
      }
      setShowEventModal(false)
      setSelectedEvent(null)
      setSelectedDate(null)
    } catch (error) {
      console.error("Error saving event:", error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      await deleteCalendarEvent(selectedEvent.id)
      setEvents(prev => prev.filter(e => e.id !== selectedEvent.id))
      setShowEventModal(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Error deleting event:", error)
    }
  }

  const openNewEvent = (date?: Date) => {
    setSelectedEvent(null)
    setSelectedDate(date || new Date())
    setShowEventModal(true)
  }

  const openEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setSelectedDate(null)
    setShowEventModal(true)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatTime = (time: string | Date) => {
    let hours: number, minutes: number
    
    if (time instanceof Date) {
      hours = time.getHours()
      minutes = time.getMinutes()
    } else {
      [hours, minutes] = time.split(":").map(Number)
    }
    
    const ampm = hours >= 12 ? "PM" : "AM"
    const displayHour = hours % 12 || 12
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Layout 
      title="Calendar" 
      subtitle={`${currentDate.toLocaleDateString("en-US", { 
        month: "long", 
        year: "numeric"
      })}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-xl bg-muted p-1">
              <button
                onClick={() => setViewMode("week")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "week" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "month" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate("prev")}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate("next")}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Add Event */}
            <Button onClick={() => openNewEvent()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </div>
        </div>

        {/* Week View */}
        {viewMode === "week" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Day headers - Mobile responsive */}
            <div className="grid grid-cols-8 border-b border-border">
              <div className="p-2 sm:p-4 text-xs text-muted-foreground hidden sm:block" />
              {weekDays.map((date, i) => (
                <div 
                  key={i}
                  className={`p-2 sm:p-4 text-center border-l border-border ${
                    isToday(date) ? "bg-primary/10" : ""
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1">{DAYS[date.getDay()]}</p>
                  <p className={`text-sm sm:text-lg font-semibold ${
                    isToday(date) ? "text-primary" : "text-foreground"
                  }`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time grid - Mobile responsive */}
            <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-border/50 min-h-[50px] sm:min-h-[60px]">
                  <div className="p-1 sm:p-2 text-xs text-muted-foreground text-right pr-2 sm:pr-4 hidden sm:block">
                    {hour % 12 || 12} {hour >= 12 ? "PM" : "AM"}
                  </div>
                  {weekDays.map((date, dayIndex) => {
                    const dayEvents = getEventsForDay(date).filter(event => {
                      const startHour = event.startTime.getHours()
                      return startHour === hour
                    })

                    return (
                      <div 
                        key={dayIndex}
                        className={`border-l border-border/50 p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                          isToday(date) ? "bg-primary/5" : ""
                        }`}
                        onClick={() => openNewEvent(date)}
                      >
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditEvent(event)
                            }}
                            className={`p-1 sm:p-2 rounded-md sm:rounded-lg text-xs border-l-2 mb-1 cursor-pointer hover:opacity-80 transition-opacity ${EVENT_COLORS[event.type]}`}
                          >
                            <div className="flex items-center gap-1 font-medium truncate">
                              {EVENT_ICONS[event.type]}
                              <span className="hidden sm:inline">{event.title}</span>
                              <span className="sm:hidden">{event.title.slice(0, 8)}...</span>
                            </div>
                            <div className="text-[10px] opacity-75 mt-0.5 hidden sm:block">
                              {formatTime(event.startTime)} - {formatTime(event.endTime)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === "month" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Day headers - Mobile responsive */}
            <div className="grid grid-cols-7 border-b border-border">
              {DAYS.map(day => (
                <div key={day} className="p-2 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0, 3)}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Day grid - Mobile responsive */}
            <div className="grid grid-cols-7">
              {monthDays.map((date, i) => (
                <div
                  key={i}
                  className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-border/50 ${
                    date ? "cursor-pointer hover:bg-muted/30" : "bg-muted/10"
                  } ${date && isToday(date) ? "bg-primary/5" : ""}`}
                  onClick={() => date && openNewEvent(date)}
                >
                  {date && (
                    <>
                      <p className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                        isToday(date) 
                          ? "w-5 h-5 sm:w-7 sm:h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground mx-auto sm:mx-0"
                          : "text-foreground"
                      }`}>
                        {date.getDate()}
                      </p>
                      <div className="space-y-0.5 sm:space-y-1">
                        {getEventsForDay(date).slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditEvent(event)
                            }}
                            className={`px-1 sm:px-2 py-0.5 sm:py-1 rounded text-xs truncate cursor-pointer hover:opacity-80 ${EVENT_COLORS[event.type]}`}
                          >
                            <span className="hidden sm:inline">{event.title}</span>
                            <span className="sm:hidden">{event.title.slice(0, 6)}...</span>
                          </div>
                        ))}
                        {getEventsForDay(date).length > 2 && (
                          <p className="text-xs text-muted-foreground px-1 sm:px-2">
                            +{getEventsForDay(date).length - 2} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Buttons */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Add</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { type: "class" as const, label: "Class", icon: BookOpen },
              { type: "lab" as const, label: "Lab", icon: FlaskConical },
              { type: "assignment" as const, label: "Assignment", icon: Clock },
              { type: "contest" as const, label: "CP Contest", icon: Code2 },
              { type: "study-session" as const, label: "Study Session", icon: Clock },
              { type: "exam" as const, label: "Exam", icon: BookOpen }
            ].map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                variant="outline"
                onClick={() => {
                  setSelectedEvent(null)
                  setSelectedDate(new Date())
                  setShowEventModal(true)
                  // Note: Would need to pass default type to modal
                }}
                className="gap-2"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Events</h3>
          <div className="grid gap-3">
            {events
              .filter(e => new Date(e.startTime) >= new Date())
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 5)
              .map(event => (
                <div
                  key={event.id}
                  onClick={() => openEditEvent(event)}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className={`p-3 rounded-xl ${EVENT_COLORS[event.type]}`}>
                    {EVENT_ICONS[event.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.startTime).toLocaleDateString("en-US", { 
                        weekday: "short",
                        month: "short", 
                        day: "numeric" 
                      })} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  )}
                  {event.isOnline && (
                    <div className="flex items-center gap-1 text-sm text-cyan-400">
                      <Video className="w-4 h-4" />
                      Online
                    </div>
                  )}
                </div>
              ))}
            {events.filter(e => new Date(e.startTime) >= new Date()).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No upcoming events. Add one to get started!
              </p>
            )}
          </div>
        </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          date={selectedDate || undefined}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
            setSelectedDate(null)
          }}
          onSave={handleSaveEvent}
          onDelete={selectedEvent ? handleDeleteEvent : undefined}
        />
      )}
    </Layout>
  )
}
