"use client"
import { useState, useRef, useEffect } from "react"
import { ImageIcon, Download, Trash2, Wand2, X, Edit2, Loader2, Sparkles } from "lucide-react"
import ModelSelector from "./ModelSelector"
import AITimer from "./AITimer"
import { PuterModel } from "@/lib/puter"
import { MediaItem, getImageHistory, addImageItem, deleteImageItem, renameImageItem } from "@/lib/media-history"

interface ImageGeneratorProps {
  models: PuterModel[]
}

export default function ImageGenerator({ models }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<MediaItem[]>([])
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setHistory(getImageHistory())
    const imageModels = models.filter(m => m.type === "image")
    if (imageModels.length > 0 && !selectedModel) {
      const online = imageModels.find(m => m.status === "online")
      setSelectedModel(online?.id || imageModels[0].id)
    }
  }, [models])

  useEffect(() => {
    if (isGenerating) {
      setProgress(0)
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          const remaining = 100 - prev
          const increment = remaining * 0.05
          const next = prev + increment + Math.random() * 2
          return Math.min(next, 95)
        })
      }, 500)
    } else {
      if (progressRef.current) clearInterval(progressRef.current)
      setProgress(0)
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [isGenerating])

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return
    setIsGenerating(true)
    setRetryCount(0)
    setError(null)

    const puter = (window as any).puter
    if (!puter?.ai?.txt2img) {
      setError("Puter.js image generation is not available. Make sure you are on a supported domain.")
      setIsGenerating(false)
      return
    }

    let attempt = 0
    const maxRetries = 8
    let imageUrl = ""
    let success = false

    while (attempt < maxRetries) {
      attempt++
      setRetryCount(attempt)
      try {
        // Per Puter.js docs: txt2img(prompt, { model: "..." }) for real generation
        // The second param is options object with model, NOT a boolean
        const result = await puter.ai.txt2img(prompt.trim(), { model: selectedModel })

        // result is an HTMLImageElement - get the src attribute
        if (result && typeof result.src === "string") {
          imageUrl = result.src
          success = true
          break
        } else if (result && typeof result === "string") {
          // Fallback: sometimes it might return a string URL directly
          imageUrl = result
          success = true
          break
        }
      } catch (err: any) {
        console.warn("Image attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (success && imageUrl) {
      const updated = addImageItem(prompt.trim(), imageUrl, selectedModel)
      setHistory(updated)
    } else {
      setError("Failed to generate image after " + maxRetries + " attempts. The model may be unavailable.")
    }

    setIsGenerating(false)
    setRetryCount(0)
    setProgress(100)
    setTimeout(() => setProgress(0), 500)
  }

  const handleDelete = (id: string) => {
    const updated = deleteImageItem(id)
    setHistory(updated)
    if (selectedImage?.id === id) setSelectedImage(null)
  }

  const handleRename = (id: string) => {
    if (editPrompt.trim()) {
      const updated = renameImageItem(id, editPrompt.trim())
      setHistory(updated)
    }
    setEditingId(null)
    setEditPrompt("")
  }

  const handleDownload = (url: string, prompt: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = "e-private-ai-" + prompt.slice(0, 30).replace(/\s+/g, "-") + ".png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Generator Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-pink-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Visual Synthesis</h2>
            <p className="text-xs text-gray-500">Generate stunning images with AI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create. The more detail you give, the better the result."
              rows={3}
              className="input-dark resize-none"
            />
          </div>

          <div className="w-64">
            <ModelSelector
              models={models}
              selected={selectedModel}
              onSelect={setSelectedModel}
              type="image"
              label="Model"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <AITimer
                isActive={isGenerating}
                estimatedSeconds={30}
                retryCount={retryCount > 0 ? retryCount : undefined}
                maxRetries={retryCount > 0 ? 8 : undefined}
              />
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 text-center">
                {progress < 30 ? "Getting everything ready..." : progress < 70 ? "Rendering your image..." : "Putting on the finishing touches..."}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:-translate-y-0.5"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isGenerating ? "Synthesizing..." : "Generate Image"}
          </button>
        </div>
      </div>

      {/* Selected Image Preview */}
      {selectedImage && (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {editingId === selectedImage.id ? (
                <input
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRename(selectedImage.id)}
                  onBlur={() => handleRename(selectedImage.id)}
                  autoFocus
                  className="input-dark"
                />
              ) : (
                <p className="text-sm text-gray-300">{selectedImage.prompt}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingId(selectedImage.id); setEditPrompt(selectedImage.prompt) }}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(selectedImage.url!, selectedImage.prompt)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-blue-400 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <img
            src={selectedImage.url}
            alt={selectedImage.prompt}
            className="w-full max-h-[600px] object-contain rounded-xl border border-white/5"
          />
        </div>
      )}

      {/* History Grid */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Creations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-pink-500/30 transition-all bg-discord-darker"
              >
                <img
                  src={item.url}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.model}</p>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}