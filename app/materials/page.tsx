"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Search, Filter, BookOpen, FileText, ImageIcon } from "lucide-react"
import { useState } from "react"

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([
    { id: 1, title: "Calculus Chapter 5", type: "pdf", subject: "Math", date: "2024-01-15" },
    { id: 2, title: "Biology Notes", type: "text", subject: "Science", date: "2024-01-14" },
    { id: 3, title: "History Timeline", type: "image", subject: "History", date: "2024-01-13" },
  ])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Study Materials</h1>
          <p className="text-muted-foreground">Organize and access all your study materials in one place</p>
        </div>

        {/* Upload Section */}
        <div className="mb-12 p-8 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 text-center hover:bg-primary/10 transition-colors">
          <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Upload Study Materials</h3>
          <p className="text-muted-foreground mb-6">
            Drag and drop PDFs, images, or notes. AI will automatically organize them for you.
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Choose Files or Drag & Drop
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search materials..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:border-primary outline-none transition-colors"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Materials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {getTypeIcon(material.type)}
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{material.title}</h3>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="px-2 py-1 bg-muted rounded">{material.subject}</span>
                <span>{material.date}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full bg-transparent">
                View & Edit
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
