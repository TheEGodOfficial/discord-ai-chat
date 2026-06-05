"use client"
import { useState, useRef, useEffect } from "react"
import { VideoIcon, Download, Trash2, Play, X, Edit2, Loader2, Film } from "lucide-react"
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

    const puter = (window as any).puter
    if (!puter?.ai?.txt2img) {
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
        const result = await puter.ai.txt2img(prompt.trim(), {
          model: selectedModel,
        })

        if (result && result.src) {
          videoUrl = result.src
          finalDuration = duration
          success = true
          break
        }
      } catch (err) {
        console.warn("Video attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (success && videoUrl) {
      const updated = addVideoItem(prompt.trim(), videoUrl, selectedModel, finalDuration)
      setHistory(updated)
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-gray-700/30">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center shadow-lg shadow-neon-blue/20">
            <VideoIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Temporal Synthesis</h2>
            <p className="text-xs text-gray-400">Generate videos with AI</p>
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
              placeholder="Describe the video you want to create. Be as detailed as possible for the best results."
              rows={3}
              className="w-full bg-discord-darker border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/50 resize-none"
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
                    className="w-2 bg-gradient-to-t from-neon-blue to-neon-purple rounded-full transition-all duration-200"
                    style={{ height: `${Math.max(height * 0.6, 4)}px` }}
                  />
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Duration: {formatDuration(duration)}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-discord-darkest rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {progress < 20 ? "Getting everything ready..." : progress < 50 ? "Generating frames..." : progress < 80 ? "Rendering motion..." : "Putting on the finishing touches..."}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-blue-400 hover:to-purple-400 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neon-blue/20"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
            {isGenerating ? "Synthesizing..." : "Generate Video"}
          </button>
        </div>
      </div>

      {selectedVideo && (
        <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {editingId === selectedVideo.id ? (
                <input
                  value={editPrompt}
                  onChange={e => setEditPrompt(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRename(selectedVideo.id)}
                  onBlur={() => handleRename(selectedVideo.id)}
                  autoFocus
                  className="bg-discord-darkest border border-gray-700/50 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-neon-blue/50"
                />
              ) : (
                <p className="text-sm text-gray-300">{selectedVideo.prompt}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingId(selectedVideo.id); setEditPrompt(selectedVideo.prompt) }}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(selectedVideo.id)}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <video
            src={selectedVideo.url}
            controls
            className="w-full max-h-[500px] rounded-xl border border-gray-700/30"
          />
          {selectedVideo.duration && (
            <p className="text-xs text-gray-500 mt-2">Duration: {formatDuration(selectedVideo.duration)}</p>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Creations</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedVideo(item)}
                className="group relative aspect-video rounded-xl overflow-hidden border border-gray-700/30 cursor-pointer hover:border-neon-blue/50 transition-all bg-discord-darker"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/50 group-hover:text-white/80 transition-colors" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs text-white line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-gray-400 mt-1">{item.model}</p>
                    {item.duration && (
                      <p className="text-xs text-neon-blue">{formatDuration(item.duration)}</p>
                    )}
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
