"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HistoryIcon } from "lucide-react"

interface RecentBusLinesProps {
  lines: string[]
  onLineClick: (line: string) => void
}

export default function RecentBusLines({ lines, onLineClick }: RecentBusLinesProps) {
  if (!lines || !lines.length) return null

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Son Aranan Hatlar</CardTitle>
        <CardDescription className="mt-1 text-xs">
          En son aradığınız hatlar, tarayıcı hafızasında saklanır ve kaybolmaz.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex flex-wrap gap-1.5">
          {lines.map((line) => {
            return (
              <Button
                key={line}
                onClick={() => onLineClick(line)}
                variant="outline"
                size="sm"
                className="h-6 py-0 px-2 text-xs bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800"
              >
                <HistoryIcon className="mr-1 h-3 w-3" />
                <span>{line}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 