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

function getPuter(): any {
  if (typeof window === "undefined") return null
  return (window as any).puter
}

// === FULL IMAGE MODELS ===
const STATIC_IMAGE_MODELS: PuterModel[] = [
  // OpenAI
  { id: "gpt-image-2", provider: "OpenAI", name: "GPT Image 2", type: "image", status: "unknown" },
  { id: "gpt-image-1.5", provider: "OpenAI", name: "GPT Image 1.5", type: "image", status: "unknown" },
  { id: "gpt-image-1", provider: "OpenAI", name: "GPT Image 1", type: "image", status: "unknown" },
  { id: "gpt-image-1-mini", provider: "OpenAI", name: "GPT Image 1 Mini", type: "image", status: "unknown" },
  { id: "dall-e-3", provider: "OpenAI", name: "DALL-E 3", type: "image", status: "unknown" },
  // Black Forest Labs
  { id: "flux-1.1-pro", provider: "Black Forest Labs", name: "FLUX 1.1 Pro", type: "image", status: "unknown" },
  { id: "flux-1-pro", provider: "Black Forest Labs", name: "FLUX 1 Pro", type: "image", status: "unknown" },
  { id: "flux-dev", provider: "Black Forest Labs", name: "FLUX Dev", type: "image", status: "unknown" },
  { id: "flux-schnell", provider: "Black Forest Labs", name: "FLUX Schnell", type: "image", status: "unknown" },
  { id: "flux-2-dev", provider: "Black Forest Labs", name: "FLUX 2 Dev", type: "image", status: "unknown" },
  { id: "flux-2-pro", provider: "Black Forest Labs", name: "FLUX 2 Pro", type: "image", status: "unknown" },
  { id: "flux-2-klein-9b-base", provider: "Black Forest Labs", name: "FLUX 2 Klein 9B", type: "image", status: "unknown" },
  { id: "flux-2-flex", provider: "Black Forest Labs", name: "FLUX 2 Flex", type: "image", status: "unknown" },
  { id: "flux-2-max", provider: "Black Forest Labs", name: "FLUX 2 Max", type: "image", status: "unknown" },
  // Ideogram
  { id: "ideogram-3.0", provider: "Ideogram", name: "Ideogram 3.0", type: "image", status: "unknown" },
  { id: "ideogram-2.5", provider: "Ideogram", name: "Ideogram 2.5", type: "image", status: "unknown" },
  { id: "ideogram-2.0", provider: "Ideogram", name: "Ideogram 2.0", type: "image", status: "unknown" },
  // Google
  { id: "imagen-4.0-fast", provider: "Google", name: "Imagen 4.0 Fast", type: "image", status: "unknown" },
  { id: "imagen-3.0-fast", provider: "Google", name: "Imagen 3.0 Fast", type: "image", status: "unknown" },
  { id: "imagen-3.0", provider: "Google", name: "Imagen 3.0", type: "image", status: "unknown" },
  // Stability AI
  { id: "stable-diffusion-3-medium", provider: "Stability AI", name: "SD 3 Medium", type: "image", status: "unknown" },
  { id: "stable-diffusion-3-large", provider: "Stability AI", name: "SD 3 Large", type: "image", status: "unknown" },
  { id: "stable-diffusion-xl", provider: "Stability AI", name: "SD XL", type: "image", status: "unknown" },
  // xAI
  { id: "grok-imagine-image", provider: "xAI", name: "Grok Imagine", type: "image", status: "unknown" },
  { id: "grok-imagine-image-quality", provider: "xAI", name: "Grok Imagine Quality", type: "image", status: "unknown" },
  // Together
  { id: "together/flux-1-schnell", provider: "Together", name: "Together FLUX Schnell", type: "image", status: "unknown" },
  { id: "together/flux-1-dev", provider: "Together", name: "Together FLUX Dev", type: "image", status: "unknown" },
  { id: "together/sdxl", provider: "Together", name: "Together SDXL", type: "image", status: "unknown" },
  // Leonardo
  { id: "lucid-origin", provider: "Leonardo", name: "Lucid Origin", type: "image", status: "unknown" },
  { id: "phoenix-1.0", provider: "Leonardo", name: "Phoenix 1.0", type: "image", status: "unknown" },
  // Cloudflare
  { id: "cloudflare/flux-1-schnell", provider: "Cloudflare", name: "CF FLUX Schnell", type: "image", status: "unknown" },
  { id: "cloudflare/sdxl", provider: "Cloudflare", name: "CF SDXL", type: "image", status: "unknown" },
  // Replicate
  { id: "replicate/flux-schnell", provider: "Replicate", name: "Replicate FLUX Schnell", type: "image", status: "unknown" },
  { id: "replicate/flux-dev", provider: "Replicate", name: "Replicate FLUX Dev", type: "image", status: "unknown" },
  { id: "replicate/lucid-origin", provider: "Replicate", name: "Replicate Lucid Origin", type: "image", status: "unknown" },
  // Wan AI
  { id: "wan-2.6-image", provider: "Wan AI", name: "Wan 2.6 Image", type: "image", status: "unknown" },
  // ByteDance
  { id: "bytedance/seed", provider: "ByteDance", name: "ByteDance Seed", type: "image", status: "unknown" },
]

