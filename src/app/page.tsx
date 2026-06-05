"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoginButton from "@/components/LoginButton";
import ChatInterface from "@/components/ChatInterface";
import ImageGenerator from "@/components/ImageGenerator";
import VideoGenerator from "@/components/VideoGenerator";
import { Loader2, Shield, Sparkles, Image, Video } from "lucide-react";

type Tab = "chat" | "image" | "video";

export default function Home() {
  const { data: session, status } = useSession();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      checkRole();
    }
  }, [session]);

  const checkRole = async () => {
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
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-discord-blurple" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-discord-blurple to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-discord-blurple/20">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">AI Workspace</h1>
            <p className="text-gray-400">Discord-verified AI chat, image & video generation</p>
          </div>
          <LoginButton />
          <p className="mt-4 text-sm text-gray-500">
            You need a specific role in our Discord server to access this app.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-discord-blurple mx-auto mb-4" />
          <p className="text-gray-400">Verifying Discord role...</p>
        </div>
      </div>
    );
  }

  if (hasRole === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="glass-panel p-8 max-w-md w-full text-center animate-fade-in">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400 mb-6">
            You don&apos;t have the required role in the Discord server to access this application.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  if (hasRole === true) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="glass-panel border-b border-gray-700/50 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-discord-blurple to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AI Workspace</h1>
                <p className="text-xs text-gray-400">Powered by Puter.js</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex gap-1 bg-discord-darker rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "chat"
                      ? "bg-discord-blurple text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Chat
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "image"
                      ? "bg-discord-blurple text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Image
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("video")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "video"
                      ? "bg-discord-blurple text-white shadow-lg"
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
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
                  <img
                    src={session.user?.image || ""}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm font-medium">{session.user?.name}</span>
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