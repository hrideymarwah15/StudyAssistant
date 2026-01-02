"use client"

/**
 * EXAM-GRADE FLASHCARD REVIEW COMPONENT
 * World-class SRS-based review UI with:
 * - Card type badges (definition/why/how/compare/trap/example/exam)
 * - SRS buttons (Again/Hard/Good/Easy)
 * - Exam relevance indicator
 * - Difficulty display
 * - Mistake tracking integration
 * - Progress visualization
 */

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Settings,
  Zap,
  Target,
  GraduationCap,
  Lightbulb,
  ArrowLeftRight,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExamGradeFlashcard, FlashcardType, SRSRating } from "@/lib/firestore"
import { SRSEngine, createSRSEngine, type SRSScheduleItem } from "@/lib/srs-engine"
import { getMistakeTracker } from "@/lib/mistake-tracker"

// ==================== TYPES ====================

interface ExamGradeReviewProps {
  cards: ExamGradeFlashcard[]
  deckName: string
  examDate?: Date
  onUpdateCard: (cardId: string, updates: Partial<ExamGradeFlashcard>) => Promise<void>
  onGenerateTrapCards?: (topic: string) => void
  onComplete: () => void
}

interface ReviewState {
  currentIndex: number
  isFlipped: boolean
  sessionStats: {
    reviewed: number
    correct: number
    incorrect: number
    startTime: Date
  }
}

// ==================== CARD TYPE CONFIG ====================

const CARD_TYPE_CONFIG: Record<FlashcardType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}> = {
  definition: { 
    label: "Definition", 
    icon: BookOpen, 
    color: "text-blue-400",
    bgColor: "bg-blue-500/20"
  },
  why: { 
    label: "Why", 
    icon: HelpCircle, 
    color: "text-purple-400",
    bgColor: "bg-purple-500/20"
  },
  how: { 
    label: "How", 
    icon: Settings, 
    color: "text-green-400",
    bgColor: "bg-green-500/20"
  },
  compare: { 
    label: "Compare", 
    icon: ArrowLeftRight, 
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20"
  },
  trap: { 
    label: "TRAP", 
    icon: AlertTriangle, 
    color: "text-red-400",
    bgColor: "bg-red-500/20"
  },
  example: { 
    label: "Example", 
    icon: Lightbulb, 
    color: "text-orange-400",
    bgColor: "bg-orange-500/20"
  },
  exam: { 
    label: "EXAM", 
    icon: GraduationCap, 
    color: "text-pink-400",
    bgColor: "bg-pink-500/20"
  },
}

const SRS_BUTTON_CONFIG: Record<SRSRating, {
  label: string
  shortcut: string
  color: string
  hoverColor: string
  interval: string
}> = {
  again: {
    label: "Again",
    shortcut: "1",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    hoverColor: "hover:bg-red-500/30",
    interval: "+1d"
  },
  hard: {
    label: "Hard",
    shortcut: "2",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    hoverColor: "hover:bg-orange-500/30",
    interval: "+3d"
  },
  good: {
    label: "Good",
    shortcut: "3",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    hoverColor: "hover:bg-green-500/30",
    interval: "+7d"
  },
  easy: {
    label: "Easy",
    shortcut: "4",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hoverColor: "hover:bg-blue-500/30",
    interval: "+15d"
  },
}

// ==================== COMPONENT ====================

