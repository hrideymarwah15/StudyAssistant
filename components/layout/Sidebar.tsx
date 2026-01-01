"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Calendar,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  Users,
  Target,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react"
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Planner", href: "/planner", icon: Calendar },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Flashcards", href: "/flashcards", icon: BookOpen },
  { name: "AI Learning", href: "/advanced-learning", icon: Brain },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const moreNavigation = [
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Habits", href: "/habits", icon: Target },
  { name: "Support", href: "/support", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMore, setShowMore] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-slate-800 border border-slate-700 rounded-lg p-2"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <ChevronLeft className="w-6 h-6 text-slate-100" /> : <ChevronRight className="w-6 h-6 text-slate-100" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-slate-900 border-r border-slate-700 transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => !isMobileOpen && setIsExpanded(true)}
        onMouseLeave={() => !isMobileOpen && setIsExpanded(false)}
      >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          {isExpanded && (
            <span className="font-serif text-xl font-bold text-slate-100 truncate">
              StudyPal
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-6 h-6 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-700",
                !isExpanded && "justify-center px-2"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="truncate">{item.name}</span>}
            </Link>
          )
        })}

        {/* More Section */}
        <div className="pt-4">
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-all duration-200 w-full",
              !isExpanded && "justify-center px-2"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span>More</span>}
          </button>

          {showMore && isExpanded && (
            <div className="mt-2 space-y-1 ml-4">
              {moreNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-slate-700">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700 animate-pulse rounded-full" />
            {isExpanded && <div className="w-24 h-4 bg-slate-700 animate-pulse rounded" />}
          </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 text-slate-400 hover:text-slate-100 transition-colors w-full">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={user.photoURL || ""} />
                    <AvatarFallback className="text-xs">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isExpanded && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-100 hover:bg-slate-700">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        {/* Theme Toggle */}
        <div className="mt-3 flex justify-center">
          <ThemeToggle />
        </div>
      </div>
      </div>
    </>
  )
}