"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Check, AlertCircle } from "lucide-react"
import { PuterModel } from "@/lib/puter"

interface ModelSelectorProps {
  models: PuterModel[]
  selected: string
  onSelect: (id: string) => void
  type: "chat" | "image" | "video"
  label?: string
}

export default function ModelSelector({ models, selected, onSelect, type, label }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 320 })

  const filtered = models.filter(m => {
    if (m.type !== type) return false
    const q = search.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.provider.toLowerCase().includes(q)
    )
  })

  const grouped: Record<string, PuterModel[]> = {}
  filtered.forEach(m => {
    if (!grouped[m.provider]) grouped[m.provider] = []
    grouped[m.provider].push(m)
  })

  const selectedModel = models.find(m => m.id === selected)

  // Update dropdown position when opening
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const dropdownHeight = 400 // approximate max height

      // Check if dropdown would go below viewport - flip to top if needed
      let top = rect.bottom + 4
      if (top + dropdownHeight > viewportHeight && rect.top - dropdownHeight > 0) {
        top = rect.top - dropdownHeight - 4
      }

      setDropdownPos({
        top,
        left: rect.left,
        width: Math.max(rect.width, 320)
      })
    }
  }, [open])

  // Handle scroll and resize to update position dynamically
  useEffect(() => {
    if (!open) return

    const handleScroll = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const dropdownHeight = 400

        let top = rect.bottom + 4
        if (top + dropdownHeight > viewportHeight && rect.top - dropdownHeight > 0) {
          top = rect.top - dropdownHeight - 4
        }

        setDropdownPos({
          top,
          left: rect.left,
          width: Math.max(rect.width, 320)
        })
      }
    }

    window.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleScroll)
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  function getStatusColor(status?: string) {
    switch (status) {
      case "online": return "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
      case "offline": return "bg-red-500"
      case "checking": return "bg-yellow-500 animate-pulse"
      default: return "bg-gray-600"
    }
  }

  const typeColors = {
    chat: "border-purple-500/20 hover:border-purple-500/40",
    image: "border-pink-500/20 hover:border-pink-500/40",
    video: "border-blue-500/20 hover:border-blue-500/40",
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between w-full px-4 py-2.5 bg-black/30 border rounded-lg text-sm text-white transition-all ${typeColors[type]}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedModel?.status)}`} aria-hidden="true" />
          <span className="truncate">{selectedModel?.name || "Pick a model"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div 
          className="fixed z-[100] bg-discord-darker border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
          }}
          role="listbox"
          aria-label="Select AI model"
        >
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                aria-label="Search models"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(grouped).map(([provider, providerModels]) => (
              <div key={provider}>
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-discord-darkest/90 backdrop-blur text-xs font-bold text-purple-400 uppercase tracking-widest">
                  {provider}
                </div>
                {providerModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { onSelect(model.id); setOpen(false); setSearch("") }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                      selected === model.id ? "bg-white/5" : ""
                    }`}
                    role="option"
                    aria-selected={selected === model.id}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(model.status)} flex-shrink-0`} aria-hidden="true" />
                      <div>
                        <div className="text-sm text-white">{model.name}</div>
                        {model.context && (
                          <div className="text-xs text-gray-600">{model.context.toLocaleString()} context</div>
                        )}
                      </div>
                    </div>
                    {selected === model.id && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-600 text-center">
                <AlertCircle className="w-4 h-4 mx-auto mb-1" aria-hidden="true" />
                {models.length === 0 ? "Loading models from Puter.js..." : "No models match your search"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}