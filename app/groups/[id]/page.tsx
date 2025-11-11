"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Send, Users, Settings, Plus, Search } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface Message {
  id: number
  author: string
  content: string
  timestamp: string
  avatar: string
}

export default function GroupChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      author: "Sarah",
      content: "Hey everyone! Did anyone solve problem 5 from the homework?",
      timestamp: "2:30 PM",
      avatar: "👩",
    },
    {
      id: 2,
      author: "Alex",
      content: "I got 42 as the answer. Used the chain rule approach.",
      timestamp: "2:35 PM",
      avatar: "👨",
    },
    {
      id: 3,
      author: "Jordan",
      content: "Oh great! Can you walk through the steps?",
      timestamp: "2:40 PM",
      avatar: "🧑",
    },
  ])

  const [newMessage, setNewMessage] = useState("")
  const [members, setMembers] = useState([
    { id: 1, name: "You", role: "Member", avatar: "👤" },
    { id: 2, name: "Sarah", role: "Admin", avatar: "👩" },
    { id: 3, name: "Alex", role: "Member", avatar: "👨" },
    { id: 4, name: "Jordan", role: "Moderator", avatar: "🧑" },
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        author: "You",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        avatar: "👤",
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 h-[calc(100vh-60px)] flex gap-6">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-border overflow-hidden bg-card">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Advanced Calculus</h2>
              <p className="text-sm text-muted-foreground">24 members online</p>
            </div>
            <Button size="sm" variant="outline">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{message.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-foreground">{message.author}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-foreground mt-1">{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSendMessage()
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
            />
            <Button onClick={handleSendMessage} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar - Members */}
        <div className="hidden lg:flex w-64 flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <Users className="w-4 h-4" />
              Members
            </h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm rounded bg-background border border-border focus:border-primary outline-none transition-colors"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {members.map((member) => (
              <div key={member.id} className="p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{member.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.role}</p>
                  </div>
                  {member.role === "Admin" && <span className="w-2 h-2 bg-primary rounded-full" />}
                </div>
              </div>
            ))}
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
