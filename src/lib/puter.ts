"use client"

export interface PuterModel {
  id: string
  provider: string
  name: string
  type: "chat" | "image" | "video" | "audio" | "other"
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

let cachedModels: PuterModel[] | null = null
let healthCheckInterval: NodeJS.Timeout | null = null
let healthListeners: Set<(models: PuterModel[]) => void> = new Set()

function getPuter(): any {
  if (typeof window === "undefined") return null
  return (window as any).puter
}

// --- STATIC MODEL DEFINITIONS ---
// Puter.js listModels() ONLY returns chat models. Image and video models
// are exposed through separate endpoints (txt2img / txt2vid) and must be
// hard-coded here based on the official docs: https://developer.puter.com/ai/models

const STATIC_IMAGE_MODELS: PuterModel[] = [
  { id: "gpt-image-2", provider: "OpenAI", name: "GPT Image 2", type: "image", status: "online" },
  { id: "gpt-image-1.5", provider: "OpenAI", name: "GPT Image 1.5", type: "image", status: "online" },
  { id: "gpt-image-1", provider: "OpenAI", name: "GPT Image 1", type: "image", status: "online" },
  { id: "gpt-image-1-mini", provider: "OpenAI", name: "GPT Image 1 Mini", type: "image", status: "online" },
  { id: "dall-e-3", provider: "OpenAI", name: "DALL-E 3", type: "image", status: "online" },
  { id: "dall-e-2", provider: "OpenAI", name: "DALL-E 2", type: "image", status: "online" },
  { id: "gemini-3.1-flash-image-preview", provider: "Google", name: "Gemini 3.1 Flash Image", type: "image", status: "online" },
  { id: "gemini-3-pro-image-preview", provider: "Google", name: "Gemini 3 Pro Image", type: "image", status: "online" },
  { id: "gemini-2.5-flash-image-preview", provider: "Google", name: "Gemini 2.5 Flash Image", type: "image", status: "online" },
  { id: "google/flash-image-2.5", provider: "Google", name: "Flash Image 2.5", type: "image", status: "online" },
  { id: "google/imagen-4.0-fast", provider: "Google", name: "Imagen 4 Fast", type: "image", status: "online" },
  { id: "google/imagen-4.0-preview", provider: "Google", name: "Imagen 4 Preview", type: "image", status: "online" },
  { id: "google/imagen-4.0-ultra", provider: "Google", name: "Imagen 4 Ultra", type: "image", status: "online" },
  { id: "black-forest-labs/flux-schnell", provider: "Black Forest Labs", name: "FLUX.1 Schnell", type: "image", status: "online" },
  { id: "black-forest-labs/flux-1.1-pro", provider: "Black Forest Labs", name: "FLUX 1.1 Pro", type: "image", status: "online" },
  { id: "black-forest-labs/FLUX.1-Canny-pro", provider: "Black Forest Labs", name: "FLUX.1 Canny Pro", type: "image", status: "online" },
  { id: "black-forest-labs/FLUX.1-kontext-max", provider: "Black Forest Labs", name: "FLUX.1 Kontext Max", type: "image", status: "online" },
  { id: "black-forest-labs/FLUX.1-kontext-pro", provider: "Black Forest Labs", name: "FLUX.1 Kontext Pro", type: "image", status: "online" },
  { id: "black-forest-labs/FLUX.1-krea-dev", provider: "Black Forest Labs", name: "FLUX.1 Krea Dev", type: "image", status: "online" },
  { id: "ByteDance-Seed/Seedream-3.0", provider: "ByteDance", name: "Seedream 3.0", type: "image", status: "online" },
  { id: "ByteDance-Seed/Seedream-4.0", provider: "ByteDance", name: "Seedream 4.0", type: "image", status: "online" },
  { id: "HiDream-ai/HiDream-I1-Dev", provider: "HiDream", name: "HiDream I1 Dev", type: "image", status: "online" },
  { id: "HiDream-ai/HiDream-I1-Fast", provider: "HiDream", name: "HiDream I1 Fast", type: "image", status: "online" },
  { id: "HiDream-ai/HiDream-I1-Full", provider: "HiDream", name: "HiDream I1 Full", type: "image", status: "online" },
  { id: "ideogram/ideogram-3.0", provider: "Ideogram", name: "Ideogram 3.0", type: "image", status: "online" },
  { id: "Qwen/Qwen-Image", provider: "Qwen", name: "Qwen Image", type: "image", status: "online" },
  { id: "Lykon/DreamShaper", provider: "Lykon", name: "DreamShaper", type: "image", status: "online" },
  { id: "RunDiffusion/Juggernaut-pro-flux", provider: "RunDiffusion", name: "Juggernaut Pro Flux", type: "image", status: "online" },
  { id: "Rundiffusion/Juggernaut-Lightning-Flux", provider: "RunDiffusion", name: "Juggernaut Lightning Flux", type: "image", status: "online" },
  { id: "stabilityai/stable-diffusion-3-medium", provider: "Stability AI", name: "Stable Diffusion 3 Medium", type: "image", status: "online" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", provider: "Stability AI", name: "Stable Diffusion XL", type: "image", status: "online" },
]

const STATIC_VIDEO_MODELS: PuterModel[] = [
  { id: "sora-2", provider: "OpenAI", name: "Sora 2", type: "video", status: "online" },
  { id: "sora-2-pro", provider: "OpenAI", name: "Sora 2 Pro", type: "video", status: "online" },
  { id: "veo-3.0-fast", provider: "Google", name: "Veo 3 Fast", type: "video", status: "online" },
  { id: "veo-3.0", provider: "Google", name: "Veo 3", type: "video", status: "online" },
  { id: "veo-3.0-fast-with-audio", provider: "Google", name: "Veo 3 Fast + Audio", type: "video", status: "online" },
  { id: "veo-3.0-with-audio", provider: "Google", name: "Veo 3 + Audio", type: "video", status: "online" },
  { id: "wan-ai/wan2.2-t2v-a14b", provider: "Wan AI", name: "Wan 2.2 T2V", type: "video", status: "online" },
  { id: "wan-ai/wan2.2-i2v-a14b", provider: "Wan AI", name: "Wan 2.2 I2V", type: "video", status: "online" },
  { id: "pixverse/pixverse-v5", provider: "PixVerse", name: "PixVerse V5", type: "video", status: "online" },
  { id: "kling-2.1-master", provider: "Kling", name: "Kling 2.1 Master", type: "video", status: "online" },
  { id: "kling-2.1-standard", provider: "Kling", name: "Kling 2.1 Standard", type: "video", status: "online" },
  { id: "kling-2.1-pro", provider: "Kling", name: "Kling 2.1 Pro", type: "video", status: "online" },
  { id: "kling-1.6-standard", provider: "Kling", name: "Kling 1.6 Standard", type: "video", status: "online" },
  { id: "kling-1.6-pro", provider: "Kling", name: "Kling 1.6 Pro", type: "video", status: "online" },
  { id: "vidu-2.0", provider: "Vidu", name: "Vidu 2.0", type: "video", status: "online" },
  { id: "seedance-1.0-lite", provider: "ByteDance", name: "Seedance 1.0 Lite", type: "video", status: "online" },
  { id: "seedance-1.0-pro", provider: "ByteDance", name: "Seedance 1.0 Pro", type: "video", status: "online" },
  { id: "minimax/hailuo-02", provider: "MiniMax", name: "Hailuo 02", type: "video", status: "online" },
  { id: "wan-ai/wan2.7-t2v", provider: "Wan AI", name: "Wan 2.7 T2V", type: "video", status: "online" },
]

function detectModelType(model: any): "chat" | "image" | "video" | "audio" | "other" {
  const id = (model.id || "").toLowerCase()
  const name = (model.name || "").toLowerCase()
  const aliases = (model.aliases || []).map((a: string) => a.toLowerCase())
  const allText = id + " " + name + " " + aliases.join(" ")

  const audioPatterns = ["audio", "speech", "tts", "voice", "sound", "transcribe", "transcription", "whisper"]
  if (audioPatterns.some(p => allText.includes(p))) return "audio"

  const videoPatterns = [
    "video", "sora", "kling", "veo", "wan2.2", "wan-2.2", "wan_2_2",
    "text-to-video", "text2video", "t2v", "txt2vid", "videogen",
    "movie", "clip", "seedance", "hailuo", "vidu", "pixverse",
  ]
  if (videoPatterns.some(p => allText.includes(p))) return "video"

  const imagePatterns = [
    "image", "dall", "flux", "sdxl", "stable-diffusion", "stable_diffusion",
    "imagen", "seedream", "grok-2-image", "grok_2_image", "ideogram",
    "hidream", "juggernaut", "wan2.6", "wan-2.6", "wan_2_6",
    "txt2img", "text-to-image", "text2image", "t2i", "imgen", "picture",
    "photoreal", "anime", "cartoon", "portrait", "landscape",
    "dreamshaper", "lucid", "phoenix", "run-diffusion", "rundiffusion",
    "qwen-image", "gpt-image", "gemini-2.5-flash-image",
  ]
  if (imagePatterns.some(p => allText.includes(p))) return "image"

  const otherPatterns = ["embedding", "embed", "moderation", "classify", "classifier", "translate", "translation"]
  if (otherPatterns.some(p => allText.includes(p))) return "other"

  return "chat"
}

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("[E Private AI] Puter.js not loaded or listModels not available")
    // Return static models so the UI still works even if Puter isn't loaded yet
    return [...STATIC_IMAGE_MODELS, ...STATIC_VIDEO_MODELS]
  }

