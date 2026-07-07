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

// --- LATEST MODELS ONLY - per provider, per agent type ---
// Based on official Puter.js docs (docs.puter.com, developer.puter.com)
// and Anthropic docs (github.com/anthropics/skills)

// CHAT MODELS - these come from puter.ai.listModels() but we also define
// the latest ones as fallback in case listModels fails or returns stale data

// IMAGE MODELS - from developer.puter.com tutorials
// txt2img(prompt, { model: "gpt-image-2" }) - returns HTMLImageElement
const STATIC_IMAGE_MODELS: PuterModel[] = [
  { id: "gpt-image-2", provider: "OpenAI", name: "GPT Image 2", type: "image", status: "unknown" },
  { id: "dall-e-3", provider: "OpenAI", name: "DALL-E 3", type: "image", status: "unknown" },
  { id: "black-forest-labs/flux-1.1-pro", provider: "Black Forest Labs", name: "FLUX 1.1 Pro", type: "image", status: "unknown" },
  { id: "ideogram/ideogram-3.0", provider: "Ideogram", name: "Ideogram 3.0", type: "image", status: "unknown" },
]

// VIDEO MODELS - same pattern as image
// txt2vid(prompt, { model: "..." }) - returns HTMLVideoElement
const STATIC_VIDEO_MODELS: PuterModel[] = [
  { id: "sora-2", provider: "OpenAI", name: "Sora 2", type: "video", status: "unknown" },
  { id: "veo-3.0", provider: "Google", name: "Veo 3", type: "video", status: "unknown" },
  { id: "kling-2.1-pro", provider: "Kling", name: "Kling 2.1 Pro", type: "video", status: "unknown" },
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


// === HEALTH CHECK SYSTEM (DISABLED - no credit waste) ===
// Health checks removed to avoid wasting API credits.
// Models show as "unknown" until user tries to use them.
// Puter.js handles model availability on their end.

export function startHealthChecks(models: PuterModel[], _intervalMs = 30000) {
  // No-op: health checks disabled to save credits
  // All models remain at their current status (usually "unknown")
}

export function stopHealthChecks() {
  // No-op
}

export function subscribeHealth(callback: (models: PuterModel[]) => void) {
  // Return a no-op unsubscribe since we're not checking anymore
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