"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import GreetingBlock from "@/components/GreetingBlock"
import { QuickCapture } from "@/components/quick-capture"

interface LayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showGreeting?: boolean
}

export default function Layout({
  children,
  title,
  subtitle,
  showGreeting = true
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-16 transition-all duration-300 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-16 lg:pt-8">
          {showGreeting && <GreetingBlock />}

          {title && (
            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-2">{title}</h1>
              {subtitle && (
                <p className="text-slate-400 text-base sm:text-lg">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </main>

      {/* Quick Capture available globally */}
      <QuickCapture />
    </div>
  )
}