  let chatModels: PuterModel[] = []

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawModels = await puter.ai.listModels()
      if (!Array.isArray(rawModels) || rawModels.length === 0) {
        throw new Error("Empty model list")
      }

      console.log("[E Private AI] Raw models from Puter.js (" + rawModels.length + " total):")
      rawModels.forEach((m: any) => {
        const detectedType = detectModelType(m)
        console.log("  " + m.id + " | " + (m.provider || "no-provider") + " | detected: " + detectedType + " | aliases: " + (m.aliases || []).join(", "))
      })

      chatModels = rawModels.map((m: any) => ({
        id: m.id || "",
        provider: m.provider || "unknown",
        name: m.name || m.id || "Unknown",
        type: "chat" as const, // listModels ONLY returns chat models -- force type
        aliases: m.aliases,
        context: m.context,
        max_tokens: m.max_tokens,
        cost: m.cost,
        status: "unknown" as const,
      })).filter((m: PuterModel) => m.id)

      console.log("[E Private AI] Fetched " + chatModels.length + " chat models from Puter.js")
      break
    } catch (err) {
      console.warn("[E Private AI] Puter model fetch attempt " + attempt + "/" + maxRetries + " failed:", err)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
  }

  // Merge chat models from API with static image/video models
  const allModels = [
    ...chatModels,
    ...STATIC_IMAGE_MODELS,
    ...STATIC_VIDEO_MODELS,
  ]

  cachedModels = allModels
  return allModels
}

