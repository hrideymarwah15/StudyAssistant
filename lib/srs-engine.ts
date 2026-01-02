/**
 * EXAM-GRADE SRS ENGINE
 * World-class spaced repetition algorithm optimized for exams
 * 
 * Rating System:
 * - Again: +1 day (failed - needs immediate re-review)
 * - Hard:  +3 days (struggled - needs more practice)
 * - Good:  +7 days (understood - normal progression)
 * - Easy:  +15 days (mastered - accelerate spacing)
 * 
 * Special Rules:
 * - TRAP cards decay 50% slower (misconceptions need reinforcement)
 * - EXAM cards get +2 priority before exam dates
 * - High exam_relevance (8-10) cards surface more frequently
 * - Mistake-prone cards get priority boost
 */

import type { 
  ExamGradeFlashcard, 
  FlashcardType, 
  SRSRating 
} from './firestore'

// ==================== CONSTANTS ====================

export const SRS_INTERVALS = {
  again: 1,   // 1 day
  hard: 3,    // 3 days
  good: 7,    // 7 days
  easy: 15,   // 15 days
} as const

export const EASE_FACTORS = {
  initial: 2.0,
  minimum: 1.3,
  maximum: 2.5,
  // Adjustments per rating
  again: -0.3,
  hard: -0.15,
  good: 0,
  easy: 0.15,
} as const

export const CARD_TYPE_MODIFIERS: Record<FlashcardType, number> = {
  definition: 1.0,    // Standard
  why: 1.0,           // Standard
  how: 1.0,           // Standard
  compare: 1.1,       // Slightly longer retention needed
  trap: 1.5,          // 50% slower decay - misconceptions need reinforcement
  example: 0.9,       // Slightly faster - concrete examples are easier
  exam: 1.2,          // Slower decay - exam-style needs repetition
}

// Priority weights
export const PRIORITY_WEIGHTS = {
  overdue: 3.0,         // Heavily prioritize overdue cards
  due_today: 2.0,       // Today's cards are important
  exam_relevance: 0.5,  // Per point of exam_relevance (1-10)
  mistake_prone: 2.0,   // Cards user commonly fails
  trap_card: 1.5,       // TRAP cards need extra attention
  exam_card_near_date: 3.0,  // EXAM cards near exam date
  low_accuracy: 1.5,    // Cards with < 60% accuracy
}

// ==================== INTERFACES ====================

export interface SRSScheduleItem {
  cardId: string
  nextReview: Date
  interval: number
  priority: number
  dueStatus: 'overdue' | 'due_today' | 'upcoming' | 'mastered'
  daysUntilDue: number
}

export interface SRSReviewResult {
  cardId: string
  rating: SRSRating
  previousInterval: number
  newInterval: number
  previousEaseFactor: number
  newEaseFactor: number
  nextReview: Date
  wasCorrect: boolean
}

export interface StudySessionStats {
  totalCards: number
  correctCount: number
  incorrectCount: number
  accuracy: number
  avgResponseTime: number
  ratingDistribution: Record<SRSRating, number>
  cardTypePerformance: Record<FlashcardType, { correct: number; total: number }>
}

export interface DeckStudyProgress {
  totalCards: number
  masteredCards: number
  learningCards: number
  newCards: number
  dueCards: number
  overdueCards: number
  avgEaseFactor: number
  estimatedMasteryDate: Date | null
}

// ==================== SRS ENGINE ====================

export class SRSEngine {
  private examDate: Date | null = null
  
  constructor(examDate?: Date) {
    if (examDate) {
      this.examDate = examDate
    }
  }
  
  setExamDate(date: Date): void {
    this.examDate = date
  }
  
