"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  cost?: { input: number; output: number; currency: string; tokens: number };
  context?: number;
  max_tokens?: number;
}

interface ModelLoaderProps {
  onModelsLoaded: (models: ModelInfo[]) => void;
  type: "chat" | "image" | "video";
}

export default function ModelLoader({ onModelsLoaded, type }: ModelLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const loadModels = async () => {
    setLoading(true);
    setError("");

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded yet");
      }

      // Use the official puter.ai.listModels() API
      const allModels = await puter.ai.listModels();

      // Filter by type based on model ID patterns and provider info
      let filtered: ModelInfo[] = [];

      if (type === "chat") {
        // Chat models - exclude image/video specific ones
        filtered = allModels.filter((m: any) => {
          const id = m.id?.toLowerCase() || "";
          const name = m.name?.toLowerCase() || "";
          // Exclude image/video models
          return !id.includes("image") && !id.includes("video") && !id.includes("txt2img") && 
                 !id.includes("txt2vid") && !id.includes("dall") && !id.includes("sora") &&
                 !id.includes("wan") && !id.includes("kling") && !id.includes("veo") &&
                 !name.includes("image") && !name.includes("video");
        });
      } else if (type === "image") {
        // Image generation models
        filtered = allModels.filter((m: any) => {
          const id = m.id?.toLowerCase() || "";
          const name = m.name?.toLowerCase() || "";
          const provider = m.provider?.toLowerCase() || "";
          return id.includes("image") || id.includes("dall") || id.includes("dream") || 
                 id.includes("lucid") || id.includes("phoenix") || id.includes("run-diffusion") ||
                 id.includes("stable") || id.includes("txt2img") || name.includes("image") ||
                 provider === "leonardo.ai" || provider === "lykon" || provider === "stability ai";
        });
      } else if (type === "video") {
        // Video generation models
        filtered = allModels.filter((m: any) => {
          const id = m.id?.toLowerCase() || "";
          const name = m.name?.toLowerCase() || "";
          return id.includes("video") || id.includes("sora") || id.includes("wan") || 
                 id.includes("kling") || id.includes("veo") || id.includes("txt2vid") ||
                 id.includes("minimax-video") || name.includes("video");
        });
      }

      // Format models
      const formatted = filtered.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: m.provider || "Unknown",
        cost: m.cost,
        context: m.context,
        max_tokens: m.max_tokens,
      }));

      // Fallback to hardcoded if no models found
      if (formatted.length === 0) {
        onModelsLoaded(getFallbackModels(type));
      } else {
        onModelsLoaded(formatted);
      }
    } catch (err: any) {
      console.error("Failed to load models:", err);
      setError(err.message || "Failed to load models");
      // Use fallback models
      onModelsLoaded(getFallbackModels(type));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for puter.js to load
    const checkPuter = setInterval(() => {
      const puter = (window as any).puter;
      if (puter && puter.ai && puter.ai.listModels) {
        clearInterval(checkPuter);
        loadModels();
      }
    }, 500);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkPuter);
      if (loading) {
        setError("Puter.js failed to load. Using fallback models.");
        onModelsLoaded(getFallbackModels(type));
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(checkPuter);
      clearTimeout(timeout);
    };
  }, [retryCount]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading models...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-yellow-400">{error}</span>
        <button 
          onClick={() => setRetryCount(c => c + 1)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Retry loading models"
        >
          <RefreshCw className="w-3 h-3 text-gray-400" />
        </button>
      </div>
    );
  }

  return null;
}

function getFallbackModels(type: "chat" | "image" | "video"): ModelInfo[] {
  if (type === "chat") {
    return [
      { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
      { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", provider: "Anthropic" },
      { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "Anthropic" },
      { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google" },
      { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google" },
      { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek" },
      { id: "grok-3", name: "Grok 3", provider: "xAI" },
      { id: "kimi-k2.6", name: "Kimi K2.6", provider: "Moonshot AI" },
      { id: "kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot AI" },
      { id: "qwen3.6-max", name: "Qwen 3.6 Max", provider: "Qwen" },
      { id: "qwen3.6-27b", name: "Qwen 3.6 27B", provider: "Qwen" },
      { id: "minimax-m3", name: "MiniMax M3", provider: "MiniMax" },
      { id: "glm-5.1", name: "GLM 5.1", provider: "Z.AI" },
      { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta" },
      { id: "gpt-5-codex", name: "GPT-5 Codex", provider: "OpenAI" },
      { id: "gemma-4-26b", name: "Gemma 4 26B", provider: "Google" },
      { id: "nemotron-3-nano", name: "Nemotron 3 Nano Omni", provider: "NVIDIA" },
      { id: "command-r7b", name: "Command R7B", provider: "Cohere" },
      { id: "mistral-nemo-12b", name: "Mistral Nemo 12B", provider: "Mistral" },
      { id: "codestral", name: "Codestral", provider: "Mistral" },
    ];
  } else if (type === "image") {
    return [
      { id: "gpt-image-2", name: "GPT Image 2", provider: "OpenAI" },
      { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI" },
      { id: "gemini-3.1-flash-image", name: "Gemini 3.1 Flash Image", provider: "Google" },
      { id: "dreamshaper", name: "DreamShaper", provider: "Lykon" },
      { id: "lucid-origin", name: "Lucid Origin", provider: "Leonardo.Ai" },
      { id: "phoenix-1.0", name: "Phoenix 1.0", provider: "Leonardo.Ai" },
      { id: "run-diffusion", name: "Run Diffusion", provider: "RunDiffusion" },
      { id: "stable-diffusion-xl", name: "Stable Diffusion XL", provider: "Stability AI" },
    ];
  } else {
    return [
      { id: "wan-2.7-text-to-video", name: "Wan 2.7 Text-to-Video", provider: "Wan AI" },
      { id: "sora", name: "Sora", provider: "OpenAI" },
      { id: "sora-2", name: "Sora 2", provider: "OpenAI" },
      { id: "sora-2-pro", name: "Sora 2 Pro", provider: "OpenAI" },
      { id: "kling-1.6-standard", name: "Kling 1.6 Standard", provider: "Kling" },
      { id: "kling-1.6-pro", name: "Kling 1.6 Pro", provider: "Kling" },
      { id: "google-veo-2", name: "Google Veo 2", provider: "Google" },
      { id: "minimax-video-01", name: "MiniMax Video-01 Director", provider: "MiniMax" },
    ];
  }
}