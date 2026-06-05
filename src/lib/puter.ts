"use client"

export interface PuterModel {
  id: string
  provider: string
  name: string
  type: "chat" | "image" | "video"
  aliases?: string[]
  context?: number
  max_tokens?: number
  cost?: {
    currency: string
    tokens: number
    input: number
    output: number
  }
  status?: "online" | "offline" | "checking" | "unknown"
}

const FALLBACK_CHAT_MODELS: PuterModel[] = [
  { id: "gpt-5-nano", provider: "openai", name: "GPT 5 Nano", type: "chat", context: 128000, status: "unknown" },
  { id: "claude-sonnet-4-5", provider: "claude", name: "Claude Sonnet 4.5", type: "chat", context: 200000, status: "unknown" },
  { id: "claude-opus-4-7", provider: "claude", name: "Claude Opus 4.7", type: "chat", context: 200000, status: "unknown" },
  { id: "gemini-3-5-flash", provider: "google", name: "Gemini 3.5 Flash", type: "chat", context: 1000000, status: "unknown" },
  { id: "gemini-3-1-pro", provider: "google", name: "Gemini 3.1 Pro", type: "chat", context: 2000000, status: "unknown" },
  { id: "deepseek-chat", provider: "deepseek", name: "DeepSeek Chat", type: "chat", context: 64000, status: "unknown" },
  { id: "x-ai/grok-4-3", provider: "xai", name: "Grok 4.3", type: "chat", context: 131072, status: "unknown" },
  { id: "x-ai/grok-4-1-fast", provider: "xai", name: "Grok 4.1 Fast", type: "chat", context: 131072, status: "unknown" },
  { id: "meta-llama/llama-4-maverick", provider: "meta", name: "Llama 4 Maverick", type: "chat", context: 128000, status: "unknown" },
  { id: "meta-llama/llama-3-1-405b-instruct", provider: "meta", name: "Llama 3.1 405B", type: "chat", context: 128000, status: "unknown" },
  { id: "mistralai/mistral-large-2", provider: "mistral", name: "Mistral Large 2", type: "chat", context: 128000, status: "unknown" },
  { id: "qwen/qwen-3-6", provider: "qwen", name: "Qwen 3.6", type: "chat", context: 128000, status: "unknown" },
  { id: "minimax/minimax-m3", provider: "minimax", name: "MiniMax M3", type: "chat", context: 256000, status: "unknown" },
  { id: "nousresearch/nemotron-3", provider: "nous", name: "Nemotron 3", type: "chat", context: 128000, status: "unknown" },
  { id: "cohere/command-r7b", provider: "cohere", name: "Command R7B", type: "chat", context: 128000, status: "unknown" },
  { id: "google/gemma-3-27b-it", provider: "google", name: "Gemma 3 27B", type: "chat", context: 128000, status: "unknown" },
]

