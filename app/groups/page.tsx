"use client"

import Layout from "@/components/Layout"
import { StudyGroups } from "@/components/groups/StudyGroups"

export default function GroupsPage() {
  return (
    <Layout 
      title="Study Groups" 
      subtitle="Connect with fellow students and study together"
    >
      <StudyGroups />
    </Layout>
  )
}
