"use client"
import { useState, useRef, useEffect } from "react"
import { VideoIcon, Download, Trash2, Play, X, Edit2, Loader2, Film, Sparkles } from "lucide-react"
import ModelSelector from "./ModelSelector"
import AITimer from "./AITimer"
import { PuterModel } from "@/lib/puter"
import { MediaItem, getVideoHistory, addVideoItem, deleteVideoItem, renameVideoItem } from "@/lib/media-history"

interface VideoGeneratorProps {
  models: PuterModel[]
}

export default function VideoGenerator({ models }: VideoGeneratorProps) {
  const [prompt, setPrompt] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [history, setHistory] = useState<MediaItem[]>([])
  const [selectedVideo, setSelectedVideo] = useState<MediaItem | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(12).fill(0))
  const progressRef = useRef<NodeJS.Timeout | null>(null)
  const durationRef = useRef<NodeJS.Timeout | null>(null)
  const visualizerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setHistory(getVideoHistory())
    const videoModels = models.filter(m => m.type === "video")
    if (videoModels.length > 0 && !selectedModel) {
      const online = videoModels.find(m => m.status === "online")
      setSelectedModel(online?.id || videoModels[0].id)
    }
  }, [models])

  useEffect(() => {
    if (isGenerating) {
      setProgress(0)
      setDuration(0)
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          const remaining = 100 - prev
          const increment = remaining * 0.02
          const next = prev + increment + Math.random() * 1
          return Math.min(next, 98)
        })
      }, 1000)
      durationRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
      visualizerRef.current = setInterval(() => {
        setVisualizerBars(Array(12).fill(0).map(() => Math.random() * 100))
      }, 200)
    } else {
      if (progressRef.current) clearInterval(progressRef.current)
      if (durationRef.current) clearInterval(durationRef.current)
      if (visualizerRef.current) clearInterval(visualizerRef.current)
      setProgress(0)
      setDuration(0)
      setVisualizerBars(Array(12).fill(0))
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
      if (durationRef.current) clearInterval(durationRef.current)
      if (visualizerRef.current) clearInterval(visualizerRef.current)
    }
  }, [isGenerating])

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedModel || isGenerating) return
    setIsGenerating(true)
    setRetryCount(0)
    setError(null)

    const puter = (window as any).puter
    if (!puter?.ai?.txt2vid) {
      setError("Puter.js video generation is not available. Make sure you are on a supported domain.")
      setIsGenerating(false)
      return
    }

    let attempt = 0
    const maxRetries = 8
    let videoUrl = ""
    let success = false
    let finalDuration = 0

    while (attempt < maxRetries) {
      attempt++
      setRetryCount(attempt)
      try {
        // Per Puter.js docs: txt2vid(prompt, { model: "..." }) for real generation
        // The second param is options object with model, NOT a boolean
        const result = await puter.ai.txt2vid(prompt.trim(), { model: selectedModel })

        // result is an HTMLVideoElement - get the src attribute
        if (result && typeof result.src === "string") {
          videoUrl = result.src
          finalDuration = duration
          success = true
          break
        } else if (result && typeof result === "string") {
          // Fallback: sometimes it might return a string URL directly
          videoUrl = result
          finalDuration = duration
          success = true
          break
        }
      } catch (err: any) {
        console.warn("Video attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (success && videoUrl) {
      const updated = addVideoItem(prompt.trim(), videoUrl, selectedModel, finalDuration)
      setHistory(updated)
    } else {
      setError("Failed to generate video after " + maxRetries + " attempts. The model may be unavailable.")
    }

    setIsGenerating(false)
    setRetryCount(0)
    setProgress(100)
    setTimeout(() => setProgress(0), 500)
  }

  const handleDelete = (id: string) => {
    const updated = deleteVideoItem(id)
    setHistory(updated)
    if (selectedVideo?.id === id) setSelectedVideo(null)
  }

  const handleRename = (id: string) => {
    if (editPrompt.trim()) {
      const updated = renameVideoItem(id, editPrompt.trim())
      setHistory(updated)
    }
    setEditingId(null)
    setEditPrompt("")
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins + ":" + secs.toString().padStart(2, "0")
  }

  return (
    <div className="space-y-6">
      {/* Generator Panel */}
      <div className="glass-panel rounded-2xl p-6 border border-blue-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Temporal Synthesis</h2>
            <p className="text-xs text-gray-500">Generate videos with AI</p>
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
              placeholder="Describe the video you want to create. Be as detailed as possible for the best results."
              rows={3}
              className="input-dark resize-none"
            />
          </div>

          <div className="w-64">
            <ModelSelector
              models={models}
              selected={selectedModel}
              onSelect={setSelectedModel}
              type="video"
              label="Model"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {isGenerating && (
            <div className="space-y-3">
              <AITimer
                isActive={isGenerating}
                estimatedSeconds={120}
                retryCount={retryCount > 0 ? retryCount : undefined}
                maxRetries={retryCount > 0 ? 8 : undefined}
              />

              <div className="flex items-center gap-1 justify-center h-16">
                {visualizerBars.map((height, i) => (
                  <div
                    key={i}
                    className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-200"
                    style={{ height: `${Math.max(height * 0.6, 4)}px` }}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Duration: {formatDuration(duration)}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">
                  {progress < 20 ? "Getting everything ready..." : progress < 50 ? "Generating frames..." : progress < 80 ? "Rendering motion..." : "Putting on the finishing touches..."}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
            {isGenerating ? "Synthesizing..." : "Generate Video"}
          </button>
        </div>
      </div>

      {/* Selected Video Preview */}
      {selectedVideo && (
        <div className="glass-panel rounded-2xl p-6 border border-white/5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {editingId === selectedVideo.id ? (
                <input
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRename(selectedVideo.id)}
                  onBlur={() => handleRename(selectedVideo.id)}
                  autoFocus
                  className="input-dark"
                />
              ) : (
                <p className="text-sm text-gray-300">{selectedVideo.prompt}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingId(selectedVideo.id); setEditPrompt(selectedVideo.prompt) }}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(selectedVideo.id)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <video
            src={selectedVideo.url}
            controls
            className="w-full max-h-[500px] rounded-xl border border-white/5"
          />
          {selectedVideo.duration && (
            <p className="text-xs text-gray-600 mt-2">Duration: {formatDuration(selectedVideo.duration)}</p>
          )}
        </div>
      )}

      {/* History Grid */}
      {history.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Your Creations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedVideo(item)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all bg-discord-darker"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/40 group-hover:text-white/70 transition-colors" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.model}</p>
                    {item.duration && (
                      <p className="text-xs text-blue-400">{formatDuration(item.duration)}</p>
                    )}
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