"use client"

import Navigation from "@/components/navigation"
import GreetingBlock from "@/components/GreetingBlock"

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
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        {showGreeting && <GreetingBlock />}
        
        {title && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">{title}</h1>
            {subtitle && (
              <p className="text-slate-400 text-lg">{subtitle}</p>
            )}
          </div>
        )}
        
        {children}
      </main>
    </div>
  )
}