async function checkWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T | "timeout"> {
  return Promise.race([
    fn(),
    new Promise<"timeout">((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeoutMs)
    )
  ]).catch(() => "timeout" as const)
}

// Chat health check -- 15s timeout instead of 5s to avoid false "unknown" from cold starts
const CHAT_HEALTH_TIMEOUT = 15000

export async function checkModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return "unknown"

  try {
    const result = await checkWithTimeout(async () => {
      await puter.ai.chat("hi", { model: modelId })
      return "online" as const
    }, CHAT_HEALTH_TIMEOUT)

    if (result === "timeout") return "unknown"
    return result
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist")) return "offline"
    return "unknown"
  }
}

// Image health check -- do NOT do real generation (too slow + burns credits).
// If the txt2img method exists on Puter.js, assume the backend is up.
export async function checkImageModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2img) return "unknown"
  // Optionally you could do a testMode call with a 60s timeout here,
  // but Puter handles model availability server-side.
  return "online"
}

// Video health check -- same reasoning as image.
export async function checkVideoModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2vid) return "unknown"
  return "online"
}

export function startHealthChecks(models: PuterModel[], intervalMs = 30000) {
  if (healthCheckInterval) clearInterval(healthCheckInterval)

  const updateHealth = async () => {
    // Only health-check chat models (from listModels).
    // Image/video are static "online" -- real generation is too slow and
    // expensive to use as a health probe.
    const chatModels = models.filter(m => m.type === "chat")

    const checks = chatModels.map(async (model) => {
      model.status = "checking"
      model.status = await checkModelHealth(model.id)
    })

    await Promise.all(checks)
    notifyHealthListeners(models)
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
