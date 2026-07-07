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

// --- FULL MODEL LISTS - all available models per provider ---
// Based on official Puter.js docs (docs.puter.com, developer.puter.com)
// Chat models come from puter.ai.listModels() dynamically
// Image and video models are statically defined since listModels() only returns chat models

// IMAGE MODELS - from developer.puter.com tutorials
// txt2img(prompt, { model: "gpt-image-2" }) - returns HTMLImageElement
const STATIC_IMAGE_MODELS: PuterModel[] = [
  // OpenAI
  { id: "gpt-image-2", provider: "OpenAI", name: "GPT Image 2", type: "image", status: "unknown" },
  { id: "gpt-image-1.5", provider: "OpenAI", name: "GPT Image 1.5", type: "image", status: "unknown" },
  { id: "gpt-image-1", provider: "OpenAI", name: "GPT Image 1", type: "image", status: "unknown" },
  { id: "gpt-image-1-mini", provider: "OpenAI", name: "GPT Image 1 Mini", type: "image", status: "unknown" },
  { id: "dall-e-3", provider: "OpenAI", name: "DALL-E 3", type: "image", status: "unknown" },
  // Black Forest Labs
  { id: "black-forest-labs/flux-1.1-pro", provider: "Black Forest Labs", name: "FLUX 1.1 Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-1-pro", provider: "Black Forest Labs", name: "FLUX 1 Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-dev", provider: "Black Forest Labs", name: "FLUX Dev", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-schnell", provider: "Black Forest Labs", name: "FLUX Schnell", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-2-dev", provider: "Black Forest Labs", name: "FLUX 2 Dev", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-2-pro", provider: "Black Forest Labs", name: "FLUX 2 Pro", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-2-klein-9b-base", provider: "Black Forest Labs", name: "FLUX 2 Klein 9B", type: "image", status: "unknown" },
  // Ideogram
  { id: "ideogram/ideogram-3.0", provider: "Ideogram", name: "Ideogram 3.0", type: "image", status: "unknown" },
  { id: "ideogram/ideogram-2.5", provider: "Ideogram", name: "Ideogram 2.5", type: "image", status: "unknown" },
  { id: "ideogram/ideogram-2.0", provider: "Ideogram", name: "Ideogram 2.0", type: "image", status: "unknown" },
  // Google
  { id: "google/imagen-4.0-fast", provider: "Google", name: "Imagen 4.0 Fast", type: "image", status: "unknown" },
  { id: "google/imagen-3.0-fast", provider: "Google", name: "Imagen 3.0 Fast", type: "image", status: "unknown" },
  { id: "google/imagen-3.0", provider: "Google", name: "Imagen 3.0", type: "image", status: "unknown" },
  // Stability AI
  { id: "stabilityai/stable-diffusion-3-medium", provider: "Stability AI", name: "SD 3 Medium", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-3-large", provider: "Stability AI", name: "SD 3 Large", type: "image", status: "unknown" },
  { id: "stabilityai/stable-diffusion-xl", provider: "Stability AI", name: "SD XL", type: "image", status: "unknown" },
  // xAI
  { id: "grok-imagine-image", provider: "xAI", name: "Grok Imagine", type: "image", status: "unknown" },
  { id: "grok-imagine-image-quality", provider: "xAI", name: "Grok Imagine Quality", type: "image", status: "unknown" },
  // Together
  { id: "together/flux-1-schnell", provider: "Together", name: "Together FLUX Schnell", type: "image", status: "unknown" },
  { id: "together/flux-1-dev", provider: "Together", name: "Together FLUX Dev", type: "image", status: "unknown" },
  { id: "together/sdxl", provider: "Together", name: "Together SDXL", type: "image", status: "unknown" },
  // Leonardo
  { id: "leonardoai/lucid-origin", provider: "Leonardo", name: "Lucid Origin", type: "image", status: "unknown" },
  { id: "leonardoai/phoenix-1.0", provider: "Leonardo", name: "Phoenix 1.0", type: "image", status: "unknown" },
  // Cloudflare
  { id: "cloudflare/flux-1-schnell", provider: "Cloudflare", name: "CF FLUX Schnell", type: "image", status: "unknown" },
  { id: "cloudflare/sdxl", provider: "Cloudflare", name: "CF SDXL", type: "image", status: "unknown" },
  // Replicate
  { id: "replicate/black-forest-labs/flux-schnell", provider: "Replicate", name: "Replicate FLUX Schnell", type: "image", status: "unknown" },
  { id: "replicate/black-forest-labs/flux-dev", provider: "Replicate", name: "Replicate FLUX Dev", type: "image", status: "unknown" },
  { id: "replicate/leonardoai/lucid-origin", provider: "Replicate", name: "Replicate Lucid Origin", type: "image", status: "unknown" },
]

// VIDEO MODELS - same pattern as image
// txt2vid(prompt, { model: "..." }) - returns HTMLVideoElement
const STATIC_VIDEO_MODELS: PuterModel[] = [
  // OpenAI
  { id: "sora-2", provider: "OpenAI", name: "Sora 2", type: "video", status: "unknown" },
  { id: "sora-2-pro", provider: "OpenAI", name: "Sora 2 Pro", type: "video", status: "unknown" },
  // Google
  { id: "veo-3.0-generate-001", provider: "Google", name: "Veo 3.0", type: "video", status: "unknown" },
  { id: "veo-3.0-fast-generate-001", provider: "Google", name: "Veo 3.0 Fast", type: "video", status: "unknown" },
  { id: "veo-3.1-generate-preview", provider: "Google", name: "Veo 3.1", type: "video", status: "unknown" },
  { id: "veo-3.1-fast-generate-preview", provider: "Google", name: "Veo 3.1 Fast", type: "video", status: "unknown" },
  { id: "veo-3.1-lite-generate-preview", provider: "Google", name: "Veo 3.1 Lite", type: "video", status: "unknown" },
  { id: "veo-2.0-generate-001", provider: "Google", name: "Veo 2.0", type: "video", status: "unknown" },
  // Kling
  { id: "kling-2.1-pro", provider: "Kling", name: "Kling 2.1 Pro", type: "video", status: "unknown" },
  { id: "kling-2.1-master", provider: "Kling", name: "Kling 2.1 Master", type: "video", status: "unknown" },
  { id: "kling-2.0-pro", provider: "Kling", name: "Kling 2.0 Pro", type: "video", status: "unknown" },
  { id: "kling-2.0-master", provider: "Kling", name: "Kling 2.0 Master", type: "video", status: "unknown" },
  // Wan AI
  { id: "wan-ai/wan2.7-t2v", provider: "Wan AI", name: "Wan 2.7 T2V", type: "video", status: "unknown" },
  { id: "wan-ai/wan2.1-t2v", provider: "Wan AI", name: "Wan 2.1 T2V", type: "video", status: "unknown" },
  // Together
  { id: "together/ltx-video", provider: "Together", name: "Together LTX Video", type: "video", status: "unknown" },
  { id: "together/mochi-1", provider: "Together", name: "Together Mochi 1", type: "video", status: "unknown" },
  // Other
  { id: "luma-dream-machine", provider: "Luma", name: "Dream Machine", type: "video", status: "unknown" },
  { id: "runway/gen-3", provider: "Runway", name: "Runway Gen 3", type: "video", status: "unknown" },
  { id: "pika/pika-2.0", provider: "Pika", name: "Pika 2.0", type: "video", status: "unknown" },
]

// Wait for Puter.js to be available with exponential backoff
async function waitForPuter(maxWaitMs = 30000): Promise<boolean> {
  const start = Date.now()
  let delay = 100

  while (Date.now() - start < maxWaitMs) {
    const puter = getPuter()
    if (puter?.ai) {
      return true
    }
    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 1.5, 2000)
  }
  return false
}

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  // Always include static models so UI isn't empty
  const staticModels = [...STATIC_IMAGE_MODELS, ...STATIC_VIDEO_MODELS]

  // Wait for Puter.js to load
  const puterReady = await waitForPuter(15000)

  if (!puterReady) {
    console.warn("[E Private AI] Puter.js did not load within 15s. Returning static models only.")
    cachedModels = staticModels
    return staticModels
  }

  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("[E Private AI] Puter.js loaded but listModels not available. Returning static models only.")
    cachedModels = staticModels
    return staticModels
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

  const allModels = [...chatModels, ...staticModels]
  cachedModels = allModels
  return allModels
}

