"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Database, Brain, Mic, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { checkHealth, type HealthResponse } from "@/lib/api"

export function AISystemHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHealth()
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadHealth = async () => {
    try {
      const data = await checkHealth()
      setHealth(data)
      setError(null)
    } catch (err) {
      setError("Backend offline")
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            AI System Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (error || !health) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            AI System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Backend Offline</p>
              <p className="text-sm text-red-700 dark:text-red-300">Start backend to enable AI features</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isHealthy = health.status === "healthy"
  const services = health.services

  return (
    <Card className={`bg-gradient-to-br ${
      isHealthy 
        ? "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900" 
        : "from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-900"
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className={`w-5 h-5 ${isHealthy ? "text-green-600" : "text-yellow-600"}`} />
          AI System Status
          <Badge variant={isHealthy ? "default" : "secondary"} className="ml-auto">
            {isHealthy ? "Healthy" : "Degraded"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Qdrant */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              services.qdrant?.connected 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <Database className={`w-4 h-4 ${
                services.qdrant?.connected 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">Vector Memory</p>
              <p className="text-xs text-muted-foreground">
                {services.qdrant?.vectors_count || 0} items stored
              </p>
            </div>
          </div>
          <Badge variant={services.qdrant?.connected ? "default" : "destructive"} className="text-xs">
            {services.qdrant?.connected ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Ollama */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              services.ollama?.connected 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <Brain className={`w-4 h-4 ${
                services.ollama?.connected 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">AI Models</p>
              <p className="text-xs text-muted-foreground">
                {services.ollama?.models?.length || 0} models
              </p>
            </div>
          </div>
          <Badge variant={services.ollama?.connected ? "default" : "destructive"} className="text-xs">
            {services.ollama?.connected ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Whisper */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              services.whisper?.loaded 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <Mic className={`w-4 h-4 ${
                services.whisper?.loaded 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              }`} />
            </div>
            <div>
              <p className="font-medium text-sm">Speech-to-Text</p>
              <p className="text-xs text-muted-foreground">
                {services.whisper?.model || "Not loaded"}
              </p>
            </div>
          </div>
          <Badge variant={services.whisper?.loaded ? "default" : "destructive"} className="text-xs">
            {services.whisper?.loaded ? "Ready" : "Offline"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
