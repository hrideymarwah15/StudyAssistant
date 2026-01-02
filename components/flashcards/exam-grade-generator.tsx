"use client"

/**
 * EXAM-GRADE AI FLASHCARD GENERATOR
 * World-class flashcard generation UI with:
 * - Multiple card type selection
 * - Difficulty targeting
 * - Source selection (topic/text/file/material)
 * - Mistake-driven generation
 * - Preview before saving
 */

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Loader2, 
  X, 
  Wand2, 
  Sparkles, 
  Upload, 
  FileText,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  Lightbulb,
  HelpCircle,
  Settings,
  ArrowLeftRight,
  Target,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  generateExamGradeFlashcards, 
  generateTrapCards,
  generateExamSimulation,
  type ExamGradeFlashcard,
  type FlashcardType,
  type FlashcardDifficulty
} from "@/lib/api"
import { readFileContent } from "@/lib/gemini"
import { getMistakeTracker } from "@/lib/mistake-tracker"

// ==================== TYPES ====================

interface ExamGradeGeneratorProps {
  deckId: string
  deckTopic?: string
  onGenerated: (flashcards: ExamGradeFlashcard[]) => Promise<void>
  onClose: () => void
}

type GenerationMode = "standard" | "trap" | "exam_sim"
type SourceType = "topic" | "text" | "file"

// ==================== CONFIG ====================

const CARD_TYPE_OPTIONS: Array<{
  type: FlashcardType
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}> = [
  { type: "definition", label: "Definition", description: "What is X?", icon: BookOpen, color: "text-blue-400" },
  { type: "why", label: "Why", description: "Why does X happen?", icon: HelpCircle, color: "text-purple-400" },
  { type: "how", label: "How", description: "How does X work?", icon: Settings, color: "text-green-400" },
  { type: "compare", label: "Compare", description: "Compare X vs Y", icon: ArrowLeftRight, color: "text-yellow-400" },
  { type: "trap", label: "TRAP", description: "Common mistakes", icon: AlertTriangle, color: "text-red-400" },
  { type: "example", label: "Example", description: "Real examples", icon: Lightbulb, color: "text-orange-400" },
  { type: "exam", label: "EXAM", description: "Exam-style Q's", icon: GraduationCap, color: "text-pink-400" },
]

const DIFFICULTY_OPTIONS: Array<{
  value: FlashcardDifficulty
  label: string
  description: string
}> = [
  { value: "beginner", label: "Beginner", description: "Foundational concepts" },
  { value: "intermediate", label: "Intermediate", description: "Core understanding" },
  { value: "advanced", label: "Advanced", description: "Deep knowledge" },
  { value: "expert", label: "Expert", description: "Mastery level" },
]

// ==================== COMPONENT ====================

