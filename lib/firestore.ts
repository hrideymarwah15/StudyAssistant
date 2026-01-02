"use client"

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  setDoc
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"

// Types
export interface MaterialFolder {
  id: string
  name: string
  color: string
  userId: string
  createdAt: Date
}

export interface Material {
  id: string
  title: string
  type: "pdf" | "image" | "text" | "other"
  subject: string
  fileUrl?: string
  content?: string
  folderId?: string
  userId: string
  createdAt: Date
}

// Legacy Flashcard interface (for backward compatibility)
export interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: "easy" | "medium" | "hard"
  deckId: string
  userId: string
  createdAt: Date
  lastReviewed?: Date
  nextReview?: Date
  reviewCount?: number
  easeFactor?: number
}

// ==================== EXAM-GRADE FLASHCARD TYPES ====================

export type FlashcardType = "definition" | "why" | "how" | "compare" | "trap" | "example" | "exam"
export type FlashcardDifficulty = "beginner" | "intermediate" | "advanced" | "expert"
export type SRSRating = "again" | "hard" | "good" | "easy"

export interface ExamGradeFlashcard {
  id: string
  type: FlashcardType
  question: string
  answer: string
  difficulty: FlashcardDifficulty
  topic: string
  subtopic?: string
  source: string
  exam_relevance: number // 1-10
  key_terms: string[]
  mistake_prone: boolean
  
  // Firestore fields
  deckId: string
  userId: string
  createdAt: Date
  
  // SRS fields
  lastReviewed?: Date
  nextReview?: Date
  reviewCount: number
  correctCount: number
  incorrectCount: number
  interval: number  // days until next review
  easeFactor: number  // 1.3 to 2.5
  consecutiveCorrect: number
  
  // Mistake tracking
  mistakeHistory: MistakeRecord[]
}

export interface MistakeRecord {
  date: Date
  wrongAnswer?: string
  correctAnswer: string
  timeSpent?: number  // seconds
}

export interface ExamGradeFlashcardDeck {
  id: string
  name: string
  subject: string
  topic: string
  cardCount: number
  userId: string
  createdAt: Date
  
  // Enhanced metadata
  totalCards: number
  masteredCards: number  // cards with interval > 21 days
  dueCards: number
  avgExamRelevance: number
  cardTypeDistribution: Record<FlashcardType, number>
  difficultyDistribution: Record<FlashcardDifficulty, number>
  
  // Study stats
  lastStudied?: Date
  totalReviews: number
  avgAccuracy: number
}

export interface FlashcardDeck {
  id: string
  name: string
  subject: string
  cardCount: number
  userId: string
  createdAt: Date
}

export interface StudyTask {
  id: string
  planId: string
  day: number
  title: string
  completed: boolean
  hours: number
  dueDate: Date
  userId: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed"
}

export interface StudyPlan {
  id: string
  name: string
  subject: string
  examDate: Date
  difficulty: "easy" | "medium" | "hard"
  hoursPerDay: number
  userId: string
  createdAt: Date
  completedTasks: number
  totalTasks: number
}

export interface GroupMember {
  userId: string
  displayName: string
  email: string
  role: "admin" | "member"
  joinedAt: Date
  avatarUrl?: string
}

export interface StudyGroup {
  id: string
  name: string
  subject: string
  description: string
  members: GroupMember[]
  memberCount: number
  createdBy: string
  createdAt: Date
  maxMembers?: number
  isPrivate?: boolean
}

export interface GroupMessage {
  id: string
  groupId: string
  content: string
  userId: string
  userName: string
  createdAt: Date
}

export interface BookmarkedJob {
  id: string
  jobId: string
  title: string
  company: string
  location: string
  deadline: string
  type: string
  url: string
  userId: string
  createdAt: Date
}

// Assistant Conversation
export interface ConversationMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  userId: string
  title: string
  messages: ConversationMessage[]
  context?: {
    materialIds?: string[]
    deckIds?: string[]
    planIds?: string[]
  }
  createdAt: Date
  updatedAt: Date
}

