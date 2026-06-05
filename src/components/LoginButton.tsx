"use client"
import { signIn, signOut, useSession } from "next-auth/react"
import { LogIn, LogOut } from "lucide-react"

export default function LoginButton() {
  const { data: session } = useSession()

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    )
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-discord-blurple hover:bg-purple-600 text-white font-medium transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
    >
      <LogIn className="w-4 h-4" />
      Sign In with Discord
    </button>
  )
}
