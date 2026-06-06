"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Send, Copy, Trash2, Plus, MessageSquare, X, Edit2, Square, Sparkles, Clock } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import ModelSelector from "./ModelSelector"
import AITimer from "./AITimer"
import { PuterModel } from "@/lib/puter"
import {
  ChatRoom, ChatMessage,
  getRooms, createRoom, deleteRoom, renameRoom,
  addMessage, clearRoomMessages, updateRoomModel, getRoomById,
} from "@/lib/chat-rooms"

interface ChatInterfaceProps {
  models: PuterModel[]
}

export default function ChatInterface({ models }: ChatInterfaceProps) {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<boolean>(false)
  const activeRoomIdRef = useRef<string>("")

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  const activeRoom = rooms.find(r => r.id === activeRoomId)

  useEffect(() => {
    const loaded = getRooms()
    setRooms(loaded)
    if (loaded.length === 0) {
      const newRoom = createRoom("New Chat", getDefaultModel())
      setRooms([newRoom])
      setActiveRoomId(newRoom.id)
    } else {
      setActiveRoomId(loaded[0].id)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeRoom?.messages])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = "auto"
      ta.style.height = ta.scrollHeight + "px"
    }
  }, [input])

  function getDefaultModel(): string {
    const chatModels = models.filter(m => m.type === "chat")
    if (chatModels.length === 0) return "gpt-5-nano"
    const online = chatModels.find(m => m.status === "online")
    return online?.id || chatModels[0].id
  }

  const handleNewRoom = () => {
    const newRoom = createRoom(`Chat ${rooms.length + 1}`, getDefaultModel())
    setRooms(getRooms())
    setActiveRoomId(newRoom.id)
  }

  const handleDeleteRoom = (roomId: string) => {
    const updated = deleteRoom(roomId)
    setRooms(updated)
    if (activeRoomId === roomId && updated.length > 0) {
      setActiveRoomId(updated[0].id)
    }
  }

  const handleRenameRoom = (roomId: string) => {
    if (editName.trim()) {
      const updated = renameRoom(roomId, editName.trim())
      setRooms(updated)
    }
    setEditingRoom(null)
    setEditName("")
  }

  const handleClearRoom = (roomId: string) => {
    clearRoomMessages(roomId)
    setRooms(getRooms())
  }

  const handleModelChange = (modelId: string) => {
    if (!activeRoomId) return
    updateRoomModel(activeRoomId, modelId)
    setRooms(getRooms())
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeRoomIdRef.current || isGenerating) return

    const trimmed = input.trim()
    setInput("")
    abortRef.current = false

    const currentRoomId = activeRoomIdRef.current

    addMessage(currentRoomId, { role: "user", content: trimmed, model: activeRoom?.model })
    setRooms(getRooms())
    setIsGenerating(true)
    setRetryCount(0)

    const puter = (window as any).puter
    if (!puter?.ai?.chat) {
      addMessage(currentRoomId, { role: "assistant", content: "E AI is still getting ready. Give it a second and try again.", model: activeRoom?.model })
      setRooms(getRooms())
      setIsGenerating(false)
      return
    }

    const room = getRoomById(currentRoomId)
    const history = room?.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    })) || []

    const messages = [...history, { role: "user", content: trimmed }]

    let attempt = 0
    const maxRetries = 8
    let assistantContent = ""
    let success = false

    while (attempt < maxRetries && !abortRef.current) {
      attempt++
      setRetryCount(attempt)
      try {
        const stream = await puter.ai.chat(messages, {
          model: activeRoom?.model || getDefaultModel(),
          stream: true,
        })

        assistantContent = ""

        // Use iterator instead of for-await to avoid syntax issues
        const iterator = stream[Symbol.asyncIterator]()
        let done = false

        while (!done && !abortRef.current) {
          const { value: part, done: iterDone } = await iterator.next()
          done = iterDone || false

          if (part && part.text) {
            assistantContent += part.text
          }

          const currentRoomIdLive = activeRoomIdRef.current
          const currentRoom = getRoomById(currentRoomIdLive)
          if (currentRoom) {
            const tempMsg: ChatMessage = {
              id: "temp-" + Date.now(),
              role: "assistant",
              content: assistantContent,
              timestamp: Date.now(),
              model: activeRoom?.model,
            }
            const updatedRooms = getRooms().map(r =>
              r.id === currentRoomIdLive
                ? { ...r, messages: [...r.messages.filter(m => !m.id?.startsWith("temp-")), tempMsg] }
                : r
            )
            setRooms(updatedRooms)
          }
        }

        if (!abortRef.current) {
          success = true
          break
        }
      } catch (err: any) {
        console.warn("Chat attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries && !abortRef.current) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (!abortRef.current) {
      const finalRoomId = activeRoomIdRef.current
      if (success && assistantContent) {
        const allRooms = getRooms()
        const cleanedRooms = allRooms.map(r =>
          r.id === finalRoomId
            ? { ...r, messages: r.messages.filter(m => !m.id?.startsWith("temp-")) }
            : r
        )
        const tempKey = "e-private-ai-chat-rooms-v1-temp"
        if (typeof window !== "undefined") {
          localStorage.setItem(tempKey, JSON.stringify({ version: "v1", data: cleanedRooms }))
        }
        addMessage(finalRoomId, { role: "assistant", content: assistantContent, model: activeRoom?.model })
      } else {
        addMessage(finalRoomId, {
          role: "assistant",
          content: "E AI ran into a problem while generating a response. The model might be down right now. Try again in a moment or pick a different model from the dropdown above.",
          model: activeRoom?.model,
        })
      }
      setRooms(getRooms())
    }

    setIsGenerating(false)
    setRetryCount(0)
  }, [input, isGenerating, activeRoom?.model])

  const handleStop = () => {
    abortRef.current = true
    setIsGenerating(false)
    setRetryCount(0)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const estimateSeconds = () => {
    const model = activeRoom?.model || ""
    if (model.includes("opus") || model.includes("4-7")) return 15
    if (model.includes("sonnet") || model.includes("4-5")) return 8
    if (model.includes("flash") || model.includes("nano")) return 3
    if (model.includes("deepseek")) return 10
    if (model.includes("grok")) return 6
    return 5
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 bg-discord-darker border border-white/5 rounded-xl flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-white/5">
          <button
            onClick={handleNewRoom}
            className="flex items-center gap-2 w-full px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-sm text-white transition-all"
            aria-label="Create new chat room"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rooms.map(room => (
            <div
              key={room.id}
              onClick={() => setActiveRoomId(room.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeRoomId === room.id
                  ? "bg-purple-500/10 border border-purple-500/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
              role="button"
              tabIndex={0}
              aria-label={`Chat room: ${room.name}`}
            >
              <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                {editingRoom === room.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRenameRoom(room.id)}
                    onBlur={() => handleRenameRoom(room.id)}
                    autoFocus
                    className="w-full bg-black/30 border border-white/10 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                    aria-label="Edit room name"
                  />
                ) : (
                  <div className="text-sm text-white truncate">{room.name}</div>
                )}
                <div className="text-xs text-gray-600">{room.messages.length} messages</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setEditingRoom(room.id); setEditName(room.name) }}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white"
                  aria-label="Rename room"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleClearRoom(room.id) }}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-yellow-400"
                  aria-label="Clear room messages"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteRoom(room.id) }}
                  className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"
                  aria-label="Delete room"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-discord-darker border border-white/5 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white">{activeRoom?.name || "E AI"}</h2>
              <p className="text-xs text-gray-600">{activeRoom?.messages.length || 0} messages</p>
            </div>
          </div>
          <div className="w-56">
            <ModelSelector
              models={models}
              selected={activeRoom?.model || getDefaultModel()}
              onSelect={handleModelChange}
              type="chat"
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeRoom?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
                <Sparkles className="w-7 h-7 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold gradient-text mb-2">E AI</h3>
              <p className="text-gray-500 text-sm max-w-md">
                Start a conversation with E AI. Ask questions, get help with coding, brainstorm ideas, or just chat.
              </p>
            </div>
          )}
          {activeRoom?.messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-purple-500/10 border border-purple-500/20 text-white"
                    : "bg-white/5 border border-white/5 text-gray-200"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "")
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/
$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-blue-400" {...props}>
                              {children}
                            </code>
                          )
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.model && <span className="text-purple-500/60">· {msg.model}</span>}
                  </span>
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="p-1 hover:bg-white/10 rounded text-gray-600 hover:text-blue-400 transition-colors"
                    aria-label="Copy message to clipboard"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          {isGenerating && (
            <div className="mb-3">
              <AITimer
                isActive={isGenerating}
                estimatedSeconds={estimateSeconds()}
                retryCount={retryCount > 0 ? retryCount : undefined}
                maxRetries={retryCount > 0 ? 8 : undefined}
              />
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message E AI..."
                rows={1}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 resize-none max-h-32"
                aria-label="Message input"
              />
            </div>
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 transition-all"
                aria-label="Stop generation"
                title="Stop generation"
              >
                <Square className="w-5 h-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}