// === STREAMING CHAT HELPER ===
// Extracted from component to avoid for-await syntax issues in JSX files.
// Per docs.puter.com: const resp = await puter.ai.chat('...', { model: '...', stream: true })
// for await (const part of resp) { console.log(part?.text) }
// We use manual iterator to avoid for-await in JSX.
export async function streamChatResponse(
  messages: Array<{ role: string; content: string }>,
  model: string,
  onChunk: (text: string) => void,
  shouldAbort: () => boolean
): Promise<{ success: boolean; content: string }> {
  const puter = getPuter()
  if (!puter?.ai?.chat) {
    return { success: false, content: "" }
  }

  try {
    // Per docs.puter.com: stream with { stream: true }
    const stream = await puter.ai.chat(messages, { model, stream: true })
    let content = ""

    // Manual async iterator - avoids for-await syntax issues
    const iterator = stream[Symbol.asyncIterator]()
    let done = false

    while (!done) {
      if (shouldAbort()) break
      const result = await iterator.next()
      done = result.done || false

      // Per docs.puter.com: part?.text
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

// === HEALTH CHECK SYSTEM ===
let healthCheckModels: PuterModel[] = []

async function checkChatModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return "unknown"

  try {
    // Use a simple non-streaming chat to check health
    // Per docs.puter.com: puter.ai.chat("hi", { model: "..." })
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const result = await Promise.race([
      puter.ai.chat("hi", { model: modelId }),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("timeout")))
      })
    ])

    clearTimeout(timeout)

    // If we got any response (even error about content), the endpoint is up
    if (result !== undefined) return "online"
    return "unknown"
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    // Rate limit / quota errors mean the endpoint is online but busy
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit") || msg.includes("busy")) return "online"
    // Model not found means the model ID is wrong or retired
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist") || msg.includes("no such")) return "offline"
    // Network/timeout issues
    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("network")) return "unknown"
    return "unknown"
  }
}

