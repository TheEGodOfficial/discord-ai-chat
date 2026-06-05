"use client"
import { useState, useRef, useEffect } from "react"
import { ImageIcon, Download, Trash2, Wand2, X, Edit2, Check, Loader2 } from "lucide-react"
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
  const progressRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setHistory(getImageHistory())
    const chatModels = models.filter(m => m.type === "image")
    if (chatModels.length > 0 && !selectedModel) {
      const online = chatModels.find(m => m.status === "online")
      setSelectedModel(online?.id || chatModels[0].id)
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

    const puter = (window as any).puter
    if (!puter?.ai?.txt2img) {
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
        const result = await puter.ai.txt2img(prompt.trim(), {
          model: selectedModel,
        })

        if (result && result.src) {
          imageUrl = result.src
          success = true
          break
        }
      } catch (err) {
        console.warn("Image attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (success && imageUrl) {
      const updated = addImageItem(prompt.trim(), imageUrl, selectedModel)
      setHistory(updated)
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-gray-700/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-pink to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-neon-pink/20">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Visual Synthesis</h2>
            <p className="text-xs text-gray-400">Generate stunning images with AI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create. The more detail you give, the better the result."
              rows={3}
              className="w-full bg-discord-darker border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-pink/50 resize-none"
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

          {isGenerating && (
            <div className="space-y-2">
              <AITimer
                isActive={isGenerating}
                estimatedSeconds={30}
                retryCount={retryCount > 0 ? retryCount : undefined}
                maxRetries={retryCount > 0 ? 8 : undefined}
              />
              <div className="w-full h-2 bg-discord-darkest rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-neon-pink to-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                {progress < 30 ? "Getting everything ready..." : progress < 70 ? "Rendering your image..." : "Putting on the finishing touches..."}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-pink to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neon-pink/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {isGenerating ? "Synthesizing..." : "Generate Image"}
          </button>
        </div>
      </div>

      {selectedImage && (
        <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {editingId === selectedImage.id ? (
                <input
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRename(selectedImage.id)}
                  onBlur={() => handleRename(selectedImage.id)}
                  autoFocus
                  className="bg-discord-darkest border border-gray-700/50 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neon-pink/50"
                />
              ) : (
                <p className="text-sm text-gray-300">{selectedImage.prompt}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingId(selectedImage.id); setEditPrompt(selectedImage.prompt) }}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(selectedImage.url!, selectedImage.prompt)}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-neon-blue transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <img
            src={selectedImage.url}
            alt={selectedImage.prompt}
            className="w-full max-h-[600px] object-contain rounded-xl border border-gray-700/30"
          />
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Creations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-gray-700/30 cursor-pointer hover:border-neon-pink/50 transition-all"
              >
                <img
                  src={item.url}
                  alt={item.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.model}</p>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
