"use client"

import { useEffect, useState } from "react"
import { Activity, Database, Brain, Mic, RefreshCw, AlertCircle } from "lucide-react"
import { checkHealth, type HealthResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"

interface AISystemHealthProps {
  onBackendStatusChange?: (online: boolean) => void
}

export function AISystemHealth({ onBackendStatusChange }: AISystemHealthProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadHealth()
    // Refresh every 30 seconds
    const interval = setInterval(loadHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (onBackendStatusChange) {
      onBackendStatusChange(health?.status === "healthy")
    }
  }, [health, onBackendStatusChange])

  const loadHealth = async () => {
    try {
      const data = await checkHealth()
      setHealth(data)
    } catch {
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHealth()
    setRefreshing(false)
  }

  // Minimal loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
        <span>Checking AI services...</span>
      </div>
    )
  }

  // Compact offline state
  if (!health) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">AI Offline</span>
          <span className="text-xs text-slate-500">• Start backend for AI features</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-slate-400 hover:text-white h-7 px-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    )
  }

  const services = health.services
  const allOnline = services.qdrant?.connected && services.ollama?.connected

  // Ultra-compact healthy state - just inline indicators
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${allOnline ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm text-slate-400">AI</span>
        </div>
        
        {/* Service dots */}
        <div className="flex items-center gap-3 text-xs">
          <span className={`flex items-center gap-1 ${services.qdrant?.connected ? 'text-slate-400' : 'text-red-400'}`}>
            <Database className="w-3 h-3" />
            Memory
          </span>
          <span className={`flex items-center gap-1 ${services.ollama?.connected ? 'text-slate-400' : 'text-red-400'}`}>
            <Brain className="w-3 h-3" />
            Models
          </span>
          <span className={`flex items-center gap-1 ${services.whisper?.loaded ? 'text-slate-400' : 'text-slate-600'}`}>
            <Mic className="w-3 h-3" />
            Voice
          </span>
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={handleRefresh}
        disabled={refreshing}
        className="text-slate-500 hover:text-white h-7 px-2"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  )
}
