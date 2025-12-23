"use client"

import { type ReactNode } from "react"
import { ErrorBoundary } from "./error-boundary"
import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"
import { JarvisAssistant } from "./jarvis-assistant"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          {children}
          <JarvisAssistant />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