export function ExamGradeGenerator({
  deckId,
  deckTopic = "",
  onGenerated,
  onClose,
}: ExamGradeGeneratorProps) {
  // State
  const [mode, setMode] = useState<GenerationMode>("standard")
  const [sourceType, setSourceType] = useState<SourceType>("topic")
  const [topic, setTopic] = useState(deckTopic)
  const [textContent, setTextContent] = useState("")
  const [numCards, setNumCards] = useState(10)
  const [difficulty, setDifficulty] = useState<FlashcardDifficulty>("intermediate")
  const [selectedTypes, setSelectedTypes] = useState<FlashcardType[]>([])
  const [subtopics, setSubtopics] = useState<string[]>([])
  const [newSubtopic, setNewSubtopic] = useState("")
  const [examFormat, setExamFormat] = useState<"multiple_choice" | "short_answer" | "essay">("multiple_choice")
  
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<ExamGradeFlashcard[] | null>(null)
  const [fileReadProgress, setFileReadProgress] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mistakeTracker = getMistakeTracker()
  
  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadedFile(file)
    setFileReadProgress("Reading file...")
    
    try {
      const content = await readFileContent(file)
      setTextContent(content)
      setFileReadProgress(`Loaded: ${file.name}`)
      setSourceType("file")
    } catch (error) {
      setFileReadProgress("Error reading file")
      toast.error("Failed to read file")
    }
  }
  
  // Toggle card type selection
  const toggleCardType = (type: FlashcardType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  // Add subtopic
  const addSubtopic = () => {
    if (newSubtopic.trim() && !subtopics.includes(newSubtopic.trim())) {
      setSubtopics([...subtopics, newSubtopic.trim()])
      setNewSubtopic("")
    }
  }
  
  // Remove subtopic
  const removeSubtopic = (subtopic: string) => {
    setSubtopics(subtopics.filter(s => s !== subtopic))
  }
  
  // Generate flashcards
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic")
      return
    }
    
    setGenerating(true)
    
    try {
      let result: ExamGradeFlashcard[]
      
      if (mode === "standard") {
        // Standard exam-grade generation
        const response = await generateExamGradeFlashcards({
          text: sourceType !== "topic" ? textContent : undefined,
          topic,
          num_cards: numCards,
          difficulty,
          use_memory: sourceType === "topic",
          user_mistakes: mistakeTracker.getMistakesByTopic(topic).map(m => m.question),
          force_card_types: selectedTypes.length === numCards ? selectedTypes : undefined,
        })
        result = response.flashcards
        
        toast.success(`Generated ${result.length} exam-grade flashcards`, {
          description: `Distribution: ${Object.entries(response.card_type_distribution)
            .map(([type, count]) => `${type}: ${count}`)
            .join(", ")}`
        })
        
      } else if (mode === "trap") {
        // TRAP card generation from mistakes
        const trapRequest = mistakeTracker.getMistakesForTrapGeneration(topic)
        
        if (!trapRequest) {
          toast.error("Not enough mistakes to generate TRAP cards", {
            description: "Keep studying and mark cards you struggle with"
          })
          setGenerating(false)
          return
        }
        
        const response = await generateTrapCards(trapRequest)
        result = response.flashcards
        mistakeTracker.markTrapCardsGenerated(topic)
        
        toast.success(`Generated ${result.length} TRAP cards`, {
          description: "Targeting your specific misconceptions"
        })
        
      } else {
        // Exam simulation
        if (subtopics.length === 0) {
          toast.error("Please add at least one subtopic for exam simulation")
          setGenerating(false)
          return
        }
        
        const response = await generateExamSimulation({
          topic,
          subtopics,
          exam_format: examFormat,
          num_cards: numCards,
        })
        result = response.flashcards
        
        toast.success(`Generated ${result.length} exam simulation cards`, {
          description: `Format: ${examFormat}, Covering ${subtopics.length} subtopics`
        })
      }
      
      // Show preview
      setPreview(result)
      
    } catch (error: any) {
      console.error("Generation error:", error)
      toast.error("Failed to generate flashcards", {
        description: error?.message || "Please try again"
      })
    } finally {
      setGenerating(false)
    }
  }
  
  // Save generated cards
  const handleSave = async () => {
    if (!preview) return
    
    try {
      await onGenerated(preview)
      toast.success(`Added ${preview.length} flashcards to deck`)
      onClose()
    } catch (error) {
      toast.error("Failed to save flashcards")
    }
  }
  
  // Regenerate
  const handleRegenerate = () => {
    setPreview(null)
    handleGenerate()
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card rounded-xl w-full max-w-2xl border border-border my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">AI Generate Flashcards</h2>
              <p className="text-sm text-muted-foreground">Exam-grade memory weapons</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!preview ? (
            <>
              {/* Generation Mode Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Generation Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMode("standard")}
                    className={cn(
                      "p-3 rounded-lg border text-sm text-center transition-all",
                      mode === "standard"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Sparkles className="w-5 h-5 mx-auto mb-1" />
                    Standard
                  </button>
                  <button
                    onClick={() => setMode("trap")}
                    className={cn(
                      "p-3 rounded-lg border text-sm text-center transition-all",
                      mode === "trap"
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : "border-border hover:border-red-500/50"
                    )}
                  >
                    <AlertTriangle className="w-5 h-5 mx-auto mb-1" />
                    TRAP Cards
                  </button>
                  <button
                    onClick={() => setMode("exam_sim")}
                    className={cn(
                      "p-3 rounded-lg border text-sm text-center transition-all",
                      mode === "exam_sim"
                        ? "border-pink-500 bg-pink-500/10 text-pink-400"
                        : "border-border hover:border-pink-500/50"
                    )}
                  >
                    <GraduationCap className="w-5 h-5 mx-auto mb-1" />
                    Exam Sim
                  </button>
                </div>
              </div>
              
              {/* Topic Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Topic *</label>
                <input
                  type="text"
                  placeholder="e.g., Photosynthesis, World War II, Calculus..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>
              
              {/* Source Selection (Standard mode only) */}
              {mode === "standard" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Content Source</label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      onClick={() => setSourceType("topic")}
                      className={cn(
                        "p-3 rounded-lg border text-sm text-center transition-all",
                        sourceType === "topic"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Sparkles className="w-4 h-4 mx-auto mb-1" />
                      Topic + Memory
                    </button>
                    <button
                      onClick={() => setSourceType("text")}
                      className={cn(
                        "p-3 rounded-lg border text-sm text-center transition-all",
                        sourceType === "text"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <FileText className="w-4 h-4 mx-auto mb-1" />
                      Paste Text
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "p-3 rounded-lg border text-sm text-center transition-all",
                        sourceType === "file"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Upload className="w-4 h-4 mx-auto mb-1" />
                      Upload File
                    </button>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.md,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {fileReadProgress && (
                    <p className="text-xs text-muted-foreground mb-2">{fileReadProgress}</p>
                  )}
                  
                  {(sourceType === "text" || sourceType === "file") && (
                    <textarea
                      placeholder="Paste your study material here..."
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border min-h-[120px] resize-none focus:border-primary outline-none"
                    />
                  )}
                </div>
              )}
              
              {/* Exam Simulation Options */}
              {mode === "exam_sim" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Exam Format</label>
                    <select
                      value={examFormat}
                      onChange={(e) => setExamFormat(e.target.value as typeof examFormat)}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subtopics to Cover *</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add a subtopic..."
                        value={newSubtopic}
                        onChange={(e) => setNewSubtopic(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSubtopic()}
                        className="flex-1 px-4 py-2 rounded-lg bg-background border border-border"
                      />
                      <Button onClick={addSubtopic} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subtopics.map((sub, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 rounded-full bg-slate-800 text-sm flex items-center gap-2"
                        >
                          {sub}
                          <button onClick={() => removeSubtopic(sub)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Card Type Selection (Standard mode) */}
              {mode === "standard" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Card Types (optional - leave empty for auto-balanced)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CARD_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = selectedTypes.includes(option.type)
                      return (
                        <button
                          key={option.type}
                          onClick={() => toggleCardType(option.type)}
                          className={cn(
                            "p-2 rounded-lg border text-xs text-left transition-all",
                            isSelected
                              ? `border-current ${option.color} bg-current/10`
                              : "border-border hover:border-slate-600"
                          )}
                        >
                          <Icon className={cn("w-4 h-4 mb-1", isSelected ? option.color : "")} />
                          <div className="font-medium">{option.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Difficulty & Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as FlashcardDifficulty)}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border"
                  >
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} - {opt.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Number of Cards</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numCards}
                    onChange={(e) => setNumCards(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-3 rounded-lg bg-background border border-border"
                  />
                </div>
              </div>
              
              {/* TRAP Card Info */}
              {mode === "trap" && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-red-400 mb-1">TRAP Card Generation</p>
                      <p className="text-slate-300">
                        TRAP cards are generated from your past mistakes and failures. 
                        They specifically target misconceptions to prevent future errors.
                      </p>
                      <p className="text-slate-400 mt-2">
                        Tracked mistakes for "{topic}": {mistakeTracker.getMistakesByTopic(topic).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Preview Section */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview ({preview.length} cards)</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleRegenerate}>
                    Regenerate
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {preview.map((card, i) => {
                  const typeConfig = CARD_TYPE_OPTIONS.find(t => t.type === card.type)
                  const TypeIcon = typeConfig?.icon || BookOpen
                  
                  return (
                    <div 
                      key={card.id}
                      className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">#{i + 1}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs flex items-center gap-1",
                          typeConfig?.color || "text-slate-400"
                        )}>
                          <TypeIcon className="w-3 h-3" />
                          {card.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 capitalize">
                          {card.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {card.exam_relevance}/10
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-100 mb-1">Q: {card.question}</p>
                      <p className="text-sm text-slate-400">A: {card.answer}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-border">
          {!preview ? (
            <Button 
              className="w-full" 
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate {numCards} Cards
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setPreview(null)}
              >
                Back to Edit
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSave}
              >
                <Check className="w-4 h-4 mr-2" />
                Save to Deck
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamGradeGenerator
