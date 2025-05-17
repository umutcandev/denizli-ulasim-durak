"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface RefreshProgressProps {
  interval: number
  onRefresh: () => void
}

export function RefreshProgress({ interval, onRefresh }: RefreshProgressProps) {
  const [progress, setProgress] = useState(100)
  const [timeLeft, setTimeLeft] = useState(interval / 1000)
  const { theme } = useTheme()

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

  const handleManualRefresh = () => {
    onRefresh()
    setProgress(100)
    setTimeLeft(interval / 1000)
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Otomatik yenileme</span>
        <div className="flex items-center gap-2">
          <span>{timeLeft} saniye</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6 rounded-full" 
            onClick={handleManualRefresh}
            title="Manuel Yenile"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <Progress
        value={progress}
        className="h-2 bg-zinc-200 dark:bg-zinc-800"
        indicatorClassName={theme === "light" ? "bg-zinc-800" : "bg-white"}
      />
    </div>
  )
}
