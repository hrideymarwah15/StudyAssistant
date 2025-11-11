import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 })
    }

    // In production, upload to Firebase Storage or S3
    const materialId = uuidv4()
    const fileName = file.name

    // Mock response - in production this would be the actual file URL
    const fileUrl = `/uploads/${materialId}/${fileName}`

    return NextResponse.json(
      {
        materialId,
        fileName,
        fileUrl,
        userId,
        uploadedAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
