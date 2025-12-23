"use client"

// Gemini AI Client for flashcard generation
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""

// Max characters to send to Gemini - reduced to avoid rate limits
const MAX_CONTENT_CHARS = 100000  // ~25k tokens, much safer for rate limits

interface GeneratedFlashcard {
  front: string
  back: string
}

// Sleep helper for retry delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Truncate content intelligently - try to keep complete sentences/paragraphs
function truncateContent(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content
  
  // Truncate to max chars
  let truncated = content.slice(0, maxChars)
  
  // Try to end at a sentence boundary
  const lastPeriod = truncated.lastIndexOf('. ')
  const lastNewline = truncated.lastIndexOf('\n')
  const cutPoint = Math.max(lastPeriod, lastNewline)
  
  if (cutPoint > maxChars * 0.8) {
    truncated = truncated.slice(0, cutPoint + 1)
  }
  
  return truncated + "\n\n[Content truncated due to length...]"
}

// Fix truncated JSON arrays from incomplete API responses
function fixTruncatedJson(jsonStr: string): string {
  let fixed = jsonStr.trim()
  
  // If it doesn't start with [, try to find the start
  if (!fixed.startsWith('[')) {
    const arrayStart = fixed.indexOf('[')
    if (arrayStart !== -1) {
      fixed = fixed.slice(arrayStart)
    } else {
      throw new Error("No JSON array found in response")
    }
  }
  
  // Count brackets to find where to close
  let bracketCount = 0
  let inString = false
  let escapeNext = false
  let lastCompleteObject = -1
  
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (char === '\\') {
      escapeNext = true
      continue
    }
    
    if (char === '"') {
      inString = !inString
      continue
    }
    
    if (inString) continue
    
    if (char === '{') bracketCount++
    if (char === '}') {
      bracketCount--
      if (bracketCount === 0) {
        lastCompleteObject = i
      }
    }
  }
  
  // If we have complete objects, cut after the last one and close the array
  if (lastCompleteObject > 0) {
    fixed = fixed.slice(0, lastCompleteObject + 1)
    // Check if there's a comma after the last object
    const remainder = jsonStr.slice(lastCompleteObject + 1).trim()
    if (remainder.startsWith(',')) {
      // There was more content, just close the array
    }
    if (!fixed.endsWith(']')) {
      fixed += ']'
    }
  }
  
  // Final cleanup
  fixed = fixed.replace(/,\s*\]$/, ']') // Remove trailing comma before ]
  fixed = fixed.replace(/,\s*$/, '') + ']' // If ends with comma, close array
  
  // Make sure it's a valid array
  if (!fixed.endsWith(']')) {
    fixed += ']'
  }
  
  return fixed
}

