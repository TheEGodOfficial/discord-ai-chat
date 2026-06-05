"use client";

import { useState, useEffect, useRef } from "react";
import { Image, Loader2, Download, Wand2, Sparkles, X, Eye } from "lucide-react";
import ModelSelector from "./ModelSelector";
import ModelLoader, { ModelInfo } from "./ModelLoader";
import AITimer from "./AITimer";

const STORAGE_KEY = "ai-image-history";
const MODEL_KEY = "ai-image-model";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MODEL_KEY) || "gpt-image-2";
    }
    return "gpt-image-2";
  });
  const [error, setError] = useState("");
  const [imageHistory, setImageHistory] = useState<{ url: string; prompt: string; model: string; id: string }[]>(() => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imageHistory));
  }, [imageHistory]);

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

  const generateImage = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setError("");
    setGeneratedImage(null);

    abortRef.current = new AbortController();

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded");
      }

      const result = await puter.ai.txt2img(prompt, {
        model: selectedModel,
      });

      if (abortRef.current?.signal.aborted) return;

      const imageUrl = typeof result === "string" ? result : result?.url || result;

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        const newItem = { url: imageUrl, prompt, model: selectedModel, id: Date.now().toString() };
        setImageHistory((prev) => [newItem, ...prev]);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  const cancelGeneration = () => {
    abortRef.current?.abort();
    setIsLoading(false);
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-image-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  };

  const removeFromHistory = (id: string) => {
    setImageHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <ModelLoader onModelsLoaded={handleModelsLoaded} type="image" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-neon-pink/30 rounded-xl blur-lg animate-pulse-glow" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center shadow-neon-pink">
              <Image className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-white tracking-wide">Visual Synthesis</h2>
            <p className="text-xs text-gray-500">Generate visual constructs from neural prompts</p>
          </div>
        </div>
        <ModelSelector
          models={models.length > 0 ? models : [{ id: "gpt-image-2", name: "GPT Image 2", provider: "OpenAI" }]}
          selected={selectedModel}
          onSelect={setSelectedModel}
          label="Model"
          dropdownDirection="down"
        />
      </div>

      <AITimer isGenerating={isLoading} modelType="image" modelId={selectedModel} />

      {/* Input */}
      <div className="glass-panel p-8">
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block uppercase tracking-wider text-xs">Neural Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the visual construct... e.g., 'A crystalline neural network suspended in zero gravity, bioluminescent purple and cyan nodes pulsing with data streams'"
              className="w-full input-futuristic p-5 text-white placeholder-gray-600 resize-none h-36 text-sm leading-relaxed"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={generateImage}
              disabled={!prompt.trim() || isLoading}
              className="btn-primary px-8 py-3.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synthesizing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Visual
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

      {/* Generated Image */}
      {generatedImage && (
        <div className="glass-panel p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-medium text-white flex items-center gap-2 tracking-wide">
              <Sparkles className="w-4 h-4 text-neon-pink" />
              Synthesis Result
            </h3>
            <button
              onClick={() => downloadImage(generatedImage)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-dark hover:bg-surface-elevated text-gray-300 rounded-xl text-sm transition-all duration-300 border border-[rgba(176,38,255,0.15)] hover:border-neon-purple/30 hover:shadow-neon"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="rounded-2xl overflow-hidden bg-surface-dark border border-[rgba(255,0,170,0.1)]">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full max-h-[600px] object-contain"
            />
          </div>
          <p className="mt-4 text-sm text-gray-500 italic border-l-2 border-neon-purple/30 pl-3">{prompt}</p>
        </div>
      )}

      {/* History */}
      {imageHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-gray-400 uppercase tracking-wider text-xs">Archive</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageHistory.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-2 cursor-pointer hover:border-neon-purple/30 transition-all duration-300 group relative overflow-hidden"
                onClick={() => setGeneratedImage(item.url)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromHistory(item.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="aspect-square rounded-xl overflow-hidden bg-surface-dark mb-2 relative">
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                    <Eye className="w-5 h-5 text-white/80" />
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