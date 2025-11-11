import type React from "react"
import type { Metadata } from "next"
import { Inter, Source_Serif_4 } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const sourceSerif = Source_Serif_4({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "StudyPal - Master Your Studies",
  description: "Organize study materials, generate flashcards, find study groups, and ace your exams with StudyPal",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e27" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
