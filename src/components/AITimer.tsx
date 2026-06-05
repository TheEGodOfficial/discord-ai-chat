"use client"
import { useEffect, useState } from "react"
import { Cpu } from "lucide-react"

interface AITimerProps {
  isActive: boolean
  estimatedSeconds: number
  retryCount?: number
  maxRetries?: number
}

export default function AITimer({ isActive, estimatedSeconds, retryCount, maxRetries }: AITimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setElapsed(0)
      return
    }
    setElapsed(0)
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive) return null

  const progress = Math.min((elapsed / estimatedSeconds) * 100, 100)
  const isOverdue = elapsed > estimatedSeconds
  let progressColor = "from-neon-purple to-neon-blue"
  if (progress > 50) progressColor = "from-neon-blue to-yellow-400"
  if (progress > 80) progressColor = "from-yellow-400 to-red-500"

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-discord-darker/80 border border-gray-700/50 rounded-lg">
      <Cpu className={`w-5 h-5 ${isOverdue ? "text-red-400 animate-pulse" : "text-neon-blue animate-pulse"}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">
            {isOverdue ? "Overclocking..." : "Processing..."}
          </span>
          <span className="text-sm font-mono text-neon-blue">{timeStr}</span>
        </div>
        <div className="w-full h-1.5 bg-discord-darkest rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-1000`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {retryCount !== undefined && maxRetries !== undefined && retryCount > 0 && (
          <div className="text-xs text-yellow-400 mt-1">
            Retry {retryCount}/{maxRetries}
          </div>
        )}
      </div>
    </div>
  )
}
