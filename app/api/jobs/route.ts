import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In production, aggregate from multiple sources
    const jobs = [
      {
        id: "1",
        title: "Summer Intern - Software Engineering",
        company: "Tech Corp",
        location: "San Francisco, CA",
        deadline: "2024-02-15",
        type: "Internship",
        url: "https://example.com/job1",
      },
      {
        id: "2",
        title: "Data Analysis Internship",
        company: "Data Solutions",
        location: "Remote",
        deadline: "2024-02-20",
        type: "Internship",
        url: "https://example.com/job2",
      },
      {
        id: "3",
        title: "Junior Developer",
        company: "StartUp Inc",
        location: "New York, NY",
        deadline: "2024-03-01",
        type: "Part-time",
        url: "https://example.com/job3",
      },
    ]

    return NextResponse.json(jobs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
