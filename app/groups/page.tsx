"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Users, Plus, Search, BookOpen, MessageSquare, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getStudyGroups, createStudyGroup, joinGroup, type StudyGroup } from "@/lib/firestore"

export default function GroupsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroup, setNewGroup] = useState({ name: "", subject: "", description: "" })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const studyGroups = await getStudyGroups()
          setGroups(studyGroups)
        } catch (error) {
          console.error("Error loading groups:", error)
        }
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name || !newGroup.subject) return
    setCreating(true)
    try {
      await createStudyGroup({
        name: newGroup.name,
        subject: newGroup.subject,
        description: newGroup.description,
        members: [user.uid],
        createdBy: user.uid
      })
      const updatedGroups = await getStudyGroups()
      setGroups(updatedGroups)
      setShowCreateModal(false)
      setNewGroup({ name: "", subject: "", description: "" })
    } catch (error) {
      console.error("Error creating group:", error)
      alert("Failed to create group. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return
    try {
      await joinGroup(groupId, user.uid)
      const updatedGroups = await getStudyGroups()
      setGroups(updatedGroups)
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Study Groups</h1>
            <p className="text-muted-foreground">Join or create study groups and collaborate with peers</p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setShowCreateModal(true)}
          >
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
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No groups yet</h3>
            <p className="text-muted-foreground mb-4">Create the first study group!</p>
            <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredGroups.map((group) => (
              <div key={group.id} className="h-full p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all">
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    <span>{group.memberCount} members</span>
                  </div>
                  {group.members.includes(user.uid) ? (
                    <Link href={`/groups/${group.id}`}>
                      <Button size="sm">Open Chat</Button>
                    </Link>
                  ) : (
                    <Button size="sm" onClick={() => handleJoinGroup(group.id)}>Join</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">Create Study Group</h2>
              <button onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Group Name</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                  placeholder="e.g., Advanced Calculus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                <input
                  type="text"
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none"
                  placeholder="e.g., Math"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none resize-none"
                  rows={3}
                  placeholder="What's this group about?"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateGroup}
                disabled={creating || !newGroup.name || !newGroup.subject}
              >
                {creating ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
