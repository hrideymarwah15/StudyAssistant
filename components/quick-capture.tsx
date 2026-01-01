"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Zap, Calendar, Target, Book } from "lucide-react"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useAuth } from "@/lib/hooks/useAuth"
import { useToast } from "@/lib/hooks/useToast"

type CaptureType = "task" | "note" | "idea" | "reminder"

export function QuickCapture() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<CaptureType>("task")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open quick capture
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen(true)
      }
      
      // ESC to close
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return

    setLoading(true)

    try {
      if (type === "task") {
        await addDoc(collection(db, "tasks"), {
          userId: user.uid,
          title: title.trim(),
          description: description.trim(),
          completed: false,
          priority: "medium",
          status: "pending",
          createdAt: serverTimestamp(),
          dueDate: null,
          course: "Quick Capture"
        })
      } else if (type === "note") {
        await addDoc(collection(db, "materials"), {
          userId: user.uid,
          title: title.trim(),
          content: description.trim(),
          type: "note",
          tags: ["quick-capture"],
          createdAt: serverTimestamp()
        })
      } else if (type === "idea") {
        await addDoc(collection(db, "ideas"), {
          userId: user.uid,
          title: title.trim(),
          description: description.trim(),
          createdAt: serverTimestamp(),
          status: "new"
        })
      } else if (type === "reminder") {
        await addDoc(collection(db, "reminders"), {
          userId: user.uid,
          title: title.trim(),
          description: description.trim(),
          createdAt: serverTimestamp(),
          completed: false
        })
      }

      toast({
        title: "Captured!",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully.`
      })

      setTitle("")
      setDescription("")
      setOpen(false)
    } catch (error) {
      console.error("Error saving:", error)
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
        aria-label="Quick Capture"
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-500" />
              Quick Capture
              <Badge variant="outline" className="text-xs">⌘K</Badge>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Selector */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("task")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  type === "task"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-background border-border hover:border-blue-500"
                }`}
              >
                <Target className="w-4 h-4 inline mr-1" />
                Task
              </button>
              <button
                type="button"
                onClick={() => setType("note")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  type === "note"
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-background border-border hover:border-green-500"
                }`}
              >
                <Book className="w-4 h-4 inline mr-1" />
                Note
              </button>
              <button
                type="button"
                onClick={() => setType("idea")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  type === "idea"
                    ? "bg-purple-500 text-white border-purple-500"
                    : "bg-background border-border hover:border-purple-500"
                }`}
              >
                <Zap className="w-4 h-4 inline mr-1" />
                Idea
              </button>
              <button
                type="button"
                onClick={() => setType("reminder")}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  type === "reminder"
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-background border-border hover:border-orange-500"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-1" />
                Reminder
              </button>
            </div>

            {/* Title Input */}
            <div>
              <Input
                ref={inputRef}
                placeholder={`What's on your mind?`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Textarea
                placeholder="Add more details (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? "Saving..." : "Capture"}
              </Button>
            </div>
          </form>

          {/* Quick Tips */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>💡 <strong>Pro tip:</strong> Press ⌘K anywhere to quickly capture your thoughts</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
