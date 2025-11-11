"use client"

import { type ReactNode } from "react"
import { ErrorBoundary } from "./error-boundary"
import { AuthProvider } from "./auth-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
  )
}
