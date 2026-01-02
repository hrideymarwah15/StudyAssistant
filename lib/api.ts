/**
 * API Client for StudyPal AI Backend
 * Connects to the FastAPI backend at localhost:8000
 */

// Get API URL from environment or use localhost
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 200000 // 200 seconds for AI operations

/**
 * Custom error for API failures
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message)
    this.name = "APIError"
  }
}

/**
 * Make an API request with timeout and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new APIError(
        error.detail || error.message || `Request failed with status ${response.status}`,
        response.status,
        error
      )
    }

    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === "AbortError") {
      throw new APIError("Request timeout - the AI is taking too long to respond")
    }
    
    if (error instanceof APIError) {
      throw error
    }
    
    throw new APIError(
      error.message || "Network error - please check your connection"
    )
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export interface HealthResponse {
  backend: string
  status: string
  services: {
    qdrant?: {
      status: string
      connected: boolean
      collection?: string
      vectors_count?: number
      url?: string
    }
    ollama?: {
      status: string
      connected: boolean
      models?: string[]
      url?: string
    }
    whisper?: {
      status: string
      loaded: boolean
      model?: string
    }
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>("/health")
}

// ============================================================================
// MATERIALS
// ============================================================================

export interface AddMaterialRequest {
  text: string
  course?: string
  topic?: string
  source?: string
  metadata?: Record<string, any>
}

export interface AddMaterialResponse {
  success: boolean
  message: string
  point_id: string
}

export async function addMaterial(data: AddMaterialRequest): Promise<AddMaterialResponse> {
  return apiRequest<AddMaterialResponse>("/materials/add", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export interface MaterialStats {
  collection_name: string
  vectors_count: number
  points_count: number
  status: string
}

export async function getMaterialStats(): Promise<{ success: boolean; stats: MaterialStats }> {
  return apiRequest("/materials/stats")
}

// ============================================================================
// AUDIO UPLOAD
// ============================================================================

export interface AudioUploadResponse {
  transcript: string
  stored_chunks: number
  language: string
  chunks?: string[]
}

export async function uploadAudio(
  file: File,
  options?: {
    course?: string
    topic?: string
    store_in_memory?: boolean
  }
): Promise<AudioUploadResponse> {
  const formData = new FormData()
  formData.append("file", file)
  
  if (options?.course) formData.append("course", options.course)
  if (options?.topic) formData.append("topic", options.topic)
  if (options?.store_in_memory !== undefined) {
    formData.append("store_in_memory", String(options.store_in_memory))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/audio/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new APIError(
        error.detail || `Upload failed with status ${response.status}`,
        response.status,
        error
      )
    }

    return await response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    
    if (error.name === "AbortError") {
      throw new APIError("Audio processing timeout")
    }
    
    if (error instanceof APIError) {
      throw error
    }
    
    throw new APIError(error.message || "Audio upload failed")
  }
}

// ============================================================================
// ASK AI (RAG)
// ============================================================================

export interface AskRequest {
  question: string
  use_memory?: boolean
  top_k?: number
}

export interface AskResponse {
  answer: string
  context_used: boolean
  sources_count: number
  sources?: Array<{
    text_preview: string
    metadata: Record<string, any>
    relevance_score: number
  }>
}

export async function askAI(data: AskRequest): Promise<AskResponse> {
  return apiRequest<AskResponse>("/ai/ask", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// FLASHCARDS
// ============================================================================

export interface GenerateFlashcardsRequest {
  text?: string
  topic?: string
  num_cards?: number
  use_memory?: boolean
}

export interface Flashcard {
  question: string
  answer: string
}

export interface GenerateFlashcardsResponse {
  flashcards: Flashcard[]
  count: number
  source: string
}

export async function generateFlashcards(
  data: GenerateFlashcardsRequest
): Promise<GenerateFlashcardsResponse> {
  return apiRequest<GenerateFlashcardsResponse>("/ai/flashcards/generate", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// EXAM-GRADE FLASHCARDS (World-Class Memory System)
// ============================================================================

export type FlashcardType = "definition" | "why" | "how" | "compare" | "trap" | "example" | "exam"
export type FlashcardDifficulty = "beginner" | "intermediate" | "advanced" | "expert"

export interface ExamGradeFlashcardRequest {
  text?: string
  topic: string
  num_cards?: number
  difficulty?: FlashcardDifficulty
  use_memory?: boolean
  user_mistakes?: string[]
  force_card_types?: FlashcardType[]
}

export interface ExamGradeFlashcard {
  id: string
  type: FlashcardType
  question: string
  answer: string
  difficulty: FlashcardDifficulty
  topic: string
  subtopic?: string
  source: string
  exam_relevance: number
  key_terms: string[]
  created_at: string
  mistake_prone: boolean
}

export interface ExamGradeFlashcardResponse {
  flashcards: ExamGradeFlashcard[]
  count: number
  source: string
  card_type_distribution: Record<string, number>
  difficulty: FlashcardDifficulty
}

export interface TrapCardRequest {
  mistakes: Array<{
    question: string
    wrong_answer: string
    correct_answer: string
  }>
  topic: string
  num_cards?: number
}

export interface TrapCardResponse {
  flashcards: ExamGradeFlashcard[]
  count: number
  source: string
  all_trap_type: boolean
}

export interface ExamSimulationRequest {
  topic: string
  subtopics: string[]
  exam_format?: "multiple_choice" | "short_answer" | "essay"
  num_cards?: number
}

export interface ExamSimulationResponse {
  flashcards: ExamGradeFlashcard[]
  count: number
  source: string
  exam_format: string
  subtopics_covered: string[]
}

/**
 * Generate exam-grade flashcards with 7 card types and full metadata.
 * Uses Qwen2.5 for high-quality, one-concept-per-card generation.
 */
