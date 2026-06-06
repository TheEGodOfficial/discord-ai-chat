"use client"
import { useState } from "react"
import { PuterModel } from "@/lib/puter"
import { Cpu, Search, AlertCircle, CheckCircle, XCircle, HelpCircle, RefreshCw } from "lucide-react"

interface ModelsTabProps {
  models: PuterModel[]
  onRefresh?: (models: PuterModel[]) => void
  isChecking?: boolean
}

export default function ModelsTab({ models, onRefresh, isChecking }: ModelsTabProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "chat" | "image" | "video">("all")

  const filtered = models.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      (m.aliases || []).some(a => a.toLowerCase().includes(search.toLowerCase()))
    const matchesType = typeFilter === "all" || m.type === typeFilter
    return matchesSearch && matchesType
  })

  const statusIcon = (status?: string) => {
    switch (status) {
      case "online": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "offline": return <XCircle className="w-4 h-4 text-red-500" />
      case "checking": return <Cpu className="w-4 h-4 text-yellow-500 animate-pulse" />
      default: return <HelpCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const statusText = (status?: string) => {
    switch (status) {
      case "online": return "Online"
      case "offline": return "Offline"
      case "checking": return "Checking..."
      default: return "Unknown"
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case "chat": return "text-purple-400 border-purple-500/20 bg-purple-500/5"
      case "image": return "text-pink-400 border-pink-500/20 bg-pink-500/5"
      case "video": return "text-blue-400 border-blue-500/20 bg-blue-500/5"
      default: return "text-gray-400 border-white/10 bg-white/5"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">All Models</h2>
            <p className="text-xs text-gray-500">Every AI model available from Puter.js</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={() => onRefresh?.(models)}
            disabled={isChecking}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white hover:border-purple-500/30 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking..." : "Check Health"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded-lg bg-green-500/5 text-green-400 border border-green-500/10">
          Online: {models.filter(m => m.status === "online").length}
        </span>
        <span className="px-2 py-1 rounded-lg bg-red-500/5 text-red-400 border border-red-500/10">
          Offline: {models.filter(m => m.status === "offline").length}
        </span>
        <span className="px-2 py-1 rounded-lg bg-yellow-500/5 text-yellow-400 border border-yellow-500/10">
          Checking: {models.filter(m => m.status === "checking").length}
        </span>
        <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-400 border border-white/10">
          Unknown: {models.filter(m => m.status === "unknown").length}
        </span>
        <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10">
          Total: {models.length}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            type="text"
            placeholder="Search by name, ID, provider, or alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "chat", "image", "video"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${
                typeFilter === t
                  ? typeColor(t)
                  : "text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {models.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center border border-white/5">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No models loaded yet. Puter.js might still be initializing.</p>
          <p className="text-xs text-gray-700 mt-2">Open your browser console (F12) to see what Puter.js returned.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(model => (
          <div
            key={model.id}
            className="glass-panel glass-panel-hover p-4 rounded-xl border border-white/5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize border ${typeColor(model.type)}`}>
                  {model.type}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {statusIcon(model.status)}
                  <span>{statusText(model.status)}</span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-white mb-1">{model.name}</h3>
            <p className="text-xs text-gray-600 font-mono mb-3 break-all">{model.id}</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Provider</span>
                <span className="text-gray-300">{model.provider}</span>
              </div>

              {model.context && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Context</span>
                  <span className="text-gray-300">{model.context.toLocaleString()} tokens</span>
                </div>
              )}

              {model.max_tokens && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Tokens</span>
                  <span className="text-gray-300">{model.max_tokens.toLocaleString()}</span>
                </div>
              )}

              {model.cost && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost</span>
                  <span className="text-gray-300">
                    {model.cost.input}/{model.cost.output} per {model.cost.tokens.toLocaleString()} {model.cost.currency}
                  </span>
                </div>
              )}

              {model.aliases && model.aliases.length > 0 && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-gray-600 block mb-1">Aliases</span>
                  <div className="flex flex-wrap gap-1">
                    {model.aliases.map(alias => (
                      <span key={alias} className="px-1.5 py-0.5 bg-black/30 rounded text-gray-500 text-xs font-mono border border-white/5">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && models.length > 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No models match your search</p>
        </div>
      )}
    </div>
  )
}
