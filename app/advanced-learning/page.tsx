"use client"

import dynamic from "next/dynamic"
import Layout from "@/components/Layout"

// Dynamically import to avoid Firebase initialization during build
const AdvancedLearningTools = dynamic(
  () => import("@/components/advanced-learning/AdvancedLearningTools").then(mod => mod.AdvancedLearningTools),
  { ssr: false }
)

export default function AdvancedLearningPage() {
  return (
    <Layout 
      title="Advanced Learning" 
      subtitle="AI-powered learning tools and advanced study techniques"
    >
      <AdvancedLearningTools />
    </Layout>
  )
}