// Assistant Memory (for "remember that..." commands)
export interface Memory {
  id: string
  userId: string
  content: string
  category: "note" | "reminder" | "fact" | "preference"
  relatedEntities?: string[]
  createdAt: Date
}

// ==================== ENHANCED TASK SYSTEM ====================
export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "todo" | "in-progress" | "done" | "blocked"
  tags: string[] // e.g., ["DSA", "project", "CP", "gym"]
  course?: string
  topic?: string
  type?: "Assignment" | "Revision" | "Practice" | "Reading" | "Project" | "Exam Prep" | "Other"
  difficulty?: "Easy" | "Medium" | "Hard"
  estimatedMinutes: number
  actualMinutes?: number
  dueDate?: Date
  scheduledDate?: Date
  scheduledStartTime?: string // "14:00"
  scheduledEndTime?: string // "16:00"
  subtasks: Subtask[]
  links?: TaskLink[]
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface TaskLink {
  type: "github" | "leetcode" | "codeforces" | "document" | "other"
  url: string
  label?: string
}

// ==================== CALENDAR & EVENTS ====================
export interface CalendarEvent {
  id: string
  userId: string
  title: string
  type: "class" | "lab" | "exam" | "assignment" | "meeting" | "focus" | "break" | "other" | "study-session" | "contest"
  course?: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  isRecurring: boolean
  recurrence?: {
    frequency: "daily" | "weekly" | "biweekly" | "monthly"
    daysOfWeek?: number[] // 0-6, Sunday-Saturday
    endDate?: Date
    exceptions?: Date[] // Dates to skip
  }
  color?: string
  reminders?: number[] // Minutes before event
  meetingLink?: string
  isOnline?: boolean
  createdAt: Date
}

// ==================== TIME BLOCKS & POMODORO ====================
export interface TimeBlock {
  id: string
  userId: string
  taskId?: string
  title: string
  type: "deep-work" | "shallow-work" | "break" | "meeting" | "personal"
  startTime: Date
  endTime: Date
  completed: boolean
  actualDuration?: number // minutes
  notes?: string
  createdAt: Date
}

export interface PomodoroSession {
  id: string
  userId: string
  taskId?: string
  course?: string
  startTime: Date
  endTime?: Date
  plannedDuration: number // minutes
  actualDuration?: number
  type: "work" | "short-break" | "long-break"
  completed: boolean
  interrupted: boolean
  productivityRating?: number // 1-5
  notes?: string
}

export interface PomodoroSettings {
  userId: string
  workDuration: number // default 25
  shortBreakDuration: number // default 5
  longBreakDuration: number // default 15
  sessionsBeforeLongBreak: number // default 4
  autoStartBreaks: boolean
  autoStartWork: boolean
  soundEnabled: boolean
  notificationsEnabled: boolean
}

// ==================== ANALYTICS & TRACKING ====================
export interface StudySession {
  id: string
  userId: string
  taskId?: string
  course?: string
  tags: string[]
  startTime: Date
  endTime: Date
  duration: number // minutes
  productivityRating?: number // 1-5
  difficultyRating?: number // 1-5
  notes?: string
  pomodoroCount?: number
}

export interface DailyStats {
  id: string
  userId: string
  date: Date
  totalStudyMinutes: number
  taskCompleted: number
  pomodoroCompleted: number
  coursesStudied: string[]
  productivityAvg?: number
  streakDay: number
}

export interface CourseGrade {
  id: string
  userId: string
  courseName: string
  courseCode?: string
  credits?: number
  color: string
  icon?: string
  grades: GradeEntry[]
  currentGrade?: number // Calculated percentage
  targetGrade?: number
}

export interface GradeEntry {
  id: string
  name: string // "Quiz 1", "Midterm", "Assignment 3"
  type: "quiz" | "test" | "exam" | "assignment" | "project" | "participation"
  score: number
  maxScore: number
  weight: number // percentage weight in final grade
  date: Date
}

// ==================== HABITS ====================
export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  icon?: string
  color: string
  frequency: "daily" | "weekly" | "custom"
  targetDays?: number[] // For weekly: which days (0-6)
  targetCount?: number // Times per period
  reminderTime?: string // "08:00"
  currentStreak: number
  longestStreak: number
  completions: HabitCompletion[]
  createdAt: Date
  isArchived: boolean
}

