"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Plus, RotateCcw } from "lucide-react"
import { useState } from "react"

export default function FlashcardsPage() {
  const [cards, setCards] = useState([
    { id: 1, front: "What is the Pythagorean theorem?", back: "a² + b² = c²", difficulty: "medium" },
    {
      id: 2,
      front: "What is photosynthesis?",
      back: "Process where plants convert light into chemical energy",
      difficulty: "easy",
    },
  ])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const nextCard = () => {
    setCurrentIndex((currentIndex + 1) % cards.length)
    setIsFlipped(false)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Flashcards</h1>
          <p className="text-muted-foreground">Study with AI-generated flashcards</p>
        </div>

        {/* Flashcard Display */}
        <div className="mb-12">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="h-80 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary/30 cursor-pointer flex items-center justify-center p-8 hover:shadow-lg transition-all transform hover:scale-105"
          >
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {isFlipped ? "Answer" : "Question"} ({currentIndex + 1}/{cards.length})
              </p>
              <p className="text-2xl md:text-4xl font-serif font-bold text-foreground">
                {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
              </p>
              <p className="text-xs text-muted-foreground mt-6">Click to flip</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}>
            Previous
          </Button>
          <Button onClick={nextCard}>Next</Button>
          <Button variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Create New */}
        <div className="mt-16 p-8 rounded-lg bg-muted border border-border text-center">
          <Plus className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Create New Deck</h3>
          <p className="text-muted-foreground mb-6">Generate flashcards from your study materials</p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Deck</Button>
        </div>
      </div>
    </main>
  )
}
