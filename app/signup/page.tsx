"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Lock, User } from "lucide-react"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="w-full max-w-md px-4 py-8">
          <div className="rounded-xl bg-card border border-border p-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Join StudyPal</h1>
            <p className="text-muted-foreground mb-8">Start mastering your studies today</p>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Create Account</Button>
            </form>

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
