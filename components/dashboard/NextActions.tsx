"use client"

import { Play, BookOpen, Plus, Zap } from "lucide-react"
import Link from "next/link"

interface NextActionsProps {
  onStartFocus: () => void
}

export function NextActions({ onStartFocus }: NextActionsProps) {
  return (
    <div className="mb-8 p-6 rounded-xl bg-card border border-border">
      <h2 className="text-display-sm text-foreground mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        Next Best Actions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onStartFocus}
          className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border hover:border-primary/50"
        >
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-foreground">Start 25-min Focus</p>
              <p className="text-sm text-muted-foreground">Build momentum with deep work</p>
            </div>
          </div>
        </button>
        <Link href="/flashcards">
          <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border hover:border-primary/50">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium text-foreground">Review flashcards due today</p>
                <p className="text-sm text-muted-foreground">Strengthen your memory</p>
              </div>
            </div>
          </div>
        </Link>
        <Link href="/planner?filter=tomorrow">
          <div className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left border border-border hover:border-primary/50">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium text-foreground">Add tasks for tomorrow</p>
                <p className="text-sm text-muted-foreground">Stay ahead of your schedule</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}