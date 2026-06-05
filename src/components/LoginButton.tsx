"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, Fingerprint } from "lucide-react";

export default function LoginButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 border border-red-500/20 text-sm font-medium hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      >
        <LogOut className="w-4 h-4" />
        Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn("discord")}
      className="group relative flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-xl transition-all duration-300 font-semibold shadow-neon hover:shadow-[0_0_30px_rgba(176,38,255,0.5),0_0_60px_rgba(0,243,255,0.2)] hover:-translate-y-0.5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <Fingerprint className="w-5 h-5 relative z-10" />
      <span className="relative z-10">Authenticate with Discord</span>
    </button>
  );
}