"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronRight, BookOpen, Users, Zap, MapPin } from "lucide-react"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import FeatureCard from "@/components/feature-card"


export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <Navigation />
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Everything You Need to Study Better
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
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
              icon={<Zap className="w-6 h-6" />}
              title="Jobs & Opportunities"
              description="Discover internships and job opportunities tailored to your skills and interests."
              href="/jobs"
            />
            <FeatureCard
              icon={<MapPin className="w-6 h-6" />}
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
