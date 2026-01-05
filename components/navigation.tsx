"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          <span className="font-serif text-xl font-bold text-slate-100">StudyPal</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-100 transition">
            Dashboard
          </Link>
          <Link href="/materials" className="text-slate-400 hover:text-slate-100 transition">
            Materials
          </Link>
          <Link href="/flashcards" className="text-slate-400 hover:text-slate-100 transition">
            Flashcards
          </Link>
          <Link href="/advanced-learning" className="text-slate-400 hover:text-slate-100 transition">
            AI Learning
          </Link>
          <Link href="/groups" className="text-slate-400 hover:text-slate-100 transition">
            Groups
          </Link>
          <Link href="/planner" className="text-slate-400 hover:text-slate-100 transition">
            Planner
          </Link>
          <Link href="/calendar" className="text-slate-400 hover:text-slate-100 transition">
            Calendar
          </Link>
          <Link href="/habits" className="text-slate-400 hover:text-slate-100 transition">
            Habits
          </Link>
          <Link href="/analytics" className="text-slate-400 hover:text-slate-100 transition">
            Analytics
          </Link>
          <Link href="/support" className="text-slate-400 hover:text-slate-100 transition">
            Support
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-8 bg-slate-700 animate-pulse rounded" />
          ) : user ? (
            <>
              <ThemeToggle />
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition p-2 rounded-lg hover:bg-slate-700">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photoURL || ""} />
                        <AvatarFallback>
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <Avatar className="w-4 h-4">
                          <AvatarImage src={user.photoURL || ""} />
                          <AvatarFallback className="text-xs">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600 focus:text-red-600">
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="w-6 h-6" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-700 md:hidden">
            <div className="flex flex-col p-4 gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-slate-100">
                Dashboard
              </Link>
              <Link href="/materials" className="text-slate-400 hover:text-slate-100">
                Materials
              </Link>
              <Link href="/flashcards" className="text-slate-400 hover:text-slate-100">
                Flashcards
              </Link>
              <Link href="/groups" className="text-slate-400 hover:text-slate-100">
                Groups
              </Link>
              <Link href="/planner" className="text-slate-400 hover:text-slate-100">
                Planner
              </Link>
              <Link href="/calendar" className="text-slate-400 hover:text-slate-100">
                Calendar
              </Link>
              <Link href="/habits" className="text-slate-400 hover:text-slate-100">
                Habits
              </Link>
              <Link href="/analytics" className="text-slate-400 hover:text-slate-100">
                Analytics
              </Link>
              <Link href="/support" className="text-slate-400 hover:text-slate-100">
                Support
              </Link>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Theme</span>
                <ThemeToggle />
              </div>
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                    <Avatar className="w-4 h-4">
                      <AvatarImage src={user.photoURL || ""} />
                      <AvatarFallback className="text-xs">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.displayName || user.email?.split("@")[0]}</span>
                  </div>
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-slate-300 hover:text-slate-100 hover:bg-slate-700">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-slate-100 hover:bg-slate-700">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
