"use client"

import { useEffect, useRef, Suspense, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, ArrowDown } from "lucide-react"
import dynamic from "next/dynamic"

const WebGLHero = dynamic(() => import("@/components/webgl-hero"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Loading 3D scene...</p>
      </div>
    </div>
  ),
})

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      if (!containerRef.current) return
      const scrollY = window.scrollY
      const elements = containerRef.current.querySelectorAll("[data-parallax]")

      elements.forEach((el) => {
        const speed = Number.parseFloat((el as HTMLElement).dataset.parallax || "0.5")
        const offset = scrollY * speed
        ;(el as HTMLElement).style.transform = `translateY(${offset}px)`
      })
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return <div className="w-full h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5" />
  }

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-0 px-4 md:px-8"
    >
      {/* WebGL 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5" />}>
          <WebGLHero />
        </Suspense>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-4xl mx-auto text-center pt-32">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 mb-8">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-medium text-primary">Welcome to StudyPal</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-6 leading-tight drop-shadow-lg">
          Master Your{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Studies</span> with AI
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Organize materials, generate flashcards, find study groups, and ace your exams with StudyPal's intelligent
          study platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg h-12 px-8 shadow-lg"
            >
              Start Studying Free
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="#features">
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-12 px-8 border-primary/30 hover:bg-primary/5 backdrop-blur-sm bg-transparent"
            >
              Learn More
            </Button>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center animate-bounce">
          <ArrowDown className="w-6 h-6 text-foreground/60" />
        </div>
      </div>
    </section>
  )
}
