import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from Firestore
    const groups = [
      {
        id: "1",
        name: "Advanced Calculus",
        subject: "Math",
        members: 24,
        createdBy: "user123",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Biology Study Circle",
        subject: "Science",
        members: 18,
        createdBy: "user456",
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json(groups)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, subject, userId } = body

    if (!name || !subject || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      subject,
      members: 1,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(newGroup, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
