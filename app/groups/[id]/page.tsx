"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Send, Users, Settings, Plus, Search, Loader2, ArrowLeft } from "lucide-react"
import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getStudyGroup, subscribeToGroupMessages, sendGroupMessage, type StudyGroup, type GroupMessage } from "@/lib/firestore"

export default function GroupChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [group, setGroup] = useState<StudyGroup | null>(null)
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const groupData = await getStudyGroup(id)
          if (groupData) {
            setGroup(groupData)
          } else {
            router.push("/groups")
          }
        } catch (error) {
          console.error("Error loading group:", error)
          router.push("/groups")
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [id, router])

  // Subscribe to realtime messages
  useEffect(() => {
    if (!id) return
    
    const unsubscribe = subscribeToGroupMessages(id, (newMessages) => {
      setMessages(newMessages)
    })
    
    return () => unsubscribe()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !group) return
    
    setSending(true)
    try {
      await sendGroupMessage({
        groupId: id,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        content: newMessage.trim()
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
    setSending(false)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getAvatarEmoji = (name: string) => {
    const emojis = ["👤", "👩", "👨", "🧑", "👧", "🧔", "👱", "👴"]
    const index = name.charCodeAt(0) % emojis.length
    return emojis[index]
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user || !group) return null

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 h-[calc(100vh-60px)] flex gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.push("/groups")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {group.memberCount} members • {group.subject}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Users className="w-12 h-12 mb-4" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{getAvatarEmoji(message.userName)}</span>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-semibold ${message.userId === user.uid ? "text-primary" : "text-foreground"}`}>
                        {message.userId === user.uid ? "You" : message.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="text-foreground mt-1">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              disabled={sending}
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={sending || !newMessage.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar - Group Info */}
        <div className="hidden lg:flex w-64 flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              Group Info
            </h3>
          </div>

          {/* Group Details */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Subject</p>
              <p className="font-medium text-foreground">{group.subject}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="font-medium text-foreground">{group.memberCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium text-foreground">{group.createdAt.toLocaleDateString()}</p>
            </div>
            {group.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-foreground">{group.description}</p>
              </div>
            )}
          </div>

          {/* Invite */}
          <div className="p-4 border-t border-border">
            <Button size="sm" variant="outline" className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
