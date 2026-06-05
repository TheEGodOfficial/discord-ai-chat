"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ModelSelectorProps {
  models: Model[];
  selected: string;
  onSelect: (modelId: string) => void;
  label?: string;
}

export default function ModelSelector({ models, selected, onSelect, label }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase())
  );

  // Group by provider
  const grouped = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-discord-darker border border-gray-700/50 rounded-lg text-sm hover:border-gray-600 transition-all min-w-[200px]"
      >
        <span className="flex-1 text-left truncate">
          {selectedModel ? `${selectedModel.name}` : "Select model"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 w-80 bg-discord-darker border border-gray-700/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-700/50">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-discord-darkest rounded-lg">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder-gray-500"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {Object.entries(grouped).map(([provider, providerModels]) => (
              <div key={provider}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      selected === model.id
                        ? "bg-discord-blurple/20 text-discord-blurple"
                        : "text-gray-300 hover:bg-gray-700/50"
                    }`}
                  >
                    {selected === model.id && <Check className="w-4 h-4" />}
                    <span className={selected === model.id ? "ml-0" : "ml-6"}>{model.name}</span>
                  </button>
                ))}
              </div>
            ))}
            {filteredModels.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">No models found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}