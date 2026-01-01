"use client"

import Layout from "@/components/Layout"
import { AdvancedLearningTools } from "@/components/advanced-learning/AdvancedLearningTools"

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