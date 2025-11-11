"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { ReactNode } from "react"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  href: string
}

export default function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  return (
    <Link href={href}>
      <div className="group h-full p-6 rounded-xl bg-card hover:bg-card/80 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
            {icon}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Link>
  )
}
