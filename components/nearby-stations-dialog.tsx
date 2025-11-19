"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, ListFilter } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

const NearbyStationsMap = dynamic(() => import("@/components/nearby-stations-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-square bg-muted/50 dark:bg-muted/30 flex items-center justify-center rounded-lg">
      <div className="text-xs text-muted-foreground">Harita yükleniyor...</div>
    </div>
  )
})

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
type SortType = "distance-asc" | "distance-desc" | "name-asc" | "name-desc" | "id-asc" | "id-desc"

export function NearbyStationsDialog({
  open,
  onOpenChange,
  onStationSelect,
}: NearbyStationsDialogProps) {
  const [dialogState, setDialogState] = useState<DialogState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [loadMoreError, setLoadMoreError] = useState("")
  const [stations, setStations] = useState<Station[]>([])
  const [sortedStations, setSortedStations] = useState<Station[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [sortType, setSortType] = useState<SortType>("distance-asc")
  const [recordCount, setRecordCount] = useState<number>(6)
  const [customRecordCount, setCustomRecordCount] = useState<string>("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const stationsListRef = useRef<HTMLDivElement>(null)

  const handleClose = useCallback(() => {
    onOpenChange(false)
    // Dialog kapandığında state'leri sıfırla
    setTimeout(() => {
      setDialogState("idle")
      setErrorMessage("")
      setStations([])
      setSortedStations([])
      setUserLocation(null)
      setSortType("distance-asc")
      setRecordCount(6)
      setCustomRecordCount("")
      setIsLoadingMore(false)
      setLoadMoreError("")
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

  const fetchNearbyStations = async (lat: number, lng: number, count: number = recordCount) => {
    setDialogState("loading")
    setErrorMessage("")

    try {
      const response = await fetch(
        `/api/nearby-stations?lat=${lat}&lng=${lng}&recordCount=${count}`
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

  // Sıralama fonksiyonu
  const sortStations = useCallback((stationsToSort: Station[], sort: SortType): Station[] => {
    const sorted = [...stationsToSort]
    
    switch (sort) {
      case "distance-asc":
        return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0))
      case "distance-desc":
        return sorted.sort((a, b) => (b.distance || 0) - (a.distance || 0))
      case "name-asc":
        return sorted.sort((a, b) => a.stationName.localeCompare(b.stationName, "tr"))
      case "name-desc":
        return sorted.sort((a, b) => b.stationName.localeCompare(a.stationName, "tr"))
      case "id-asc":
        return sorted.sort((a, b) => a.stationId - b.stationId)
      case "id-desc":
        return sorted.sort((a, b) => b.stationId - a.stationId)
      default:
        return sorted
    }
  }, [])

  // Stations değiştiğinde sıralama yap
  useEffect(() => {
    if (stations.length > 0) {
      const sorted = sortStations(stations, sortType)
      setSortedStations(sorted)
    } else {
      setSortedStations([])
    }
  }, [stations, sortType, sortStations])

  // Daha fazla durak çekme fonksiyonu
  const handleLoadMoreStations = async () => {
    if (!userLocation) return
    
    const count = parseInt(customRecordCount)
    if (isNaN(count) || count < 1 || count > 50) {
      setLoadMoreError("Lütfen 1 ile 50 arasında bir sayı girin.")
      return
    }

    setIsLoadingMore(true)
    setLoadMoreError("")
    
    try {
      const response = await fetch(
        `/api/nearby-stations?lat=${userLocation.lat}&lng=${userLocation.lng}&recordCount=${count}`
      )

      if (!response.ok) {
        throw new Error(`API yanıt hatası: ${response.status}`)
      }

      const data = await response.json()

      if (data.isSuccess && data.value && Array.isArray(data.value)) {
        setStations(data.value)
        setRecordCount(count)
        setCustomRecordCount("")
        setLoadMoreError("")
      } else {
        throw new Error("Geçersiz API yanıtı")
      }
    } catch (error) {
      console.error("Yakın duraklar çekilirken hata:", error)
      setLoadMoreError("Yakın duraklar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsLoadingMore(false)
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
      return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
    } else if (distance <= 500) {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400"
    } else if (distance <= 1000) {
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
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
            Burada konumunuzdan en yakın duraklar listelenir.
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
                  <div className="p-3 pt-3 pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Skeleton className="h-6 w-10 rounded flex-shrink-0" />
                        <Skeleton className="h-5 flex-1" />
                      </div>
                      <Skeleton className="h-5 w-12 rounded flex-shrink-0" />
                    </div>
                  </div>
                  <div className="border-t bg-muted/50">
                    <div className="flex">
                      <Skeleton className="h-8 flex-1 rounded-none" />
                      <div className="w-px bg-border" />
                      <Skeleton className="h-8 flex-1 rounded-none" />
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
            <div>
              {stations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Yakın durak bulunamadı.
                </div>
              ) : (
                <Tabs defaultValue="list" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger value="list" className="text-sm px-3 py-1.5">Duraklar</TabsTrigger>
                    <TabsTrigger value="map" className="text-sm px-3 py-1.5">Harita</TabsTrigger>
                  </TabsList>
                  
                  {/* Durak Listesi Tab */}
                  <TabsContent value="list" className="mt-4">
                    {/* Toolbar: Sıralama ve Daha Fazla Durak */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      {/* Sol: Sıralama Butonu (Dropdown) */}
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span>Sırala</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="start" 
                          className="w-48 z-[2000]"
                          sideOffset={4}
                          avoidCollisions={true}
                        >
                          <DropdownMenuLabel className="text-xs">Sıralama Ölçütü</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuRadioGroup value={sortType} onValueChange={(value) => setSortType(value as SortType)}>
                            <DropdownMenuRadioItem value="distance-asc" className="text-xs">Mesafe (Yakın → Uzak)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="distance-desc" className="text-xs">Mesafe (Uzak → Yakın)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="name-asc" className="text-xs">İsim (A → Z)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="name-desc" className="text-xs">İsim (Z → A)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="id-asc" className="text-xs">Durak No (Artan)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="id-desc" className="text-xs">Durak No (Azalan)</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Sağ: Daha Fazla Durak Input + Gönder (Birleşik) */}
                      <div className="flex items-center">
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="Sayı"
                            value={customRecordCount}
                            onChange={(e) => setCustomRecordCount(e.target.value)}
                            className="h-8 w-16 text-xs rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-1 text-center"
                            min="1"
                            max="50"
                            disabled={isLoadingMore}
                          />
                        </div>
                        <Button
                          onClick={handleLoadMoreStations}
                          size="sm"
                          className="h-8 text-xs px-3 rounded-l-none border border-l-0"
                          disabled={isLoadingMore || !customRecordCount}
                        >
                          {isLoadingMore ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <span>Durak Listele</span>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Hata mesajı (varsa) */}
                    {loadMoreError && (
                      <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">{loadMoreError}</p>
                      </div>
                    )}

                    <div ref={stationsListRef} className="space-y-2">
                      {sortedStations.map((station) => (
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
                                Yol Tarifi Al
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
                      ))}
                    </div>
                  </TabsContent>

                  {/* Harita Tab */}
                  <TabsContent value="map" className="mt-4">
                    {userLocation && (
                      <div className="w-full px-2">
                        <div className="w-full aspect-square rounded-lg overflow-hidden border bg-muted/30">
                          <NearbyStationsMap
                            userLat={userLocation.lat}
                            userLng={userLocation.lng}
                            stations={sortedStations}
                            onStationClick={(station) => {
                              // Haritada durak ikonuna tıklandığında popup zaten gösteriliyor
                              // Burada ekstra bir işlem yapmak isterseniz ekleyebilirsiniz
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

