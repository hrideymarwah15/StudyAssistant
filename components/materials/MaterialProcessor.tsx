"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, BookOpen, Brain, CheckCircle, AlertCircle, Loader2, Mic } from "lucide-react"
import { addMaterial, uploadAudio, APIError } from "@/lib/api"
import { toast } from "sonner"

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
  transcript?: string
  chunksStored?: number
}

interface MaterialProcessorProps {
  onMaterialProcessed?: (material: MaterialFile) => void
  subject?: string
  topic?: string
}

export function MaterialProcessor({ onMaterialProcessed, subject, topic }: MaterialProcessorProps) {
  const [files, setFiles] = useState<MaterialFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingType, setProcessingType] = useState<'text' | 'audio'>('text')

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
      // Determine if it's an audio file
      const isAudio = actualFile.type.startsWith('audio/') || 
                      actualFile.name.match(/\.(mp3|wav|m4a|ogg|flac)$/i)

      if (isAudio) {
        // Process audio file
        setProcessingType('audio')
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'processing', progress: 25 } : f
        ))

        toast.loading("Transcribing audio...", { id: file.id })

        const result = await uploadAudio(actualFile, {
          course: subject || "General",
          topic: topic || file.name,
          store_in_memory: true
        })

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, progress: 75 } : f
        ))

        const processedFile: MaterialFile = {
          ...file,
          status: 'completed',
          progress: 100,
          transcript: result.transcript,
          chunksStored: result.stored_chunks,
          summary: `Transcribed ${result.language} audio with ${result.stored_chunks} chunks stored in memory.`
        }

        setFiles(prev => prev.map(f =>
          f.id === file.id ? processedFile : f
        ))

        toast.success(`Audio transcribed! ${result.stored_chunks} chunks stored.`, { id: file.id })
        onMaterialProcessed?.(processedFile)

      } else {
        // Process text file
        setProcessingType('text')
        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, status: 'processing', progress: 25 } : f
        ))

        toast.loading("Processing text...", { id: file.id })

        // Read file content
        const text = await actualFile.text()

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, progress: 50 } : f
        ))

        // Store in AI memory
        const result = await addMaterial({
          text: text,
          course: subject || "General",
          topic: topic || file.name,
          source: file.name
        })

        setFiles(prev => prev.map(f =>
          f.id === file.id ? { ...f, progress: 75 } : f
        ))

        const processedFile: MaterialFile = {
          ...file,
          status: 'completed',
          progress: 100,
          summary: `Stored in AI memory with ID: ${result.point_id.substring(0, 8)}...`
        }

        setFiles(prev => prev.map(f =>
          f.id === file.id ? processedFile : f
        ))

        toast.success("Material stored in AI memory!", { id: file.id })
        onMaterialProcessed?.(processedFile)
      }

    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'Processing failed'

      setFiles(prev => prev.map(f =>
        f.id === file.id ? {
          ...f,
          status: 'error',
          progress: 0,
          error: errorMessage
        } : f
      ))

      toast.error(errorMessage, { id: file.id })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg', '.flac']
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
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Text:</strong> PDF, DOC, DOCX, TXT
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Mic className="w-4 h-4" />
                  <strong>Audio:</strong> MP3, WAV, M4A, OGG, FLAC (auto-transcribed)
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
                    <div className="mt-4 space-y-3">
                      {file.summary && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Result
                          </h4>
                          <p className="text-sm">{file.summary}</p>
                        </div>
                      )}

                      {file.transcript && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <Mic className="w-4 h-4 text-blue-500" />
                            Transcript {file.chunksStored && `(${file.chunksStored} chunks stored)`}
                          </h4>
                          <p className="text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
                            {file.transcript}
                          </p>
                        </div>
                      )}

                      {file.keyPoints && file.keyPoints.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Key Points
                          </h4>
                          {file.keyPoints.map((point, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              <span className="text-sm">{point}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {file.flashcards && file.flashcards.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Flashcards
                          </h4>
                          {file.flashcards.map((card, index) => (
                            <Card key={index} className="p-4">
                              <div className="space-y-2">
                                <p className="font-medium">{card.question}</p>
                                <p className="text-sm text-muted-foreground">{card.answer}</p>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
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