const FALLBACK_IMAGE_MODELS: PuterModel[] = [
  { id: "openai/gpt-image-2", provider: "openai", name: "GPT Image 2", type: "image", status: "unknown" },
  { id: "openai/gpt-image-1-5", provider: "openai", name: "GPT Image 1.5", type: "image", status: "unknown" },
  { id: "openai/gpt-image-1", provider: "openai", name: "GPT Image 1", type: "image", status: "unknown" },
  { id: "dall-e-3", provider: "openai", name: "DALL-E 3", type: "image", status: "unknown" },
  { id: "dall-e-2", provider: "openai", name: "DALL-E 2", type: "image", status: "unknown" },
  { id: "google/gemini-3-1-flash-image", provider: "google", name: "Gemini 3.1 Flash Image", type: "image", status: "unknown" },
  { id: "google/gemini-3-pro-image-preview", provider: "google", name: "Gemini 3 Pro Image", type: "image", status: "unknown" },
  { id: "google/gemini-2-5-flash-image", provider: "google", name: "Gemini 2.5 Flash Image", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX-2-max", provider: "black-forest-labs", name: "FLUX 2 Max", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX-2-pro", provider: "black-forest-labs", name: "FLUX 2 Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-schnell", provider: "black-forest-labs", name: "FLUX Schnell", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-1-1-pro", provider: "black-forest-labs", name: "FLUX 1.1 Pro", type: "image", status: "unknown" },
  { id: "x-ai/grok-2-image", provider: "xai", name: "Grok 2 Image", type: "image", status: "unknown" },
  { id: "qwen/qwen-image-2-0", provider: "qwen", name: "Qwen Image 2.0", type: "image", status: "unknown" },
  { id: "qwen/qwen-image", provider: "qwen", name: "Qwen Image", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-3-medium", provider: "stabilityai", name: "Stable Diffusion 3", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-xl-base-1-0", provider: "stabilityai", name: "SDXL Base", type: "image", status: "unknown" },
  { id: "wan-ai/wan2-6-image", provider: "wan-ai", name: "Wan 2.6 Image", type: "image", status: "unknown" },
  { id: "ByteDance-Seed/Seedream-4-0", provider: "bytedance", name: "Seedream 4.0", type: "image", status: "unknown" },
  { id: "ideogram/ideogram-3-0", provider: "ideogram", name: "Ideogram 3.0", type: "image", status: "unknown" },
  { id: "google/imagen-4-0-ultra", provider: "google", name: "Imagen 4 Ultra", type: "image", status: "unknown" },
  { id: "google/imagen-4-0-fast", provider: "google", name: "Imagen 4 Fast", type: "image", status: "unknown" },
  { id: "HiDream-ai/HiDream-I1-Full", provider: "hidream", name: "HiDream I1 Full", type: "image", status: "unknown" },
  { id: "RunDiffusion/Juggernaut-pro-flux", provider: "rundiffusion", name: "Juggernaut Pro", type: "image", status: "unknown" },
]

const FALLBACK_VIDEO_MODELS: PuterModel[] = [
  { id: "wan-2-7-text-to-video", provider: "wan-ai", name: "Wan 2.7 Text to Video", type: "video", status: "unknown" },
  { id: "sora", provider: "openai", name: "Sora", type: "video", status: "unknown" },
  { id: "sora-2", provider: "openai", name: "Sora 2", type: "video", status: "unknown" },
  { id: "sora-2-pro", provider: "openai", name: "Sora 2 Pro", type: "video", status: "unknown" },
  { id: "kling-1-6-standard", provider: "kling", name: "Kling 1.6 Standard", type: "video", status: "unknown" },
  { id: "kling-1-6-pro", provider: "kling", name: "Kling 1.6 Pro", type: "video", status: "unknown" },
  { id: "google/veo-2", provider: "google", name: "Google Veo 2", type: "video", status: "unknown" },
  { id: "minimax/video-01", provider: "minimax", name: "MiniMax Video 01", type: "video", status: "unknown" },
]

let cachedModels: PuterModel[] | null = null
let lastFetchTime = 0
let healthCheckInterval: NodeJS.Timeout | null = null
let healthListeners: Set<(models: PuterModel[]) => void> = new Set()

function getPuter(): any {
  if (typeof window === "undefined") return null
  return (window as any).puter
}

function isChatModel(model: any): boolean {
  const id = (model.id || "").toLowerCase()
  const name = (model.name || "").toLowerCase()
  const excluded = ["image", "video", "audio", "speech", "tts", "embedding", "moderation", "classify"]
  if (excluded.some(e => id.includes(e) || name.includes(e))) return false
  return true
}

function isImageModel(model: any): boolean {
  const id = (model.id || "").toLowerCase()
  const name = (model.name || "").toLowerCase()
  return id.includes("image") || id.includes("dall") || id.includes("flux") || id.includes("sdxl") || id.includes("stable-diffusion") || id.includes("imagen") || id.includes("seedream") || id.includes("grok-2-image") || id.includes("ideogram") || id.includes("hidream") || id.includes("juggernaut") || id.includes("wan2.6") || id.includes("wan2-6")
}

function isVideoModel(model: any): boolean {
  const id = (model.id || "").toLowerCase()
  const name = (model.name || "").toLowerCase()
  return id.includes("video") || id.includes("sora") || id.includes("kling") || id.includes("veo") || name.includes("video")
}

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("Puter.js not loaded or listModels not available, using fallback")
    return [...FALLBACK_CHAT_MODELS, ...FALLBACK_IMAGE_MODELS, ...FALLBACK_VIDEO_MODELS]
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawModels = await puter.ai.listModels()
      if (!Array.isArray(rawModels) || rawModels.length === 0) {
        throw new Error("Empty model list")
      }

      const models: PuterModel[] = rawModels.map((m: any) => {
        let type: "chat" | "image" | "video" = "chat"
        if (isImageModel(m)) type = "image"
        else if (isVideoModel(m)) type = "video"
        else if (!isChatModel(m)) type = "chat"

        return {
          id: m.id,
          provider: m.provider || "unknown",
          name: m.name || m.id,
          type,
          aliases: m.aliases,
          context: m.context,
          max_tokens: m.max_tokens,
          cost: m.cost,
          status: "unknown" as const,
        }
      })

      cachedModels = models
      lastFetchTime = Date.now()
      return models
    } catch (err) {
      console.warn(`Puter model fetch attempt ${attempt}/${maxRetries} failed:`, err)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
  }

  console.warn("All retries failed, using fallback models")
  cachedModels = [...FALLBACK_CHAT_MODELS, ...FALLBACK_IMAGE_MODELS, ...FALLBACK_VIDEO_MODELS]
  lastFetchTime = Date.now()
  return cachedModels
}

