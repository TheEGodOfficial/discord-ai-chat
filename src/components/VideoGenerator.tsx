"use client";

import { useState } from "react";
import { Video, Loader2, Download, Wand2, Sparkles, Play } from "lucide-react";
import ModelSelector from "./ModelSelector";

const VIDEO_MODELS = [
  { id: "wan-2.7-text-to-video", name: "Wan 2.7 Text-to-Video", provider: "Wan AI" },
  { id: "sora", name: "Sora", provider: "OpenAI" },
];

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("wan-2.7-text-to-video");
  const [error, setError] = useState("");
  const [videoHistory, setVideoHistory] = useState<{ url: string; prompt: string; model: string }[]>([]);

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError("");
    setGeneratedVideo(null);

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded");
      }

      const result = await puter.ai.txt2vid(prompt, {
        model: selectedModel,
      });

      const videoUrl = typeof result === "string" ? result : result?.url || result;

      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        setVideoHistory((prev) => [{ url: videoUrl, prompt, model: selectedModel }, ...prev]);
      } else {
        throw new Error("No video generated");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate video");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadVideo = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-video-${Date.now()}.mp4`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Text to Video</h2>
            <p className="text-xs text-gray-400">Generate video clips from text descriptions</p>
          </div>
        </div>
        <ModelSelector
          models={VIDEO_MODELS}
          selected={selectedModel}
          onSelect={setSelectedModel}
          label="Video Model"
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
              placeholder="Describe the video you want to generate... e.g., 'A serene ocean wave crashing on a tropical beach at golden hour, cinematic slow motion'"
              className="w-full bg-discord-darkest border border-gray-700/50 rounded-lg p-4 text-white placeholder-gray-500 outline-none focus:border-discord-blurple transition-all resize-none h-32"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-3 h-3" />
            <span>Video generation may take 30-120 seconds depending on the model and complexity</span>
          </div>
          <button
            onClick={generateVideo}
            disabled={!prompt.trim() || isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium shadow-lg shadow-red-500/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Video...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Video
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

      {/* Generated Video */}
      {generatedVideo && (
        <div className="glass-panel p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-red-400" />
              Generated Result
            </h3>
            <button
              onClick={() => downloadVideo(generatedVideo)}
              className="flex items-center gap-2 px-3 py-1.5 bg-discord-darker hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <div className="rounded-xl overflow-hidden bg-black">
            <video
              src={generatedVideo}
              controls
              className="w-full max-h-[500px]"
              poster={generatedVideo.replace('.mp4', '.jpg').replace('/video/', '/thumb/')}
            />
          </div>
          <p className="mt-3 text-sm text-gray-400 italic">"{prompt}"</p>
        </div>
      )}

      {/* History */}
      {videoHistory.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-300">History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoHistory.slice(1).map((item, idx) => (
              <div
                key={idx}
                className="glass-panel p-3 cursor-pointer hover:border-red-500/50 transition-all group"
                onClick={() => setGeneratedVideo(item.url)}
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-black mb-2 relative">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                    <Play className="w-8 h-8 text-white opacity-80" />
                  </div>
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