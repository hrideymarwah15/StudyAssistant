import { NextResponse } from "next/server"
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. User creation is handled client-side." },
    { status: 410 },
  )
}
