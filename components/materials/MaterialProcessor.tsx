"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, BookOpen, Brain, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { processMaterial } from "@/lib/api-client"

interface MaterialFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  summary?: string
  flashcards?: any[]
  keyPoints?: string[]
  error?: string
}

interface MaterialProcessorProps {
  onMaterialProcessed?: (material: MaterialFile) => void
}

export function MaterialProcessor({ onMaterialProcessed }: MaterialProcessorProps) {
  const [files, setFiles] = useState<MaterialFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: MaterialFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Process each file
    for (const file of newFiles) {
      await processFile(file, acceptedFiles.find(f => f.name === file.name)!)
    }
  }, [])

  const processFile = async (file: MaterialFile, actualFile: File) => {
    try {
      // Update status to processing
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'processing', progress: 25 } : f
      ))

      // Convert file to text (simplified - in real app would handle PDFs, etc.)
      const text = await actualFile.text()

      // Update progress
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, progress: 50 } : f
      ))

      // Process with AI
      const result = await processMaterial(text, {
        generateSummary: true,
        generateFlashcards: true,
        extractKeyPoints: true
      })

      // Update with results
      const processedFile: MaterialFile = {
        ...file,
        status: 'completed',
        progress: 100,
        summary: result.summary,
        flashcards: result.flashcards,
        keyPoints: result.keyPoints
      }

      setFiles(prev => prev.map(f =>
        f.id === file.id ? processedFile : f
      ))

      onMaterialProcessed?.(processedFile)

    } catch (error) {
      setFiles(prev => prev.map(f =>
        f.id === file.id ? {
          ...f,
          status: 'error',
          progress: 0,
          error: error instanceof Error ? error.message : 'Processing failed'
        } : f
      ))
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  })

  const getStatusIcon = (status: MaterialFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusColor = (status: MaterialFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'text-blue-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Study Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop your study materials here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop study materials here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports PDF, DOC, DOCX, and TXT files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(file.status)}>
                      {file.status}
                    </Badge>
                  </div>

                  {file.status === 'uploading' || file.status === 'processing' ? (
                    <Progress value={file.progress} className="mb-2" />
                  ) : null}

                  {file.error && (
                    <p className="text-sm text-red-600 mt-2">{file.error}</p>
                  )}

                  {file.status === 'completed' && (
                    <Tabs defaultValue="summary" className="mt-4">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                        <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                      </TabsList>

                      <TabsContent value="summary" className="mt-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            AI-Generated Summary
                          </h4>
                          <p className="text-sm">{file.summary}</p>
                        </div>
                      </TabsContent>

                      <TabsContent value="keypoints" className="mt-4">
                        <div className="space-y-2">
                          {file.keyPoints?.map((point, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              <span className="text-sm">{point}</span>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="flashcards" className="mt-4">
                        <div className="grid gap-3">
                          {file.flashcards?.map((card, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-2">
                                <p className="font-medium">{card.question}</p>
                                <p className="text-sm text-muted-foreground">{card.answer}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}