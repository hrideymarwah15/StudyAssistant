"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Lock, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth"
import { auth, db, googleProvider } from "@/lib/firebase"
import { setDoc, doc, getDoc } from "firebase/firestore"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const user = userCredential.user

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: data.email,
        name: data.name,
        createdAt: new Date().toISOString(),
        subjects: [],
        preferences: {
          pace: "normal",
          dailyHours: 3,
        },
      })

      router.push("/materials")
    } catch (err: any) {
      // Handle Firebase errors
      let errorMessage = "Failed to create account. Please try again."
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in instead."
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check and try again."
      } else if (err.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (err.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled. Please contact support."
      } else if (err.code === "auth/configuration-not-found") {
        errorMessage = "Firebase Authentication is not configured. Please enable Email/Password authentication in Firebase Console."
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      if (user) {
        // Try to save user data to Firestore, but don't block login if it fails
        try {
          const userRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userRef)
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email?.split("@")[0],
              photoURL: user.photoURL ?? null,
              provider: "google",
              createdAt: new Date().toISOString(),
              subjects: [],
              preferences: {
                pace: "normal",
                dailyHours: 3,
              },
            })
          }
        } catch (firestoreErr: any) {
          // Log but don't block - user is still authenticated
          console.warn("Could not save user profile to Firestore:", firestoreErr.message)
        }
      }
      router.push("/materials")
    } catch (err: any) {
      let errorMessage = "Google sign-in failed. Please try again."
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in pop-up was closed before completing the process."
      } else if (err.code === "auth/cancelled-popup-request") {
        errorMessage = "Another sign-in attempt is already in progress."
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "The pop-up was blocked by the browser. Please allow pop-ups and try again."
      } else if (err.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with the same email but different sign-in credentials."
      } else if (err.message) {
        errorMessage = err.message
      }
      setError(errorMessage)
    } finally {
      setGoogleLoading(false)
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="w-full max-w-md px-4 py-8">
          <div className="rounded-xl bg-card border border-border p-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Join StudyPal</h1>
            <p className="text-muted-foreground mb-8">Start mastering your studies today</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    {...register("name")}
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent" type="button" onClick={handleGoogleSignIn} disabled={googleLoading}>
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
            </Button>

            <p className="text-center text-muted-foreground text-sm mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
