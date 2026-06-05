"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import LoginButton from "@/components/LoginButton"
import { Loader2, Shield, ImageIcon, Video, MessageSquare, Lock, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"

type Tab = "chat" | "image" | "video"

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
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-neon-purple/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in relative z-10 border border-gray-700/30">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-neon-purple/20 animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">E Private AI</h1>
            <p className="text-gray-400 text-sm">
              Free AI tools built just for whitelisted users. This site was made with Kiwi AI.
            </p>
          </div>
          <LoginButton />
          <p className="mt-4 text-sm text-gray-500">
            You will need a specific role in our Discord server to get in.
          </p>
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
      <div className="min-h-screen bg-discord-darkest">
        <div className="relative overflow-hidden border-b border-gray-700/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neon-purple/10 via-transparent to-transparent" />
          <div className="max-w-6xl mx-auto px-6 py-16 text-center relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-neon-purple/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">E Private AI</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Free AI tools built just for whitelisted users. This site was made with Kiwi AI.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/workspace?tab=image" className="group">
              <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 hover:border-neon-pink/50 transition-all hover:shadow-lg hover:shadow-neon-pink/10 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-neon-pink to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-neon-pink/20 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Image Gen</h3>
                <p className="text-sm text-gray-400">
                  Generate stunning images from text using a wide range of AI models. Pick the one that fits your style and watch your ideas come to life.
                </p>
                <div className="flex items-center gap-1 mt-4 text-neon-pink text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it out <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/workspace?tab=video" className="group">
              <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 hover:border-neon-blue/50 transition-all hover:shadow-lg hover:shadow-neon-blue/10 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-neon-blue to-neon-purple rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-neon-blue/20 group-hover:scale-110 transition-transform">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Video Gen</h3>
                <p className="text-sm text-gray-400">
                  Turn your prompts into videos with multiple AI models to choose from. Each model brings a different look and feel to your creations.
                </p>
                <div className="flex items-center gap-1 mt-4 text-neon-blue text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it out <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <Link href="/workspace?tab=chat" className="group">
              <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 hover:border-neon-purple/50 transition-all hover:shadow-lg hover:shadow-neon-purple/10 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-neon-purple/20 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Chat Bot</h3>
                <p className="text-sm text-gray-400">
                  Chat with E AI about anything under the sun. Ask questions, brainstorm ideas, get help with coding, or just vibe and see where the conversation goes.
                </p>
                <div className="flex items-center gap-1 mt-4 text-neon-purple text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Try it out <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            <div className="group">
              <div className="glass-panel p-6 rounded-2xl border border-gray-700/30 hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10 h-full">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">All Private</h3>
                <p className="text-sm text-gray-400">
                  Everything here is built exclusively for whitelisted members. You get access to premium AI tools that are not open to the public, completely free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
