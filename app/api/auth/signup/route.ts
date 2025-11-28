import { NextResponse } from "next/server"

// Note: User creation is now handled client-side using Firebase Auth client SDK
// This endpoint is kept for backward compatibility but is no longer used
// Firebase client SDK cannot be used in server-side API routes
export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. User creation is handled client-side." },
    { status: 410 },
  )
}
