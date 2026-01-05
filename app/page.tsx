"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, BookOpen, Users, Zap, Heart, Loader2 } from "lucide-react"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import FeatureCard from "@/components/feature-card"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"


export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard")
      } else {
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <Navigation />
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-100 mb-4">
              Everything You Need to Study Better
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              From organizing notes to acing exams, StudyPal has you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Smart Material Organization"
              description="Upload PDFs, images, and notes. AI automatically tags and organizes everything for you."
              href="/materials"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="AI Flashcard Generation"
              description="Automatically generate flashcards from your study materials for efficient learning."
              href="/flashcards"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Find Study Groups"
              description="Connect with peers studying the same topics and join collaborative study sessions."
              href="/groups"
            />
            <FeatureCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Exam Prep Scheduler"
              description="AI generates personalized study schedules based on your exam date and subjects."
              href="/planner"
            />
            <FeatureCard
              icon={<Heart className="w-6 h-6" />}
              title="Mental Health Support"
              description="Access mental health resources and find support when you need it most."
              href="/support"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-muted to-background">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12 text-center border border-primary/20">
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Ready to Transform Your Studies?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of students already achieving their academic goals with StudyPal.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started Now
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