export async function generateFlashcardsWithGemini(
  content: string, 
  topic: string,
  count: number = 5, 
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<GeneratedFlashcard[]> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.")
  }

  // Truncate content if too large
  const processedContent = content ? truncateContent(content.trim(), MAX_CONTENT_CHARS) : ""
  
  console.log(`Content length: ${content.length} chars, processed: ${processedContent.length} chars`)

  const difficultyPrompts = {
    easy: "Create simple, straightforward questions with concise answers suitable for beginners.",
    medium: "Create balanced questions that test understanding with moderately detailed answers.",
    hard: "Create challenging questions that require deep understanding with comprehensive answers."
  }

  const prompt = processedContent && processedContent.length > 50 
    ? `You are an expert educator creating flashcards for students.

IMPORTANT: You MUST create flashcards based ONLY on the provided study material below. Do NOT make up information or use general knowledge. Extract key facts, definitions, concepts, and important details directly from the text.

Study Material:
"""
${processedContent}
"""

${topic ? `Topic/Subject: ${topic}` : ""}
Difficulty: ${difficulty}
${difficultyPrompts[difficulty]}

Generate exactly ${count} high-quality flashcards based STRICTLY on the content above. Each flashcard should:
- Ask about specific information found in the provided text
- Have accurate answers taken directly from the material
- Cover different parts of the provided content

Return ONLY a valid JSON array with this exact format, no other text:
[
  {"front": "Question about the content?", "back": "Answer from the content"},
  {"front": "Question 2?", "back": "Answer 2"}
]

CRITICAL: Only use information from the provided study material. Do not add external knowledge.`
    : `You are an expert educator creating flashcards for students.

Topic: ${topic}
Difficulty: ${difficulty}
${difficultyPrompts[difficulty]}

Generate exactly ${count} high-quality flashcards about "${topic}". Each flashcard should have:
- A clear, specific question (front)
- A comprehensive but concise answer (back)

Return ONLY a valid JSON array with this exact format, no other text:
[
  {"front": "Question 1?", "back": "Answer 1"},
  {"front": "Question 2?", "back": "Answer 2"}
]

Important:
- Questions should test key concepts
- Answers should be accurate and educational
- Avoid yes/no questions
- Make questions progressively cover different aspects of the topic`

  // Retry logic with exponential backoff
  const maxRetries = 3
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait before retry: 2s, 4s, 8s
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`)
        await sleep(waitTime)
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error?.message || response.statusText
        
        // Check if it's a rate limit error (429 or "Resource exhausted")
        if (response.status === 429 || errorMessage.includes("Resource exhausted") || errorMessage.includes("rate limit")) {
          lastError = new Error(`Rate limited: ${errorMessage}`)
          continue // Try again
        }
        
        throw new Error(`Gemini API error: ${errorMessage}`)
      }

      const data = await response.json()
      
      // Extract the text content from the response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!textContent) {
        throw new Error("No content returned from Gemini")
      }

      // Parse the JSON from the response
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonStr = textContent
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      } else {
        // Try to find array directly
        const arrayMatch = textContent.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          jsonStr = arrayMatch[0]
        }
      }

      // Try to fix incomplete JSON
      let flashcards: GeneratedFlashcard[]
      try {
        flashcards = JSON.parse(jsonStr)
      } catch (parseError) {
        // Try to fix truncated JSON
        console.log("Initial parse failed, attempting to fix JSON...")
        jsonStr = fixTruncatedJson(jsonStr)
        flashcards = JSON.parse(jsonStr)
      }
      
      // Validate the structure
      if (!Array.isArray(flashcards)) {
        throw new Error("Invalid response format from Gemini")
      }

      return flashcards.filter(card => card.front && card.back).slice(0, count)
      
    } catch (error: any) {
      // If it's a rate limit error, store it and continue the loop
      if (error.message?.includes("Rate limited")) {
        lastError = error
        continue
      }
      // For other errors, throw immediately
      console.error("Gemini API Error:", error)
      throw new Error(`Failed to generate flashcards: ${error.message}`)
    }
  }
  
  // If we've exhausted all retries
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message || "Rate limit exceeded"}`)
}

// Helper to read file content
export async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const fileName = file.name.toLowerCase()
    
    reader.onload = async (e) => {
      try {
        const result = e.target?.result
        
        // Handle PDF files - extract text using pdf.js or basic extraction
        if (fileName.endsWith(".pdf")) {
          if (typeof result === "string") {
            // Try to extract readable text from PDF
            const text = extractTextFromPDF(result)
            resolve(text || `[PDF Document: ${file.name}]\n\nPlease copy and paste the text content from this PDF for best results, or the AI will generate flashcards based on the filename.`)
          } else if (result instanceof ArrayBuffer) {
            const text = await extractTextFromPDFBuffer(result)
            resolve(text || `[PDF Document: ${file.name}]\n\nPlease copy and paste the text content from this PDF for best results.`)
          }
          return
        }
        
        // Handle Word documents (.docx)
        if (fileName.endsWith(".docx")) {
          if (result instanceof ArrayBuffer) {
            const text = await extractTextFromDocx(result)
            resolve(text)
            return
          }
        }
        
        // Handle plain text files
        if (typeof result === "string") {
          resolve(result)
        } else {
          resolve(`[Document: ${file.name}] - Could not extract text content.`)
        }
      } catch (error) {
        console.error("Error processing file:", error)
        resolve(`[Document: ${file.name}] - Error reading file content.`)
      }
    }
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }
    
    // Read based on file type
    if (fileName.endsWith(".pdf") || fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      reader.readAsArrayBuffer(file)
    } else {
      // Read as text for text files
      reader.readAsText(file)
    }
  })
}

