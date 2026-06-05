"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";
import LoginButton from "@/components/LoginButton";
import ChatInterface from "@/components/ChatInterface";
import ImageGenerator from "@/components/ImageGenerator";
import VideoGenerator from "@/components/VideoGenerator";
import { Loader2, Shield, Sparkles, Image, Video, Zap, Orbit } from "lucide-react";

type Tab = "chat" | "image" | "video";

const TAB_STORAGE_KEY = "ai-active-tab";

export default function Home() {
  const { data: session, status } = useSession();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(TAB_STORAGE_KEY) as Tab) || "chat";
    }
    return "chat";
  });
  const [loading, setLoading] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const roleCheckInProgress = useRef(false);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  const checkRole = useCallback(async () => {
    if (roleCheckInProgress.current || roleChecked) return;
    roleCheckInProgress.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/check-role");
      const data = await res.json();
      setHasRole(data.hasRole);
    } catch (error) {
      console.error("Error checking role:", error);
      setHasRole(false);
    } finally {
      setLoading(false);
      setRoleChecked(true);
      roleCheckInProgress.current = false;
    }
  }, [roleChecked]);

  useEffect(() => {
    if (session?.user?.id && !roleChecked && status === "authenticated") {
      checkRole();
    }
  }, [session, status, roleChecked, checkRole]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "unauthenticated" && hasRole !== null) {
        setHasRole(null);
        setRoleChecked(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status, hasRole]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-neon-purple/30 border-t-neon-purple animate-spin" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-neon-blue/20 border-t-neon-blue animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 grid-bg relative overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neon-purple/30 rounded-full animate-float" style={{ animationDelay: '0s' }} />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-neon-blue/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-neon-pink/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-neon-purple/40 rounded-full animate-float" style={{ animationDelay: '3s' }} />
        </div>

        <div className="glass-panel p-10 max-w-md w-full text-center animate-fade-in relative z-10">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl rotate-3 opacity-50 blur-xl animate-pulse-glow" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-neon-purple via-neon-blue to-neon-pink rounded-2xl flex items-center justify-center shadow-neon">
                <Orbit className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-3">NEXUS AI</h1>
            <p className="text-gray-400 text-sm tracking-wide">Discord-verified AI workspace</p>
          </div>

          <div className="space-y-4">
            <LoginButton />
            <p className="text-xs text-gray-500">
              Requires verified Discord role for access
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-neon-purple" />
              30+ Models
            </span>
            <span className="flex items-center gap-1">
              <Image className="w-3 h-3 text-neon-blue" />
              Text-to-Image
            </span>
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3 text-neon-pink" />
              Text-to-Video
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-neon-purple/30 border-t-neon-purple animate-spin" />
            <div className="absolute inset-2 rounded-full border-2 border-neon-blue/20 border-t-neon-blue animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
          <p className="text-gray-400 text-sm">Verifying neural link...</p>
        </div>
      </div>
    );
  }

  if (hasRole === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 grid-bg">
        <div className="glass-panel p-10 max-w-md w-full text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
            <Shield className="relative w-20 h-20 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-8">
            Neural link rejected. Your Discord account lacks the required clearance level.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  if (hasRole === true) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-black">
        {/* Header */}
        <header className="glass-panel border-b border-[rgba(176,38,255,0.15)] px-6 py-3 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl opacity-50 blur-lg animate-pulse-glow" />
                <div className="relative w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center shadow-neon">
                  <Orbit className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-wide">NEXUS AI</h1>
                <p className="text-xs text-gray-500">Powered by Puter.js</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <nav className="flex gap-1 bg-surface-dark rounded-xl p-1 border border-[rgba(176,38,255,0.1)]">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "chat"
                      ? "tab-active"
                      : "text-gray-400 hover:text-white hover:bg-[rgba(176,38,255,0.1)]"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "image"
                      ? "tab-active"
                      : "text-gray-400 hover:text-white hover:bg-[rgba(0,243,255,0.1)]"
                  }`}
                >
                  <Image className="w-4 h-4" />
                  Image
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    activeTab === "video"
                      ? "tab-active"
                      : "text-gray-400 hover:text-white hover:bg-[rgba(255,0,170,0.1)]"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Video
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-dark rounded-xl border border-[rgba(176,38,255,0.15)]">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full ring-2 ring-neon-purple/30"
                    />
                  )}
                  <span className="text-sm font-medium">{session.user?.name}</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                </div>
                <LoginButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-6">
          <div className="animate-slide-up">
            {activeTab === "chat" && <ChatInterface />}
            {activeTab === "image" && <ImageGenerator />}
            {activeTab === "video" && <VideoGenerator />}
          </div>
        </main>
      </div>
    );
  }

  return null;
}