/**
 * MISTAKE-DRIVEN FLASHCARD SYSTEM
 * Automatically tracks failures and generates targeted TRAP cards
 * 
 * Features:
 * - Track "Again" button presses with full context
 * - Record quiz failures with wrong answers
 * - Identify pattern-based misconceptions
 * - Auto-trigger TRAP card generation API
 * - Local storage persistence for offline support
 */

import type { 
  ExamGradeFlashcard, 
  FlashcardType, 
  MistakeRecord 
} from './firestore'
import type { TrapCardRequest } from './api'

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'studypal_mistakes'
const TRAP_GENERATION_THRESHOLD = 3 // Mistakes before generating TRAP cards
const MAX_STORED_MISTAKES = 500 // Limit storage size

// ==================== INTERFACES ====================

export interface TrackedMistake {
  id: string
  cardId: string
  question: string
  correctAnswer: string
  wrongAnswer?: string
  cardType: FlashcardType
  topic: string
  subtopic?: string
  timestamp: Date
  source: 'review' | 'quiz' | 'self_test'
  responseTime?: number // milliseconds
  consecutiveFailures: number
}

export interface MistakePattern {
  topic: string
  subtopic?: string
  mistakeCount: number
  cardTypes: FlashcardType[]
  questions: string[]
  commonMisconception?: string
  lastMistake: Date
  trapCardsGenerated: boolean
}

export interface MistakeStats {
  totalMistakes: number
  uniqueTopics: number
  mostProblematicTopic: string | null
  mostProblematicCardType: FlashcardType | null
  recentMistakes: TrackedMistake[]
  patternsIdentified: MistakePattern[]
  trapCardsNeeded: number
}

// ==================== MISTAKE TRACKER ====================

export class MistakeTracker {
  private mistakes: TrackedMistake[] = []
  private patterns: Map<string, MistakePattern> = new Map()
  private pendingTrapGeneration: Set<string> = new Set()
  
  constructor() {
    this.loadFromStorage()
  }
  
  /**
   * Track a mistake from flashcard review (Again button).
   */
  trackReviewMistake(
    card: ExamGradeFlashcard,
    responseTime?: number
  ): TrackedMistake {
    const existingMistakes = this.mistakes.filter(m => m.cardId === card.id)
    const consecutiveFailures = this.getConsecutiveFailures(card.id)
    
    const mistake: TrackedMistake = {
      id: this.generateId(),
      cardId: card.id,
      question: card.question,
      correctAnswer: card.answer,
      cardType: card.type,
      topic: card.topic,
      subtopic: card.subtopic,
      timestamp: new Date(),
      source: 'review',
      responseTime,
      consecutiveFailures: consecutiveFailures + 1,
    }
    
    this.addMistake(mistake)
    this.updatePatterns(mistake)
    this.checkTrapGeneration(card.topic)
    
    return mistake
  }
  
  /**
   * Track a mistake from quiz with wrong answer.
   */
  trackQuizMistake(
    card: ExamGradeFlashcard,
    wrongAnswer: string,
    responseTime?: number
  ): TrackedMistake {
    const consecutiveFailures = this.getConsecutiveFailures(card.id)
    
    const mistake: TrackedMistake = {
      id: this.generateId(),
      cardId: card.id,
      question: card.question,
      correctAnswer: card.answer,
      wrongAnswer,
      cardType: card.type,
      topic: card.topic,
      subtopic: card.subtopic,
      timestamp: new Date(),
      source: 'quiz',
      responseTime,
      consecutiveFailures: consecutiveFailures + 1,
    }
    
    this.addMistake(mistake)
    this.updatePatterns(mistake)
    this.checkTrapGeneration(card.topic)
    
    return mistake
  }
  
  /**
   * Track a self-reported mistake.
   */
  trackSelfReportedMistake(
    question: string,
    correctAnswer: string,
    wrongAnswer: string,
    topic: string,
    subtopic?: string
  ): TrackedMistake {
    const mistake: TrackedMistake = {
      id: this.generateId(),
      cardId: `self_${this.generateId()}`,
      question,
      correctAnswer,
      wrongAnswer,
      cardType: 'definition', // Default
      topic,
      subtopic,
      timestamp: new Date(),
      source: 'self_test',
      consecutiveFailures: 1,
    }
    
    this.addMistake(mistake)
    this.updatePatterns(mistake)
    this.checkTrapGeneration(topic)
    
    return mistake
  }
  
