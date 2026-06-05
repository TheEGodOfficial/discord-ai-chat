"use client";

import { useState, useEffect, useRef } from "react";
import { Video, Loader2, Download, Wand2, Sparkles, Play, X, Film } from "lucide-react";
import ModelSelector from "./ModelSelector";
import ModelLoader, { ModelInfo } from "./ModelLoader";
import AITimer from "./AITimer";

const STORAGE_KEY = "ai-video-history";
const MODEL_KEY = "ai-video-model";

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MODEL_KEY) || "wan-2.7-text-to-video";
    }
    return "wan-2.7-text-to-video";
  });
  const [error, setError] = useState("");
  const [videoHistory, setVideoHistory] = useState<{ url: string; prompt: string; model: string; id: string }[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch { return []; }
      }
    }
    return [];
  });
  const [models, setModels] = useState<ModelInfo[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videoHistory));
  }, [videoHistory]);

  useEffect(() => {
    localStorage.setItem(MODEL_KEY, selectedModel);
  }, [selectedModel]);

  const handleModelsLoaded = (loadedModels: ModelInfo[]) => {
    setModels(loadedModels);

    const modelExists = loadedModels.some(m => m.id === selectedModel);
    if (!modelExists && loadedModels.length > 0) {
      setSelectedModel(loadedModels[0].id);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    setGeneratedVideo(null);

    abortRef.current = new AbortController();

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded");
      }

      const result = await puter.ai.txt2vid(prompt, {
        model: selectedModel,
      });

      if (abortRef.current?.signal.aborted) return;

      const videoUrl = typeof result === "string" ? result : result?.url || result;

      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        const newItem = { url: videoUrl, prompt, model: selectedModel, id: Date.now().toString() };
        setVideoHistory((prev) => [newItem, ...prev]);
      } else {
        throw new Error("No video generated");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to generate video");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const downloadVideo = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-video-${Date.now()}.mp4`;
    link.target = "_blank";
    link.click();
  };

  const removeFromHistory = (id: string) => {
    setVideoHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ModelLoader onModelsLoaded={handleModelsLoaded} type="video" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-neon-blue/30 rounded-xl blur-lg animate-pulse-glow" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-neon-blue to-neon-pink rounded-xl flex items-center justify-center shadow-neon-blue">
              <Video className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-white tracking-wide">Temporal Synthesis</h2>
            <p className="text-xs text-gray-500">Generate temporal constructs from neural prompts</p>
          </div>
        </div>
        <ModelSelector
          models={models.length > 0 ? models : [{ id: "wan-2.7-text-to-video", name: "Wan 2.7 Text-to-Video", provider: "Wan AI" }]}
          selected={selectedModel}
          onSelect={setSelectedModel}
          label="Model"
          dropdownDirection="down"
        />
      </div>

      <AITimer isGenerating={isLoading} modelType="video" modelId={selectedModel} />

      {/* Input */}
      <div className="glass-panel p-8">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block uppercase tracking-wider text-xs">Neural Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the temporal construct... e.g., 'A holographic data stream flowing through a dark neural corridor, cyan and purple light trails, cinematic slow motion'"
              className="w-full input-futuristic p-5 text-white placeholder-gray-600 resize-none h-36 text-sm leading-relaxed"
            />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
            <span>Temporal synthesis may require 30s-3m depending on model complexity</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateVideo}
              disabled={!prompt.trim() || isLoading}
              className="btn-primary px-8 py-3.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synthesizing Temporal...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Temporal
                </>
              )}
            </button>
            {isLoading && (
              <button
                onClick={cancelGeneration}
                className="flex items-center gap-2 px-5 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all duration-300 border border-red-500/20 hover:border-red-500/40 font-medium"
              >
                <X className="w-5 h-5" />
                Abort
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-5 border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </p>
        </div>
      )}

      {/* Generated Video */}
      {generatedVideo && (
        <div className="glass-panel p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-medium text-white flex items-center gap-2 tracking-wide">
              <Play className="w-4 h-4 text-neon-blue" />
              Temporal Result
            </h3>
            <button
              onClick={() => downloadVideo(generatedVideo)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-surface-elevated text-gray-300 rounded-xl text-sm transition-all duration-300 border border-[rgba(0,243,255,0.15)] hover:border-neon-blue/30 hover:shadow-neon-blue"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden bg-black border border-[rgba(0,243,255,0.1)]">
            <video
              src={generatedVideo}
              controls
              className="w-full max-h-[500px]"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500 italic border-l-2 border-neon-blue/30 pl-3">{prompt}</p>
        </div>
      )}

      {/* History */}
      {videoHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-400 uppercase tracking-wider text-xs">Archive</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoHistory.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-3 cursor-pointer hover:border-neon-blue/30 transition-all duration-300 group relative overflow-hidden"
                onClick={() => setGeneratedVideo(item.url)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="aspect-video rounded-xl overflow-hidden bg-black mb-2 relative">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white opacity-80" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 truncate px-1">{item.prompt}</p>
                <p className="text-xs text-gray-700 px-1 mt-0.5">{item.model}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}