// Extract text from PDF (basic extraction from ArrayBuffer)
async function extractTextFromPDFBuffer(buffer: ArrayBuffer): Promise<string> {
  try {
    // Convert ArrayBuffer to string to find text content
    const uint8Array = new Uint8Array(buffer)
    let text = ""
    
    // Look for text streams in PDF
    const decoder = new TextDecoder("utf-8", { fatal: false })
    const pdfString = decoder.decode(uint8Array)
    
    // Extract text between stream markers (basic PDF text extraction)
    const streamMatches = pdfString.match(/stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g)
    if (streamMatches) {
      for (const match of streamMatches) {
        // Try to find readable text
        const readable = match.replace(/stream[\r\n]+/, "").replace(/[\r\n]+endstream/, "")
        // Filter for printable ASCII characters
        const cleanText = readable.replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim()
        if (cleanText.length > 20) {
          text += cleanText + "\n"
        }
      }
    }
    
    // Also try to extract text objects (Tj, TJ operators)
    const textMatches = pdfString.match(/\(([^)]+)\)\s*Tj/g)
    if (textMatches) {
      for (const match of textMatches) {
        const content = match.match(/\(([^)]+)\)/)
        if (content && content[1]) {
          text += content[1] + " "
        }
      }
    }
    
    return text.trim() || ""
  } catch (error) {
    console.error("PDF extraction error:", error)
    return ""
  }
}

// Basic PDF text extraction (fallback)
function extractTextFromPDF(content: string): string {
  try {
    // Try to find text content in PDF
    const textMatches = content.match(/\(([^)]+)\)/g)
    if (textMatches) {
      return textMatches
        .map(m => m.slice(1, -1))
        .filter(t => t.length > 2 && /[a-zA-Z]/.test(t))
        .join(" ")
    }
    return ""
  } catch {
    return ""
  }
}

// Extract text from DOCX (ZIP-based XML format)
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    // DOCX is a ZIP file containing XML
    // We'll use basic extraction by looking for text content
    const uint8Array = new Uint8Array(buffer)
    const decoder = new TextDecoder("utf-8", { fatal: false })
    const content = decoder.decode(uint8Array)
    
    // Look for word/document.xml content (the main document)
    // Extract text between <w:t> tags
    const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)
    if (textMatches) {
      const extractedText = textMatches
        .map(match => {
          const textContent = match.match(/<w:t[^>]*>([^<]*)<\/w:t>/)
          return textContent ? textContent[1] : ""
        })
        .filter(t => t.length > 0)
        .join(" ")
      
      if (extractedText.length > 50) {
        return extractedText
      }
    }
    
    // Fallback: try to find any readable text
    const readable = content.replace(/<[^>]+>/g, " ").replace(/[^\x20-\x7E\n\r]/g, " ").replace(/\s+/g, " ").trim()
    
    // Filter to only substantial text
    const words = readable.split(" ").filter(w => w.length > 2 && /^[a-zA-Z]+$/.test(w))
    if (words.length > 20) {
      return words.join(" ")
    }
    
    return `[Word Document] - For best results with .docx files, please copy and paste the text content directly.`
  } catch (error) {
    console.error("DOCX extraction error:", error)
    return `[Word Document] - Could not extract text. Please copy and paste the content.`
  }
}