  /**
   * Get mistakes ready for TRAP card generation.
   */
  getMistakesForTrapGeneration(topic?: string): TrapCardRequest | null {
    let relevantMistakes = this.mistakes.filter(m => 
      m.consecutiveFailures >= 2 || m.wrongAnswer
    )
    
    if (topic) {
      relevantMistakes = relevantMistakes.filter(m => m.topic === topic)
    }
    
    if (relevantMistakes.length < TRAP_GENERATION_THRESHOLD) {
      return null
    }
    
    // Get unique mistakes (latest per card)
    const uniqueMistakes = new Map<string, TrackedMistake>()
    relevantMistakes.forEach(m => {
      const existing = uniqueMistakes.get(m.cardId)
      if (!existing || m.timestamp > existing.timestamp) {
        uniqueMistakes.set(m.cardId, m)
      }
    })
    
    const mistakesArray = Array.from(uniqueMistakes.values()).slice(0, 10)
    
    return {
      mistakes: mistakesArray.map(m => ({
        question: m.question,
        wrong_answer: m.wrongAnswer || 'User marked as incorrect',
        correct_answer: m.correctAnswer,
      })),
      topic: topic || this.getMostProblematicTopic() || 'General',
      num_cards: Math.min(5, Math.ceil(mistakesArray.length / 2)),
    }
  }
  
  /**
   * Mark TRAP cards as generated for a topic.
   */
  markTrapCardsGenerated(topic: string): void {
    const pattern = this.patterns.get(topic)
    if (pattern) {
      pattern.trapCardsGenerated = true
      this.patterns.set(topic, pattern)
    }
    this.pendingTrapGeneration.delete(topic)
    this.saveToStorage()
  }
  
  /**
   * Clear a correct response (remove from mistake tracking).
   */
  recordCorrectResponse(cardId: string): void {
    // Don't delete mistakes, but reset consecutive failures
    const recentMistake = this.mistakes
      .filter(m => m.cardId === cardId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    
    if (recentMistake) {
      recentMistake.consecutiveFailures = 0
    }
    this.saveToStorage()
  }
  
  /**
   * Get comprehensive mistake statistics.
   */
  getStats(): MistakeStats {
    const topicCounts = new Map<string, number>()
    const typeCounts = new Map<FlashcardType, number>()
    
    this.mistakes.forEach(m => {
      topicCounts.set(m.topic, (topicCounts.get(m.topic) || 0) + 1)
      typeCounts.set(m.cardType, (typeCounts.get(m.cardType) || 0) + 1)
    })
    
    // Find most problematic topic
    let mostProblematicTopic: string | null = null
    let maxTopicCount = 0
    topicCounts.forEach((count, topic) => {
      if (count > maxTopicCount) {
        maxTopicCount = count
        mostProblematicTopic = topic
      }
    })
    
    // Find most problematic card type
    let mostProblematicCardType: FlashcardType | null = null
    let maxTypeCount = 0
    typeCounts.forEach((count, type) => {
      if (count > maxTypeCount) {
        maxTypeCount = count
        mostProblematicCardType = type
      }
    })
    
    // Count topics needing TRAP cards
    let trapCardsNeeded = 0
    this.patterns.forEach(pattern => {
      if (!pattern.trapCardsGenerated && pattern.mistakeCount >= TRAP_GENERATION_THRESHOLD) {
        trapCardsNeeded++
      }
    })
    
    return {
      totalMistakes: this.mistakes.length,
      uniqueTopics: topicCounts.size,
      mostProblematicTopic,
      mostProblematicCardType,
      recentMistakes: this.mistakes
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10),
      patternsIdentified: Array.from(this.patterns.values()),
      trapCardsNeeded,
    }
  }
  
  /**
   * Get mistakes for a specific topic.
   */
  getMistakesByTopic(topic: string): TrackedMistake[] {
    return this.mistakes.filter(m => m.topic === topic)
  }
  
  /**
   * Get the most problematic topic.
   */
  getMostProblematicTopic(): string | null {
    const stats = this.getStats()
    return stats.mostProblematicTopic
  }
  
