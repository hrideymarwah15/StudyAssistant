"use client"

import { getMaterials, type Material } from '@/lib/firestore'
import { useAuthContext } from '@/components/auth-provider'

export interface MaterialSearchResult {
  id: string
  name: string
  type: string
  content: string
  tags: string[]
  relevanceScore: number
  excerpt: string
}

export class MaterialSearchIntegration {
  private materials: Material[] = []
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async initialize(): Promise<void> {
    try {
      this.materials = await getMaterials(this.userId)
    } catch (error) {
      console.error('Failed to load materials for search:', error)
      this.materials = []
    }
  }

  async search(query: string, options: {
    limit?: number
    types?: string[]
    tags?: string[]
  } = {}): Promise<MaterialSearchResult[]> {
    const { limit = 10, types, tags } = options

    if (!query.trim()) {
      return []
    }

    // Ensure materials are loaded
    if (this.materials.length === 0) {
      await this.initialize()
    }

    const queryLower = query.toLowerCase()
    const results: MaterialSearchResult[] = []

    for (const material of this.materials) {
      // Filter by type if specified
      if (types && types.length > 0 && !types.includes(material.type)) {
        continue
      }

      // Filter by subject/tags if specified
      if (tags && tags.length > 0) {
        const materialSubject = material.subject || ''
        if (!tags.some(tag => materialSubject.toLowerCase().includes(tag.toLowerCase()))) {
          continue
        }
      }

      let relevanceScore = 0
      let excerpt = ''

      // Search in title (highest weight)
      if (material.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10
        excerpt = this.extractExcerpt(material.title, queryLower)
      }

      // Search in content
      if (material.content && material.content.toLowerCase().includes(queryLower)) {
        relevanceScore += 5
        if (!excerpt) {
          excerpt = this.extractExcerpt(material.content, queryLower)
        }
      }

      // Search in subject
      if (material.subject && material.subject.toLowerCase().includes(queryLower)) {
        relevanceScore += 3
        if (!excerpt) {
          excerpt = `Subject: ${material.subject}`
        }
      }
      // Boost score for exact matches
      if (material.title.toLowerCase() === queryLower) {
        relevanceScore += 20
      }

      if (relevanceScore > 0) {
        results.push({
          id: material.id,
          name: material.title,
          type: material.type,
          content: material.content || '',
          tags: [material.subject],
          relevanceScore,
          excerpt: excerpt || material.title
        })
      }
    }

    // Sort by relevance score (descending)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return results.slice(0, limit)
  }

  private extractExcerpt(text: string, query: string, contextLength: number = 50): string {
    const index = text.toLowerCase().indexOf(query)
    if (index === -1) return text.substring(0, contextLength) + '...'

    const start = Math.max(0, index - contextLength / 2)
    const end = Math.min(text.length, index + query.length + contextLength / 2)

    let excerpt = text.substring(start, end)
    if (start > 0) excerpt = '...' + excerpt
    if (end < text.length) excerpt = excerpt + '...'

    return excerpt
  }

  getAvailableTypes(): string[] {
    const types = new Set(this.materials.map(m => m.type))
    return Array.from(types)
  }

  getAvailableTags(): string[] {
    const tags = new Set<string>()
    this.materials.forEach(material => {
      if (material.subject) {
        tags.add(material.subject)
      }
    })
    return Array.from(tags)
  }

  getMaterialCount(): number {
    return this.materials.length
  }
}

// Singleton instance for the current user
let materialSearchInstance: MaterialSearchIntegration | null = null

export function getMaterialSearchIntegration(userId: string): MaterialSearchIntegration {
  if (!materialSearchInstance || materialSearchInstance['userId'] !== userId) {
    materialSearchInstance = new MaterialSearchIntegration(userId)
  }
  return materialSearchInstance
}

export function useMaterialSearch() {
  const { user } = useAuthContext()

  const searchMaterials = async (query: string, options?: {
    limit?: number
    types?: string[]
    tags?: string[]
  }): Promise<MaterialSearchResult[]> => {
    if (!user) return []

    const searchIntegration = getMaterialSearchIntegration(user.uid)
    return await searchIntegration.search(query, options)
  }

  const initializeSearch = async (): Promise<void> => {
    if (!user) return

    const searchIntegration = getMaterialSearchIntegration(user.uid)
    await searchIntegration.initialize()
  }

  return {
    searchMaterials,
    initializeSearch
  }
}