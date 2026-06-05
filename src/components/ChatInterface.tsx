"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Copy, Check } from "lucide-react";
import ModelSelector from "./ModelSelector";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
};

const CHAT_MODELS = [
  { id: "openai/gpt-5.4-nano", name: "GPT-5.4 Nano", provider: "OpenAI" },
  { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "claude-opus-4-7", name: "Claude Opus 4.7", provider: "Anthropic" },
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "Google" },
  { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", provider: "Google" },
  { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek" },
  { id: "grok-3", name: "Grok 3", provider: "xAI" },
  { id: "qwen3.6-max", name: "Qwen 3.6 Max", provider: "Qwen" },
  { id: "qwen3.6-27b", name: "Qwen 3.6 27B", provider: "Qwen" },
  { id: "kimi-k2.6", name: "Kimi K2.6", provider: "Moonshot AI" },
  { id: "kimi-k2.5", name: "Kimi K2.5", provider: "Moonshot AI" },
  { id: "minimax-m3", name: "MiniMax M3", provider: "MiniMax" },
  { id: "step-3.7-flash", name: "Step 3.7 Flash", provider: "StepFun" },
  { id: "glm-5.1", name: "GLM 5.1", provider: "Z.AI" },
  { id: "ring-2.6-1t", name: "Ring 2.6 1T", provider: "InclusionAI" },
  { id: "ling-2.6-flash", name: "Ling 2.6 Flash", provider: "InclusionAI" },
  { id: "solar-pro-3", name: "Solar Pro 3", provider: "Upstage" },
  { id: "kat-coder-pro-v2", name: "KAT Coder Pro V2", provider: "KwaiPilot" },
  { id: "aion-2.0", name: "Aion 2.0", provider: "Aion Labs" },
  { id: "inflection-3-pi", name: "Inflection 3 Pi", provider: "Inflection" },
  { id: "inflection-3-productivity", name: "Inflection 3 Productivity", provider: "Inflection" },
  { id: "lfm2-24b", name: "LFM2 24B", provider: "Liquid AI" },
  { id: "trinity-large", name: "Trinity Large", provider: "Arcee AI" },
  { id: "magnum-v4-72b", name: "Magnum v4 72B", provider: "Anthracite" },
  { id: "seed-2.0-mini", name: "Seed 2.0 Mini", provider: "ByteDance" },
  { id: "cobuddy", name: "CoBuddy", provider: "Tencent" },
  { id: "qwen3-coder-next", name: "Qwen3 Coder Next", provider: "Qwen" },
  { id: "ministral-3b", name: "Ministral 3B", provider: "Mistral" },
  { id: "ministral-8b", name: "Ministral 8B", provider: "Mistral" },
  { id: "reka-edge", name: "Reka Edge", provider: "Reka" },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("openai/gpt-5.4-nano");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI Chat</h2>
            <p className="text-xs text-gray-400">{messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ModelSelector
            models={CHAT_MODELS}
            selected={selectedModel}
            onSelect={setSelectedModel}
            label="Model"
          />
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Sparkles className="w-12 h-12 mb-4 text-discord-blurple/50" />
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-sm">Select a model and send your first message</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-discord-blurple text-white rounded-br-sm"
                  : "bg-discord-darker border border-gray-700/50 text-gray-100 rounded-bl-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {message.role === "assistant" ? (
                  <Bot className="w-4 h-4 text-blue-400" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
                <span className="text-xs font-medium opacity-70">
                  {message.role === "user" ? "You" : "AI"}
                </span>
                <span className="text-xs opacity-50">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                )}
              </div>
              {message.role === "assistant" && !message.isStreaming && (
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => copyMessage(message.id, message.content)}
                    className="p-1 text-gray-500 hover:text-gray-300 rounded transition-colors"
                    title="Copy"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
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
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none max-h-32 py-2 px-3 text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-discord-blurple hover:bg-discord-blurple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all"
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