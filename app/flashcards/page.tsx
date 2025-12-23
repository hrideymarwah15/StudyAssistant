"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Plus, RotateCcw, Loader2, X, Trash2, Sparkles, Wand2, Upload, FileText } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getFlashcardDecks, createFlashcardDeck, getFlashcards, addFlashcard, getMaterials, type FlashcardDeck, type Flashcard, type Material } from "@/lib/firestore"
import { generateFlashcards } from "@/lib/ai-client"
import { readFileContent } from "@/lib/gemini"

export default function FlashcardsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null)
  const [cards, setCards] = useState<Flashcard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showCreateDeck, setShowCreateDeck] = useState(false)
  const [showAddCard, setShowAddCard] = useState(false)
  const [showAIGenerate, setShowAIGenerate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [newDeck, setNewDeck] = useState({ name: "", subject: "" })
  const [newCard, setNewCard] = useState({ front: "", back: "", difficulty: "medium" as "easy" | "medium" | "hard" })
  const [aiConfig, setAiConfig] = useState({ 
    topic: "", 
    count: 5, 
    difficulty: "medium" as "easy" | "medium" | "hard",
    sourceType: "topic" as "topic" | "file" | "material" | "text",
    sourceContent: "",
    selectedMaterialId: ""
  })
  const [materials, setMaterials] = useState<Material[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileReadProgress, setFileReadProgress] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const userDecks = await getFlashcardDecks(currentUser.uid)
          setDecks(userDecks)
          // Also load materials for AI generation source
          const userMaterials = await getMaterials(currentUser.uid)
          setMaterials(userMaterials)
        } catch (error) {
          console.error("Error loading decks:", error)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleSelectDeck = async (deck: FlashcardDeck) => {
    setSelectedDeck(deck)
    const deckCards = await getFlashcards(deck.id)
    setCards(deckCards)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const handleCreateDeck = async () => {
    if (!user || !newDeck.name || !newDeck.subject) return
    setCreating(true)
    try {
      await createFlashcardDeck({
        name: newDeck.name,
        subject: newDeck.subject,
        userId: user.uid
      })
      const updatedDecks = await getFlashcardDecks(user.uid)
      setDecks(updatedDecks)
      setShowCreateDeck(false)
      setNewDeck({ name: "", subject: "" })
    } catch (error: any) {
      console.error("Error creating deck:", error)
      alert("Error creating deck: " + (error?.message || "Unknown error"))
    } finally {
      setCreating(false)
    }
  }

  const handleAddCard = async () => {
    if (!user || !selectedDeck || !newCard.front || !newCard.back) return
    try {
      await addFlashcard({
        front: newCard.front,
        back: newCard.back,
        difficulty: newCard.difficulty,
        deckId: selectedDeck.id,
        userId: user.uid
      })
      const updatedCards = await getFlashcards(selectedDeck.id)
      setCards(updatedCards)
      setShowAddCard(false)
      setNewCard({ front: "", back: "", difficulty: "medium" })
    } catch (error) {
      console.error("Error adding card:", error)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const fileArray = Array.from(files)
    setUploadedFiles(fileArray)
    setFileReadProgress("Reading files...")
    
    try {
      // Read all files and combine their content
      let combinedContent = ""
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        setFileReadProgress(`Reading file ${i + 1}/${fileArray.length}: ${file.name}`)
        const content = await readFileContent(file)
        combinedContent += `\n\n--- Content from: ${file.name} ---\n\n${content}`
      }
      
      setAiConfig(prev => ({ ...prev, sourceContent: combinedContent.trim(), sourceType: "file" }))
      setFileReadProgress(`${fileArray.length} file(s) loaded successfully`)
    } catch (error) {
      console.error("Error reading files:", error)
      setFileReadProgress("Error reading files")
      alert("Failed to read file content")
    }
  }

  // AI Flashcard Generation using Gemini
  const generateAIFlashcards = async () => {
    if (!user || !selectedDeck) return
    
    // Validate based on source type
    if (aiConfig.sourceType === "topic" && !aiConfig.topic) {
      alert("Please enter a topic")
      return
    }
    if (aiConfig.sourceType === "text" && !aiConfig.sourceContent) {
      alert("Please enter some text content")
      return
    }
    if (aiConfig.sourceType === "file" && uploadedFiles.length === 0) {
      alert("Please upload at least one file")
      return
    }
    if (aiConfig.sourceType === "file" && !aiConfig.sourceContent) {
      alert("Files are still being processed. Please wait.")
      return
    }
    
    setGenerating(true)
    try {
      let generatedCards: { front: string; back: string }[]
      
      // Determine content source - prioritize file content
      const content = (aiConfig.sourceType === "text" || aiConfig.sourceType === "file") 
        ? aiConfig.sourceContent 
        : ""
      
      // Get topic from input or file names
      const topic = aiConfig.topic || 
        (uploadedFiles.length > 0 
          ? uploadedFiles.map(f => f.name.replace(/\.[^/.]+$/, "")).join(", ") 
          : "Study Material")
      
      console.log("Generating flashcards with content length:", content.length)
      console.log("Topic:", topic)
      
      // Use unified AI client (Groq + Gemini fallback)
      generatedCards = await generateFlashcards(
        content,
        topic,
        aiConfig.count,
        aiConfig.difficulty
      )
      
      // Add all generated cards to the deck
      for (const card of generatedCards) {
        await addFlashcard({
          front: card.front,
          back: card.back,
          difficulty: aiConfig.difficulty,
          deckId: selectedDeck.id,
          userId: user.uid
        })
      }
      
      // Refresh cards
      const updatedCards = await getFlashcards(selectedDeck.id)
      setCards(updatedCards)
      
      // Update deck in decks list
      const updatedDecks = await getFlashcardDecks(user.uid)
      setDecks(updatedDecks)
      
      setShowAIGenerate(false)
      resetAiConfig()
      alert(`Successfully generated ${generatedCards.length} flashcards with Gemini AI!`)
    } catch (error: any) {
      console.error("Error generating flashcards:", error)
      alert("Error generating flashcards: " + (error?.message || "Unknown error"))
    } finally {
      setGenerating(false)
    }
  }

  const resetAiConfig = () => {
    setAiConfig({ 
      topic: "", 
      count: 5, 
      difficulty: "medium",
      sourceType: "topic",
      sourceContent: "",
      selectedMaterialId: ""
    })
    setUploadedFiles([])
    setFileReadProgress("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Fallback smart flashcard generator (used when Gemini fails)
  const generateSmartFlashcards = (topic: string, count: number, difficulty: "easy" | "medium" | "hard") => {
    const topicLower = topic.toLowerCase()
    const cards: { front: string; back: string }[] = []
    
    // Template-based generation system
    const templates = {
      definition: [
        { front: `What is ${topic}?`, back: `${topic} is a concept/subject that involves understanding and applying related principles and knowledge.` },
        { front: `Define ${topic} in your own words`, back: `${topic} can be defined as the study and practice of its core principles, methods, and applications.` },
        { front: `What are the key characteristics of ${topic}?`, back: `Key characteristics include: foundational concepts, practical applications, and theoretical frameworks.` }
      ],
      concepts: [
        { front: `What are the main components of ${topic}?`, back: `The main components include: core elements, supporting structures, and interconnected systems.` },
        { front: `Explain the fundamental principles of ${topic}`, back: `Fundamental principles include systematic approaches, logical reasoning, and evidence-based methods.` },
        { front: `What is the purpose of studying ${topic}?`, back: `Studying ${topic} helps develop understanding, critical thinking, and practical skills in the subject area.` }
      ],
      application: [
        { front: `How is ${topic} applied in real life?`, back: `${topic} is applied in various fields including education, industry, research, and everyday problem-solving.` },
        { front: `Give an example of ${topic} in practice`, back: `A practical example involves using ${topic} principles to solve problems, make decisions, or create solutions.` },
        { front: `What problems can ${topic} help solve?`, back: `${topic} can help address challenges related to analysis, optimization, design, and understanding complex systems.` }
      ],
      analysis: [
        { front: `Compare and contrast aspects of ${topic}`, back: `Different aspects share common foundations but vary in application, complexity, and scope.` },
        { front: `What are the advantages of ${topic}?`, back: `Advantages include improved understanding, better problem-solving abilities, and practical skill development.` },
        { front: `What challenges exist in ${topic}?`, back: `Common challenges include complexity, requiring prerequisite knowledge, and practical implementation difficulties.` }
      ],
      review: [
        { front: `Summarize the key points of ${topic}`, back: `Key points: definitions, principles, applications, examples, and interconnections with other concepts.` },
        { front: `What should you remember about ${topic}?`, back: `Remember the core definitions, main principles, practical applications, and common examples.` },
        { front: `How does ${topic} connect to other subjects?`, back: `${topic} connects through shared principles, complementary skills, and interdisciplinary applications.` }
      ]
    }

    // Subject-specific enhancements
    const subjectTemplates: { [key: string]: { front: string; back: string }[] } = {
      math: [
        { front: "What is a derivative?", back: "A derivative measures the rate of change of a function with respect to a variable. It represents the slope of the tangent line at any point." },
        { front: "What is the quadratic formula?", back: "x = (-b ± √(b²-4ac)) / 2a, used to solve equations of the form ax² + bx + c = 0" },
        { front: "What is the Pythagorean theorem?", back: "In a right triangle, a² + b² = c², where c is the hypotenuse." },
        { front: "What is a limit in calculus?", back: "A limit describes the value a function approaches as the input approaches some value." },
        { front: "What is integration?", back: "Integration is the reverse of differentiation, used to find areas under curves and accumulation of quantities." }
      ],
      physics: [
        { front: "What is Newton's First Law?", back: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force." },
        { front: "What is the formula for force?", back: "F = ma (Force equals mass times acceleration)" },
        { front: "What is kinetic energy?", back: "KE = ½mv² - the energy an object possesses due to its motion." },
        { front: "What is potential energy?", back: "Energy stored in an object due to its position or configuration (e.g., gravitational PE = mgh)" },
        { front: "What is the speed of light?", back: "Approximately 3 × 10⁸ m/s (299,792,458 meters per second)" }
      ],
      chemistry: [
        { front: "What is an atom?", back: "The smallest unit of matter that retains the properties of an element, consisting of protons, neutrons, and electrons." },
        { front: "What is the periodic table?", back: "A tabular arrangement of chemical elements organized by atomic number, electron configuration, and recurring properties." },
        { front: "What is a covalent bond?", back: "A chemical bond formed by sharing electrons between atoms." },
        { front: "What is pH?", back: "A scale measuring acidity/basicity from 0-14, where 7 is neutral, below 7 is acidic, and above 7 is basic." },
        { front: "What is Avogadro's number?", back: "6.022 × 10²³ - the number of particles in one mole of a substance." }
      ],
      biology: [
        { front: "What is DNA?", back: "Deoxyribonucleic acid - a molecule carrying genetic instructions for development, functioning, and reproduction of organisms." },
        { front: "What is photosynthesis?", back: "The process by which plants convert light energy, water, and CO₂ into glucose and oxygen: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂" },
        { front: "What is mitosis?", back: "Cell division resulting in two identical daughter cells with the same number of chromosomes as the parent cell." },
        { front: "What is the cell membrane?", back: "A semipermeable lipid bilayer that surrounds cells, controlling what enters and exits." },
        { front: "What is evolution?", back: "The process of change in living organisms over generations through natural selection and genetic variation." }
      ],
      history: [
        { front: "When did World War II end?", back: "1945 - with Germany surrendering in May and Japan in September after atomic bombs on Hiroshima and Nagasaki." },
        { front: "What was the Renaissance?", back: "A cultural movement (14th-17th century) marking the transition from medieval to modern times, emphasizing art, science, and humanism." },
        { front: "What was the Industrial Revolution?", back: "A period of major industrialization (1760-1840) transitioning from hand production to machine manufacturing." },
        { front: "When was the Declaration of Independence signed?", back: "July 4, 1776 - declaring American independence from British rule." },
        { front: "What was the Cold War?", back: "A period of geopolitical tension (1947-1991) between the USA and USSR, characterized by political conflict without direct military engagement." }
      ],
      programming: [
        { front: "What is a variable?", back: "A named storage location in memory that holds a value which can change during program execution." },
        { front: "What is a function?", back: "A reusable block of code that performs a specific task and can accept inputs (parameters) and return outputs." },
        { front: "What is an array?", back: "A data structure that stores a collection of elements of the same type in contiguous memory locations." },
        { front: "What is Object-Oriented Programming?", back: "A programming paradigm based on objects containing data (attributes) and code (methods), with principles like encapsulation, inheritance, and polymorphism." },
        { front: "What is an algorithm?", back: "A step-by-step procedure or formula for solving a problem or completing a task." }
      ]
    }

    // Check if topic matches any subject-specific templates
    for (const [subject, subjectCards] of Object.entries(subjectTemplates)) {
      if (topicLower.includes(subject) || subject.includes(topicLower)) {
        const selectedCards = subjectCards.slice(0, count)
        return selectedCards
      }
    }

    // Generate from general templates
    const allTemplates = [...templates.definition, ...templates.concepts, ...templates.application, ...templates.analysis, ...templates.review]
    
    // Shuffle and select
    const shuffled = allTemplates.sort(() => Math.random() - 0.5)
    
    // Add difficulty-based variations
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
      let card = { ...shuffled[i] }
      
      if (difficulty === "hard") {
        card.front = card.front.replace("What is", "Explain in detail")
        card.front = card.front.replace("Define", "Critically analyze and define")
      } else if (difficulty === "easy") {
        card.back = card.back.split('.')[0] + "."  // Shorter answers for easy
      }
      
      cards.push(card)
    }

    return cards
  }

  const nextCard = () => {
    setCurrentIndex((currentIndex + 1) % cards.length)
    setIsFlipped(false)
  }

  const prevCard = () => {
    setCurrentIndex(currentIndex === 0 ? cards.length - 1 : currentIndex - 1)
    setIsFlipped(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Flashcards</h1>
          <p className="text-muted-foreground">Study with flashcards</p>
        </div>

        {!selectedDeck ? (
          <>
            {/* Deck List */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleSelectDeck(deck)}
                  className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-foreground mb-2">{deck.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{deck.subject}</p>
                  <p className="text-xs text-primary">{deck.cardCount} cards</p>
                </div>
              ))}
            </div>

            {/* Create New Deck */}
            <div className="p-8 rounded-lg bg-muted border border-border text-center">
              <Plus className="w-8 h-8 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Create New Deck</h3>
              <p className="text-muted-foreground mb-6">Create a new flashcard deck</p>
              <Button onClick={() => setShowCreateDeck(true)}>Create Deck</Button>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <Button variant="outline" onClick={() => setSelectedDeck(null)} className="mb-6">
              ← Back to Decks
            </Button>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-foreground">{selectedDeck.name}</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAIGenerate(true)} className="border-primary/50 text-primary hover:bg-primary/10">
                  <Sparkles className="w-4 h-4 mr-2" /> AI Generate
                </Button>
                <Button onClick={() => setShowAddCard(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Card
                </Button>
              </div>
            </div>

            {cards.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">No cards in this deck yet</p>
                <Button onClick={() => setShowAddCard(true)}>Add First Card</Button>
              </div>
            ) : (
              <>
                {/* Flashcard Display */}
                <div className="mb-12">
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="min-h-80 max-h-[500px] rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 cursor-pointer flex items-center justify-center p-8 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="text-center w-full max-w-3xl">
                      <p className="text-sm text-muted-foreground mb-4">
                        {isFlipped ? "Answer" : "Question"} ({currentIndex + 1}/{cards.length})
                      </p>
                      <div className="max-h-60 overflow-y-auto px-4">
                        <p className="text-xl md:text-2xl lg:text-3xl font-serif font-bold text-foreground leading-relaxed">
                          {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-6">Click to flip</p>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={prevCard}>Previous</Button>
                  <Button onClick={nextCard}>Next</Button>
                  <Button variant="outline" onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Create Deck Modal */}
      {showCreateDeck && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Create Deck</h2>
              <button onClick={() => setShowCreateDeck(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Deck Name"
                value={newDeck.name}
                onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border"
              />
              <input
                type="text"
                placeholder="Subject"
                value={newDeck.subject}
                onChange={(e) => setNewDeck({ ...newDeck, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border"
              />
              <Button className="w-full" onClick={handleCreateDeck} disabled={creating || !newDeck.name || !newDeck.subject}>
                {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal */}
      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Add Card</h2>
              <button onClick={() => setShowAddCard(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <textarea
                placeholder="Question (Front)"
                value={newCard.front}
                onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border resize-none"
                rows={3}
              />
              <textarea
                placeholder="Answer (Back)"
                value={newCard.back}
                onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border resize-none"
                rows={3}
              />
              <select
                value={newCard.difficulty}
                onChange={(e) => setNewCard({ ...newCard, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                className="w-full px-4 py-2 rounded-lg bg-background border border-border"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <Button className="w-full" onClick={handleAddCard}>Add Card</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAIGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl p-6 w-full max-w-lg border border-border my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                AI Generate Flashcards
              </h2>
              <button onClick={() => { setShowAIGenerate(false); resetAiConfig(); }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Source Type Selection */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Generate from:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, sourceType: "topic", sourceContent: "" })}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      aiConfig.sourceType === "topic" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 mb-1" />
                    Topic Only
                  </button>
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, sourceType: "file" })}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      aiConfig.sourceType === "file" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, sourceType: "text" })}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      aiConfig.sourceType === "text" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-1" />
                    Paste Text
                  </button>
                  <button
                    onClick={() => setAiConfig({ ...aiConfig, sourceType: "material" })}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                      aiConfig.sourceType === "material" 
                        ? "border-primary bg-primary/10 text-primary" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <FileText className="w-4 h-4 mb-1" />
                    My Materials
                  </button>
                </div>
              </div>

              {/* Topic Input */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  {aiConfig.sourceType === "topic" ? "Topic / Subject *" : "Topic / Subject (optional)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g., Biology, Calculus, World War II..."
                  value={aiConfig.topic}
                  onChange={(e) => setAiConfig({ ...aiConfig, topic: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>

              {/* File Upload */}
              {aiConfig.sourceType === "file" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Upload Source Files</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.md,.csv,.pdf,.doc,.docx,.rtf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer text-center transition-all"
                  >
                    {uploadedFiles.length > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2 text-primary">
                          <FileText className="w-5 h-5" />
                          <span className="font-medium">{uploadedFiles.length} file(s) selected</span>
                        </div>
                        <div className="text-xs text-muted-foreground max-h-16 overflow-y-auto">
                          {uploadedFiles.map((f, i) => (
                            <div key={i}>{f.name}</div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload multiple files</p>
                        <p className="text-xs text-muted-foreground">PDF, Word, TXT, MD supported</p>
                      </>
                    )}
                  </div>
                  {fileReadProgress && (
                    <p className={`text-xs mt-1 ${fileReadProgress.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                      {fileReadProgress}
                    </p>
                  )}
                  {aiConfig.sourceContent && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">
                        Content loaded: {aiConfig.sourceContent.length.toLocaleString()} characters
                      </p>
                      {aiConfig.sourceContent.length > 500000 && (
                        <p className="text-xs text-yellow-500">
                          ⚠️ Large content will be truncated to fit AI limits (~500k chars max)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              {aiConfig.sourceType === "text" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Paste Study Content</label>
                  <textarea
                    placeholder="Paste your notes, textbook content, or any study material here..."
                    value={aiConfig.sourceContent}
                    onChange={(e) => setAiConfig({ ...aiConfig, sourceContent: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none resize-none"
                    rows={5}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {aiConfig.sourceContent.length.toLocaleString()} characters
                    {aiConfig.sourceContent.length > 500000 && (
                      <span className="text-yellow-500 ml-2">⚠️ Will be truncated</span>
                    )}
                  </p>
                </div>
              )}

              {/* Material Selection */}
              {aiConfig.sourceType === "material" && (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Select from Materials</label>
                  {materials.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center border border-dashed border-border rounded-lg">
                      No materials found. Upload materials first in the Materials section.
                    </p>
                  ) : (
                    <select
                      value={aiConfig.selectedMaterialId}
                      onChange={(e) => setAiConfig({ ...aiConfig, selectedMaterialId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                    >
                      <option value="">Select a material...</option>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.title} ({m.subject})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Number of Cards */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Number of Cards</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiConfig.count}
                  onChange={(e) => setAiConfig({ ...aiConfig, count: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Difficulty Level</label>
                <select
                  value={aiConfig.difficulty}
                  onChange={(e) => setAiConfig({ ...aiConfig, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                >
                  <option value="easy">Easy - Simple, concise answers</option>
                  <option value="medium">Medium - Balanced questions</option>
                  <option value="hard">Hard - In-depth analysis</option>
                </select>
              </div>

              {/* Gemini API Notice */}
              <p className="text-xs text-muted-foreground text-center">
                Powered by Google Gemini AI
              </p>

              <Button 
                className="w-full bg-gradient-to-r from-primary to-purple-600" 
                onClick={generateAIFlashcards}
                disabled={generating || (aiConfig.sourceType === "topic" && !aiConfig.topic)}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Generate Flashcards
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