export async function checkModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return "unknown"

  try {
    await puter.ai.chat("hi", { model: modelId, testMode: true })
    return "online"
  } catch (err: any) {
    if (err?.message?.includes("rate limit") || err?.message?.includes("quota")) return "online"
    if (err?.message?.includes("not found") || err?.message?.includes("invalid")) return "offline"
    return "unknown"
  }
}

export async function checkImageModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2img) return "unknown"

  try {
    await puter.ai.txt2img("test", { model: modelId, testMode: true })
    return "online"
  } catch (err: any) {
    if (err?.message?.includes("rate limit") || err?.message?.includes("quota")) return "online"
    if (err?.message?.includes("not found") || err?.message?.includes("invalid")) return "offline"
    return "unknown"
  }
}

export function startHealthChecks(models: PuterModel[], intervalMs = 30000) {
  if (healthCheckInterval) clearInterval(healthCheckInterval)

  const updateHealth = async () => {
    for (const model of models) {
      model.status = "checking"
      notifyHealthListeners(models)

      let result: "online" | "offline" | "unknown" = "unknown"
      if (model.type === "chat") {
        result = await checkModelHealth(model.id)
      } else if (model.type === "image") {
        result = await checkImageModelHealth(model.id)
      }

      model.status = result
      notifyHealthListeners(models)
    }
  }

  updateHealth()
  healthCheckInterval = setInterval(updateHealth, intervalMs)
}

export function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
}

export function subscribeHealth(callback: (models: PuterModel[]) => void) {
  healthListeners.add(callback)
  return () => healthListeners.delete(callback)
}

function notifyHealthListeners(models: PuterModel[]) {
  healthListeners.forEach(cb => cb([...models]))
}

export function getCachedModels(): PuterModel[] | null {
  return cachedModels
}

export function getModelsByType(type: "chat" | "image" | "video", models: PuterModel[]): PuterModel[] {
  return models.filter(m => m.type === type)
}

export function getDefaultModel(type: "chat" | "image" | "video", models: PuterModel[]): string {
  const typeModels = getModelsByType(type, models)
  if (typeModels.length === 0) return ""
  const online = typeModels.find(m => m.status === "online")
  if (online) return online.id
  return typeModels[0].id
}