  /**
   * Calculate the next review date and interval based on user rating.
   */
  calculateNextReview(
    card: ExamGradeFlashcard,
    rating: SRSRating,
    currentDate: Date = new Date()
  ): SRSReviewResult {
    const baseInterval = SRS_INTERVALS[rating]
    const currentInterval = card.interval || 0
    const currentEaseFactor = card.easeFactor || EASE_FACTORS.initial
    
    // Calculate new ease factor
    let newEaseFactor = currentEaseFactor + EASE_FACTORS[rating]
    newEaseFactor = Math.max(EASE_FACTORS.minimum, Math.min(EASE_FACTORS.maximum, newEaseFactor))
    
    // Calculate new interval
    let newInterval: number
    
    if (rating === 'again') {
      // Reset to minimum interval
      newInterval = baseInterval
    } else if (currentInterval === 0) {
      // First review - use base interval
      newInterval = baseInterval
    } else {
      // Standard SM-2 style calculation with modifications
      newInterval = Math.round(currentInterval * newEaseFactor)
      
      // Apply card type modifier
      const typeModifier = CARD_TYPE_MODIFIERS[card.type]
      newInterval = Math.round(newInterval * typeModifier)
      
      // Ensure minimum intervals per rating
      newInterval = Math.max(baseInterval, newInterval)
    }
    
    // Apply exam proximity boost for EXAM-type cards
    if (card.type === 'exam' && this.examDate) {
      const daysUntilExam = Math.ceil(
        (this.examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExam <= 14 && daysUntilExam > 0) {
        // Within 2 weeks of exam - cap interval to ensure review before exam
        newInterval = Math.min(newInterval, Math.floor(daysUntilExam / 2))
      }
    }
    
    // Cap at 365 days for mastered cards
    newInterval = Math.min(newInterval, 365)
    
    // Calculate next review date
    const nextReview = new Date(currentDate)
    nextReview.setDate(nextReview.getDate() + newInterval)
    
    return {
      cardId: card.id,
      rating,
      previousInterval: currentInterval,
      newInterval,
      previousEaseFactor: currentEaseFactor,
      newEaseFactor,
      nextReview,
      wasCorrect: rating !== 'again',
    }
  }
  
  /**
   * Generate a prioritized study schedule from a deck of cards.
   */
  generateSchedule(
    cards: ExamGradeFlashcard[],
    currentDate: Date = new Date()
  ): SRSScheduleItem[] {
    return cards
      .map(card => this.calculatePriority(card, currentDate))
      .sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * Calculate priority score for a card.
   */
  private calculatePriority(
    card: ExamGradeFlashcard,
    currentDate: Date
  ): SRSScheduleItem {
    const nextReview = card.nextReview ? new Date(card.nextReview) : currentDate
    const daysUntilDue = Math.ceil(
      (nextReview.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    let priority = 0
    let dueStatus: SRSScheduleItem['dueStatus']
    
    // Determine due status and base priority
    if (daysUntilDue < 0) {
      dueStatus = 'overdue'
      priority += PRIORITY_WEIGHTS.overdue * Math.abs(daysUntilDue)
    } else if (daysUntilDue === 0) {
      dueStatus = 'due_today'
      priority += PRIORITY_WEIGHTS.due_today
    } else if (card.interval >= 21) {
      dueStatus = 'mastered'
      priority += 0.5 // Low priority for mastered cards
    } else {
      dueStatus = 'upcoming'
      priority += 1 / (daysUntilDue + 1) // Inverse relationship
    }
    
    // Add exam relevance bonus
    priority += card.exam_relevance * PRIORITY_WEIGHTS.exam_relevance
    
    // Add mistake-prone bonus
    if (card.mistake_prone) {
      priority += PRIORITY_WEIGHTS.mistake_prone
    }
    
    // Add TRAP card bonus
    if (card.type === 'trap') {
      priority += PRIORITY_WEIGHTS.trap_card
    }
    
    // Add EXAM card near exam date bonus
    if (card.type === 'exam' && this.examDate) {
      const daysUntilExam = Math.ceil(
        (this.examDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExam <= 7 && daysUntilExam > 0) {
        priority += PRIORITY_WEIGHTS.exam_card_near_date
      }
    }
    
    // Add low accuracy bonus
    const accuracy = card.reviewCount > 0 
      ? card.correctCount / card.reviewCount 
      : 0.5
    if (accuracy < 0.6 && card.reviewCount >= 3) {
      priority += PRIORITY_WEIGHTS.low_accuracy
    }
    
    return {
      cardId: card.id,
      nextReview,
      interval: card.interval || 0,
      priority: Math.round(priority * 100) / 100,
      dueStatus,
      daysUntilDue,
    }
  }
  
  /**
   * Get cards that are due for review.
   */
  getDueCards(
    cards: ExamGradeFlashcard[],
    currentDate: Date = new Date(),
    includeUpcoming: number = 0 // Days to look ahead
  ): ExamGradeFlashcard[] {
    const cutoffDate = new Date(currentDate)
    cutoffDate.setDate(cutoffDate.getDate() + includeUpcoming)
    
    return cards.filter(card => {
      if (!card.nextReview) return true // New cards are always due
      const nextReview = new Date(card.nextReview)
      return nextReview <= cutoffDate
    })
  }
  
  /**
   * Calculate deck study progress statistics.
   */
  getDeckProgress(
    cards: ExamGradeFlashcard[],
    currentDate: Date = new Date()
  ): DeckStudyProgress {
    let masteredCards = 0
    let learningCards = 0
    let newCards = 0
    let dueCards = 0
    let overdueCards = 0
    let totalEaseFactor = 0
    
    cards.forEach(card => {
      const interval = card.interval || 0
      const nextReview = card.nextReview ? new Date(card.nextReview) : null
      
      // Categorize card
      if (interval === 0 || card.reviewCount === 0) {
        newCards++
      } else if (interval >= 21) {
        masteredCards++
      } else {
        learningCards++
      }
      
      // Check if due
      if (nextReview) {
        const daysUntilDue = Math.ceil(
          (nextReview.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntilDue < 0) {
          overdueCards++
        } else if (daysUntilDue === 0) {
          dueCards++
        }
      } else {
        dueCards++ // New cards count as due
      }
      
      totalEaseFactor += card.easeFactor || EASE_FACTORS.initial
    })
    
    const avgEaseFactor = cards.length > 0 ? totalEaseFactor / cards.length : EASE_FACTORS.initial
    
    // Estimate mastery date (simplified calculation)
    let estimatedMasteryDate: Date | null = null
    if (learningCards + newCards > 0) {
      const avgDaysToMastery = 30 // Assumption: ~30 days to master a card
      const cardsToMaster = learningCards + newCards
      const daysNeeded = Math.ceil(cardsToMaster * avgDaysToMastery / 10) // 10 cards parallel
      estimatedMasteryDate = new Date(currentDate)
      estimatedMasteryDate.setDate(estimatedMasteryDate.getDate() + daysNeeded)
    }
    
    return {
      totalCards: cards.length,
      masteredCards,
      learningCards,
      newCards,
      dueCards: dueCards + overdueCards,
      overdueCards,
      avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
      estimatedMasteryDate,
    }
  }
  
  /**
   * Calculate study session statistics.
   */
  calculateSessionStats(
    results: SRSReviewResult[],
    cards: ExamGradeFlashcard[]
  ): StudySessionStats {
    const cardMap = new Map(cards.map(c => [c.id, c]))
    
    const correctCount = results.filter(r => r.wasCorrect).length
    const totalCards = results.length
    
    const ratingDistribution: Record<SRSRating, number> = {
      again: 0,
      hard: 0,
      good: 0,
      easy: 0,
    }
    
    const cardTypePerformance: Record<FlashcardType, { correct: number; total: number }> = {
      definition: { correct: 0, total: 0 },
      why: { correct: 0, total: 0 },
      how: { correct: 0, total: 0 },
      compare: { correct: 0, total: 0 },
      trap: { correct: 0, total: 0 },
      example: { correct: 0, total: 0 },
      exam: { correct: 0, total: 0 },
    }
    
    results.forEach(result => {
      ratingDistribution[result.rating]++
      
      const card = cardMap.get(result.cardId)
      if (card) {
        cardTypePerformance[card.type].total++
        if (result.wasCorrect) {
          cardTypePerformance[card.type].correct++
        }
      }
    })
    
    return {
      totalCards,
      correctCount,
      incorrectCount: totalCards - correctCount,
      accuracy: totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0,
      avgResponseTime: 0, // Would need timing data
      ratingDistribution,
      cardTypePerformance,
    }
  }
  
  /**
   * Identify cards that need TRAP card generation (frequent failures).
   */
  identifyTrapCandidates(cards: ExamGradeFlashcard[]): ExamGradeFlashcard[] {
    return cards.filter(card => {
      const accuracy = card.reviewCount > 0 
        ? card.correctCount / card.reviewCount 
        : 1
      
      // Cards with <50% accuracy and at least 3 reviews
      return accuracy < 0.5 && card.reviewCount >= 3
    })
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Get the recommended daily review count based on workload.
 */
export function getRecommendedDailyCount(
  dueCards: number,
  newCards: number,
  studyTimeMinutes: number = 30
): { dueLimit: number; newLimit: number } {
  // Assume ~30 seconds per card average
  const totalCardsInTime = Math.floor(studyTimeMinutes * 2)
  
  // Prioritize due cards, then new cards
  const dueLimit = Math.min(dueCards, Math.floor(totalCardsInTime * 0.7))
  const newLimit = Math.min(newCards, Math.floor(totalCardsInTime * 0.3))
  
  return { dueLimit, newLimit }
}

/**
 * Calculate optimal study time based on exam date and card count.
 */
export function calculateOptimalStudyTime(
  totalCards: number,
  masteredCards: number,
  daysUntilExam: number
): number {
  if (daysUntilExam <= 0) return 60 // Crunch time - 1 hour

  const cardsToMaster = totalCards - masteredCards
  const cardsPerDay = Math.ceil(cardsToMaster / daysUntilExam)
  
  // ~30 seconds per card, minimum 15 minutes, max 90 minutes
  const minutes = Math.max(15, Math.min(90, cardsPerDay * 0.5))
  
  return Math.round(minutes)
}

// ==================== EXPORTS ====================

export function createSRSEngine(examDate?: Date): SRSEngine {
  return new SRSEngine(examDate)
}
