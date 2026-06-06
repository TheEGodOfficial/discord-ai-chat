"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import LoginButton from "@/components/LoginButton"
import { Loader2, Shield, Sparkles, ImageIcon, Video, MessageSquare, Zap, ChevronRight } from "lucide-react"

export default function Home() {
  const { data: session, status } = useSession()
  const [hasRole, setHasRole] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [roleChecked, setRoleChecked] = useState(false)

  useEffect(() => {
    if (session?.user?.id && !roleChecked) {
      checkRole()
    }
  }, [session, roleChecked])

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
      <div className="min-h-screen bg-discord-darkest flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="glass-panel p-10 max-w-md w-full text-center animate-fade-in relative z-10 border border-purple-500/10">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3">E Private AI</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              Free AI tools built exclusively for whitelisted users.
              <br />Chat, generate images, and create videos — all powered by Puter.js.
            </p>
          </div>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">30+ Chat Models</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-gray-400">30+ Image Models</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
              <Video className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">19+ Video Models</span>
            </div>
          </div>
          <LoginButton />
          <p className="mt-4 text-xs text-gray-600">Discord role verification required for access.</p>
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
        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in border border-red-500/10">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You do not have the required role in the Discord server to use this app.</p>
          <LoginButton />
        </div>
      </div>
    )
  }

  if (hasRole === true) {
    return (
      <div className="min-h-screen bg-discord-darkest flex flex-col items-center justify-center px-4">
        <div className="glass-panel p-10 max-w-lg w-full text-center animate-fade-in border border-purple-500/10">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3">Welcome Back</h1>
          <p className="text-gray-500 mb-8">Your AI workspace is ready. Head to the dashboard to start creating.</p>
          <a href="/workspace" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-medium transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5">
            <Zap className="w-5 h-5" />
            Open Dashboard
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    )
  }

  return null
}
