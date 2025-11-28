"use client"

import { type ReactNode } from "react"
import { ErrorBoundary } from "./error-boundary"
import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
