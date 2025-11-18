"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Map, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface NearbyStationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStationSelect?: (stationId: string) => void
}

interface Station {
  stationId: number
  stationName: string
  latitude: string
  longitude: string
  distance: number
}

type DialogState = "idle" | "requesting" | "loading" | "success" | "error"

export function NearbyStationsDialog({
  open,
  onOpenChange,
  onStationSelect,
}: NearbyStationsDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [stations, setStations] = useState<Station[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Dialog kapandığında state'leri sıfırla
    setTimeout(() => {
      setDialogState("idle")
      setErrorMessage("")
      setStations([])
      setUserLocation(null)
    }, 200)
  }, [onOpenChange])

  // Dialog açıldığında konum izni iste
  useEffect(() => {
    if (!open) {
      return
    }

    // Dialog açıldığında direkt konum izni iste
    requestLocationPermission()
  }, [open])

  const requestLocationPermission = async () => {
    setDialogState("requesting")
    setErrorMessage("")

    // Tarayıcı konum desteğini kontrol et
    if (!navigator.geolocation) {
      setDialogState("error")
      setErrorMessage("Tarayıcınız konum özelliğini desteklemiyor. Lütfen güncel bir tarayıcı kullanın.")
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude

      setUserLocation({ lat, lng })
      await fetchNearbyStations(lat, lng)
    } catch (error: any) {
      setDialogState("error")
      
      // Hata tipine göre mesaj belirle
      if (error.code === 1) {
        // PERMISSION_DENIED
        setErrorMessage("Konum izni verilmedi. Bu özelliği kullanmak için konum izni vermeniz gerekmektedir.")
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        setErrorMessage("Konum bilgisi alınamadı. Lütfen tekrar deneyin.")
      } else if (error.code === 3) {
        // TIMEOUT
        setErrorMessage("Konum bilgisi alınırken zaman aşımı oluştu. Lütfen tekrar deneyin.")
      } else {
        setErrorMessage("Konum bilgisi alınırken bir hata oluştu. Lütfen tekrar deneyin.")
      }
    }
  }

  const fetchNearbyStations = async (lat: number, lng: number) => {
    setDialogState("loading")
    setErrorMessage("")

    try {
      const response = await fetch(
        `/api/nearby-stations?lat=${lat}&lng=${lng}&recordCount=5`
      )

      if (!response.ok) {
        throw new Error(`API yanıt hatası: ${response.status}`)
      }

      const data = await response.json()

      if (data.isSuccess && data.value && Array.isArray(data.value)) {
        setStations(data.value)
        setDialogState("success")
      } else {
        throw new Error("Geçersiz API yanıtı")
      }
    } catch (error) {
      console.error("Yakın duraklar çekilirken hata:", error)
      setDialogState("error")
      setErrorMessage("Yakın duraklar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.")
    }
  }

  const handleRetry = () => {
    requestLocationPermission()
  }

  const openGoogleMaps = (latitude: string, longitude: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, "_blank")
  }

  const handleStationClick = (stationId: number) => {
    if (onStationSelect) {
      onStationSelect(stationId.toString())
      handleClose()
    }
  }

  const getDistanceColor = (distance: number) => {
    if (distance <= 200) {
      return "bg-green-900/40 text-green-400 dark:bg-green-900/50 dark:text-green-400"
    } else if (distance <= 500) {
      return "bg-yellow-900/40 text-yellow-400 dark:bg-yellow-900/50 dark:text-yellow-400"
    } else if (distance <= 1000) {
      return "bg-orange-900/40 text-orange-400 dark:bg-orange-900/50 dark:text-orange-400"
    } else {
      return "bg-muted text-muted-foreground"
    }
  }

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`
    }
    return `${(distance / 1000).toFixed(1)}km`
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 flex-shrink-0">
          <DialogTitle>Yakındaki Duraklar</DialogTitle>
          <DialogDescription>
            Burada konumunuzdan en yakın duraklar listelenir, duraklar hakkında bilgi almak için saatleri gör butonunu kullanınız.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto px-6 pb-6">
          {dialogState === "requesting" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground text-center">
                Konum izni isteniyor...
              </p>
            </div>
          )}

          {dialogState === "loading" && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border rounded-lg bg-card overflow-hidden">
                  <div className="p-3 pb-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Skeleton className="h-5 w-10 rounded" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                      <Skeleton className="h-5 w-12 rounded" />
                    </div>
                  </div>
                  <div className="border-t bg-muted/50">
                    <div className="flex">
                      <Skeleton className="h-9 flex-1 rounded-none" />
                      <div className="w-px bg-border" />
                      <Skeleton className="h-9 flex-1 rounded-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {dialogState === "error" && (
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Hata
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  className="flex-1"
                >
                  Tekrar Dene
                </Button>
                <Button
                  onClick={handleClose}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  İptal
                </Button>
              </div>
            </div>
          )}

          {dialogState === "success" && (
            <div className="space-y-2">
              {stations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Yakın durak bulunamadı.
                </div>
              ) : (
                stations.map((station) => (
                  <div
                    key={station.stationId}
                    className="group border rounded-lg bg-card hover:bg-muted/30 transition-colors overflow-hidden"
                  >
                    {/* Top Section - Station Info */}
                    <div className="p-3 pt-3 pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="bg-white text-black px-2 py-0.5 rounded text-xs font-bold min-w-[2.5rem] text-center flex-shrink-0">
                            {station.stationId}
                          </span>
                          <p className="text-sm font-bold text-foreground truncate">
                            {station.stationName}
                          </p>
                        </div>
                        {station.distance && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getDistanceColor(
                              station.distance
                            )}`}
                          >
                            {formatDistance(station.distance)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom Section - Action Buttons */}
                    <div className="border-t bg-muted/50">
                      <div className="flex">
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            openGoogleMaps(station.latitude, station.longitude)
                          }}
                          className="flex-1 h-8 rounded-none text-xs font-medium hover:bg-muted"
                        >
                          Haritaya Git
                        </Button>
                        <div className="w-px bg-border" />
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStationClick(station.stationId)
                          }}
                          className="flex-1 h-8 rounded-none text-xs font-medium hover:bg-muted"
                        >
                          Saatleri Gör
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

