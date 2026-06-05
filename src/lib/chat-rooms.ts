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
const STORAGE_KEY = "e-private-ai-chat-rooms"

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function loadRooms(): ChatRoom[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveRooms(rooms: ChatRoom[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
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

  rooms.unshift(newRoom)
  if (rooms.length > MAX_ROOMS) {
    rooms.pop()
  }
  saveRooms(rooms)
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
  const room = rooms.find(r => r.id === roomId)
  if (!room) return null

  const msg: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: Date.now(),
  }
  room.messages.push(msg)
  room.updatedAt = Date.now()
  saveRooms(rooms)
  return room
}

export function clearRoomMessages(roomId: string): ChatRoom | null {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (!room) return null
  room.messages = []
  room.updatedAt = Date.now()
  saveRooms(rooms)
  return room
}

export function updateRoomModel(roomId: string, model: string): ChatRoom | null {
  const rooms = loadRooms()
  const room = rooms.find(r => r.id === roomId)
  if (!room) return null
  room.model = model
  room.updatedAt = Date.now()
  saveRooms(rooms)
  return room
}

export function getRoomById(roomId: string): ChatRoom | null {
  return loadRooms().find(r => r.id === roomId) || null
}