  /**
   * Check if TRAP cards should be generated.
   */
  shouldGenerateTrapCards(topic?: string): boolean {
    if (topic) {
      const pattern = this.patterns.get(topic)
      return pattern 
        ? !pattern.trapCardsGenerated && pattern.mistakeCount >= TRAP_GENERATION_THRESHOLD
        : false
    }
    
    // Check any topic
    for (const pattern of this.patterns.values()) {
      if (!pattern.trapCardsGenerated && pattern.mistakeCount >= TRAP_GENERATION_THRESHOLD) {
        return true
      }
    }
    return false
  }
  
  /**
   * Get topics that need TRAP card generation.
   */
  getTopicsNeedingTrapCards(): string[] {
    const topics: string[] = []
    this.patterns.forEach((pattern, topic) => {
      if (!pattern.trapCardsGenerated && pattern.mistakeCount >= TRAP_GENERATION_THRESHOLD) {
        topics.push(topic)
      }
    })
    return topics
  }
  
  /**
   * Clear all tracked mistakes.
   */
  clearAll(): void {
    this.mistakes = []
    this.patterns.clear()
    this.pendingTrapGeneration.clear()
    this.saveToStorage()
  }
  
  // ==================== PRIVATE METHODS ====================
  
  private generateId(): string {
    return `m_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private getConsecutiveFailures(cardId: string): number {
    const cardMistakes = this.mistakes
      .filter(m => m.cardId === cardId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    
    return cardMistakes[0]?.consecutiveFailures || 0
  }
  
  private addMistake(mistake: TrackedMistake): void {
    this.mistakes.push(mistake)
    
    // Trim if over limit
    if (this.mistakes.length > MAX_STORED_MISTAKES) {
      this.mistakes = this.mistakes
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, MAX_STORED_MISTAKES)
    }
    
    this.saveToStorage()
  }
  
  private updatePatterns(mistake: TrackedMistake): void {
    const key = mistake.topic
    const existing = this.patterns.get(key)
    
    if (existing) {
      existing.mistakeCount++
      existing.lastMistake = mistake.timestamp
      if (!existing.cardTypes.includes(mistake.cardType)) {
        existing.cardTypes.push(mistake.cardType)
      }
      if (!existing.questions.includes(mistake.question)) {
        existing.questions.push(mistake.question)
      }
      this.patterns.set(key, existing)
    } else {
      this.patterns.set(key, {
        topic: mistake.topic,
        subtopic: mistake.subtopic,
        mistakeCount: 1,
        cardTypes: [mistake.cardType],
        questions: [mistake.question],
        lastMistake: mistake.timestamp,
        trapCardsGenerated: false,
      })
    }
  }
  
  private checkTrapGeneration(topic: string): void {
    const pattern = this.patterns.get(topic)
    if (pattern && !pattern.trapCardsGenerated && pattern.mistakeCount >= TRAP_GENERATION_THRESHOLD) {
      this.pendingTrapGeneration.add(topic)
    }
  }
  
  private saveToStorage(): void {
    try {
      const data = {
        mistakes: this.mistakes.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
        patterns: Array.from(this.patterns.entries()).map(([key, pattern]) => ({
          key,
          ...pattern,
          lastMistake: pattern.lastMistake.toISOString(),
        })),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to save mistakes to storage:', e)
    }
  }
  
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return
      
      const data = JSON.parse(stored)
      
      this.mistakes = (data.mistakes || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }))
      
      this.patterns.clear()
      ;(data.patterns || []).forEach((p: any) => {
        this.patterns.set(p.key, {
          ...p,
          lastMistake: new Date(p.lastMistake),
        })
      })
    } catch (e) {
      console.warn('Failed to load mistakes from storage:', e)
      this.mistakes = []
      this.patterns.clear()
    }
  }
}

// ==================== SINGLETON & EXPORTS ====================

let mistakeTrackerInstance: MistakeTracker | null = null

export function getMistakeTracker(): MistakeTracker {
  if (!mistakeTrackerInstance) {
    mistakeTrackerInstance = new MistakeTracker()
  }
  return mistakeTrackerInstance
}

export function createMistakeTracker(): MistakeTracker {
  return new MistakeTracker()
}
