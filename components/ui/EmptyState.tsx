"use client"

import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface EmptyStateAction {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "ghost" | "secondary"
  icon?: LucideIcon
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  aiAction?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action,
  secondaryAction,
  aiAction
}: EmptyStateProps) {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">{description}</p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        {action && (
          <Button 
            onClick={action.onClick} 
            variant={action.variant || "default"}
            className="w-full sm:w-auto"
          >
            {action.icon && <action.icon className="w-4 h-4 mr-2" />}
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button 
            onClick={secondaryAction.onClick} 
            variant={secondaryAction.variant || "outline"}
            className="w-full sm:w-auto"
          >
            {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
            {secondaryAction.label}
          </Button>
        )}
        
        {aiAction && (
          <Button 
            onClick={aiAction.onClick} 
            variant="ghost"
            className="w-full sm:w-auto text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {aiAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}