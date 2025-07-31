"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface StationInputProps {
  onSubmit: (stationId: string) => void
  isLoading: boolean
  onShowBusTimesClick?: () => void
  weatherData?: {
    temperature: string;
  } | null
}

export default function StationInput({ onSubmit, isLoading, onShowBusTimesClick, weatherData }: StationInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(inputValue.trim())
    }
  }

  const getTemperatureStyle = (temperature: string) => {
    // Sıcaklık değerini sayıya çevir (°C işaretini kaldır)
    const temp = parseFloat(temperature.replace(/[^\d.-]/g, ''))
    
    if (temp < 0) {
      // Çok soğuk - Mavi
      return "bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
    } else if (temp <= 10) {
      // Soğuk - Açık mavi
      return "bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900 dark:border-sky-700 dark:text-sky-200"
    } else if (temp <= 20) {
      // Serin - Yeşil
      return "bg-green-100 border-green-300 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
    } else if (temp <= 30) {
      // Ilık - Sarı
      return "bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
    } else if (temp <= 40) {
      // Sıcak - Turuncu
      return "bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200"
    } else {
      // Çok sıcak - Kırmızı
      return "bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
    }
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Durak ve Otobüs Saatleri Bilgisi</CardTitle>
          {weatherData ? (
            <div className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap ${getTemperatureStyle(weatherData.temperature)}`}>
              <strong>Hava:</strong>&nbsp;{weatherData.temperature}
            </div>
          ) : (
            <Skeleton className="h-6 w-24 rounded-md" />
          )}
        </div>
        <CardDescription>Durak numarasını girerek o durağa ait otobüs bilgilerini görebilir, yandaki saat simgesine tıklayarak otobüs saatlerini inceleyebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          {onShowBusTimesClick && (
            <Button
              type="button"
              variant="outline"
              onClick={onShowBusTimesClick}
              aria-label="Otobüs Saatlerini Göster"
              className="p-4 sm:px-3 sm:py-3 flex items-center"
            >
              <Clock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Saatler</span>
            </Button>
          )}
          <Input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Durak numarasını girin (örn: 1628)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="outline"
            className="bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
            disabled={isLoading || !inputValue}
          >
            {isLoading && inputValue ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Ara"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
