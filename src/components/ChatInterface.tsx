"use client"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Send, Copy, Trash2, Plus, MessageSquare, X, Edit2, Square, Sparkles } from "lucide-react"
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

  const handleSend = async () => {
    if (!input.trim() || !activeRoomId || isGenerating) return

    const trimmed = input.trim()
    setInput("")

    addMessage(activeRoomId, { role: "user", content: trimmed, model: activeRoom?.model })
    setRooms(getRooms())
    setIsGenerating(true)
    setRetryCount(0)

    const puter = (window as any).puter
    if (!puter?.ai?.chat) {
      addMessage(activeRoomId, { role: "assistant", content: "E AI is still getting ready. Give it a second and try again.", model: activeRoom?.model })
      setRooms(getRooms())
      setIsGenerating(false)
      return
    }

    const room = getRoomById(activeRoomId)
    const history = room?.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content,
    })) || []

    const messages = [...history, { role: "user", content: trimmed }]

    let attempt = 0
    const maxRetries = 8
    let assistantContent = ""
    let success = false
    let stopped = false

    while (attempt < maxRetries && !stopped) {
      attempt++
      setRetryCount(attempt)
      try {
        const response = await puter.ai.chat(messages, {
          model: activeRoom?.model || getDefaultModel(),
          stream: true,
        })

        assistantContent = ""
        for await (const part of response) {
          if (stopped) break
          assistantContent += part?.text || ""
          const tempMsg: ChatMessage = {
            id: "temp-" + Date.now(),
            role: "assistant",
            content: assistantContent,
            timestamp: Date.now(),
            model: activeRoom?.model,
          }
          const currentRoom = getRoomById(activeRoomId)
          if (currentRoom) {
            currentRoom.messages = [...currentRoom.messages.filter(m => !m.id.startsWith("temp-")), tempMsg]
            setRooms(getRooms())
          }
        }

        if (!stopped) {
          success = true
          break
        }
      } catch (err) {
        console.warn("Chat attempt " + attempt + "/" + maxRetries + " failed:", err)
        if (attempt < maxRetries && !stopped) {
          await new Promise(r => setTimeout(r, 10000))
        }
      }
    }

    if (!stopped) {
      if (success && assistantContent) {
        const room2 = getRoomById(activeRoomId)
        if (room2) {
          room2.messages = room2.messages.filter(m => !m.id.startsWith("temp-"))
          addMessage(activeRoomId, { role: "assistant", content: assistantContent, model: activeRoom?.model })
        }
      } else {
        addMessage(activeRoomId, {
          role: "assistant",
          content: "E AI ran into a problem while generating a response. The model might be down right now. Try again in a moment or pick a different model from the dropdown above.",
          model: activeRoom?.model,
        })
      }
      setRooms(getRooms())
    }

    setIsGenerating(false)
    setRetryCount(0)
  }

  const handleStop = () => {
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
    <div className="flex h-[calc(100vh-80px)]">
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 bg-discord-darker border-r border-gray-700/30 flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-gray-700/30">
          <button
            onClick={handleNewRoom}
            className="flex items-center gap-2 w-full px-3 py-2 bg-neon-purple/20 hover:bg-neon-purple/30 border border-neon-purple/30 rounded-lg text-sm text-white transition-all"
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
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                activeRoomId === room.id
                  ? "bg-neon-purple/20 border border-neon-purple/30"
                  : "hover:bg-discord-darkest border border-transparent"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {editingRoom === room.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRenameRoom(room.id)}
                    onBlur={() => handleRenameRoom(room.id)}
                    autoFocus
                    className="w-full bg-discord-darkest border border-gray-700/50 rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-neon-purple/50"
                  />
                ) : (
                  <div className="text-sm text-white truncate">{room.name}</div>
                )}
                <div className="text-xs text-gray-500">{room.messages.length} messages</div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); setEditingRoom(room.id); setEditName(room.name) }}
                  className="p-1 hover:bg-discord-darkest rounded text-gray-400 hover:text-white"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleClearRoom(room.id) }}
                  className="p-1 hover:bg-discord-darkest rounded text-gray-400 hover:text-yellow-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); handleDeleteRoom(room.id) }}
                  className="p-1 hover:bg-discord-darkest rounded text-gray-400 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/30 bg-discord-darker/50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-discord-darkest rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-white">{activeRoom?.name || "E AI"}</h2>
              <p className="text-xs text-gray-500">{activeRoom?.messages.length || 0} messages</p>
            </div>
          </div>
          <div className="w-64">
            <ModelSelector
              models={models}
              selected={activeRoom?.model || getDefaultModel()}
              onSelect={handleModelChange}
              type="chat"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeRoom?.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-neon-purple/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold gradient-text mb-2">E AI</h3>
              <p className="text-gray-400 max-w-md">
                Start a conversation with E AI. Ask questions, get help with coding, brainstorm ideas, or just chat about whatever is on your mind.
              </p>
            </div>
          )}
          {activeRoom?.messages.map((msg, i) => (
            <div
              key={msg.id || i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-neon-purple/20 border border-neon-purple/30 text-white"
                    : "bg-discord-darker border border-gray-700/30 text-gray-200"
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
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-discord-darkest px-1.5 py-0.5 rounded text-sm text-neon-blue" {...props}>
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
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/20">
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                    {msg.model && ` · ${msg.model}`}
                  </span>
                  <button
                    onClick={() => handleCopy(msg.content)}
                    className="p-1 hover:bg-discord-darkest rounded text-gray-500 hover:text-neon-blue transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-gray-700/30 bg-discord-darker/50">
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
                className="w-full bg-discord-darker border border-gray-700/50 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50 resize-none max-h-32"
              />
            </div>
            {isGenerating ? (
              <button
                onClick={handleStop}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400 transition-all"
              >
                <Square className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-neon-purple hover:bg-purple-600 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-neon-purple/20"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