export interface HabitCompletion {
  date: string // "2025-12-23"
  completed: boolean
  count?: number // For habits with multiple completions per day
  notes?: string
}

// ==================== COURSES ====================
export interface Course {
  id: string
  userId: string
  name: string
  code?: string
  professor?: string
  color: string
  icon?: string
  credits?: number
  schedule?: CourseSchedule[]
  syllabus?: string[]
  examDate?: Date
  notes?: string
}

export interface CourseSchedule {
  dayOfWeek: number // 0-6
  startTime: string // "09:00"
  endTime: string // "10:30"
  location?: string
  type: "lecture" | "lab" | "tutorial" | "office-hours"
}

// Material Folder Functions
export async function getMaterialFolders(userId: string): Promise<MaterialFolder[]> {
  const snapshot = await getDocs(collection(db, "materialFolders"))
  const folders = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as MaterialFolder
    })
    .filter(f => f.userId === userId)
  return folders.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createMaterialFolder(folder: Omit<MaterialFolder, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "materialFolders"), {
    ...folder,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function deleteMaterialFolder(folderId: string): Promise<void> {
  // Delete the folder
  await deleteDoc(doc(db, "materialFolders", folderId))
  // Move materials in this folder to root (remove folderId)
  const snapshot = await getDocs(collection(db, "materials"))
  const folderMaterials = snapshot.docs.filter(d => d.data().folderId === folderId)
  for (const docSnap of folderMaterials) {
    await updateDoc(docSnap.ref, { folderId: null })
  }
}

export async function updateMaterialFolder(materialId: string, folderId: string | null): Promise<void> {
  await updateDoc(doc(db, "materials", materialId), { folderId })
}

// Materials Functions
export async function getMaterials(userId: string, folderId?: string | null): Promise<Material[]> {
  // Fetch all and filter client-side to avoid index requirements
  const snapshot = await getDocs(collection(db, "materials"))
  let materials = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Material
    })
    .filter(m => m.userId === userId)
  
  // Filter by folder if specified
  if (folderId !== undefined) {
    materials = materials.filter(m => (m.folderId || null) === folderId)
  }
  
  return materials.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function addMaterial(material: Omit<Material, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "materials"), {
    ...material,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function uploadFile(file: File, userId: string): Promise<string> {
  const fileRef = ref(storage, `materials/${userId}/${Date.now()}_${file.name}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export async function deleteMaterial(materialId: string): Promise<void> {
  await deleteDoc(doc(db, "materials", materialId))
}

// Flashcard Functions
export async function getFlashcardDecks(userId: string): Promise<FlashcardDeck[]> {
  // Fetch all and filter client-side to avoid index requirements
  const snapshot = await getDocs(collection(db, "flashcardDecks"))
  const decks = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as FlashcardDeck
    })
    .filter(d => d.userId === userId)
  return decks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function createFlashcardDeck(deck: Omit<FlashcardDeck, "id" | "createdAt" | "cardCount">): Promise<string> {
  const docRef = await addDoc(collection(db, "flashcardDecks"), {
    ...deck,
    cardCount: 0,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  // Fetch all and filter client-side to avoid index requirements
  const snapshot = await getDocs(collection(db, "flashcards"))
  return snapshot.docs
    .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Flashcard))
    .filter(c => c.deckId === deckId)
}

export async function addFlashcard(card: Omit<Flashcard, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "flashcards"), {
    ...card,
    createdAt: new Date()
  })
  // Update deck card count
  const deckRef = doc(db, "flashcardDecks", card.deckId)
  const deckSnap = await getDoc(deckRef)
  if (deckSnap.exists()) {
    await updateDoc(deckRef, { cardCount: (deckSnap.data().cardCount || 0) + 1 })
  }
  return docRef.id
}

// Study Plans Functions
export async function getStudyPlans(userId: string): Promise<StudyPlan[]> {
  const snapshot = await getDocs(collection(db, "studyPlans"))
  const plans = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        examDate: data.examDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      } as StudyPlan
    })
    .filter(p => p.userId === userId)
  return plans.sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
}

export async function createStudyPlan(plan: Omit<StudyPlan, "id" | "createdAt" | "completedTasks">): Promise<string> {
  const docRef = await addDoc(collection(db, "studyPlans"), {
    ...plan,
    completedTasks: 0,
    examDate: Timestamp.fromDate(plan.examDate),
    createdAt: serverTimestamp()
  })
  
  // After tasks are created, update the totalTasks count
  return docRef.id
}

export async function deleteStudyPlan(planId: string): Promise<void> {
  // Delete the plan
  await deleteDoc(doc(db, "studyPlans", planId))
  // Delete all tasks associated with this plan
  const snapshot = await getDocs(collection(db, "studyTasks"))
  const planTasks = snapshot.docs.filter(d => d.data().planId === planId)
  for (const docSnap of planTasks) {
    await deleteDoc(docSnap.ref)
  }
}

export async function updatePlanProgress(planId: string, completedTasks: number): Promise<void> {
  await updateDoc(doc(db, "studyPlans", planId), { completedTasks })
}

export async function updatePlanTotalTasks(planId: string, totalTasks: number): Promise<void> {
  await updateDoc(doc(db, "studyPlans", planId), { totalTasks })
}

// Study Tasks Functions
export async function getStudyTasks(userId: string, planId?: string): Promise<StudyTask[]> {
  const snapshot = await getDocs(collection(db, "studyTasks"))
  const tasks = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate?.toDate() || new Date(),
        priority: data.priority || "medium",
        status: data.status || "pending"
      } as StudyTask
    })
    .filter(t => t.userId === userId && (!planId || t.planId === planId))
  return tasks.sort((a, b) => a.day - b.day)
}

export async function createStudyTask(task: Omit<StudyTask, "id" | "completed">): Promise<string> {
  const docRef = await addDoc(collection(db, "studyTasks"), {
    ...task,
    completed: false,
    dueDate: Timestamp.fromDate(task.dueDate)
  })
  return docRef.id
}

export async function toggleTaskComplete(taskId: string, completed: boolean, planId?: string): Promise<void> {
  await updateDoc(doc(db, "studyTasks", taskId), { completed })
  
  // Update plan progress if planId provided
  if (planId) {
    const snapshot = await getDocs(collection(db, "studyTasks"))
    const planTasks = snapshot.docs.filter(d => d.data().planId === planId)
    const completedCount = planTasks.filter(d => d.data().completed || (d.id === taskId && completed)).length
    await updatePlanProgress(planId, completedCount)
  }
}

export async function deleteStudyTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "studyTasks", taskId))
}

export async function clearPlanTasks(planId: string): Promise<void> {
  const snapshot = await getDocs(collection(db, "studyTasks"))
  const planTasks = snapshot.docs.filter(d => d.data().planId === planId)
  for (const docSnap of planTasks) {
    await deleteDoc(docSnap.ref)
  }
}

// Study Groups Functions
export async function getStudyGroups(userId?: string): Promise<StudyGroup[]> {
  const snapshot = await getDocs(collection(db, "studyGroups"))
  let groups = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date()
  })) as StudyGroup[]

  // Filter groups where user is a member if userId is provided
  if (userId) {
    groups = groups.filter(group =>
      group.members.some((member: GroupMember) => member.userId === userId)
    )
  }

  // Sort client-side to avoid index requirement
  return groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function getStudyGroup(groupId: string): Promise<StudyGroup | null> {
  const docSnap = await getDoc(doc(db, "studyGroups", groupId))
  if (!docSnap.exists()) return null
  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate() || new Date()
  } as StudyGroup
}

export async function createStudyGroup(group: Omit<StudyGroup, "id" | "createdAt" | "memberCount">): Promise<string> {
  const docRef = await addDoc(collection(db, "studyGroups"), {
    ...group,
    memberCount: group.members.length,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function joinGroup(groupId: string, member: GroupMember): Promise<void> {
  const groupRef = doc(db, "studyGroups", groupId)
  const groupSnap = await getDoc(groupRef)
  if (groupSnap.exists()) {
    const groupData = groupSnap.data()
    const members = groupData.members || []

    // Check if group is full
    if (members.length >= (groupData.maxMembers || 10)) {
      throw new Error("Group is full")
    }

    if (!members.some((m: GroupMember) => m.userId === member.userId)) {
      await updateDoc(groupRef, {
        members: [...members, member],
        memberCount: members.length + 1
      })
    }
  }
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const groupRef = doc(db, "studyGroups", groupId)
  const groupSnap = await getDoc(groupRef)
  if (groupSnap.exists()) {
    const members = groupSnap.data().members || []
    const newMembers = members.filter((m: string) => m !== userId)
    await updateDoc(groupRef, {
      members: newMembers,
      memberCount: newMembers.length
    })
  }
}

// Group Messages Functions
export function subscribeToGroupMessages(
  groupId: string, 
  callback: (messages: GroupMessage[]) => void
): () => void {
  // Subscribe to all messages and filter client-side to avoid index requirements
  return onSnapshot(collection(db, "groupMessages"), (snapshot) => {
    const messages = snapshot.docs
      .map(docSnap => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        } as GroupMessage
      })
      .filter(m => m.groupId === groupId)
    callback(messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()))
  })
}

export async function sendGroupMessage(message: Omit<GroupMessage, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "groupMessages"), {
    ...message,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

// Bookmarked Jobs Functions
export async function getBookmarkedJobs(userId: string): Promise<BookmarkedJob[]> {
  // Fetch all and filter client-side to avoid index requirements
  const snapshot = await getDocs(collection(db, "bookmarkedJobs"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as BookmarkedJob
    })
    .filter(b => b.userId === userId)
}

export async function toggleJobBookmark(job: Omit<BookmarkedJob, "id" | "createdAt">): Promise<boolean> {
  // Fetch all and filter client-side to avoid index requirements
  const snapshot = await getDocs(collection(db, "bookmarkedJobs"))
  const existing = snapshot.docs.find(d => 
    d.data().userId === job.userId && d.data().jobId === job.jobId
  )
  
  if (!existing) {
    await addDoc(collection(db, "bookmarkedJobs"), {
      ...job,
      createdAt: serverTimestamp()
    })
    return true // Now bookmarked
  } else {
    await deleteDoc(existing.ref)
    return false // Unbookmarked
  }
}

// User Profile
export async function getUserProfile(userId: string) {
  const docSnap = await getDoc(doc(db, "users", userId))
  return docSnap.exists() ? docSnap.data() : null
}

export async function updateUserProfile(userId: string, data: Record<string, unknown>) {
  await setDoc(doc(db, "users", userId), data, { merge: true })
}

// ==================== CONVERSATION FUNCTIONS ====================
export async function getConversations(userId: string): Promise<Conversation[]> {
  const snapshot = await getDocs(collection(db, "conversations"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        messages: (data.messages || []).map((m: any) => ({
          ...m,
          timestamp: m.timestamp?.toDate() || new Date()
        })),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Conversation
    })
    .filter(c => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export async function createConversation(userId: string, title: string = "New Conversation"): Promise<string> {
  const docRef = await addDoc(collection(db, "conversations"), {
    userId,
    title,
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<ConversationMessage, "timestamp">
): Promise<void> {
  const docRef = doc(db, "conversations", conversationId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    throw new Error("Conversation not found")
  }
  
  const data = docSnap.data()
  const messages = data.messages || []
  messages.push({
    ...message,
    timestamp: new Date()
  })
  
  await updateDoc(docRef, {
    messages,
    updatedAt: serverTimestamp()
  })
}

export async function deleteConversation(conversationId: string): Promise<void> {
  await deleteDoc(doc(db, "conversations", conversationId))
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "conversations", conversationId), { title })
}

// ==================== MEMORY FUNCTIONS ====================
export async function getMemories(userId: string): Promise<Memory[]> {
  const snapshot = await getDocs(collection(db, "memories"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Memory
    })
    .filter(m => m.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export async function addMemory(memory: Omit<Memory, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "memories"), {
    ...memory,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function deleteMemory(memoryId: string): Promise<void> {
  await deleteDoc(doc(db, "memories", memoryId))
}

export async function searchMemories(userId: string, query: string): Promise<Memory[]> {
  const memories = await getMemories(userId)
  const lowerQuery = query.toLowerCase()
  return memories.filter(m => 
    m.content.toLowerCase().includes(lowerQuery)
  )
}

// ==================== TASK FUNCTIONS ====================
export async function getTasks(userId: string, filters?: {
  status?: Task["status"]
  priority?: Task["priority"]
  course?: string
  tag?: string
  dateRange?: { start: Date; end: Date }
}): Promise<Task[]> {
  const snapshot = await getDocs(collection(db, "tasks"))
  let tasks = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
        scheduledDate: data.scheduledDate?.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        subtasks: data.subtasks || [],
        tags: data.tags || [],
        links: data.links || []
      } as Task
    })
    .filter(t => t.userId === userId)

  if (filters?.status) tasks = tasks.filter(t => t.status === filters.status)
  if (filters?.priority) tasks = tasks.filter(t => t.priority === filters.priority)
  if (filters?.course) tasks = tasks.filter(t => t.course === filters.course)
  if (filters?.tag) tasks = tasks.filter(t => t.tags.includes(filters.tag!))
  if (filters?.dateRange) {
    tasks = tasks.filter(t => 
      t.dueDate && t.dueDate >= filters.dateRange!.start && t.dueDate <= filters.dateRange!.end
    )
  }

  return tasks.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export async function createTask(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "tasks"), {
    ...task,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  await updateDoc(doc(db, "tasks", taskId), {
    ...updates,
    updatedAt: serverTimestamp()
  })
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, "tasks", taskId))
}

export async function toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
  const docRef = doc(db, "tasks", taskId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return

  const task = docSnap.data()
  const subtasks = task.subtasks || []
  const updatedSubtasks = subtasks.map((st: Subtask) =>
    st.id === subtaskId ? { ...st, completed: !st.completed } : st
  )

  await updateDoc(docRef, { subtasks: updatedSubtasks, updatedAt: serverTimestamp() })
}

// ==================== CALENDAR EVENT FUNCTIONS ====================
export async function getCalendarEvents(userId: string, dateRange?: { start: Date; end: Date }): Promise<CalendarEvent[]> {
  const snapshot = await getDocs(collection(db, "calendarEvents"))
  let events = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        recurrence: data.recurrence ? {
          ...data.recurrence,
          endDate: data.recurrence.endDate?.toDate(),
          exceptions: data.recurrence.exceptions?.map((e: any) => e.toDate()) || []
        } : undefined
      } as CalendarEvent
    })
    .filter(e => e.userId === userId)

  if (dateRange) {
    events = events.filter(e => 
      e.startTime >= dateRange.start && e.startTime <= dateRange.end
    )
  }

  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

export async function createCalendarEvent(event: Omit<CalendarEvent, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "calendarEvents"), {
    ...event,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
  await updateDoc(doc(db, "calendarEvents", eventId), updates)
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, "calendarEvents", eventId))
}

// ==================== POMODORO FUNCTIONS ====================
export async function getPomodoroSettings(userId: string): Promise<PomodoroSettings | null> {
  const docSnap = await getDoc(doc(db, "pomodoroSettings", userId))
  return docSnap.exists() ? docSnap.data() as PomodoroSettings : null
}

export async function savePomodoroSettings(settings: PomodoroSettings): Promise<void> {
  await setDoc(doc(db, "pomodoroSettings", settings.userId), settings)
}

export async function logPomodoroSession(session: Omit<PomodoroSession, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "pomodoroSessions"), session)
  return docRef.id
}

export async function getPomodoroSessions(userId: string, dateRange?: { start: Date; end: Date }): Promise<PomodoroSession[]> {
  const snapshot = await getDocs(collection(db, "pomodoroSessions"))
  let sessions = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate()
      } as PomodoroSession
    })
    .filter(s => s.userId === userId)

  if (dateRange) {
    sessions = sessions.filter(s => 
      s.startTime >= dateRange.start && s.startTime <= dateRange.end
    )
  }

  return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
}

// ==================== STUDY SESSION & ANALYTICS FUNCTIONS ====================
export async function logStudySession(session: Omit<StudySession, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "studySessions"), session)
  
  // Update daily stats
  const dateStr = session.startTime.toISOString().split('T')[0]
  await updateDailyStats(session.userId, dateStr, session.duration, session.course)
  
  return docRef.id
}

export async function getStudySessions(userId: string, dateRange?: { start: Date; end: Date }): Promise<StudySession[]> {
  const snapshot = await getDocs(collection(db, "studySessions"))
  let sessions = snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        tags: data.tags || []
      } as StudySession
    })
    .filter(s => s.userId === userId)

  if (dateRange) {
    sessions = sessions.filter(s => 
      s.startTime >= dateRange.start && s.startTime <= dateRange.end
    )
  }

  return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
}

export async function getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
  const docSnap = await getDoc(doc(db, "dailyStats", `${userId}_${date}`))
  if (!docSnap.exists()) return null
  const data = docSnap.data()
  return {
    id: docSnap.id,
    ...data,
    date: data.date?.toDate() || new Date(),
    coursesStudied: data.coursesStudied || []
  } as DailyStats
}

export async function getWeeklyStats(userId: string): Promise<DailyStats[]> {
  const today = new Date()
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const stats: DailyStats[] = []
  for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayStat = await getDailyStats(userId, dateStr)
    if (dayStat) stats.push(dayStat)
  }
  return stats
}

async function updateDailyStats(userId: string, dateStr: string, minutes: number, course?: string): Promise<void> {
  const docRef = doc(db, "dailyStats", `${userId}_${dateStr}`)
  const existing = await getDoc(docRef)
  
  if (existing.exists()) {
    const data = existing.data()
    const coursesStudied = data.coursesStudied || []
    if (course && !coursesStudied.includes(course)) {
      coursesStudied.push(course)
    }
    await updateDoc(docRef, {
      totalStudyMinutes: (data.totalStudyMinutes || 0) + minutes,
      coursesStudied
    })
  } else {
    // Calculate streak
    const yesterday = new Date(dateStr)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStats = await getDailyStats(userId, yesterday.toISOString().split('T')[0])
    const streakDay = yesterdayStats ? yesterdayStats.streakDay + 1 : 1
    
    await setDoc(docRef, {
      userId,
      date: new Date(dateStr),
      totalStudyMinutes: minutes,
      taskCompleted: 0,
      pomodoroCompleted: 0,
      coursesStudied: course ? [course] : [],
      streakDay
    })
  }
}

// ==================== COURSE & GRADE FUNCTIONS ====================
export async function getCourses(userId: string): Promise<Course[]> {
  const snapshot = await getDocs(collection(db, "courses"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        schedule: data.schedule || [],
        examDate: data.examDate?.toDate()
      } as Course
    })
    .filter(c => c.userId === userId)
}

export async function createCourse(course: Omit<Course, "id">): Promise<string> {
  const docRef = await addDoc(collection(db, "courses"), course)
  return docRef.id
}

export async function updateCourse(courseId: string, updates: Partial<Course>): Promise<void> {
  await updateDoc(doc(db, "courses", courseId), updates)
}

export async function deleteCourse(courseId: string): Promise<void> {
  await deleteDoc(doc(db, "courses", courseId))
}

export async function getCourseGrades(userId: string): Promise<CourseGrade[]> {
  const snapshot = await getDocs(collection(db, "courseGrades"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        grades: (data.grades || []).map((g: any) => ({
          ...g,
          date: g.date?.toDate() || new Date()
        }))
      } as CourseGrade
    })
    .filter(g => g.userId === userId)
}

export async function addGradeEntry(courseGradeId: string, entry: Omit<GradeEntry, "id">): Promise<void> {
  const docRef = doc(db, "courseGrades", courseGradeId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return

  const data = docSnap.data()
  const grades = data.grades || []
  grades.push({ ...entry, id: Date.now().toString() })

  // Calculate current grade
  const totalWeight = grades.reduce((sum: number, g: GradeEntry) => sum + g.weight, 0)
  const weightedScore = grades.reduce((sum: number, g: GradeEntry) => 
    sum + (g.score / g.maxScore * 100) * (g.weight / 100), 0
  )
  const currentGrade = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0

  await updateDoc(docRef, { grades, currentGrade })
}

// ==================== HABIT FUNCTIONS ====================
export async function getHabits(userId: string): Promise<Habit[]> {
  const snapshot = await getDocs(collection(db, "habits"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        completions: data.completions || []
      } as Habit
    })
    .filter(h => h.userId === userId && !h.isArchived)
}

export async function createHabit(habit: Omit<Habit, "id" | "createdAt" | "currentStreak" | "longestStreak" | "completions">): Promise<string> {
  const docRef = await addDoc(collection(db, "habits"), {
    ...habit,
    currentStreak: 0,
    longestStreak: 0,
    completions: [],
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function toggleHabitCompletion(habitId: string, date: string): Promise<void> {
  const docRef = doc(db, "habits", habitId)
  const docSnap = await getDoc(docRef)
  if (!docSnap.exists()) return

  const habit = docSnap.data()
  const completions = habit.completions || []
  const existingIdx = completions.findIndex((c: HabitCompletion) => c.date === date)

  if (existingIdx >= 0) {
    completions[existingIdx].completed = !completions[existingIdx].completed
  } else {
    completions.push({ date, completed: true })
  }

  // Calculate streak
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]
    const completion = completions.find((c: HabitCompletion) => c.date === dateStr)
    if (completion?.completed) {
      streak++
    } else if (i > 0) { // Allow today to be incomplete
      break
    }
  }

  const longestStreak = Math.max(habit.longestStreak || 0, streak)

  await updateDoc(docRef, { completions, currentStreak: streak, longestStreak })
}

export async function deleteHabit(habitId: string): Promise<void> {
  await updateDoc(doc(db, "habits", habitId), { isArchived: true })
}

// ==================== TIME BLOCK FUNCTIONS ====================
export async function getTimeBlocks(userId: string, date: Date): Promise<TimeBlock[]> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const snapshot = await getDocs(collection(db, "timeBlocks"))
  return snapshot.docs
    .map(docSnap => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date()
      } as TimeBlock
    })
    .filter(tb => 
      tb.userId === userId && 
      tb.startTime >= startOfDay && 
      tb.startTime <= endOfDay
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

export async function createTimeBlock(block: Omit<TimeBlock, "id" | "createdAt">): Promise<string> {
  const docRef = await addDoc(collection(db, "timeBlocks"), {
    ...block,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function updateTimeBlock(blockId: string, updates: Partial<TimeBlock>): Promise<void> {
  await updateDoc(doc(db, "timeBlocks", blockId), updates)
}

export async function deleteTimeBlock(blockId: string): Promise<void> {
  await deleteDoc(doc(db, "timeBlocks", blockId))
}

// ==================== FLASHCARDS ====================
export async function createFlashcards(
  userId: string,
  cards: Omit<Flashcard, "id" | "userId" | "createdAt">[],
): Promise<Flashcard[]> {
  const flashcardsRef = collection(db, "flashcards")
  const createdCards: Flashcard[] = []

  for (const cardData of cards) {
    const docRef = doc(flashcardsRef)
    const card: Flashcard = {
      id: docRef.id,
      userId,
      ...cardData,
      createdAt: new Date(),
    }
    await setDoc(docRef, card)
    createdCards.push(card)
  }

  return createdCards
}

// ==================== USER DATA AGGREGATION ====================
export async function getUserData(userId: string): Promise<{
  tasks: Task[]
  courses: Course[]
  habits: Habit[]
  dailyStats: DailyStats | null
  userStreak: number
}> {
  const [tasks, courses, habits] = await Promise.all([
    getTasks(userId),
    getCourses(userId),
    getHabits(userId)
  ])

  // Get today's stats
  const today = new Date().toISOString().split('T')[0]
  const dailyStats = await getDailyStats(userId, today)

  // Calculate user streak (simplified - could be more sophisticated)
  let userStreak = 0
  if (dailyStats) {
    userStreak = dailyStats.streakDay
  }

  return {
    tasks,
    courses,
    habits,
    dailyStats,
    userStreak
  }
}