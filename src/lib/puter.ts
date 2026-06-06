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
// hard-coded here based on the official docs.

const STATIC_IMAGE_MODELS: PuterModel[] = [
  { id: "gpt-image-2", provider: "OpenAI", name: "GPT Image 2", type: "image", status: "unknown" },
  { id: "gpt-image-1.5", provider: "OpenAI", name: "GPT Image 1.5", type: "image", status: "unknown" },
  { id: "gpt-image-1", provider: "OpenAI", name: "GPT Image 1", type: "image", status: "unknown" },
  { id: "gpt-image-1-mini", provider: "OpenAI", name: "GPT Image 1 Mini", type: "image", status: "unknown" },
  { id: "dall-e-3", provider: "OpenAI", name: "DALL-E 3", type: "image", status: "unknown" },
  { id: "dall-e-2", provider: "OpenAI", name: "DALL-E 2", type: "image", status: "unknown" },
  { id: "gemini-3.1-flash-image-preview", provider: "Google", name: "Gemini 3.1 Flash Image", type: "image", status: "unknown" },
  { id: "gemini-3-pro-image-preview", provider: "Google", name: "Gemini 3 Pro Image", type: "image", status: "unknown" },
  { id: "gemini-2.5-flash-image-preview", provider: "Google", name: "Gemini 2.5 Flash Image", type: "image", status: "unknown" },
  { id: "google/flash-image-2.5", provider: "Google", name: "Flash Image 2.5", type: "image", status: "unknown" },
  { id: "google/imagen-4.0-fast", provider: "Google", name: "Imagen 4 Fast", type: "image", status: "unknown" },
  { id: "google/imagen-4.0-preview", provider: "Google", name: "Imagen 4 Preview", type: "image", status: "unknown" },
  { id: "google/imagen-4.0-ultra", provider: "Google", name: "Imagen 4 Ultra", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-schnell", provider: "Black Forest Labs", name: "FLUX.1 Schnell", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-1.1-pro", provider: "Black Forest Labs", name: "FLUX 1.1 Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX.1-Canny-pro", provider: "Black Forest Labs", name: "FLUX.1 Canny Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX.1-kontext-max", provider: "Black Forest Labs", name: "FLUX.1 Kontext Max", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX.1-kontext-pro", provider: "Black Forest Labs", name: "FLUX.1 Kontext Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/FLUX.1-krea-dev", provider: "Black Forest Labs", name: "FLUX.1 Krea Dev", type: "image", status: "unknown" },
  { id: "ByteDance-Seed/Seedream-3.0", provider: "ByteDance", name: "Seedream 3.0", type: "image", status: "unknown" },
  { id: "ByteDance-Seed/Seedream-4.0", provider: "ByteDance", name: "Seedream 4.0", type: "image", status: "unknown" },
  { id: "HiDream-ai/HiDream-I1-Dev", provider: "HiDream", name: "HiDream I1 Dev", type: "image", status: "unknown" },
  { id: "HiDream-ai/HiDream-I1-Fast", provider: "HiDream", name: "HiDream I1 Fast", type: "image", status: "unknown" },
  { id: "HiDream-ai/HiDream-I1-Full", provider: "HiDream", name: "HiDream I1 Full", type: "image", status: "unknown" },
  { id: "ideogram/ideogram-3.0", provider: "Ideogram", name: "Ideogram 3.0", type: "image", status: "unknown" },
  { id: "Qwen/Qwen-Image", provider: "Qwen", name: "Qwen Image", type: "image", status: "unknown" },
  { id: "Lykon/DreamShaper", provider: "Lykon", name: "DreamShaper", type: "image", status: "unknown" },
  { id: "RunDiffusion/Juggernaut-pro-flux", provider: "RunDiffusion", name: "Juggernaut Pro Flux", type: "image", status: "unknown" },
  { id: "Rundiffusion/Juggernaut-Lightning-Flux", provider: "RunDiffusion", name: "Juggernaut Lightning Flux", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-3-medium", provider: "Stability AI", name: "Stable Diffusion 3 Medium", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-xl-base-1.0", provider: "Stability AI", name: "Stable Diffusion XL", type: "image", status: "unknown" },
]

const STATIC_VIDEO_MODELS: PuterModel[] = [
  { id: "sora-2", provider: "OpenAI", name: "Sora 2", type: "video", status: "unknown" },
  { id: "sora-2-pro", provider: "OpenAI", name: "Sora 2 Pro", type: "video", status: "unknown" },
  { id: "veo-3.0-fast", provider: "Google", name: "Veo 3 Fast", type: "video", status: "unknown" },
  { id: "veo-3.0", provider: "Google", name: "Veo 3", type: "video", status: "unknown" },
  { id: "veo-3.0-fast-with-audio", provider: "Google", name: "Veo 3 Fast + Audio", type: "video", status: "unknown" },
  { id: "veo-3.0-with-audio", provider: "Google", name: "Veo 3 + Audio", type: "video", status: "unknown" },
  { id: "wan-ai/wan2.2-t2v-a14b", provider: "Wan AI", name: "Wan 2.2 T2V", type: "video", status: "unknown" },
  { id: "wan-ai/wan2.2-i2v-a14b", provider: "Wan AI", name: "Wan 2.2 I2V", type: "video", status: "unknown" },
  { id: "pixverse/pixverse-v5", provider: "PixVerse", name: "PixVerse V5", type: "video", status: "unknown" },
  { id: "kling-2.1-master", provider: "Kling", name: "Kling 2.1 Master", type: "video", status: "unknown" },
  { id: "kling-2.1-standard", provider: "Kling", name: "Kling 2.1 Standard", type: "video", status: "unknown" },
  { id: "kling-2.1-pro", provider: "Kling", name: "Kling 2.1 Pro", type: "video", status: "unknown" },
  { id: "kling-1.6-standard", provider: "Kling", name: "Kling 1.6 Standard", type: "video", status: "unknown" },
  { id: "kling-1.6-pro", provider: "Kling", name: "Kling 1.6 Pro", type: "video", status: "unknown" },
  { id: "vidu-2.0", provider: "Vidu", name: "Vidu 2.0", type: "video", status: "unknown" },
  { id: "seedance-1.0-lite", provider: "ByteDance", name: "Seedance 1.0 Lite", type: "video", status: "unknown" },
  { id: "seedance-1.0-pro", provider: "ByteDance", name: "Seedance 1.0 Pro", type: "video", status: "unknown" },
  { id: "minimax/hailuo-02", provider: "MiniMax", name: "Hailuo 02", type: "video", status: "unknown" },
  { id: "wan-ai/wan2.7-t2v", provider: "Wan AI", name: "Wan 2.7 T2V", type: "video", status: "unknown" },
]

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("[E Private AI] Puter.js not loaded or listModels not available")
    return [...STATIC_IMAGE_MODELS, ...STATIC_VIDEO_MODELS]
  }

  let chatModels: PuterModel[] = []

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawModels = await puter.ai.listModels()
      if (!Array.isArray(rawModels) || rawModels.length === 0) {
        throw new Error("Empty model list")
      }

      chatModels = rawModels.map((m: any) => ({
        id: m.id || "",
        provider: m.provider || "unknown",
        name: m.name || m.id || "Unknown",
        type: "chat" as const,
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

  const allModels = [...chatModels, ...STATIC_IMAGE_MODELS, ...STATIC_VIDEO_MODELS]
  cachedModels = allModels
  return allModels
}

// === HEALTH CHECK SYSTEM ===
let healthCheckModels: PuterModel[] = []

async function checkChatModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return "unknown"

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const result = await Promise.race([
      puter.ai.chat("hi", { model: modelId }),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("timeout")))
      })
    ])

    clearTimeout(timeout)

    if (result !== undefined) return "online"
    return "unknown"
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit") || msg.includes("busy")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist") || msg.includes("no such")) return "offline"
    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("network")) return "unknown"
    return "unknown"
  }
}