export async function generateExamGradeFlashcards(
  data: ExamGradeFlashcardRequest
): Promise<ExamGradeFlashcardResponse> {
  return apiRequest<ExamGradeFlashcardResponse>("/ai/flashcards/exam-grade", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Generate TRAP cards from user's past mistakes.
 * Creates misconception-busting flashcards targeting failure points.
 */
export async function generateTrapCards(
  data: TrapCardRequest
): Promise<TrapCardResponse> {
  return apiRequest<TrapCardResponse>("/ai/flashcards/trap-cards", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/**
 * Generate exam simulation cards that mirror real test questions.
 */
export async function generateExamSimulation(
  data: ExamSimulationRequest
): Promise<ExamSimulationResponse> {
  return apiRequest<ExamSimulationResponse>("/ai/flashcards/exam-simulation", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// STUDY PLAN
// ============================================================================

export interface CreateStudyPlanRequest {
  subject: string
  days: number
  current_knowledge?: string
  retrieve_materials?: boolean
}

export interface CreateStudyPlanResponse {
  plan: string
  subject: string
  days: number
  materials_used: number
}

export async function createStudyPlan(
  data: CreateStudyPlanRequest
): Promise<CreateStudyPlanResponse> {
  return apiRequest<CreateStudyPlanResponse>("/ai/plan/create", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// INTELLIGENT AI (Study Intelligence System)
// ============================================================================

export type AIMode = "plan" | "explain" | "quiz" | "flashcards" | "review" | "coach"

export interface UserStudyContext {
  focus_minutes_today?: number
  target_focus_minutes?: number
  habits_completed_today?: number
  total_habits_today?: number
  flashcards_due?: number
  streak_days?: number
  urgent_task_count?: number
  overdue_tasks?: number
  current_course?: string
  current_topic?: string
  days_until_exam?: number
  recent_failures?: string[]
}

export interface IntelligentAskRequest {
  message: string
  mode?: AIMode
  context?: UserStudyContext
  use_memory?: boolean
  skip_intervention?: boolean
}

export interface Intervention {
  should_intervene: boolean
  message: string
  suggested_mode: AIMode
  priority: "high" | "medium" | "low"
}

export interface ProactiveSuggestion {
  id: string
  message: string
  action: string
  priority: "urgent" | "high" | "normal"
  icon: string
}

export interface IntelligentAskResponse {
  mode: AIMode
  answer: string
  structured_output?: Record<string, any>
  intervention?: Intervention
  memory_used: boolean
  memory_quality: "strong" | "weak" | "none"
  chunks_used: number
  suggestions: ProactiveSuggestion[]
}

/**
 * Intelligent AI endpoint - Study Intelligence System
 * Processes messages with mode-based routing, intervention logic, and structured outputs
 */
export async function intelligentAsk(
  data: IntelligentAskRequest
): Promise<IntelligentAskResponse> {
  return apiRequest<IntelligentAskResponse>("/ai/intelligent-ask", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Check if the backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const health = await checkHealth()
    return health.backend === "online" || health.status === "healthy"
  } catch {
    return false
  }
}

/**
 * Get backend service status summary
 */
export async function getServiceStatus(): Promise<{
  backend: boolean
  qdrant: boolean
  ollama: boolean
  whisper: boolean
}> {
  try {
    const health = await checkHealth()
    return {
      backend: health.backend === "online",
      qdrant: health.services.qdrant?.connected ?? false,
      ollama: health.services.ollama?.connected ?? false,
      whisper: health.services.whisper?.loaded ?? false,
    }
  } catch {
    return {
      backend: false,
      qdrant: false,
      ollama: false,
      whisper: false,
    }
  }
}
