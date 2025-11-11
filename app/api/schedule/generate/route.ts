import { type NextRequest, NextResponse } from "next/server"

interface ScheduleTask {
  day: number
  title: string
  completed: boolean
  hours: number
  subtasks: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examDate, subjects, pace = "normal" } = body

    if (!examDate || !subjects || subjects.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Calculate days remaining
    const exam = new Date(examDate)
    const today = new Date()
    const daysRemaining = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Mock schedule generation - In production, use AI to create personalized schedules
    const schedule: ScheduleTask[] = []
    const paceMultiplier = pace === "aggressive" ? 1.2 : pace === "conservative" ? 0.8 : 1

    for (let day = 1; day <= Math.min(14, daysRemaining); day++) {
      const subjectsPerDay = subjects.slice(0, Math.ceil(subjects.length / 2))

      schedule.push({
        day,
        title: `Review: ${subjectsPerDay.join(", ")}`,
        completed: false,
        hours: 2.5 * paceMultiplier,
        subtasks: ["Read notes", "Complete practice problems", "Create summary"],
      })
    }

    return NextResponse.json(
      {
        schedule,
        daysRemaining,
        totalHours: schedule.reduce((sum, task) => sum + task.hours, 0),
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
