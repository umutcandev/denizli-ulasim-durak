"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
    <Card className="border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Durak Bilgisi</CardTitle>
        <CardDescription>Durak numarasını girerek o durağa ait otobüs bilgilerini görebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Durak numarasını girin (örn: 1628)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 bg-zinc-900 border-zinc-800"
          />
          <Button type="submit" variant="outline" className="bg-white text-black hover:bg-gray-200 hover:text-black">
            Ara
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
