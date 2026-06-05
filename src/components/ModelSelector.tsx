"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Cpu } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
  cost?: { input: number; output: number; currency: string; tokens: number };
  context?: number;
  max_tokens?: number;
}

interface ModelSelectorProps {
  models: Model[];
  selected: string;
  onSelect: (modelId: string) => void;
  label?: string;
  dropdownDirection?: "up" | "down" | "auto";
}

export default function ModelSelector({ 
  models, 
  selected, 
  onSelect, 
  label,
  dropdownDirection = "auto" 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [actualDirection, setActualDirection] = useState<"up" | "down">("down");

  const selectedModel = models.find((m) => m.id === selected);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownDirection === "auto") {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 450;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setActualDirection("up");
      } else {
        setActualDirection("down");
      }
    } else if (dropdownDirection !== "auto") {
      setActualDirection(dropdownDirection);
    }
  }, [isOpen, dropdownDirection]);

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-surface-dark border border-[rgba(176,38,255,0.2)] rounded-xl text-sm hover:border-neon-purple/40 transition-all duration-300 min-w-[220px] group"
      >
        <Cpu className="w-4 h-4 text-neon-purple/50 group-hover:text-neon-purple transition-colors" />
        <span className="flex-1 text-left truncate text-gray-300">
          {selectedModel ? selectedModel.name : "Select model"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="fixed z-[100] w-96 bg-surface-dark/95 backdrop-blur-xl border border-[rgba(176,38,255,0.2)] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5),0_0_20px_rgba(176,38,255,0.1)] overflow-hidden flex flex-col"
          style={{
            ...(actualDirection === "down" 
              ? { top: (buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8 }
              : { bottom: (window.innerHeight - (buttonRef.current?.getBoundingClientRect().top ?? 0)) + 8 }
            ),
            left: Math.min(
              buttonRef.current?.getBoundingClientRect().left ?? 0,
              window.innerWidth - 400
            ),
            maxHeight: "500px",
          }}
        >
          <div className="p-3 border-b border-[rgba(176,38,255,0.1)] shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-surface-black/80 rounded-xl border border-[rgba(176,38,255,0.15)]">
              <Search className="w-4 h-4 text-neon-purple/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search neural models..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-600"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto p-2 space-y-1">
            {Object.entries(grouped).map(([provider, providerModels]) => (
              <div key={provider}>
                <div className="px-3 py-1.5 text-xs font-semibold text-neon-purple/60 uppercase tracking-wider sticky top-0 bg-surface-dark/95 backdrop-blur-sm z-10">
                  {provider}
                </div>
                {providerModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelect(model.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      selected === model.id
                        ? "bg-gradient-to-r from-neon-purple/20 to-neon-blue/10 text-neon-purple border border-neon-purple/20"
                        : "text-gray-400 hover:text-white hover:bg-[rgba(176,38,255,0.08)]"
                    }`}
                  >
                    {selected === model.id ? (
                      <div className="w-5 h-5 rounded-full bg-neon-purple/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-neon-purple" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-700 shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{model.name}</div>
                      {model.context && (
                        <div className="text-xs text-gray-600 mt-0.5">{model.context.toLocaleString()} context</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className="text-center py-6 text-gray-600 text-sm">
                <Cpu className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                No neural models found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}