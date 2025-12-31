"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Users, MessageCircle, Calendar, Trophy, Plus, Search, UserPlus, Crown, Target } from "lucide-react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getStudyGroups, createStudyGroup, joinGroup, type StudyGroup, type GroupMember } from "@/lib/firestore"

interface StudyGroupsProps {
  className?: string
}

export function StudyGroups({ className = "" }: StudyGroupsProps) {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    subject: "",
    maxMembers: 10,
    isPrivate: false
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const allGroups = await getStudyGroups()
          setGroups(allGroups)
        } catch (error) {
          console.error("Error loading study groups:", error)
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleCreateGroup = async () => {
    if (!user || !newGroup.name.trim()) return

    try {
      await createStudyGroup({
        name: newGroup.name.trim(),
        description: newGroup.description.trim(),
        subject: newGroup.subject.trim(),
        maxMembers: newGroup.maxMembers,
        isPrivate: newGroup.isPrivate,
        createdBy: user.uid,
        members: [{
          userId: user.uid,
          displayName: user.displayName || user.email || "Anonymous",
          email: user.email || "",
          role: "admin",
          joinedAt: new Date(),
          avatarUrl: user.photoURL || ""
        }]
      })

      // Refresh groups
      const allGroups = await getStudyGroups()
      setGroups(allGroups)

      // Reset form
      setNewGroup({
        name: "",
        description: "",
        subject: "",
        maxMembers: 10,
        isPrivate: false
      })
      setShowCreateGroup(false)
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user) return

    try {
      await joinGroup(groupId, {
        userId: user.uid,
        displayName: user.displayName || user.email || "Anonymous",
        email: user.email || "",
        role: "member",
        joinedAt: new Date(),
        avatarUrl: user.photoURL || ""
      })

      // Refresh groups
      const allGroups = await getStudyGroups()
      setGroups(allGroups)
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const myGroups = filteredGroups.filter(group =>
    group.members.some(member => member.userId === user?.uid)
  )

  const availableGroups = filteredGroups.filter(group =>
    !group.members.some(member => member.userId === user?.uid) &&
    !group.isPrivate
  )

  // Calculate total counts for tab labels (not filtered by search)
  const totalMyGroups = groups.filter(group =>
    group.members.some(member => member.userId === user?.uid)
  )

  const totalAvailableGroups = groups.filter(group =>
    !group.members.some(member => member.userId === user?.uid) &&
    !group.isPrivate
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Study Groups
          </h2>
          <p className="text-muted-foreground">Collaborate and learn with peers</p>
        </div>

        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Calculus Study Group"
                />
              </div>
              <div>
                <Label htmlFor="group-subject">Subject</Label>
                <Input
                  id="group-subject"
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="group-description">Description</Label>
                <Textarea
                  id="group-description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your study group..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="max-members">Max Members</Label>
                <Input
                  id="max-members"
                  type="number"
                  value={newGroup.maxMembers}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 10 }))}
                  min={2}
                  max={50}
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="my-groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-groups">My Groups ({totalMyGroups.length})</TabsTrigger>
          <TabsTrigger value="available">Available Groups ({totalAvailableGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-4">
          {myGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Join existing groups or create your own to start collaborating with peers.
                </p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group) => (
                <GroupCard key={group.id} group={group} user={user} isMember={true} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availableGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Search className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No available groups</h3>
                <p className="text-muted-foreground text-center">
                  Be the first to create a study group in your subject area!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  user={user}
                  isMember={false}
                  onJoin={() => handleJoinGroup(group.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface GroupCardProps {
  group: StudyGroup
  user: User | null
  isMember: boolean
  onJoin?: () => void
}

function GroupCard({ group, user, isMember, onJoin }: GroupCardProps) {
  const userRole = group.members.find(m => m.userId === user?.uid)?.role

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <Badge variant="secondary" className="mt-1">{group.subject}</Badge>
          </div>
          {userRole === 'admin' && (
            <Crown className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {group.description}
        </p>

        {/* Members */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {group.members.length}/{group.maxMembers} members
            </span>
          </div>
          <div className="flex -space-x-2">
            {group.members.slice(0, 3).map((member, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-background">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {member.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
            {group.members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{group.members.length - 3}</span>
              </div>
            )}
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <MessageCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <span className="text-xs text-muted-foreground">Discussions</span>
          </div>
          <div>
            <Calendar className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <span className="text-xs text-muted-foreground">Sessions</span>
          </div>
          <div>
            <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Goals</span>
          </div>
        </div>

        {/* Action Button */}
        {isMember ? (
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 mr-2" />
            Open Group
          </Button>
        ) : group.members.length >= (group.maxMembers || 10) ? (
          <Button disabled className="w-full">
            <Users className="w-4 h-4 mr-2" />
            Group Full
          </Button>
        ) : (
          <Button onClick={onJoin} className="w-full">
            <UserPlus className="w-4 h-4 mr-2" />
            Join Group
          </Button>
        )}
      </CardContent>
    </Card>
  )
}