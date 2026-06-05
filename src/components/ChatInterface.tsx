"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Copy, Check, Zap } from "lucide-react";
import ModelSelector from "./ModelSelector";
import ModelLoader, { ModelInfo } from "./ModelLoader";
import AITimer from "./AITimer";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
};

const STORAGE_KEY = "ai-chat-messages";
const MODEL_KEY = "ai-chat-model";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp).getTime() }));
        } catch { return []; }
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(MODEL_KEY) || "gpt-4o";
    }
    return "gpt-4o";
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(MODEL_KEY, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scrollToBottom();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleModelsLoaded = (loadedModels: ModelInfo[]) => {
    setModels(loadedModels);
    setModelsLoaded(true);

    const modelExists = loadedModels.some(m => m.id === selectedModel);
    if (!modelExists && loadedModels.length > 0) {
      setSelectedModel(loadedModels[0].id);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isGeneratingRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    isGeneratingRef.current = true;

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const puter = (window as any).puter;
      if (!puter) {
        throw new Error("Puter.js not loaded. Please refresh the page.");
      }

      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      conversationHistory.push({ role: "user", content: userMessage.content });

      const response = await puter.ai.chat(conversationHistory, {
        model: selectedModel,
        stream: true,
      });

      let fullContent = "";
      for await (const part of response) {
        if (controller.signal.aborted) break;
        if (part?.text) {
          fullContent += part.text;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: fullContent, isStreaming: true }
                : m
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: fullContent, isStreaming: false } : m
        )
      );
    } catch (error: any) {
      if (error.name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `Error: ${error.message || "Failed to get response"}`,
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
      setAbortController(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    if (abortController) {
      abortController.abort();
    }
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
      <ModelLoader onModelsLoaded={handleModelsLoaded} type="chat" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 bg-neon-blue/30 rounded-xl blur-lg animate-pulse-glow" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center shadow-neon">
              <Bot className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h2 className="font-semibold text-white tracking-wide">Neural Chat</h2>
            <p className="text-xs text-gray-500">{messages.length} transmissions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModelSelector
            models={models.length > 0 ? models : [{ id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" }]}
            selected={selectedModel}
            onSelect={setSelectedModel}
            label="Model"
            dropdownDirection="down"
          />
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-500/20"
              title="Clear transmissions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Timer */}
      <div className="mb-3">
        <AITimer isGenerating={isLoading} modelType="chat" modelId={selectedModel} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-neon-purple/20 rounded-full blur-2xl animate-pulse-glow" />
              <Sparkles className="relative w-16 h-16 text-neon-purple/50" />
            </div>
            <p className="text-xl font-medium gradient-text mb-2">Initialize Neural Link</p>
            <p className="text-sm text-gray-600">Select a model and transmit your first message</p>
            {!modelsLoaded && (
              <p className="text-xs text-gray-700 mt-3 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Synchronizing model database...
              </p>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                message.role === "user"
                  ? "message-user rounded-br-sm"
                  : "message-ai rounded-bl-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.role === "assistant" ? (
                  <div className="w-6 h-6 rounded-full bg-neon-blue/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-neon-blue" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neon-purple/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-neon-purple" />
                  </div>
                )}
                <span className="text-xs font-medium opacity-70 uppercase tracking-wider">
                  {message.role === "user" ? "Operator" : "Neural Net"}
                </span>
                <span className="text-xs opacity-40">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-neon-blue ml-1 animate-pulse shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
                )}
              </div>
              {message.role === "assistant" && !message.isStreaming && (
                <div className="flex items-center gap-1 mt-3 pt-2 border-t border-[rgba(0,243,255,0.1)]">
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="p-1.5 text-gray-500 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all duration-300"
                    title="Copy transmission"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="glass-panel p-2 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Transmit message... (Shift+Enter for newline)"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 resize-none max-h-32 py-3 px-4 text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-neon-purple to-neon-blue hover:from-neon-purple/90 hover:to-neon-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 shadow-neon hover:shadow-[0_0_20px_rgba(176,38,255,0.5)]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}