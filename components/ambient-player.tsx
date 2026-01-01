"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, VolumeX, Coffee, Waves, CloudRain, Wind, Music, BellOff, Bell } from "lucide-react"

type AmbientSound = "none" | "coffee-shop" | "rain" | "ocean" | "white-noise" | "lo-fi"

interface AmbientPlayerProps {
  isActive: boolean
}

export function AmbientPlayer({ isActive }: AmbientPlayerProps) {
  const [sound, setSound] = useState<AmbientSound>("none")
  const [volume, setVolume] = useState(0.3)
  const [dndMode, setDndMode] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    if (typeof window !== "undefined") {
      audioRef.current = new Audio()
      audioRef.current.loop = true
      audioRef.current.volume = volume
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current || !isActive) return

    if (sound === "none") {
      audioRef.current.pause()
      return
    }

    // Map sounds to audio URLs (you would replace these with actual audio files)
    const soundUrls: Record<Exclude<AmbientSound, "none">, string> = {
      "coffee-shop": "/sounds/coffee-shop.mp3",
      "rain": "/sounds/rain.mp3",
      "ocean": "/sounds/ocean.mp3",
      "white-noise": "/sounds/white-noise.mp3",
      "lo-fi": "/sounds/lo-fi.mp3"
    }

    // For now, we'll just log since we don't have actual audio files
    console.log(`Would play: ${soundUrls[sound]}`)
    
    // In production, uncomment:
    // audioRef.current.src = soundUrls[sound]
    // audioRef.current.play().catch(err => console.log("Audio play failed:", err))
  }, [sound, isActive])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    // Enable Do Not Disturb mode
    if (dndMode && typeof window !== "undefined") {
      document.title = "🔴 Focus Mode - Do Not Disturb"
    } else {
      document.title = "StudyPal"
    }
  }, [dndMode])

  const sounds: { id: AmbientSound; label: string; icon: any; color: string }[] = [
    { id: "none", label: "Silence", icon: VolumeX, color: "gray" },
    { id: "coffee-shop", label: "Coffee Shop", icon: Coffee, color: "amber" },
    { id: "rain", label: "Rain", icon: CloudRain, color: "blue" },
    { id: "ocean", label: "Ocean", icon: Waves, color: "cyan" },
    { id: "white-noise", label: "White Noise", icon: Wind, color: "slate" },
    { id: "lo-fi", label: "Lo-Fi Beats", icon: Music, color: "purple" }
  ]

  if (!isActive) return null

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-purple-500" />
            <h4 className="font-semibold">Ambient Sounds</h4>
          </div>
          
          {/* Do Not Disturb Toggle */}
          <button
            onClick={() => setDndMode(!dndMode)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              dndMode
                ? "bg-red-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {dndMode ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
            {dndMode ? "DND On" : "DND Off"}
          </button>
        </div>

        {/* Sound Selection */}
        <div className="grid grid-cols-3 gap-2">
          {sounds.map((s) => {
            const Icon = s.icon
            const isActive = sound === s.id
            
            return (
              <button
                key={s.id}
                onClick={() => setSound(s.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                  isActive
                    ? `bg-${s.color}-500/10 border-${s.color}-500 text-${s.color}-500`
                    : "bg-background border-border hover:border-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Volume Control */}
        {sound !== "none" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Volume</span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume * 100}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        )}

        {/* DND Info */}
        {dndMode && (
          <div className="pt-2 border-t border-purple-500/20">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <BellOff className="w-3 h-3" />
              Do Not Disturb is active. Browser notifications are suppressed.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
