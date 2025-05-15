"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

interface RefreshProgressProps {
  interval: number
  onRefresh: () => void
}

export function RefreshProgress({ interval, onRefresh }: RefreshProgressProps) {
  const [progress, setProgress] = useState(100)
  const [timeLeft, setTimeLeft] = useState(interval / 1000)

  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + interval

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const newProgress = (remaining / interval) * 100
      const newTimeLeft = Math.ceil(remaining / 1000)

      setProgress(newProgress)
      setTimeLeft(newTimeLeft)

      if (remaining <= 0) {
        onRefresh()
        // Reset timer
        setProgress(100)
        setTimeLeft(interval / 1000)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [interval, onRefresh])

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Otomatik yenileme</span>
        <span>{timeLeft} saniye</span>
      </div>
      <Progress value={progress} className="h-2 bg-zinc-800" indicatorClassName="bg-white" />
    </div>
  )
}
