"use client"

import { useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error("Auth state change error:", err)
        setError(err as Error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    if (!auth) return
    try {
      await signOut(auth)
      setUser(null)
    } catch (err) {
      setError(err as Error)
    }
  }

  return { user, loading, error, logout }
}
