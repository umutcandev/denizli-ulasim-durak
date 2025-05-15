"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github } from "lucide-react"

interface StationInputProps {
  onSubmit: (stationId: string) => void
}

export default function StationInput({ onSubmit }: StationInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(inputValue.trim())
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Durak Bilgisi</CardTitle>
          <a
            href="https://github.com/umutcandev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Github className="mr-1 h-3.5 w-3.5" />
            /umutcandev
          </a>
        </div>
        <CardDescription>Durak numarasını girerek o durağa ait otobüs bilgilerini görebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Durak numarasını girin (örn: 1628)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
          />
          <Button
            type="submit"
            variant="outline"
            className="bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
          >
            Ara
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
