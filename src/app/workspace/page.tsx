"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import LoginButton from "@/components/LoginButton"
import ChatInterface from "@/components/ChatInterface"
import ImageGenerator from "@/components/ImageGenerator"
import VideoGenerator from "@/components/VideoGenerator"
import { Loader2, Shield, Sparkles, ImageIcon, Video, MessageSquare } from "lucide-react"
import { PuterModel, fetchModelsWithRetry, startHealthChecks, stopHealthChecks, subscribeHealth } from "@/lib/puter"

type Tab = "chat" | "image" | "video"

function WorkspaceContent() {
  const { data: session, status } = useSession()
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("chat")
  const [models, setModels] = useState<PuterModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab
    if (tab && ["chat", "image", "video"].includes(tab)) {
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
      unsub = subscribeHealth(updated => setModels(updated))
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
              Free AI Tools made for whitelisted users. Website made with Kiwi AI.
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
          <p className="text-gray-400">Verifying Discord role...</p>
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
            You do not have the required role in the Discord server to access this application.
          </p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (hasRole === true) {
    return (
      <div className="min-h-screen bg-discord-darkest flex flex-col">
        <header className="glass-panel border-b border-gray-700/30 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center shadow-lg shadow-neon-purple/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white">E Private AI</h1>
                <p className="text-xs text-gray-400">Powered by Puter.js</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-1 bg-discord-darker rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "chat"
                      ? "bg-neon-purple/20 text-white border border-neon-purple/30 shadow-lg shadow-neon-purple/10"
                      : "text-gray-400 hover:text-white hover:bg-discord-darkest"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "image"
                      ? "bg-neon-pink/20 text-white border border-neon-pink/30 shadow-lg shadow-neon-pink/10"
                      : "text-gray-400 hover:text-white hover:bg-discord-darkest"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "video"
                      ? "bg-neon-blue/20 text-white border border-neon-blue/30 shadow-lg shadow-neon-blue/10"
                      : "text-gray-400 hover:text-white hover:bg-discord-darkest"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video
                  </span>
                </button>
              </nav>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-discord-darker rounded-lg">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-white">{session.user?.name}</span>
                </div>
                <LoginButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {modelsLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-neon-purple mx-auto mb-4" />
                <p className="text-gray-400">Loading AI models...</p>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === "chat" && <ChatInterface models={models} />}
              {activeTab === "image" && <ImageGenerator models={models} />}
              {activeTab === "video" && <VideoGenerator models={models} />}
            </div>
          )}
        </main>
      </div>
    )
  }

  return null
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
