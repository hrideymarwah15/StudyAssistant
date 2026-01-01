"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Database, Brain, Mic, AlertCircle, CheckCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react"
import { checkHealth, type HealthResponse } from "@/lib/api"
import { toast } from "sonner"

interface AISystemHealthProps {
  onBackendStatusChange?: (online: boolean) => void
}

export function AISystemHealth({ onBackendStatusChange }: AISystemHealthProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
    } catch (err) {
      setError("Backend offline")
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHealth()
    setRefreshing(false)
    if (health?.status === "healthy") {
      toast.success("AI services are online")
    } else {
      toast.error("Backend is offline")
    }
  }

  // Compact loading state
  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm text-slate-400">Checking AI services...</span>
        </div>
      </div>
    )
  }

  // Compact offline state with action
  if (error || !health) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-medium text-red-400">AI Backend Offline</p>
              <p className="text-xs text-slate-500">Start backend to enable AI features</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={() => window.open('http://localhost:8000/docs', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Check API
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isHealthy = health.status === "healthy"
  const services = health.services
  const onlineServices = [
    services.qdrant?.connected,
    services.ollama?.connected,
    services.whisper?.loaded
  ].filter(Boolean).length

  // Compact healthy state
  return (
    <div className={`p-4 rounded-xl border ${
      isHealthy 
        ? "bg-green-500/5 border-green-500/20" 
        : "bg-yellow-500/5 border-yellow-500/20"
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isHealthy ? "bg-green-500/20" : "bg-yellow-500/20"
          }`}>
            <Activity className={`w-5 h-5 ${isHealthy ? "text-green-400" : "text-yellow-400"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-white">AI Services</p>
              <Badge 
                variant="outline" 
                className={`text-[10px] ${
                  isHealthy 
                    ? "border-green-500/30 text-green-400" 
                    : "border-yellow-500/30 text-yellow-400"
                }`}
              >
                {onlineServices}/3 Online
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {isHealthy ? "All systems operational" : "Some services degraded"}
            </p>
          </div>
        </div>
        
        {/* Service indicators */}
        <div className="flex items-center gap-3">
          {/* Qdrant */}
          <div className="text-center" title={`Vector Memory: ${services.qdrant?.connected ? 'Online' : 'Offline'}`}>
            <Database className={`w-4 h-4 mx-auto ${
              services.qdrant?.connected ? "text-green-400" : "text-red-400"
            }`} />
            <span className="text-[10px] text-slate-500 block mt-0.5">Memory</span>
          </div>
          
          {/* Ollama */}
          <div className="text-center" title={`AI Models: ${services.ollama?.connected ? 'Online' : 'Offline'}`}>
            <Brain className={`w-4 h-4 mx-auto ${
              services.ollama?.connected ? "text-green-400" : "text-red-400"
            }`} />
            <span className="text-[10px] text-slate-500 block mt-0.5">AI</span>
          </div>
          
          {/* Whisper */}
          <div className="text-center" title={`Speech-to-Text: ${services.whisper?.loaded ? 'Ready' : 'Offline'}`}>
            <Mic className={`w-4 h-4 mx-auto ${
              services.whisper?.loaded ? "text-green-400" : "text-red-400"
            }`} />
            <span className="text-[10px] text-slate-500 block mt-0.5">Voice</span>
          </div>
          
          {/* Refresh button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-slate-400 hover:text-white ml-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}
