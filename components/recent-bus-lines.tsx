"use client"

import { Button } from "@/components/ui/button"
import { HistoryIcon } from "lucide-react"

interface RecentBusLinesProps {
  lines: string[]
  onLineClick: (line: string) => void
}

export default function RecentBusLines({ lines, onLineClick }: RecentBusLinesProps) {
  if (!lines || !lines.length) return null

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Son Aranan Hatlar</h4>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">En son aradığınız hatlar, tarayıcı hafızasında saklanır ve kaybolmaz.</p>
      <div className="flex flex-wrap gap-1.5">
        {lines.map((line) => {
          return (
            <Button
              key={line}
              onClick={() => onLineClick(line)}
              variant="outline"
              size="sm"
              className="h-7 py-0 px-2 text-xs bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <HistoryIcon className="mr-1 h-3 w-3" />
              <span>{line}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
} 