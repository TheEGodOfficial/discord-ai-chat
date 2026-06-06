"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import LoginButton from "@/components/LoginButton"
import ChatInterface from "@/components/ChatInterface"
import ImageGenerator from "@/components/ImageGenerator"
import VideoGenerator from "@/components/VideoGenerator"
import ModelsTab from "@/components/ModelsTab"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import {
  Loader2, Shield, Sparkles, ImageIcon, Video, MessageSquare, Cpu,
  Home, ChevronLeft, ChevronRight, Zap, Settings, Star, Crown
} from "lucide-react"
import { PuterModel, fetchModelsWithRetry, startHealthChecks, stopHealthChecks, subscribeHealth } from "@/lib/puter"

type Tab = "home" | "chat" | "image" | "video" | "models" | "settings"

function WorkspaceContent() {
  const { data: session, status } = useSession()
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [models, setModels] = useState<PuterModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab
    if (tab && ["home", "chat", "image", "video", "models", "settings"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (session?.user?.id && !roleChecked) {
      checkRole()
    }
  }, [session, roleChecked])

  useEffect(() => {
    let unsub: (() => void) | undefined

    async function loadModels() {
      const fetched = await fetchModelsWithRetry(8, 10000)
      setModels(fetched)
      setModelsLoading(false)
      startHealthChecks(fetched, 30000)
      unsub = subscribeHealth(updated => {
        setModels(updated)
      })
    }

    loadModels()
    return () => {
      stopHealthChecks()
      if (unsub) unsub()
    }
  }, [])

  const checkRole = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/check-role")
      const data = await res.json()
      setHasRole(data.hasRole)
    } catch (error) {
      console.error("Error checking role:", error)
      setHasRole(false)
    } finally {
      setLoading(false)
      setRoleChecked(true)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-discord-darkest">
        <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-discord-darkest flex flex-col items-center justify-center px-4">
        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in border border-gray-700/30">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-neon-purple/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">E Private AI</h1>
            <p className="text-gray-400 text-sm">
              Free AI tools built just for whitelisted users.
            </p>
          </div>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-discord-darkest">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon-purple mx-auto mb-4" />
          <p className="text-gray-400">Checking your Discord role...</p>
        </div>
      </div>
    )
  }

  if (hasRole === false) {
    return (
      <div className="min-h-screen bg-discord-darkest flex flex-col items-center justify-center px-4">
        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in border border-gray-700/30">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            Looks like you do not have the right role in the Discord server to use this app.
          </p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (hasRole === true) {
    return (
      <div className="min-h-screen bg-discord-darkest flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} flex-shrink-0 bg-discord-darker border-r border-white/5 flex flex-col transition-all duration-300`}>
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-white/5">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 font-bold text-lg text-white tracking-tight">E Private AI</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main</div>
            )}

            <button onClick={() => setActiveTab("home")} className={`sidebar-item w-full ${activeTab === "home" ? "active" : ""}`}>
              <Home className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Home</span>}
            </button>

            <button onClick={() => setActiveTab("chat")} className={`sidebar-item w-full ${activeTab === "chat" ? "active" : ""}`}>
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Chat Bot</span>}
            </button>

            <button onClick={() => setActiveTab("image")} className={`sidebar-item w-full ${activeTab === "image" ? "active" : ""}`}>
              <ImageIcon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Image Gen</span>}
            </button>

            <button onClick={() => setActiveTab("video")} className={`sidebar-item w-full ${activeTab === "video" ? "active" : ""}`}>
              <Video className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Video Gen</span>}
            </button>

            <button onClick={() => setActiveTab("models")} className={`sidebar-item w-full ${activeTab === "models" ? "active" : ""}`}>
              <Cpu className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>All Models</span>}
            </button>

            {!sidebarCollapsed && (
              <div className="px-3 mt-6 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">System</div>
            )}

            <button onClick={() => setActiveTab("settings")} className={`sidebar-item w-full ${activeTab === "settings" ? "active" : ""}`}>
              <Settings className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-3 border-t border-white/5">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : ""}`}>
              {session.user?.image ? (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-xs font-bold text-white">
                  {session.user?.name?.charAt(0) || "U"}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-500">Whitelisted</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 flex items-center justify-center border-t border-white/5 text-gray-500 hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-discord-darker/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="text-gray-500">Dashboard</span>
              <span className="text-gray-600">/</span>
              <span className="text-white capitalize">{activeTab}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                <Zap className="w-3.5 h-3.5 text-neon-purple" />
                <span className="text-xs text-gray-300">Puter.js</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <LoginButton />
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {modelsLoading && activeTab !== "settings" ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-neon-purple mx-auto mb-4" />
                  <p className="text-gray-400">Loading AI models...</p>
                  <p className="text-xs text-gray-600 mt-1">Connecting to Puter.js</p>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in max-w-7xl mx-auto">
                {activeTab === "home" && <DashboardHome models={models} onNavigate={setActiveTab} />}
                {activeTab === "chat" && (
                  <ErrorBoundary>
                    <ChatInterface models={models} />
                  </ErrorBoundary>
                )}
                {activeTab === "image" && (
                  <ErrorBoundary>
                    <ImageGenerator models={models} />
                  </ErrorBoundary>
                )}
                {activeTab === "video" && (
                  <ErrorBoundary>
                    <VideoGenerator models={models} />
                  </ErrorBoundary>
                )}
                {activeTab === "models" && (
                  <ErrorBoundary>
                    <ModelsTab models={models} onRefresh={(updatedModels) => startHealthChecks(updatedModels, 30000)} isChecking={models.some(m => m.status === "checking")} />
                  </ErrorBoundary>
                )}
                {activeTab === "settings" && <SettingsTab />}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  return null
}

// Dashboard Home Component
function DashboardHome({ models, onNavigate }: { models: PuterModel[], onNavigate: (tab: Tab) => void }) {
  const chatModels = models.filter(m => m.type === "chat")
  const imageModels = models.filter(m => m.type === "image")
  const videoModels = models.filter(m => m.type === "video")
  const onlineCount = models.filter(m => m.status === "online").length

  const quickActions = [
    { id: "chat" as Tab, label: "Chat Bot", desc: "AI Conversations", icon: MessageSquare, color: "from-purple-600 to-purple-800", borderColor: "border-purple-500/30" },
    { id: "image" as Tab, label: "Image Gen", desc: "Visual Synthesis", icon: ImageIcon, color: "from-pink-600 to-pink-800", borderColor: "border-pink-500/30" },
    { id: "video" as Tab, label: "Video Gen", desc: "Temporal Synthesis", icon: Video, color: "from-blue-600 to-blue-800", borderColor: "border-blue-500/30" },
    { id: "models" as Tab, label: "All Models", desc: "Browse & Status", icon: Cpu, color: "from-indigo-600 to-indigo-800", borderColor: "border-indigo-500/30" },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-gray-400 text-sm">Your AI workspace is ready. {onlineCount} models online.</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className={`glass-panel glass-panel-hover rounded-xl p-5 text-left border ${action.borderColor} group`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white">{action.label}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Stats */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Model Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Chat Models</span>
              </div>
              <span className="text-sm font-bold text-white">{chatModels.length}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full" style={{ width: `${chatModels.length > 0 ? (chatModels.length / models.length) * 100 : 0}%` }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-gray-300">Image Models</span>
              </div>
              <span className="text-sm font-bold text-white">{imageModels.length}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pink-500 to-pink-700 rounded-full" style={{ width: `${imageModels.length > 0 ? (imageModels.length / models.length) * 100 : 0}%` }} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Video Models</span>
              </div>
              <span className="text-sm font-bold text-white">{videoModels.length}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full" style={{ width: `${videoModels.length > 0 ? (videoModels.length / models.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">API Status</span>
              </div>
              <span className="badge badge-green">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">Models Loaded</span>
              </div>
              <span className="text-sm font-bold text-white">{models.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">Online Models</span>
              </div>
              <span className="text-sm font-bold text-white">{onlineCount}</span>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="glass-panel rounded-xl p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Info</h3>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <p className="text-purple-400 font-medium mb-1">Free Access</p>
              <p className="text-gray-500 text-xs">All AI models are free through Puter.js integration.</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <p className="text-blue-400 font-medium mb-1">Streaming</p>
              <p className="text-gray-500 text-xs">Chat responses stream in real-time for instant feedback.</p>
            </div>
            <div className="p-3 rounded-lg bg-pink-500/5 border border-pink-500/10">
              <p className="text-pink-400 font-medium mb-1">History</p>
              <p className="text-gray-500 text-xs">Last 8 chat rooms and media generations are saved locally.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Settings Tab
function SettingsTab() {
  const { data: session } = useSession()
  const [activeSettingsTab, setActiveSettingsTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your preferences and account details</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveSettingsTab("overview")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === "overview" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSettingsTab("appearance")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSettingsTab === "appearance" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          Appearance
        </button>
      </div>

      {activeSettingsTab === "overview" && (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img src={session.user.image} alt="" className="w-16 h-16 rounded-full border-2 border-purple-500/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-xl font-bold text-white">
                  {session?.user?.name?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">{session?.user?.name}</h3>
                <p className="text-sm text-gray-400">{session?.user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-purple">Enhanced</span>
                  <span className="badge badge-green">Whitelisted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Account Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Display Name</label>
                  <input type="text" value={session?.user?.name || ""} readOnly className="input-dark opacity-60" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                  <input type="text" value={session?.user?.email || ""} readOnly className="input-dark opacity-60" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Discord ID</label>
                  <input type="text" value={session?.user?.id || ""} readOnly className="input-dark opacity-60 font-mono text-xs" />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">System Security</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">Authentication</span>
                    <span className="badge badge-green">Active</span>
                  </div>
                  <p className="text-xs text-gray-500">Discord OAuth 2.0 with role verification</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">Session</span>
                    <span className="badge badge-blue">Valid</span>
                  </div>
                  <p className="text-xs text-gray-500">Managed by NextAuth.js</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSettingsTab === "appearance" && (
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Visual Theme</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Midnight", color: "from-purple-900 to-blue-900", active: true },
              { name: "Crimson", color: "from-red-900 to-purple-900", active: false },
              { name: "Ocean", color: "from-blue-900 to-cyan-900", active: false },
              { name: "Void", color: "from-gray-900 to-black", active: false },
            ].map(theme => (
              <button
                key={theme.name}
                className={`p-4 rounded-xl border-2 transition-all ${theme.active ? "border-purple-500" : "border-transparent hover:border-white/10"}`}
              >
                <div className={`w-full h-16 rounded-lg bg-gradient-to-br ${theme.color} mb-3`} />
                <p className={`text-sm font-medium ${theme.active ? "text-white" : "text-gray-400"}`}>{theme.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-discord-darkest">
        <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  )
}
