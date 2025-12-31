"use client"

import Navigation from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Upload, Search, Filter, BookOpen, FileText, ImageIcon, Loader2, Trash2, FolderPlus, Folder, FolderOpen, ArrowLeft, MoreVertical, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { 
  getMaterials, addMaterial, uploadFile, deleteMaterial, 
  getMaterialFolders, createMaterialFolder, deleteMaterialFolder, updateMaterialFolder,
  type Material, type MaterialFolder 
} from "@/lib/firestore"
import { MaterialProcessor } from "@/components/materials/MaterialProcessor"
import { processMaterial } from "@/lib/api-client"

const FOLDER_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
]

export default function MaterialsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [materials, setMaterials] = useState<Material[]>([])
  const [folders, setFolders] = useState<MaterialFolder[]>([])
  const [currentFolder, setCurrentFolder] = useState<MaterialFolder | null>(null)
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
  const [movingMaterial, setMovingMaterial] = useState<Material | null>(null)
  const [aiSummaries, setAiSummaries] = useState<{ [materialId: string]: string }>({})
  const [generatingSummary, setGeneratingSummary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateSummary = async (material: Material) => {
    if (!material.content) return
    
    setGeneratingSummary(material.id)
    try {
      const result = await processMaterial(material.content, { generateSummary: true })
      setAiSummaries(prev => ({ ...prev, [material.id]: result.summary || "No summary generated" }))
    } catch (error) {
      console.error("Error generating summary:", error)
    } finally {
      setGeneratingSummary(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        await loadData(currentUser.uid)
      } else {
        router.push("/login")
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [router])

  const loadData = async (userId: string, folderId?: string | null) => {
    try {
      const [userMaterials, userFolders] = await Promise.all([
        getMaterials(userId, folderId),
        getMaterialFolders(userId)
      ])
      setMaterials(userMaterials)
      setFolders(userFolders)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleFolderClick = async (folder: MaterialFolder) => {
    setCurrentFolder(folder)
    if (user) {
      const folderMaterials = await getMaterials(user.uid, folder.id)
      setMaterials(folderMaterials)
    }
  }

  const handleBackToRoot = async () => {
    setCurrentFolder(null)
    if (user) {
      const rootMaterials = await getMaterials(user.uid, null)
      setMaterials(rootMaterials)
    }
  }

  const handleCreateFolder = async () => {
    if (!user || !newFolderName.trim()) return
    try {
      await createMaterialFolder({
        name: newFolderName.trim(),
        color: newFolderColor,
        userId: user.uid
      })
      const userFolders = await getMaterialFolders(user.uid)
      setFolders(userFolders)
      setShowCreateFolder(false)
      setNewFolderName("")
      setNewFolderColor(FOLDER_COLORS[0])
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder? Materials inside will be moved to root.")) return
    try {
      await deleteMaterialFolder(folderId)
      if (user) await loadData(user.uid, currentFolder?.id || null)
    } catch (error) {
      console.error("Error deleting folder:", error)
    }
  }

  const handleMoveMaterial = async (targetFolderId: string | null) => {
    if (!movingMaterial || !user) return
    try {
      await updateMaterialFolder(movingMaterial.id, targetFolderId)
      await loadData(user.uid, currentFolder?.id || null)
      setMovingMaterial(null)
    } catch (error) {
      console.error("Error moving material:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fileType = file.type.includes("pdf") ? "pdf" : 
                        file.type.includes("image") ? "image" : "other"
        
        // Store material metadata in Firestore (no file upload - Storage not available)
        await addMaterial({
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: fileType as "pdf" | "image" | "text" | "other",
          subject: "General",
          folderId: currentFolder?.id,
          userId: user.uid
        })
      }
      await loadData(user.uid, currentFolder?.id || null)
    } catch (error) {
      console.error("Error saving material:", error)
      alert("Failed to save material. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return
    try {
      await deleteMaterial(materialId)
      setMaterials(materials.filter(m => m.id !== materialId))
    } catch (error) {
      console.error("Error deleting material:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif font-bold text-slate-100 mb-2">Study Materials</h1>
          <p className="text-slate-400 mb-4">Upload, organize, and access all your study files and notes</p>
          <p className="text-slate-400">
            Welcome, {user.displayName || user.email}! Organize and access all your study materials in one place.
          </p>
        </div>

        {/* Current Folder Path */}
        {currentFolder && (
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={handleBackToRoot}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              All Materials
            </button>
            <span className="text-slate-400">/</span>
            <span className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: currentFolder.color }}
              />
              {currentFolder.name}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div 
            className="flex-1 min-w-[200px] p-6 border-2 border-dashed border-blue-500/30 rounded-xl bg-blue-500/5 text-center hover:bg-blue-500/10 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            )}
            <h3 className="font-semibold text-slate-100 mb-1">
              {uploading ? "Uploading..." : "Upload Files"}
            </h3>
            <p className="text-sm text-slate-400">
              {currentFolder ? `Upload to ${currentFolder.name}` : "Upload to root"}
            </p>
          </div>

          {!currentFolder && (
            <div 
              className="flex-1 min-w-[200px] p-6 border-2 border-dashed border-slate-600 rounded-xl bg-slate-700/30 text-center hover:bg-slate-700/50 transition-colors cursor-pointer"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="font-semibold text-slate-100 mb-1">New Folder</h3>
              <p className="text-sm text-slate-400">Organize materials</p>
            </div>
          )}
        </div>

        {/* AI Material Processor - EPIC 4 */}
        <div className="mb-8">
          <MaterialProcessor onMaterialProcessed={(material) => {
            // Handle processed material - could add to materials list
            console.log('Material processed:', material)
          }} />
        </div>

        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:border-slate-500 outline-none transition-colors text-slate-100"
            />
          </div>
        </div>

        {/* Folders Grid (only in root) */}
        {!currentFolder && filteredFolders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Folders</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleFolderClick(folder)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${folder.color}20` }}
                      >
                        <Folder className="w-5 h-5" style={{ color: folder.color }} />
                      </div>
                      <span className="font-medium text-slate-100">{folder.name}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Materials Grid */}
        <div>
          {!currentFolder && <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {filteredFolders.length > 0 ? "Files" : "All Materials"}
          </h2>}
          
          {filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-100 mb-2">
                {currentFolder ? "This folder is empty" : "No materials yet"}
              </h3>
              <p className="text-slate-400 mb-6">
                {currentFolder ? "Upload files to this folder" : "Upload your first study material to get started!"}
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Materials
              </Button>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No files in {currentFolder ? "this folder" : "root"}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  className="p-6 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-slate-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      {getTypeIcon(material.type)}
                    </div>
                    <div className="flex items-center gap-1">
                      {!currentFolder && folders.length > 0 && (
                        <button 
                          onClick={() => setMovingMaterial(material)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all p-1"
                          title="Move to folder"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(material.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-100 mb-2 truncate">{material.title}</h3>
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                    <span className="px-2 py-1 bg-slate-700 rounded">{material.subject}</span>
                    <span>{material.createdAt.toLocaleDateString()}</span>
                  </div>
                  
                  {/* AI Summary */}
                  {material.content && (
                    <div className="mb-4">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => generateSummary(material)}
                        disabled={generatingSummary === material.id}
                        className="w-full mb-2 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        {generatingSummary === material.id ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                        ) : (
                          <>AI Summary</>
                        )}
                      </Button>
                      {aiSummaries[material.id] && (
                        <div className="p-3 bg-slate-700/50 rounded text-sm text-slate-400">
                          {aiSummaries[material.id]}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {material.fileUrl && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => window.open(material.fileUrl, "_blank")}
                    >
                      View File
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-500" />
                Create Folder
              </h2>
              <button onClick={() => setShowCreateFolder(false)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g., Physics Notes, Exam Prep..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 focus:border-slate-500 outline-none text-slate-100"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Folder Color</label>
                <div className="flex gap-2 flex-wrap">
                  {FOLDER_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewFolderColor(color)}
                      className={`w-8 h-8 rounded-lg transition-all ${newFolderColor === color ? "ring-2 ring-offset-2 ring-blue-500" : ""}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
              >
                Create Folder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Move Material Modal */}
      {movingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-slate-100">Move to Folder</h2>
              <button onClick={() => setMovingMaterial(null)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Moving: <span className="text-slate-100 font-medium">{movingMaterial.title}</span>
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleMoveMaterial(null)}
                className="w-full p-3 rounded-lg border border-slate-600 hover:border-slate-500 text-left flex items-center gap-3 text-slate-100 hover:bg-slate-700"
              >
                <BookOpen className="w-5 h-5 text-slate-400" />
                <span>Root (No folder)</span>
              </button>
              {folders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => handleMoveMaterial(folder.id)}
                  className="w-full p-3 rounded-lg border border-slate-600 hover:border-slate-500 text-left flex items-center gap-3 text-slate-100 hover:bg-slate-700"
                >
                  <Folder className="w-5 h-5" style={{ color: folder.color }} />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
