"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, X, AlertCircle, Info, AlertTriangle } from "lucide-react"

type NotificationType = "success" | "error" | "warning" | "info"

interface NotificationProps {
  type: NotificationType
  message: string
  description?: string
  duration?: number
  onClose?: () => void
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colorMap = {
  success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
  warning: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
  info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
}

const iconColorMap = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  warning: "text-orange-600 dark:text-orange-400",
  info: "text-blue-600 dark:text-blue-400"
}

export function Notification({ 
  type, 
  message, 
  description, 
  duration = 5000,
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = iconMap[type]

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-md w-full pointer-events-auto animate-slide-in`}
    >
      <div className={`rounded-lg border p-4 shadow-lg ${colorMap[type]}`}>
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColorMap[type]}`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">{message}</p>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Notification Manager for global notifications
let notificationId = 0
const notifications = new Map<number, React.ReactNode>()
const listeners = new Set<() => void>()

export function showNotification(
  type: NotificationType,
  message: string,
  description?: string,
  duration?: number
) {
  const id = notificationId++
  
  const notification = (
    <Notification
      key={id}
      type={type}
      message={message}
      description={description}
      duration={duration}
      onClose={() => {
        notifications.delete(id)
        listeners.forEach(fn => fn())
      }}
    />
  )

  notifications.set(id, notification)
  listeners.forEach(fn => fn())

  return id
}

export function NotificationContainer() {
  const [, setVersion] = useState(0)

  useEffect(() => {
    const update = () => setVersion(v => v + 1)
    listeners.add(update)
    return () => { listeners.delete(update) }
  }, [])

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none p-4">
      {Array.from(notifications.values())}
    </div>
  )
}