async function checkImageEndpointHealth(): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2img) return "unknown"

  try {
    // Per docs.puter.com: txt2img(prompt, true) for test mode (no credits used)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const result = await Promise.race([
      puter.ai.txt2img("a red circle", true),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("timeout")))
      })
    ])

    clearTimeout(timeout)

    // Test mode returns a result if the endpoint is available
    if (result !== undefined && result !== null) return "online"
    return "unknown"
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit") || msg.includes("busy")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist") || msg.includes("no such")) return "offline"
    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("network")) return "unknown"
    return "unknown"
  }
}

async function checkVideoEndpointHealth(): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2vid) return "unknown"

  try {
    // Same pattern as image: test mode with boolean true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    const result = await Promise.race([
      puter.ai.txt2vid("a red circle", true),
      new Promise((_, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("timeout")))
      })
    ])

    clearTimeout(timeout)

    if (result !== undefined && result !== null) return "online"
    return "unknown"
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit") || msg.includes("busy")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist") || msg.includes("no such")) return "offline"
    if (msg.includes("timeout") || msg.includes("abort") || msg.includes("network")) return "unknown"
    return "unknown"
  }
}

// IMMEDIATE notification for status changes (not debounced)
function notifyHealthListenersImmediate() {
  const freshModels = healthCheckModels.map(m => ({ ...m }))
  healthListeners.forEach(cb => cb(freshModels))
}

// Debounced notification for batch updates at end
let healthNotifyTimeout: NodeJS.Timeout | null = null

function debouncedNotifyHealthListeners() {
  if (healthNotifyTimeout) {
    clearTimeout(healthNotifyTimeout)
  }
  healthNotifyTimeout = setTimeout(() => {
    const freshModels = healthCheckModels.map(m => ({ ...m }))
    healthListeners.forEach(cb => cb(freshModels))
  }, 150)
}

export function startHealthChecks(models: PuterModel[], intervalMs = 30000) {
  stopHealthChecks()
  healthCheckModels = models.map(m => ({ ...m }))

  async function runChecks() {
    // Check chat models - set checking IMMEDIATELY so UI shows it
    const chatModels = healthCheckModels.filter(m => m.type === "chat")
    for (const m of chatModels) {
      const idx = healthCheckModels.findIndex(hm => hm.id === m.id)
      if (idx !== -1) {
        healthCheckModels[idx] = { ...healthCheckModels[idx], status: "checking" }
      }
    }
    notifyHealthListenersImmediate()

    // Check each chat model individually
    for (const model of chatModels) {
      const idx = healthCheckModels.findIndex(hm => hm.id === model.id)
      if (idx !== -1) {
        const status = await checkChatModelHealth(model.id)
        healthCheckModels[idx] = { ...healthCheckModels[idx], status }
        notifyHealthListenersImmediate()
      }
    }

    // Check image endpoint - set all image models to checking
    const imageModels = healthCheckModels.filter(m => m.type === "image")
    if (imageModels.length > 0) {
      for (const m of imageModels) {
        const idx = healthCheckModels.findIndex(hm => hm.id === m.id)
        if (idx !== -1) {
          healthCheckModels[idx] = { ...healthCheckModels[idx], status: "checking" }
        }
      }
      notifyHealthListenersImmediate()

      const imageStatus = await checkImageEndpointHealth()
      for (const m of imageModels) {
        const idx = healthCheckModels.findIndex(hm => hm.id === m.id)
        if (idx !== -1) {
          healthCheckModels[idx] = { ...healthCheckModels[idx], status: imageStatus }
        }
      }
      notifyHealthListenersImmediate()
    }

    // Check video endpoint - set all video models to checking
    const videoModels = healthCheckModels.filter(m => m.type === "video")
    if (videoModels.length > 0) {
      for (const m of videoModels) {
        const idx = healthCheckModels.findIndex(hm => hm.id === m.id)
        if (idx !== -1) {
          healthCheckModels[idx] = { ...healthCheckModels[idx], status: "checking" }
        }
      }
      notifyHealthListenersImmediate()

      const videoStatus = await checkVideoEndpointHealth()
      for (const m of videoModels) {
        const idx = healthCheckModels.findIndex(hm => hm.id === m.id)
        if (idx !== -1) {
          healthCheckModels[idx] = { ...healthCheckModels[idx], status: videoStatus }
        }
      }
      notifyHealthListenersImmediate()
    }

    // Final debounced batch to catch any stragglers
    debouncedNotifyHealthListeners()
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
