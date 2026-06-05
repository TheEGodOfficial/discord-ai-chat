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
const IMAGE_STORAGE_KEY = "e-private-ai-image-history"
const VIDEO_STORAGE_KEY = "e-private-ai-video-history"

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function loadItems(key: string): MediaItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveItems(key: string, items: MediaItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(items))
}

export function getImageHistory(): MediaItem[] {
  return loadItems(IMAGE_STORAGE_KEY)
}

export function getVideoHistory(): MediaItem[] {
  return loadItems(VIDEO_STORAGE_KEY)
}

export function addImageItem(prompt: string, url: string, model: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY)
  const newItem: MediaItem = {
    id: generateId(),
    prompt,
    url,
    model,
    createdAt: Date.now(),
  }
  items.unshift(newItem)
  if (items.length > MAX_ITEMS) items.pop()
  saveItems(IMAGE_STORAGE_KEY, items)
  return items
}

export function addVideoItem(prompt: string, url: string, model: string, duration?: number): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY)
  const newItem: MediaItem = {
    id: generateId(),
    prompt,
    url,
    model,
    createdAt: Date.now(),
    duration,
  }
  items.unshift(newItem)
  if (items.length > MAX_ITEMS) items.pop()
  saveItems(VIDEO_STORAGE_KEY, items)
  return items
}

export function deleteImageItem(id: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY).filter(i => i.id !== id)
  saveItems(IMAGE_STORAGE_KEY, items)
  return items
}

export function deleteVideoItem(id: string): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY).filter(i => i.id !== id)
  saveItems(VIDEO_STORAGE_KEY, items)
  return items
}

export function renameImageItem(id: string, newPrompt: string): MediaItem[] {
  const items = loadItems(IMAGE_STORAGE_KEY).map(i =>
    i.id === id ? { ...i, prompt: newPrompt } : i
  )
  saveItems(IMAGE_STORAGE_KEY, items)
  return items
}

export function renameVideoItem(id: string, newPrompt: string): MediaItem[] {
  const items = loadItems(VIDEO_STORAGE_KEY).map(i =>
    i.id === id ? { ...i, prompt: newPrompt } : i
  )
  saveItems(VIDEO_STORAGE_KEY, items)
  return items
}
