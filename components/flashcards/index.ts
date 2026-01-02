/**
 * EXAM-GRADE FLASHCARD SYSTEM
 * World-class memory weapons for exam preparation
 */

export { ExamGradeReview } from './exam-grade-review'
export { ExamGradeGenerator } from './exam-grade-generator'

// Re-export types from lib
export type {
  ExamGradeFlashcard,
  FlashcardType,
  FlashcardDifficulty,
  SRSRating,
  MistakeRecord,
  ExamGradeFlashcardDeck,
} from '@/lib/firestore'

export type {
  SRSScheduleItem,
  SRSReviewResult,
  StudySessionStats,
  DeckStudyProgress,
} from '@/lib/srs-engine'

export type {
  TrackedMistake,
  MistakePattern,
  MistakeStats,
} from '@/lib/mistake-tracker'