// === FULL VIDEO MODELS ===
const STATIC_VIDEO_MODELS: PuterModel[] = [
  // OpenAI
  { id: "sora-2", provider: "OpenAI", name: "Sora 2", type: "video", status: "unknown" },
  { id: "sora-2-pro", provider: "OpenAI", name: "Sora 2 Pro", type: "video", status: "unknown" },
  // Google
  { id: "veo-3.0-generate-001", provider: "Google", name: "Veo 3.0", type: "video", status: "unknown" },
  { id: "veo-3.0-fast-generate-001", provider: "Google", name: "Veo 3.0 Fast", type: "video", status: "unknown" },
  { id: "veo-3.1-generate-preview", provider: "Google", name: "Veo 3.1 Preview", type: "video", status: "unknown" },
  { id: "veo-3.1-fast-generate-preview", provider: "Google", name: "Veo 3.1 Fast Preview", type: "video", status: "unknown" },
  { id: "veo-3.1-lite-generate-preview", provider: "Google", name: "Veo 3.1 Lite", type: "video", status: "unknown" },
  { id: "veo-2.0-generate-001", provider: "Google", name: "Veo 2.0", type: "video", status: "unknown" },
  // Kling
  { id: "kling-2.1-pro", provider: "Kling", name: "Kling 2.1 Pro", type: "video", status: "unknown" },
  { id: "kling-2.1-master", provider: "Kling", name: "Kling 2.1 Master", type: "video", status: "unknown" },
  { id: "kling-2.0-pro", provider: "Kling", name: "Kling 2.0 Pro", type: "video", status: "unknown" },
  { id: "kling-2.0-master", provider: "Kling", name: "Kling 2.0 Master", type: "video", status: "unknown" },
  // Wan AI
  { id: "wan-2.7-t2v", provider: "Wan AI", name: "Wan 2.7 T2V", type: "video", status: "unknown" },
  { id: "wan-2.1-t2v", provider: "Wan AI", name: "Wan 2.1 T2V", type: "video", status: "unknown" },
  { id: "wan-2.2-t2v-a14b", provider: "Wan AI", name: "Wan 2.2 T2V A14B", type: "video", status: "unknown" },
  { id: "wan-2.2-i2v-a14b", provider: "Wan AI", name: "Wan 2.2 I2V A14B", type: "video", status: "unknown" },
  // Together
  { id: "together/ltx-video", provider: "Together", name: "Together LTX Video", type: "video", status: "unknown" },
  { id: "together/mochi-1", provider: "Together", name: "Together Mochi 1", type: "video", status: "unknown" },
  // Vidu
  { id: "vidu-2.0", provider: "Vidu", name: "Vidu 2.0", type: "video", status: "unknown" },
  { id: "vidu-q1", provider: "Vidu", name: "Vidu Q1", type: "video", status: "unknown" },
  // PixVerse
  { id: "pixverse-v5", provider: "PixVerse", name: "PixVerse V5", type: "video", status: "unknown" },
  // Other
  { id: "luma-dream-machine", provider: "Luma", name: "Dream Machine", type: "video", status: "unknown" },
  { id: "runway/gen-3", provider: "Runway", name: "Runway Gen-3", type: "video", status: "unknown" },
]

async function waitForPuter(maxWaitMs = 30000): Promise<boolean> {
  const start = Date.now()
  let delay = 100
  while (Date.now() - start < maxWaitMs) {
    const puter = getPuter()
    if (puter?.ai) return true
    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 2000)
  }
  return false
}

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  const staticModels = [...STATIC_IMAGE_MODELS, ...STATIC_VIDEO_MODELS]
  const puterReady = await waitForPuter(15000)

  if (!puterReady) {
    console.warn("[E Private AI] Puter.js did not load within 15s. Returning static models only.")
    cachedModels = staticModels
    return staticModels
  }

  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("[E Private AI] listModels not available. Returning static models only.")
    cachedModels = staticModels
    return staticModels
  }

  let chatModels: PuterModel[] = []
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawModels = await puter.ai.listModels()
      if (!Array.isArray(rawModels) || rawModels.length === 0) throw new Error("Empty model list")
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
      console.log("[E Private AI] Fetched " + chatModels.length + " chat models")
      break
    } catch (err) {
      console.warn("[E Private AI] Model fetch attempt " + attempt + "/" + maxRetries + " failed:", err)
      if (attempt < maxRetries) await new Promise(r => setTimeout(r, delayMs))
    }
  }

  const allModels = [...chatModels, ...staticModels]
  cachedModels = allModels
  return allModels
}

export async function streamChatResponse(
  messages: Array<{ role: string; content: string }>,
  model: string,
  onChunk: (text: string) => void,
  shouldAbort: () => boolean
): Promise<{ success: boolean; content: string }> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return { success: false, content: "" }
  try {
    const stream = await puter.ai.chat(messages, { model, stream: true })
    let content = ""
    const iterator = stream[Symbol.asyncIterator]()
    let done = false
    while (!done) {
      if (shouldAbort()) break
      const result = await iterator.next()
      done = result.done || false
      const part = result.value
      if (part && part.text) {
        content += part.text
        onChunk(content)
      }
    }
    return { success: !shouldAbort() && content.length > 0, content }
  } catch (err) {
    console.warn("Stream chat error:", err)
    return { success: false, content: "" }
  }
}

export function startHealthChecks(models: PuterModel[], _intervalMs = 30000) {
  // No-op: disabled to save credits
}

export function stopHealthChecks() {
  // No-op
}

export function subscribeHealth(callback: (models: PuterModel[]) => void) {
  return () => {}
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
