import { createUserWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { setDoc, doc } from "firebase/firestore"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      name,
      createdAt: new Date().toISOString(),
      subjects: [],
      preferences: {
        pace: "normal",
        dailyHours: 3,
      },
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        uid: user.uid,
      },
      { status: 201 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