export function ExamGradeReview({
  cards,
  deckName,
  examDate,
  onUpdateCard,
  onGenerateTrapCards,
  onComplete,
}: ExamGradeReviewProps) {
  const [state, setState] = useState<ReviewState>({
    currentIndex: 0,
    isFlipped: false,
    sessionStats: {
      reviewed: 0,
      correct: 0,
      incorrect: 0,
      startTime: new Date(),
    },
  })
  
  const [srsEngine] = useState(() => createSRSEngine(examDate))
  const [schedule, setSchedule] = useState<SRSScheduleItem[]>([])
  const [mistakeTracker] = useState(() => getMistakeTracker())
  const [showTrapSuggestion, setShowTrapSuggestion] = useState(false)
  
  // Generate schedule on mount
  useEffect(() => {
    const newSchedule = srsEngine.generateSchedule(cards)
    setSchedule(newSchedule)
  }, [cards, srsEngine])
  
  // Get current card based on schedule priority
  const getCurrentCard = useCallback(() => {
    if (schedule.length === 0 || state.currentIndex >= schedule.length) {
      return cards[state.currentIndex] || null
    }
    const scheduleItem = schedule[state.currentIndex]
    return cards.find(c => c.id === scheduleItem.cardId) || cards[state.currentIndex]
  }, [cards, schedule, state.currentIndex])
  
  const currentCard = getCurrentCard()
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentCard) return
      
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault()
          setState(s => ({ ...s, isFlipped: !s.isFlipped }))
          break
        case '1':
          if (state.isFlipped) handleSRSRating('again')
          break
        case '2':
          if (state.isFlipped) handleSRSRating('hard')
          break
        case '3':
          if (state.isFlipped) handleSRSRating('good')
          break
        case '4':
          if (state.isFlipped) handleSRSRating('easy')
          break
        case 'ArrowLeft':
          if (state.currentIndex > 0) {
            setState(s => ({ ...s, currentIndex: s.currentIndex - 1, isFlipped: false }))
          }
          break
        case 'ArrowRight':
          if (state.currentIndex < cards.length - 1) {
            setState(s => ({ ...s, currentIndex: s.currentIndex + 1, isFlipped: false }))
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentCard, state.isFlipped, state.currentIndex, cards.length])
  
  // Handle SRS rating
  const handleSRSRating = async (rating: SRSRating) => {
    if (!currentCard) return
    
    const result = srsEngine.calculateNextReview(currentCard, rating)
    
    // Track mistakes
    if (rating === 'again') {
      mistakeTracker.trackReviewMistake(currentCard)
      
      // Check if we should suggest TRAP card generation
      if (mistakeTracker.shouldGenerateTrapCards(currentCard.topic)) {
        setShowTrapSuggestion(true)
      }
    } else {
      mistakeTracker.recordCorrectResponse(currentCard.id)
    }
    
    // Update card in database
    await onUpdateCard(currentCard.id, {
      lastReviewed: new Date(),
      nextReview: result.nextReview,
      interval: result.newInterval,
      easeFactor: result.newEaseFactor,
      reviewCount: (currentCard.reviewCount || 0) + 1,
      correctCount: (currentCard.correctCount || 0) + (result.wasCorrect ? 1 : 0),
      incorrectCount: (currentCard.incorrectCount || 0) + (result.wasCorrect ? 0 : 1),
      consecutiveCorrect: result.wasCorrect ? (currentCard.consecutiveCorrect || 0) + 1 : 0,
    })
    
    // Update session stats
    setState(s => ({
      ...s,
      sessionStats: {
        ...s.sessionStats,
        reviewed: s.sessionStats.reviewed + 1,
        correct: s.sessionStats.correct + (result.wasCorrect ? 1 : 0),
        incorrect: s.sessionStats.incorrect + (result.wasCorrect ? 0 : 1),
      },
    }))
    
    // Move to next card
    if (state.currentIndex < cards.length - 1) {
      setState(s => ({ ...s, currentIndex: s.currentIndex + 1, isFlipped: false }))
    } else {
      onComplete()
    }
  }
  
  // Handle TRAP card generation
  const handleGenerateTrapCards = () => {
    if (currentCard && onGenerateTrapCards) {
      onGenerateTrapCards(currentCard.topic)
      mistakeTracker.markTrapCardsGenerated(currentCard.topic)
    }
    setShowTrapSuggestion(false)
  }
  
  if (!currentCard) {
    return (
      <div className="text-center py-16">
        <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Session Complete!</h3>
        <p className="text-muted-foreground mb-4">
          Reviewed {state.sessionStats.reviewed} cards with{' '}
          {Math.round((state.sessionStats.correct / state.sessionStats.reviewed) * 100)}% accuracy
        </p>
        <Button onClick={onComplete}>Back to Deck</Button>
      </div>
    )
  }
  
  const typeConfig = CARD_TYPE_CONFIG[currentCard.type]
  const TypeIcon = typeConfig.icon
  const scheduleItem = schedule.find(s => s.cardId === currentCard.id)
  
  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">{deckName}</h2>
          <div className="text-sm text-muted-foreground">
            {state.currentIndex + 1} / {cards.length}
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓ {state.sessionStats.correct}</span>
            <span className="text-red-400">✗ {state.sessionStats.incorrect}</span>
          </div>
          {state.sessionStats.reviewed > 0 && (
            <div className="text-muted-foreground">
              {Math.round((state.sessionStats.correct / state.sessionStats.reviewed) * 100)}%
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
          style={{ width: `${((state.currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>
      
      {/* Card Metadata */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Card Type Badge */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
          typeConfig.bgColor,
          typeConfig.color
        )}>
          <TypeIcon className="w-4 h-4" />
          {typeConfig.label}
        </div>
        
        {/* Metadata Pills */}
        <div className="flex items-center gap-2">
          {/* Difficulty */}
          <div className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 capitalize">
            {currentCard.difficulty}
          </div>
          
          {/* Exam Relevance */}
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded text-xs",
            currentCard.exam_relevance >= 8 
              ? "bg-red-500/20 text-red-400"
              : currentCard.exam_relevance >= 5
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-slate-800 text-slate-400"
          )}>
            <Target className="w-3 h-3" />
            {currentCard.exam_relevance}/10
          </div>
          
          {/* Interval */}
          {currentCard.interval > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-slate-800 text-slate-400">
              <Clock className="w-3 h-3" />
              {currentCard.interval}d
            </div>
          )}
          
          {/* Mistake Prone */}
          {currentCard.mistake_prone && (
            <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">
              <AlertTriangle className="w-3 h-3" />
              Watch out!
            </div>
          )}
        </div>
      </div>
      
      {/* Flashcard */}
      <div
        onClick={() => setState(s => ({ ...s, isFlipped: !s.isFlipped }))}
        className={cn(
          "min-h-[350px] rounded-2xl cursor-pointer flex items-center justify-center p-8 transition-all duration-300",
          "border-2",
          state.isFlipped
            ? "bg-gradient-to-br from-accent/20 to-primary/20 border-accent/30"
            : "bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30",
          "hover:shadow-xl"
        )}
      >
        <div className="text-center w-full max-w-3xl">
          <p className="text-sm text-muted-foreground mb-4 flex items-center justify-center gap-2">
            {state.isFlipped ? (
              <>
                <Zap className="w-4 h-4" />
                Answer
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4" />
                Question
              </>
            )}
          </p>
          
          <div className="max-h-60 overflow-y-auto px-4">
            <p className="text-xl md:text-2xl lg:text-3xl font-serif text-slate-100 leading-relaxed">
              {state.isFlipped ? currentCard.answer : currentCard.question}
            </p>
          </div>
          
          {/* Key Terms (shown when flipped) */}
          {state.isFlipped && currentCard.key_terms && currentCard.key_terms.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              {currentCard.key_terms.map((term, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 text-xs rounded bg-slate-700/50 text-slate-300"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-6">
            {state.isFlipped 
              ? "Rate your recall: 1-4 or click buttons below"
              : "Click to flip • Space/Enter to reveal"
            }
          </p>
        </div>
      </div>
      
      {/* SRS Rating Buttons (only when flipped) */}
      {state.isFlipped && (
        <div className="grid grid-cols-4 gap-3">
          {(Object.entries(SRS_BUTTON_CONFIG) as [SRSRating, typeof SRS_BUTTON_CONFIG[SRSRating]][]).map(
            ([rating, config]) => (
              <button
                key={rating}
                onClick={() => handleSRSRating(rating)}
                className={cn(
                  "py-4 px-3 rounded-xl border-2 transition-all",
                  "flex flex-col items-center gap-1",
                  config.color,
                  config.hoverColor
                )}
              >
                <span className="text-lg font-bold">{config.label}</span>
                <span className="text-xs opacity-80">{config.interval}</span>
                <span className="text-[10px] opacity-60">({config.shortcut})</span>
              </button>
            )
          )}
        </div>
      )}
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState(s => ({ ...s, currentIndex: Math.max(0, s.currentIndex - 1), isFlipped: false }))}
          disabled={state.currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setState(s => ({ ...s, currentIndex: 0, isFlipped: false }))
          }}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState(s => ({ ...s, currentIndex: Math.min(cards.length - 1, s.currentIndex + 1), isFlipped: false }))}
          disabled={state.currentIndex === cards.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      {/* TRAP Card Suggestion Modal */}
      {showTrapSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold">Pattern Detected</h3>
                <p className="text-sm text-muted-foreground">
                  You've struggled with this topic multiple times
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-300 mb-6">
              Would you like to generate <strong>TRAP cards</strong> to help you overcome 
              these misconceptions? They target exactly where you're making mistakes.
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateTrapCards}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              >
                Generate TRAP Cards
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTrapSuggestion(false)}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamGradeReview
