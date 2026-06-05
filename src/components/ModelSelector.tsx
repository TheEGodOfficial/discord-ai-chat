"use client"
import { useState, useRef, useEffect } from "react"
import { ChevronDown, Search, Check, AlertCircle, Loader2 } from "lucide-react"
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
      case "online": return "bg-green-500"
      case "offline": return "bg-red-500"
      case "checking": return "bg-yellow-500 animate-pulse"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-2.5 bg-discord-darker border border-gray-700/50 rounded-lg text-sm text-white hover:border-neon-purple/50 transition-all"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${getStatusColor(selectedModel?.status)}`} />
          <span className="truncate">{selectedModel?.name || "Select a model"}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="fixed z-[100] mt-1 w-80 bg-discord-darker border border-gray-700/50 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0,
          }}
        >
          <div className="p-2 border-b border-gray-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-discord-darkest border border-gray-700/50 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50"
              />
            </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {Object.entries(grouped).map(([provider, providerModels]) => (
              <div key={provider}>
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-discord-darkest/90 backdrop-blur text-xs font-semibold text-neon-blue uppercase tracking-wider">
                  {provider}
                </div>
                {providerModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => { onSelect(model.id); setOpen(false); setSearch("") }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-discord-darkest transition-colors ${
                      selected === model.id ? "bg-discord-darkest/60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(model.status)} flex-shrink-0`} />
                      <div>
                        <div className="text-sm text-white">{model.name}</div>
                        {model.context && (
                          <div className="text-xs text-gray-500">{model.context.toLocaleString()} context</div>
                        )}
                      </div>
                    </div>
                    {selected === model.id && <Check className="w-4 h-4 text-neon-purple flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                No models found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
