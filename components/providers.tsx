"use client"

import { type ReactNode } from "react"
import { ErrorBoundary } from "./error-boundary"
import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"
import { LoadingProvider } from "@/components/ui/loading"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <LoadingProvider>
            {children}
            <JarvisAssistant />
          </LoadingProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
