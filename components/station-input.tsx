"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Clock, QrCode, Search } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipArrow } from "@/components/ui/tooltip"

interface StationInputProps {
  onSubmit: (stationId: string) => void
  isLoading: boolean
  onShowBusTimesClick?: () => void
  onQrScanClick?: () => void
  onLocationClick?: () => void
}

export default function StationInput({ onSubmit, isLoading, onShowBusTimesClick, onQrScanClick, onLocationClick }: StationInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipDisabled, setTooltipDisabled] = useState(false)

  // İlk kez sayfa yüklendiğinde localStorage'dan kontrol et ve 1 saniye sonra tooltip göster
  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem("hasSeenBusTimesTooltip")
    if (hasSeenTooltip === "true") {
      setTooltipDisabled(true)
      return
    }

    const timer = setTimeout(() => {
      if (!tooltipDisabled && onShowBusTimesClick) {
        setShowTooltip(true)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [tooltipDisabled, onShowBusTimesClick])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSubmit(inputValue.trim())
      // Kullanıcı form submit ettiğinde tooltip'i disable et
      handleUserInteraction()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Kullanıcı input'a yazmaya başladığında tooltip'i disable et
    handleUserInteraction()
  }

  const handleBusTimesClick = () => {
    if (onShowBusTimesClick) {
      onShowBusTimesClick()
      // Kullanıcı otobüs saatleri butonuna tıkladığında tooltip'i disable et
      handleUserInteraction()
    }
  }

  const handleQrScanClick = () => {
    if (onQrScanClick) {
      onQrScanClick()
      // Kullanıcı QR tarama butonuna tıkladığında tooltip'i disable et
      handleUserInteraction()
    }
  }

  const handleLocationClick = () => {
    if (onLocationClick) {
      onLocationClick()
      // Kullanıcı konum butonuna tıkladığında tooltip'i disable et
      handleUserInteraction()
    }
  }

  const handleUserInteraction = () => {
    setShowTooltip(false)
    setTooltipDisabled(true)
    localStorage.setItem("hasSeenBusTimesTooltip", "true")
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">Durak Bilgileri</CardTitle>
          <div className="flex items-center gap-2">
            {onLocationClick && (
              <Button
                type="button"
                variant="outline"
                onClick={handleLocationClick}
                aria-label="Konumdan Durak Bul"
                className="h-6 px-2 py-1 text-xs bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                disabled={isLoading}
              >
                Konumdan Durak Bul
              </Button>
            )}
          </div>
        </div>
        <CardDescription className="mt-1 text-xs">
          Durak numarasını girerek o durağa ait otobüs bilgilerini görebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full items-center gap-2">
          <div className="hidden sm:flex sm:w-auto items-center space-x-2 order-2 sm:order-1">
            {onShowBusTimesClick && (
              <TooltipProvider>
                <Tooltip open={showTooltip}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBusTimesClick}
                      aria-label="Otobüs Saatlerini Göster"
                      className="p-3 sm:px-3 sm:py-3 flex items-center justify-center flex-1 sm:flex-initial"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="sm:inline">Otobüs Saatleri</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={4}
                    alignOffset={12}
                    className="px-2 py-1 text-xs font-medium"
                  >
                    Otobüs saatlerini gör
                    <TooltipArrow />
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {onQrScanClick && (
              <Button
                type="button"
                variant="outline"
                onClick={handleQrScanClick}
                aria-label="QR Kod Tarama"
                className="p-3 sm:px-3 sm:py-3 flex items-center justify-center flex-1 sm:flex-initial"
              >
                <QrCode className="h-4 w-4 mr-2" />
                <span className="sm:inline">QR Tara</span>
              </Button>
            )}
          </div>
          <div className="flex w-full sm:flex-1 items-center space-x-2 order-1 sm:order-2">
            <Input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Durak numarası girin (örn: 14)"
              style={{ fontSize: "0.80rem" }}
              value={inputValue}
              onChange={handleInputChange}
              className="h-8 sm:h-auto flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="outline"
              className="h-8 sm:h-auto bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
              disabled={isLoading || !inputValue}
            >
              {isLoading && inputValue ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Sorgula</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
