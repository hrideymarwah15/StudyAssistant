"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SP</span>
          </div>
          <span className="font-serif text-xl font-bold text-foreground">StudyPal</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/materials" className="text-muted-foreground hover:text-foreground transition">
            Materials
          </Link>
          <Link href="/groups" className="text-muted-foreground hover:text-foreground transition">
            Groups
          </Link>
          <Link href="/planner" className="text-muted-foreground hover:text-foreground transition">
            Planner
          </Link>
          <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition">
            Jobs
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          <Menu className="w-6 h-6" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border md:hidden">
            <div className="flex flex-col p-4 gap-4">
              <Link href="/materials" className="text-muted-foreground hover:text-foreground">
                Materials
              </Link>
              <Link href="/groups" className="text-muted-foreground hover:text-foreground">
                Groups
              </Link>
              <Link href="/planner" className="text-muted-foreground hover:text-foreground">
                Planner
              </Link>
              <Link href="/jobs" className="text-muted-foreground hover:text-foreground">
                Jobs
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="w-full justify-start">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
