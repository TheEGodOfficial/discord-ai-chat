"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Zap, Cpu } from "lucide-react";

interface AITimerProps {
  isGenerating: boolean;
  modelType: "chat" | "image" | "video";
  modelId?: string;
}

const TIME_ESTIMATES: Record<string, { min: number; max: number; label: string }> = {
  "gpt-4o": { min: 1, max: 5, label: "1-5s" },
  "gpt-4": { min: 2, max: 8, label: "2-8s" },
  "claude": { min: 2, max: 10, label: "2-10s" },
  "gemini": { min: 1, max: 6, label: "1-6s" },
  "deepseek": { min: 3, max: 12, label: "3-12s" },
  "grok": { min: 2, max: 8, label: "2-8s" },
  "kimi": { min: 2, max: 10, label: "2-10s" },
  "qwen": { min: 2, max: 8, label: "2-8s" },
  "llama": { min: 3, max: 15, label: "3-15s" },
  "default-chat": { min: 2, max: 10, label: "2-10s" },

  "gpt-image": { min: 5, max: 20, label: "5-20s" },
  "dall": { min: 8, max: 25, label: "8-25s" },
  "gemini-image": { min: 5, max: 15, label: "5-15s" },
  "dream": { min: 10, max: 30, label: "10-30s" },
  "lucid": { min: 10, max: 30, label: "10-30s" },
  "phoenix": { min: 10, max: 30, label: "10-30s" },
  "run-diffusion": { min: 15, max: 45, label: "15-45s" },
  "stable": { min: 15, max: 45, label: "15-45s" },
  "default-image": { min: 10, max: 30, label: "10-30s" },

  "wan": { min: 30, max: 120, label: "30s-2m" },
  "sora": { min: 45, max: 180, label: "45s-3m" },
  "kling": { min: 30, max: 120, label: "30s-2m" },
  "veo": { min: 45, max: 180, label: "45s-3m" },
  "minimax-video": { min: 30, max: 120, label: "30s-2m" },
  "default-video": { min: 45, max: 180, label: "45s-3m" },
};

function getEstimate(modelType: string, modelId?: string): { min: number; max: number; label: string } {
  if (!modelId) return TIME_ESTIMATES[`default-${modelType}`] || TIME_ESTIMATES["default-chat"];

  const id = modelId.toLowerCase();
  for (const [key, value] of Object.entries(TIME_ESTIMATES)) {
    if (id.includes(key)) return value;
  }
  return TIME_ESTIMATES[`default-${modelType}`] || TIME_ESTIMATES["default-chat"];
}

export default function AITimer({ isGenerating, modelType, modelId }: AITimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const estimate = getEstimate(modelType, modelId);

  useEffect(() => {
    if (isGenerating) {
      startTimeRef.current = Date.now();
      setElapsed(0);
      setShowWarning(false);

      const interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(seconds);

        if (seconds > estimate.max) {
          setShowWarning(true);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setElapsed(0);
      setShowWarning(false);
    }
  }, [isGenerating, estimate.max]);

  if (!isGenerating) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toString().padStart(2, '0')}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const progressPercent = Math.min((elapsed / estimate.max) * 100, 100);

  let progressColor = "from-neon-purple to-neon-blue";
  if (progressPercent > 75) progressColor = "from-yellow-500 to-orange-500";
  if (progressPercent > 90) progressColor = "from-red-500 to-red-600";

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-surface-dark/80 rounded-xl border border-[rgba(176,38,255,0.15)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Cpu className="w-4 h-4 text-neon-purple animate-pulse" />
        <span className="text-sm font-mono text-gray-400">
          {formatTime(elapsed)}
        </span>
      </div>

      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[200px]">
        <div 
          className={`h-full bg-gradient-to-r ${progressColor} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-600">
        <Zap className="w-3 h-3 text-neon-blue" />
        <span className="font-mono">{estimate.label}</span>
      </div>

      {showWarning && (
        <span className="text-xs text-yellow-400 animate-pulse flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          Overclocking...
        </span>
      )}
    </div>
  );
}