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

function detectModelType(model: any): "chat" | "image" | "video" | "audio" | "other" {
  const id = (model.id || "").toLowerCase()
  const name = (model.name || "").toLowerCase()
  const aliases = (model.aliases || []).map((a: string) => a.toLowerCase())
  const allText = id + " " + name + " " + aliases.join(" ")

  // Audio / speech
  const audioPatterns = ["audio", "speech", "tts", "voice", "sound", "transcribe", "transcription", "whisper"]
  if (audioPatterns.some(p => allText.includes(p))) return "audio"

  // Video
  const videoPatterns = [
    "video", "sora", "kling", "veo", "wan2.2", "wan-2.2", "wan_2_2",
    "text-to-video", "text2video", "t2v", "txt2vid", "videogen",
    "movie", "clip", "seedance", "hailuo", "vidu", "pixverse",
  ]
  if (videoPatterns.some(p => allText.includes(p))) return "video"

  // Image
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

  // Other non-chat
  const otherPatterns = ["embedding", "embed", "moderation", "classify", "classifier", "translate", "translation"]
  if (otherPatterns.some(p => allText.includes(p))) return "other"

  // Default to chat
  return "chat"
}

export async function fetchModelsWithRetry(maxRetries = 8, delayMs = 10000): Promise<PuterModel[]> {
  const puter = getPuter()
  if (!puter?.ai?.listModels) {
    console.warn("[E Private AI] Puter.js not loaded or listModels not available")
    return []
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const rawModels = await puter.ai.listModels()
      if (!Array.isArray(rawModels) || rawModels.length === 0) {
        throw new Error("Empty model list")
      }

      // Log raw models for debugging
      console.log("[E Private AI] Raw models from Puter.js (" + rawModels.length + " total):")
      rawModels.forEach((m: any) => {
        const detectedType = detectModelType(m)
        console.log("  " + m.id + " | " + (m.provider || "no-provider") + " | detected: " + detectedType + " | aliases: " + (m.aliases || []).join(", "))
      })

      const models: PuterModel[] = rawModels.map((m: any) => ({
        id: m.id || "",
        provider: m.provider || "unknown",
        name: m.name || m.id || "Unknown",
        type: detectModelType(m),
        aliases: m.aliases,
        context: m.context,
        max_tokens: m.max_tokens,
        cost: m.cost,
        status: "unknown" as const,
      })).filter((m: PuterModel) => m.id && m.type !== "audio" && m.type !== "other")

      console.log("[E Private AI] Filtered to " + models.length + " usable models:")
      console.log("  Chat: " + models.filter(m => m.type === "chat").length)
      console.log("  Image: " + models.filter(m => m.type === "image").length)
      console.log("  Video: " + models.filter(m => m.type === "video").length)

      cachedModels = models
      return models
    } catch (err) {
      console.warn("[E Private AI] Puter model fetch attempt " + attempt + "/" + maxRetries + " failed:", err)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
  }

  console.warn("[E Private AI] All retries failed, no models available")
  return []
}

async function checkWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T | "timeout"> {
  return Promise.race([
    fn(),
    new Promise<"timeout">((_, reject) => 
      setTimeout(() => reject("timeout"), timeoutMs)
    )
  ]).catch(() => "timeout" as const)
}

export async function checkModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.chat) return "unknown"

  try {
    const result = await checkWithTimeout(async () => {
      await puter.ai.chat("hi", { model: modelId })
      return "online"
    }, 5000)

    if (result === "timeout") return "unknown"
    return result
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist")) return "offline"
    if (msg.includes("timeout")) return "unknown"
    return "unknown"
  }
}

export async function checkImageModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2img) return "unknown"

  try {
    const result = await checkWithTimeout(async () => {
      await puter.ai.txt2img("test", { model: modelId })
      return "online"
    }, 5000)

    if (result === "timeout") return "unknown"
    return result
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist")) return "offline"
    if (msg.includes("timeout")) return "unknown"
    return "unknown"
  }
}

export async function checkVideoModelHealth(modelId: string): Promise<"online" | "offline" | "unknown"> {
  const puter = getPuter()
  if (!puter?.ai?.txt2vid) return "unknown"

  try {
    const result = await checkWithTimeout(async () => {
      await puter.ai.txt2vid("test", { model: modelId })
      return "online"
    }, 5000)

    if (result === "timeout") return "unknown"
    return result
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase()
    if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("credit")) return "online"
    if (msg.includes("not found") || msg.includes("invalid") || msg.includes("does not exist")) return "offline"
    if (msg.includes("timeout")) return "unknown"
    return "unknown"
  }
}

export function startHealthChecks(models: PuterModel[], intervalMs = 30000) {
  if (healthCheckInterval) clearInterval(healthCheckInterval)

  const updateHealth = async () => {
    // Run all checks in parallel instead of sequentially
    const checks = models.map(async (model) => {
      model.status = "checking"

      let result: "online" | "offline" | "unknown" = "unknown"
      if (model.type === "chat") {
        result = await checkModelHealth(model.id)
      } else if (model.type === "image") {
        result = await checkImageModelHealth(model.id)
      } else if (model.type === "video") {
        result = await checkVideoModelHealth(model.id)
      }

      model.status = result
    })

    // Notify listeners once after all checks complete
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
