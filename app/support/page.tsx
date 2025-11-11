"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, MessageCircle, AlertCircle, NavigationIcon } from "lucide-react"
import { useState } from "react"

export default function SupportPage() {
  const [resources] = useState([
    { title: "National Crisis Hotline", number: "988", description: "Free 24/7 support for mental health" },
    { title: "International Support", number: "+1-800-SUICIDE", description: "Crisis support across borders" },
    { title: "Campus Counseling", number: "(555) 123-4567", description: "Connect with your school counselor" },
  ])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Alert Banner */}
        <div className="mb-12 p-6 rounded-lg bg-accent/10 border border-accent/30 flex gap-4">
          <AlertCircle className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-foreground mb-2">You're Not Alone</h2>
            <p className="text-muted-foreground">If you're struggling, please reach out. Support is available 24/7.</p>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Mental Health & Support</h1>
          <p className="text-muted-foreground">Resources and help when you need it most</p>
        </div>

        {/* Hotlines */}
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6">Emergency Resources</h2>
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{resource.title}</h3>
                  <a href={`tel:${resource.number}`} className="text-primary font-bold">
                    {resource.number}
                  </a>
                </div>
                <p className="text-muted-foreground mb-4">{resource.description}</p>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Other Resources */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-card border border-border">
            <MessageCircle className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Chat Support</h3>
            <p className="text-muted-foreground mb-4">Talk to trained counselors online</p>
            <Button variant="outline" className="w-full bg-transparent">
              Start Chat
            </Button>
          </div>
          <div className="p-6 rounded-lg bg-card border border-border">
            <MapPin className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Find Nearby Help</h3>
            <p className="text-muted-foreground mb-4">Locate counselors near you</p>
            <Button variant="outline" className="w-full bg-transparent">
              <NavigationIcon className="w-4 h-4 mr-2" />
              Find Services
            </Button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="p-6 rounded-lg bg-muted">
          <h3 className="font-semibold text-foreground mb-3">Why StudyPal Offers Support</h3>
          <ul className="space-y-2 text-muted-foreground text-sm">
            <li>• Mental health is as important as your studies</li>
            <li>• Academic stress can impact your wellbeing</li>
            <li>• Professional support makes a real difference</li>
            <li>• You deserve to prioritize your mental health</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
