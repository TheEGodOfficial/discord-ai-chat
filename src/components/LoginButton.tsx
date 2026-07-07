"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut } from "lucide-react"

export default function LoginButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs font-medium"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5"
    >
      <LogIn className="w-4 h-4" />
      Sign In with Discord
    </button>
  )
}