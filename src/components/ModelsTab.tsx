"use client"
import { useState } from "react"
import { PuterModel } from "@/lib/puter"
import { Cpu, Search, AlertCircle, CheckCircle, XCircle, HelpCircle } from "lucide-react"

interface ModelsTabProps {
  models: PuterModel[]
}

export default function ModelsTab({ models }: ModelsTabProps) {
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
      default: return <HelpCircle className="w-4 h-4 text-gray-500" />
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
      case "chat": return "text-neon-purple border-neon-purple/30 bg-neon-purple/10"
      case "image": return "text-neon-pink border-neon-pink/30 bg-neon-pink/10"
      case "video": return "text-neon-blue border-neon-blue/30 bg-neon-blue/10"
      default: return "text-gray-400 border-gray-700/30 bg-gray-800/50"
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center shadow-lg shadow-neon-purple/20">
          <Cpu className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">All Models</h2>
          <p className="text-xs text-gray-400">Every AI model available from Puter.js</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, ID, provider, or alias..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-discord-darker border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-purple/50"
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
                  : "text-gray-400 border-gray-700/30 hover:border-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {models.length === 0 && (
        <div className="glass-panel p-8 rounded-2xl text-center border border-gray-700/30">
          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No models loaded yet. Puter.js might still be initializing.</p>
          <p className="text-xs text-gray-500 mt-2">Try refreshing the page or check the console for errors.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(model => (
          <div
            key={model.id}
            className="glass-panel p-4 rounded-xl border border-gray-700/30 hover:border-gray-600/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize border ${typeColor(model.type)}`}>
                  {model.type}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  {statusIcon(model.status)}
                  <span>{statusText(model.status)}</span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-white mb-1">{model.name}</h3>
            <p className="text-xs text-gray-500 font-mono mb-3 break-all">{model.id}</p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-300">{model.provider}</span>
              </div>

              {model.context && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Context</span>
                  <span className="text-gray-300">{model.context.toLocaleString()} tokens</span>
                </div>
              )}

              {model.max_tokens && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Tokens</span>
                  <span className="text-gray-300">{model.max_tokens.toLocaleString()}</span>
                </div>
              )}

              {model.cost && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span className="text-gray-300">
                    {model.cost.input}/{model.cost.output} per {model.cost.tokens.toLocaleString()} {model.cost.currency}
                  </span>
                </div>
              )}

              {model.aliases && model.aliases.length > 0 && (
                <div className="pt-2 border-t border-gray-700/30">
                  <span className="text-gray-500 block mb-1">Aliases</span>
                  <div className="flex flex-wrap gap-1">
                    {model.aliases.map(alias => (
                      <span key={alias} className="px-1.5 py-0.5 bg-discord-darkest rounded text-gray-400 text-xs font-mono">
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
          <AlertCircle className="w-6 h-6 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No models match your search</p>
        </div>
      )}
    </div>
  )
}