// Debounce health notifications to prevent UI flicker during sequential checks
let healthNotifyTimeout: NodeJS.Timeout | null = null
let pendingHealthModels: PuterModel[] | null = null

function debouncedNotifyHealthListeners() {
  if (healthNotifyTimeout) {
    clearTimeout(healthNotifyTimeout)
  }
  healthNotifyTimeout = setTimeout(() => {
    if (pendingHealthModels) {
      const freshModels = pendingHealthModels.map(m => ({ ...m }))
      healthListeners.forEach(cb => cb(freshModels))
      pendingHealthModels = null
    }
  }, 150) // Batch updates within 150ms window
}

function queueHealthNotification() {
  pendingHealthModels = healthCheckModels
  debouncedNotifyHealthListeners()
}

export function startHealthChecks(models: PuterModel[], intervalMs = 30000) {
  stopHealthChecks()
  healthCheckModels = models.map(m => ({ ...m }))

  async function runChecks() {
    const chatModels = healthCheckModels.filter(m => m.type === "chat")

    // Mark all as checking
    for (const m of chatModels) {
      m.status = "checking"
    }
    queueHealthNotification()

    // Check each model sequentially
    for (const model of chatModels) {
      model.status = await checkChatModelHealth(model.id)
      queueHealthNotification()
    }

    // Image/video: Mark as "online" if txt2img/txt2vid methods exist.
    // Note: Individual model availability is handled by Puter.js routing.
    // We mark as "online" to indicate the endpoint is available.
    const puter = getPuter()
    if (puter?.ai?.txt2img) {
      for (const m of healthCheckModels) {
        if (m.type === "image" && m.status === "unknown") {
          m.status = "online"
        }
      }
    }
    if (puter?.ai?.txt2vid) {
      for (const m of healthCheckModels) {
        if (m.type === "video" && m.status === "unknown") {
          m.status = "online"
        }
      }
    }
    queueHealthNotification()
  }

  runChecks()
  healthCheckInterval = setInterval(runChecks, intervalMs)
}

export function stopHealthChecks() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
    healthCheckInterval = null
  }
  if (healthNotifyTimeout) {
    clearTimeout(healthNotifyTimeout)
    healthNotifyTimeout = null
  }
  pendingHealthModels = null
}

export function subscribeHealth(callback: (models: PuterModel[]) => void) {
  healthListeners.add(callback)
  if (healthCheckModels.length > 0) {
    callback(healthCheckModels.map(m => ({ ...m })))
  }
  return () => healthListeners.delete(callback)
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
