"use client"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
  model?: string
}

export interface ChatRoom {
  id: string
  name: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  model: string
}

const MAX_ROOMS = 8
const STORAGE_VERSION = "v1"
const STORAGE_KEY = `e-private-ai-chat-rooms-${STORAGE_VERSION}`
const LEGACY_STORAGE_KEY = "e-private-ai-chat-rooms"

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function migrateLegacyData(): ChatRoom[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Migrate to new format
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: parsed }))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return parsed
    }
    return []
  } catch {
    return []
  }
}

function loadRooms(): ChatRoom[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Try legacy migration
      return migrateLegacyData()
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Old format without version wrapper - migrate
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: parsed }))
      return parsed
    }
    if (parsed.version && parsed.data) return parsed.data
    return []
  } catch {
    return []
  }
}

function saveRooms(rooms: ChatRoom[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, data: rooms }))
}

export function getRooms(): ChatRoom[] {
  return loadRooms()
}

export function createRoom(name?: string, model?: string): ChatRoom {
  const rooms = loadRooms()
  const newRoom: ChatRoom = {
    id: generateId(),
    name: name || `Chat ${rooms.length + 1}`,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: model || "",
  }

  const updated = [newRoom, ...rooms]
  if (updated.length > MAX_ROOMS) {
    updated.pop()
  }
  saveRooms(updated)
  return newRoom
}

export function deleteRoom(roomId: string): ChatRoom[] {
  const rooms = loadRooms().filter(r => r.id !== roomId)
  saveRooms(rooms)
  return rooms
}

export function renameRoom(roomId: string, newName: string): ChatRoom[] {
  const rooms = loadRooms().map(r =>
    r.id === roomId ? { ...r, name: newName, updatedAt: Date.now() } : r
  )
  saveRooms(rooms)
  return rooms
}

export function addMessage(roomId: string, message: Omit<ChatMessage, "id" | "timestamp">): ChatRoom | null {
  const rooms = loadRooms()
  const roomIndex = rooms.findIndex(r => r.id === roomId)
  if (roomIndex === -1) return null

  const msg: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: Date.now(),
  }

  const updatedRooms = rooms.map((r, i) =>
    i === roomIndex
      ? { ...r, messages: [...r.messages, msg], updatedAt: Date.now() }
      : r
  )
  saveRooms(updatedRooms)
  return updatedRooms[roomIndex]
}

export function clearRoomMessages(roomId: string): ChatRoom | null {
  const rooms = loadRooms()
  const roomIndex = rooms.findIndex(r => r.id === roomId)
  if (roomIndex === -1) return null

  const updatedRooms = rooms.map((r, i) =>
    i === roomIndex
      ? { ...r, messages: [], updatedAt: Date.now() }
      : r
  )
  saveRooms(updatedRooms)
  return updatedRooms[roomIndex]
}

export function updateRoomModel(roomId: string, model: string): ChatRoom | null {
  const rooms = loadRooms()
  const roomIndex = rooms.findIndex(r => r.id === roomId)
  if (roomIndex === -1) return null

  const updatedRooms = rooms.map((r, i) =>
    i === roomIndex
      ? { ...r, model, updatedAt: Date.now() }
      : r
  )
  saveRooms(updatedRooms)
  return updatedRooms[roomIndex]
}

export function getRoomById(roomId: string): ChatRoom | null {
  return loadRooms().find(r => r.id === roomId) || null
}