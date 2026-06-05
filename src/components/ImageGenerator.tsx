"use client";

import { useState } from "react";
import { Image, Loader2, Download, Wand2, Sparkles } from "lucide-react";
import ModelSelector from "./ModelSelector";

const IMAGE_MODELS = [
  { id: "gpt-image-2", name: "GPT Image 2", provider: "OpenAI" },
  { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI" },
  { id: "gemini-3.1-flash-image", name: "Gemini 3.1 Flash Image", provider: "Google" },
  { id: "dreamshaper", name: "DreamShaper", provider: "Lykon" },
  { id: "lucid-origin", name: "Lucid Origin", provider: "Leonardo.Ai" },
  { id: "phoenix-1.0", name: "Phoenix 1.0", provider: "Leonardo.Ai" },
  { id: "run-diffusion", name: "Run Diffusion", provider: "RunDiffusion" },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-image-2");
  const [error, setError] = useState("");
  const [imageHistory, setImageHistory] = useState<{ url: string; prompt: string; model: string }[]>([]);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError("");
    setGeneratedImage(null);

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded");
      }

      const result = await puter.ai.txt2img(prompt, {
        model: selectedModel,
      });

      // Result could be a URL string or an object with url property
      const imageUrl = typeof result === "string" ? result : result?.url || result;

      if (imageUrl) {
        setGeneratedImage(imageUrl);
        setImageHistory((prev) => [{ url: imageUrl, prompt, model: selectedModel }, ...prev]);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-image-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Image className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Text to Image</h2>
            <p className="text-xs text-gray-400">Generate stunning images from text descriptions</p>
          </div>
        </div>
        <ModelSelector
          models={IMAGE_MODELS}
          selected={selectedModel}
          onSelect={setSelectedModel}
          label="Image Model"
        />
      </div>

      {/* Input */}
      <div className="glass-panel p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate... e.g., 'A futuristic cityscape at sunset with flying cars and neon lights'"
              className="w-full bg-discord-darkest border border-gray-700/50 rounded-lg p-4 text-white placeholder-gray-500 outline-none focus:border-discord-blurple transition-all resize-none h-32"
            />
          </div>
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Image
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Generated Image */}
      {generatedImage && (
        <div className="glass-panel p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Generated Result
            </h3>
            <button
              onClick={() => downloadImage(generatedImage)}
              className="flex items-center gap-2 px-3 py-1.5 bg-discord-darker hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="rounded-xl overflow-hidden bg-discord-darker">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full max-h-[600px] object-contain"
            />
          </div>
          <p className="mt-3 text-sm text-gray-400 italic">"{prompt}"</p>
        </div>
      )}

      {/* History */}
      {imageHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-300">History</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageHistory.slice(1).map((item, idx) => (
              <div
                key={idx}
                className="glass-panel p-2 cursor-pointer hover:border-discord-blurple/50 transition-all group"
                onClick={() => setGeneratedImage(item.url)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-discord-darker mb-2">
                  <img
                    src={item.url}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <p className="text-xs text-gray-400 truncate">{item.prompt}</p>
                <p className="text-xs text-gray-600">{item.model}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}