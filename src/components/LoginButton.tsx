"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20 text-sm font-medium"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="flex items-center gap-2 px-6 py-3 bg-discord-blurple hover:bg-discord-blurple/90 text-white rounded-lg transition-all shadow-lg shadow-discord-blurple/20 font-medium"
    >
      <LogIn className="w-5 h-5" />
      Login with Discord
    </button>
  );
}