"use client"

export interface MediaItem {
  id: string
  prompt: string
  url?: string
  model: string
  createdAt: number
  duration?: number
}

const MAX_ITEMS = 8
const STORAGE_VERSION = "v1"
const IMAGE_STORAGE_KEY = `e-private-ai-image-history-${STORAGE_VERSION}`
const VIDEO_STORAGE_KEY = `e-private-ai-video-history-${STORAGE_VERSION}`
const LEGACY_IMAGE_KEY = "e-private-ai-image-history"
const LEGACY_VIDEO_KEY = "e-private-ai-video-history"

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function migrateLegacyItems(key: string, legacyKey: string): MediaItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(legacyKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data: parsed }))
      localStorage.removeItem(legacyKey)
      return parsed
    }
    return []
  } catch {
    return []
  }
}

function loadItems(key: string, legacyKey?: string): MediaItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw && legacyKey) {
      return migrateLegacyItems(key, legacyKey)
    }
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data: parsed }))
      return parsed
    }
    if (parsed.version && parsed.data) return parsed.data
    return []
  } catch {
    return []
  }
}

function saveItems(key: string, items: MediaItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, data: items }))
}

export function getImageHistory(): MediaItem[] {
  return loadItems(IMAGE_STORAGE_KEY, LEGACY_IMAGE_KEY)
}

export function getVideoHistory(): MediaItem[] {
  return loadItems(VIDEO_STORAGE_KEY, LEGACY_VIDEO_KEY)
}

export function addImageItem(prompt: string, url: string, model: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY, LEGACY_IMAGE_KEY)
  const newItem: MediaItem = {
    id: generateId(),
    prompt,
    url,
    model,
    createdAt: Date.now(),
  }
  const updated = [newItem, ...items]
  if (updated.length > MAX_ITEMS) updated.pop()
  saveItems(IMAGE_STORAGE_KEY, updated)
  return updated
}

export function addVideoItem(prompt: string, url: string, model: string, duration?: number): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY, LEGACY_VIDEO_KEY)
  const newItem: MediaItem = {
    id: generateId(),
    prompt,
    url,
    model,
    createdAt: Date.now(),
    duration,
  }
  const updated = [newItem, ...items]
  if (updated.length > MAX_ITEMS) updated.pop()
  saveItems(VIDEO_STORAGE_KEY, updated)
  return updated
}

export function deleteImageItem(id: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY, LEGACY_IMAGE_KEY).filter(i => i.id !== id)
  saveItems(IMAGE_STORAGE_KEY, items)
  return items
}

export function deleteVideoItem(id: string): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY, LEGACY_VIDEO_KEY).filter(i => i.id !== id)
  saveItems(VIDEO_STORAGE_KEY, items)
  return items
}

export function renameImageItem(id: string, newPrompt: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY, LEGACY_IMAGE_KEY).map(i =>
    i.id === id ? { ...i, prompt: newPrompt } : i
  )
  saveItems(IMAGE_STORAGE_KEY, items)
  return items
}

export function renameVideoItem(id: string, newPrompt: string): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY, LEGACY_VIDEO_KEY).map(i =>
    i.id === id ? { ...i, prompt: newPrompt } : i
  )
  saveItems(VIDEO_STORAGE_KEY, items)
  return items
}
