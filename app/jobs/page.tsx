"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Bookmark, MapPin, Clock, ExternalLink } from "lucide-react"
import { useState } from "react"

export default function JobsPage() {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "Summer Intern - Software Engineering",
      company: "Tech Corp",
      location: "San Francisco, CA",
      deadline: "2024-02-15",
      type: "Internship",
    },
    {
      id: 2,
      title: "Data Analysis Internship",
      company: "Data Solutions",
      location: "Remote",
      deadline: "2024-02-20",
      type: "Internship",
    },
    {
      id: 3,
      title: "Junior Developer",
      company: "StartUp Inc",
      location: "New York, NY",
      deadline: "2024-03-01",
      type: "Part-time",
    },
  ])

  const [bookmarked, setBookmarked] = useState<number[]>([])

  const toggleBookmark = (id: number) => {
    setBookmarked((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Jobs & Internships</h1>
          <p className="text-muted-foreground">Discover opportunities tailored to your skills</p>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-6 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">{job.title}</h3>
                  <p className="text-primary font-medium mb-3">{job.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Apply by {job.deadline}
                    </div>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">{job.type}</span>
                  </div>
                </div>
                <button onClick={() => toggleBookmark(job.id)} className="ml-4">
                  <Bookmark
                    className={`w-6 h-6 transition-colors ${
                      bookmarked.includes(job.id)
                        ? "fill-primary text-primary"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  />
                </button>
              </div>
              <div className="flex gap-3">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Apply Now
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline">Learn More</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
