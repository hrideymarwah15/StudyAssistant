"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Users, Plus, Search, BookOpen, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function GroupsPage() {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: "Advanced Calculus",
      subject: "Math",
      members: 24,
      description: "Preparing for calculus exams",
      lastMessage: "Great discussion on derivatives!",
    },
    {
      id: 2,
      name: "Biology Study Circle",
      subject: "Science",
      members: 18,
      description: "Collaborative biology learning",
      lastMessage: "Anyone free for study session tomorrow?",
    },
    {
      id: 3,
      name: "History Buffs",
      subject: "History",
      members: 12,
      description: "World history study group",
      lastMessage: "Check out this timeline resource",
    },
    {
      id: 4,
      name: "Spanish Conversación",
      subject: "Language",
      members: 15,
      description: "Spanish speaking practice",
      lastMessage: "¿Cómo estás todos?",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Study Groups</h1>
            <p className="text-muted-foreground">Join or create study groups and collaborate with peers</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search study groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border focus:border-primary outline-none transition-colors"
          />
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredGroups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`}>
              <div className="h-full p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                    {group.subject}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{group.name}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{group.description}</p>

                {/* Last Message Preview */}
                <div className="p-3 rounded-lg bg-muted/50 mb-4 border-l-2 border-primary">
                  <div className="flex gap-2 items-start">
                    <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground line-clamp-2">{group.lastMessage}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    <span>{group.members} members</span>
                  </div>
                  <Button size="sm">Join</Button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No groups found matching your search.</p>
            <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">Create First Group</Button>
          </div>
        )}
      </div>
    </main>
  )
}
