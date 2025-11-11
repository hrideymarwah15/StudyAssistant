"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
      router.push("/materials")
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="w-full max-w-md px-4 py-8">
          <div className="rounded-xl bg-card border border-border p-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground mb-8">Sign in to your StudyPal account</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            <div className="text-right mt-4">
              <Link href="#" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Continue with Google
            </Button>

            <p className="text-center text-muted-foreground text-sm mt-6">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
