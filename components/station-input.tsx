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
}

export default function StationInput({ onSubmit, isLoading, onShowBusTimesClick, onQrScanClick }: StationInputProps) {
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

  const handleUserInteraction = () => {
    setShowTooltip(false)
    setTooltipDisabled(true)
    localStorage.setItem("hasSeenBusTimesTooltip", "true")
  }

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md">Durak ve Otobüs Saatleri</CardTitle>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/umutcandev/denizli-ulasim-durak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
              aria-label="GitHub Repository"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="h-4 w-4 text-zinc-800 dark:text-zinc-200"
              >
                <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z"></path>
              </svg>
            </a>
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
              className="flex-1 h-8 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
              disabled={isLoading}
            />
            <Button
              type="submit"
              variant="outline"
              className="h-8 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
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
