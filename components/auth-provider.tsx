"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import type { User } from "firebase/auth"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: Error | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider")
  }
  return context
}
