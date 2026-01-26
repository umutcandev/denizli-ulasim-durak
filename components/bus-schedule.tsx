import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshProgress } from "@/components/refresh-progress"
import { Button } from "@/components/ui/button"
import { ExternalLink, MoreHorizontal, Copy, Map, Route, Clock, ChevronDown, ChevronUp, Navigation, Plus, Minus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React, { useEffect, useState, useCallback } from "react"
import { fetchBusSchedules } from "@/lib/api"
import { BusScheduleImageDialog } from "@/components/bus-schedule-image-dialog"
import { BusScheduleSkeleton } from "@/components/bus-schedule-skeleton"
import LeafletMap from "@/components/leaflet-map"
import LeafletStationMap from "@/components/leaflet-station-map"

interface BusData {
  stationName: string
  stationId: string
  longitude?: string
  latitude?: string
  busList: Array<{
    hatno: string
    hatadi: string
    sure: string
    kalanduraksayisi: number
    kalkisaKadarkiDakika: number
    plaka: string
    latitude?: string
    longitude?: string
  }>
}

interface BusLineData {
  stationName: string
  stationId: string
  longitude?: string
  latitude?: string
  routeList: Array<{
    routeCode: string
    routeNo: number
    routeLongName: string
    routeShortName: string
  }>
}

interface BusScheduleProps {
  data: BusData
  onRefresh: () => void
}

export default function BusSchedule({ data, onRefresh }: BusScheduleProps) {
  const [scheduleUrls, setScheduleUrls] = useState<Record<string, string>>({})
  const [selectedBusSchedule, setSelectedBusSchedule] = useState<{ url: string; busNumber: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [mapInstances, setMapInstances] = useState<Record<number, any>>({})

  // Bus lines için state'ler
  const [busLinesData, setBusLinesData] = useState<BusLineData | null>(null)
  const [busLinesLoading, setBusLinesLoading] = useState(false)
  const [busLinesError, setBusLinesError] = useState<string | null>(null)

  // Otobüs saatlerini çek
  const fetchScheduleUrls = useCallback(async () => {
    try {
      const urls = await fetchBusSchedules()
      setScheduleUrls(urls)
    } catch (error) {
      console.error("Otobüs saatleri yüklenirken hata oluştu:", error)
    }
  }, [])

  // Bus lines verilerini çek
  const fetchBusLines = useCallback(async (stationId: string) => {
    if (!stationId) return

    setBusLinesLoading(true)
    setBusLinesError(null)

    try {
      const response = await fetch(`/api/bus-lines?stationId=${stationId}`)
      if (!response.ok) {
        throw new Error(`API yanıt hatası: ${response.status}`)
      }

      const result = await response.json()

      if (result.isSuccess && result.value) {
        setBusLinesData({
          stationName: result.value.stationName,
          stationId: result.value.stationId,
          longitude: result.value.longitude,
          latitude: result.value.latitude,
          routeList: result.value.routeList || []
        })
      } else {
        throw new Error("Veri çekilemedi")
      }
    } catch (error) {
      console.error("Bus lines çekilirken hata:", error)
      setBusLinesError("Durak hatları yüklenirken bir hata oluştu")
    } finally {
      setBusLinesLoading(false)
    }
  }, [])

  // İlk yüklemede ve her yenilemede çalıştır
  useEffect(() => {
    fetchScheduleUrls()
  }, [fetchScheduleUrls])

  // Data değiştiğinde bus lines'ı çek
  useEffect(() => {
    if (data?.stationId) {
      fetchBusLines(data.stationId)
    }
  }, [data?.stationId, fetchBusLines])

  // Yenileme işlemini özelleştir
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)

    // Önce otobüs saatlerini yenile
    fetchScheduleUrls()

    // Bus lines'ı yenile
    if (data?.stationId) {
      fetchBusLines(data.stationId)
    }

    // Sonra ana veriyi yenile
    onRefresh()

    // Yenileme durumunu kapat
    setIsRefreshing(false)
  }, [fetchScheduleUrls, fetchBusLines, data?.stationId, onRefresh])

  // Otobüs saatleri diyaloğunu aç
  const openScheduleDialog = (busNumber: string, url: string) => {
    setSelectedBusSchedule({ url, busNumber })
    setIsDialogOpen(true)
  }

  // Satırı genişlet/daralt
  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      // Eğer tıklanan satır zaten açıksa, sadece onu kapat
      if (prev[index]) {
        return {
          ...prev,
          [index]: false
        }
      }

      // Eğer tıklanan satır kapalıysa, tüm satırları kapat ve sadece tıklanan satırı aç
      return {
        // Tüm satırları kapat
        [index]: true // Sadece tıklanan satırı aç
      }
    })
  }

  if (!data) {
    return (
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardContent className="pt-6">
          <div className="text-center p-4">Veri bulunamadı</div>
        </CardContent>
      </Card>
    )
  }

  // API yanıtı farklı bir formatta gelebilir, kontrol edelim
  const stationName = data.stationName || "Durak Bilgisi"
  const stationId = data.stationId || ""
  const busList = data.busList || []

  // Kalan süreye göre tag sınıfını belirleyen yardımcı fonksiyon
  const getTimeTagClass = (minutes: number): string => {
    if (minutes <= 10) return "time-tag time-tag-success"
    if (minutes <= 25) return "time-tag time-tag-warning"
    return "time-tag time-tag-danger"
  }

  // Süreyi dakikaya çeviren yardımcı fonksiyon
  const getMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Otobüs hattı detayları sayfasına yönlendirme
  const navigateToBusRoute = (busNumber: string) => {
    window.open(`https://ulasim.denizli.bel.tr/?page=hatBilgi&hatNo=${busNumber}`, "_blank")
  }

  // Hat numarasını kopyala
  const copyBusNumber = (busNumber: string) => {
    navigator.clipboard.writeText(busNumber)
      .catch(err => {
        console.error('Kopyalama hatası:', err)
      })
  }

  // Güzergah detaylarını göster
  const showRouteDetails = (busNumber: string, routeName: string) => {
    window.open(`https://ulasim.denizli.bel.tr/?page=hatBilgi&hatNo=${busNumber}#guzergah`, "_blank")
  }

  // Durak haritasını göster
  const showStationMap = (stationId: string) => {
    window.open(`https://ulasim.denizli.bel.tr/?page=harita&durakId=${stationId}`, "_blank")
  }

  // Ondalık ayırıcıyı virgülden noktaya çeviren yardımcı fonksiyon
  const formatCoordinate = (coordinate: string | undefined): string => {
    if (!coordinate) return "-"
    return coordinate.replace(",", ".")
  }

  // Map instance'ını kaydet
  const handleMapReady = useCallback((index: number, map: any) => {
    setMapInstances(prev => ({
      ...prev,
      [index]: map
    }))
  }, [])

  // Zoom in fonksiyonu
  const handleZoomIn = useCallback((index: number) => {
    const map = mapInstances[index]
    if (map) {
      map.zoomIn()
    }
  }, [mapInstances])

  // Zoom out fonksiyonu
  const handleZoomOut = useCallback((index: number) => {
    const map = mapInstances[index]
    if (map) {
      map.zoomOut()
    }
  }, [mapInstances])

  // Eğer yenileme yapılıyorsa, sadece tablo içeriğini skeleton olarak göster
  if (isRefreshing) {
    return <BusScheduleSkeleton stationName={stationName} stationId={stationId} />
  }

  // Evrensel durak bilgileri (bus lines data varsa onu kullan, yoksa mevcut data'yı kullan)
  const stationInfo = busLinesData || {
    stationName: data?.stationName,
    stationId: data?.stationId,
    longitude: data?.longitude,
    latitude: data?.latitude
  }

  return (
    <>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-stretch gap-3">
            {/* Sol taraf - Station bilgileri */}
            <div className="flex-1 min-w-0">
              <div className="space-y-1">
                {/* Station ID - Üst satır */}
                {stationInfo.stationId && (
                  <div className="flex items-center">
                    <span className="bg-primary text-primary-foreground px-1 py-0.3 rounded-md font-bold text-md">
                      {stationInfo.stationId}
                    </span>
                  </div>
                )}
                {/* Station Name - Alt satır */}
                <CardTitle className="text-md font-semibold">
                  {stationInfo.stationName}
                </CardTitle>
              </div>
            </div>

            {/* Sağ taraf - Dinamik harita */}
            {stationInfo.longitude && stationInfo.latitude && (
              <div className="relative w-32 sm:w-40 md:w-48 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 z-0">
                <LeafletStationMap
                  latitude={stationInfo.latitude}
                  longitude={stationInfo.longitude}
                  className="rounded"
                  onMapReady={(map) => handleMapReady(-1, map)}
                />

                {/* Zoom kontrolleri */}
                <div className="absolute top-1 right-1 z-[1000] flex flex-col gap-0.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0 bg-white/90 dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleZoomIn(-1)
                    }}
                  >
                    <Plus className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0 bg-white/90 dark:bg-zinc-800/90 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 shadow-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleZoomOut(-1)
                    }}
                  >
                    <Minus className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-4">
            <RefreshProgress interval={30000} onRefresh={handleRefresh} />
          </div>

          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="schedule">Dakika Bilgileri</TabsTrigger>
              <TabsTrigger value="lines">Duraktan Geçenler</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-4">
              {busList.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">Bu duraktan şu an için geçecek otobüs yoktur.</div>
              ) : (
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[60px] sm:w-[100px] p-2 pl-3 pr-1 sm:p-4">Hat</TableHead>
                        <TableHead className="p-2 px-1 sm:p-4">Güzergah</TableHead>
                        <TableHead className="text-right w-[60px] sm:w-[80px] p-2 px-1 sm:p-4">Süre</TableHead>
                        <TableHead className="text-right w-[60px] sm:w-[100px] p-2 pl-1 pr-3 sm:p-4">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {busList.map((bus, index) => {
                        // Kalan süreyi hesapla
                        let remainingTime = ""
                        let minutes = 0

                        if (bus.sure) {
                          const [hours, mins] = bus.sure.split(":").map(Number)
                          minutes = hours * 60 + mins

                          if (
                            bus.kalanduraksayisi === 1 &&
                            bus.kalkisaKadarkiDakika <= 0 &&
                            bus.plaka !== "EnYakinKalkis" &&
                            bus.plaka !== "ilkDurakKalkan"
                          ) {
                            remainingTime = "Gelmek Üzere"
                            minutes = 0
                          } else if (hours > 0) {
                            remainingTime = `${hours}s ${mins}dk`
                          } else {
                            remainingTime = `${mins}dk`
                          }
                        } else {
                          remainingTime = "Bilinmiyor"
                        }

                        const timeTagClass = getTimeTagClass(minutes)
                        const busNumber = bus.hatno?.replace(/D$/, "") || "-"
                        const isExpanded = expandedRows[index] || false

                        return (
                          <React.Fragment key={`bus-item-${index}`}>
                            <TableRow
                              key={`row-${index}`}
                              className={`border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${isExpanded ? "bg-zinc-50 dark:bg-zinc-900 border-b-0" : ""
                                }`}
                              onClick={() => toggleRowExpansion(index)}
                            >
                              <TableCell className="font-medium p-2 pl-3 pr-1 sm:p-4">
                                <div className="flex items-center">
                                  {busNumber}
                                  <span className="ml-2">
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="p-2 px-1 sm:p-4 max-w-[120px] sm:max-w-none truncate">{bus.hatadi || "-"}</TableCell>
                              <TableCell className="text-right p-2 px-1 sm:p-4">
                                <span className={`${timeTagClass} whitespace-nowrap`}>{remainingTime}</span>
                              </TableCell>
                              <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
                                {busNumber !== "-" && (
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 sm:h-9 px-2 sm:px-3 min-w-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="z-[2000]"
                                      sideOffset={4}
                                      avoidCollisions={true}
                                    >
                                      <DropdownMenuItem onClick={() => navigateToBusRoute(busNumber)}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        <span>Otobüs detayları</span>
                                      </DropdownMenuItem>
                                      {scheduleUrls[busNumber] && (
                                        <DropdownMenuItem onClick={() => openScheduleDialog(busNumber, scheduleUrls[busNumber])}>
                                          <Clock className="mr-2 h-4 w-4" />
                                          <span>Otobüs saatleri</span>
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                            <TableRow key={`detail-${index}`} className="border-t-0 border-b-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                              <TableCell colSpan={4} className="p-0">
                                <div className={`row-details-container ${isExpanded ? 'row-details-enter-active' : 'row-details-enter'}`}>
                                  <div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-0 min-h-56">
                                    {/* İlk satır - Sol: Kalan Durak */}
                                    <div className="px-3 py-2 border-t border-r border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                                        <Navigation className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-md font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                                          {bus.kalanduraksayisi !== undefined ? bus.kalanduraksayisi : "-"}
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">Kalan Durak</p>
                                      </div>
                                    </div>

                                    {/* İlk satır - Sağ: Bir Sonraki Kalkış */}
                                    <div className="px-3 py-2 border-t border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-2.5 h-2.5 text-zinc-500 dark:text-zinc-400" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-md font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                                          {bus.kalkisaKadarkiDakika <= 0 ?
                                            "Seyir Halinde" :
                                            bus.kalkisaKadarkiDakika !== undefined ?
                                              `${bus.kalkisaKadarkiDakika}dk` :
                                              "Seyir Halinde"
                                          }
                                        </p>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">Kalkışa Kalan</p>
                                      </div>
                                    </div>

                                    {/* İkinci satır - Konum alanı (tam genişlik) */}
                                    <div className="col-span-2 row-start-2 p-2 flex flex-col">
                                      {/* Harita - Mobil için daha büyük */}
                                      <div className="flex-1 min-h-32 relative overflow-hidden rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                                        {/* Gerçek Leaflet haritası - Sadece expand edilmişse */}
                                        {isExpanded && bus.latitude && bus.longitude ? (
                                          <LeafletMap
                                            latitude={bus.latitude}
                                            longitude={bus.longitude}
                                            stationLatitude={stationInfo.latitude}
                                            stationLongitude={stationInfo.longitude}
                                            className="rounded"
                                            onMapReady={(map) => handleMapReady(index, map)}
                                          />
                                        ) : isExpanded ? (
                                          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                              Konum mevcut değil
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                                              Haritayı görmek için expand edin
                                            </div>
                                          </div>
                                        )}

                                        {/* Plaka bilgisi ve Zoom kontrolleri - Sadece harita varken */}
                                        {isExpanded && bus.latitude && bus.longitude && (
                                          <div className="absolute top-1 right-1 z-[1000] flex flex-col items-end gap-1">
                                            <div className="flex shadow-sm group cursor-pointer transition-all duration-300 w-auto">
                                              {/* TR Etiketi */}
                                              <div className="bg-blue-600 rounded-l px-2 py-0.5 flex items-center">
                                                <span className="font-mono text-xs text-white font-base">TR</span>
                                              </div>
                                              {/* Plaka Alanı */}
                                              <div className="bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 border-l-0 rounded-r px-2 py-0.5">
                                                {(() => {
                                                  const plaka = bus.plaka && bus.plaka !== "EnYakinKalkis" && bus.plaka !== "ilkDurakKalkan" ? bus.plaka : "-";
                                                  if (plaka === "-" || !plaka.includes("/")) {
                                                    return (
                                                      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                                                        {plaka}
                                                      </p>
                                                    );
                                                  }

                                                  const shortPlaka = plaka.split("/")[0];

                                                  return (
                                                    <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap transition-all duration-300">
                                                      <span className="group-hover:hidden">
                                                        {shortPlaka}
                                                      </span>
                                                      <span className="hidden group-hover:inline">
                                                        {plaka}
                                                      </span>
                                                    </p>
                                                  );
                                                })()}
                                              </div>
                                            </div>

                                            {/* Zoom kontrolleri */}
                                            <div className="flex flex-col gap-0.5">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  handleZoomIn(index)
                                                }}
                                              >
                                                <Plus className="w-2 h-2 text-zinc-500 dark:text-zinc-400" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-6 p-0 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-sm"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  handleZoomOut(index)
                                                }}
                                              >
                                                <Minus className="w-2 h-2 text-zinc-500 dark:text-zinc-400" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Koordinat bilgisi - Sadece harita varken */}
                                        {isExpanded && bus.latitude && bus.longitude && (
                                          <div className="absolute bottom-1 left-1 bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 z-[1000] shadow-sm">
                                            {formatCoordinate(bus.latitude).substring(0, 6)}, {formatCoordinate(bus.longitude).substring(0, 6)}
                                          </div>
                                        )}

                                        {/* Canlı indicator - Sadece harita varken */}
                                        {isExpanded && bus.latitude && bus.longitude && bus.kalkisaKadarkiDakika <= 0 && (
                                          <div className="absolute top-1 left-1 bg-white/90 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1 z-[1000] shadow-sm">
                                            <div className="w-1 h-1 bg-red-500 rounded-full" />
                                            <span>Canlı</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="lines" className="mt-4">
              {busLinesLoading ? (
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[80px] p-2 pl-3 pr-1 sm:p-4">Hat</TableHead>
                        <TableHead className="p-2 px-1 sm:p-4 max-w-0">Hat Adı</TableHead>
                        <TableHead className="text-right w-[80px] p-2 pl-1 pr-3 sm:p-4">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={index} className="border-zinc-200 dark:border-zinc-800">
                          <TableCell className="font-medium p-2 pl-3 pr-1 sm:p-4 w-[80px]">
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell className="p-2 px-1 sm:p-4 truncate overflow-hidden">
                            <Skeleton className="h-4 w-full max-w-xs" />
                          </TableCell>
                          <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4 w-[80px]">
                            <Skeleton className="h-7 w-7 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : busLinesError ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 p-4 text-center">
                  {busLinesError}
                </div>
              ) : !busLinesData || busLinesData.routeList.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">Bu duraktan geçen hat bulunamadı.</div>
              ) : (
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-[80px] p-2 pl-3 pr-1 sm:p-4">Hat</TableHead>
                        <TableHead className="p-2 px-1 sm:p-4 max-w-0">Hat Adı</TableHead>
                        <TableHead className="text-right w-[80px] p-2 pl-1 pr-3 sm:p-4">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Duplicate verileri filtrele ve küçükten büyüğe sırala */}
                      {busLinesData.routeList
                        .filter((line, index, self) =>
                          index === self.findIndex((l) => l.routeCode === line.routeCode)
                        )
                        .sort((a, b) => {
                          // Hat numaralarını sayısal olarak karşılaştır
                          const numA = parseInt(a.routeCode?.replace(/D$/, "") || "0", 10)
                          const numB = parseInt(b.routeCode?.replace(/D$/, "") || "0", 10)
                          return numA - numB
                        })
                        .map((line, index) => {
                          const busNumber = line.routeCode?.replace(/D$/, "") || "-"

                          return (
                            <TableRow
                              key={`line-${index}`}
                              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            >
                              <TableCell className="font-medium p-2 pl-3 pr-1 sm:p-4 w-[80px]">
                                {busNumber}
                              </TableCell>
                              <TableCell className="p-2 px-1 sm:p-4 truncate overflow-hidden" title={line.routeLongName || "-"}>{line.routeLongName || "-"}</TableCell>
                              <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4 w-[80px]">
                                {busNumber !== "-" && (
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 sm:h-9 px-2 sm:px-3 min-w-0"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="z-[2000]"
                                      sideOffset={4}
                                      avoidCollisions={true}
                                    >
                                      <DropdownMenuItem onClick={() => navigateToBusRoute(busNumber)}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        <span>Hat detayları</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => window.open(`https://ulasim.denizli.bel.tr/map.html?hatNo=${busNumber}`, "_blank")}>
                                        <Map className="mr-2 h-4 w-4" />
                                        <span>Haritada göster</span>
                                      </DropdownMenuItem>
                                      {scheduleUrls[busNumber] && (
                                        <DropdownMenuItem onClick={() => openScheduleDialog(busNumber, scheduleUrls[busNumber])}>
                                          <Clock className="mr-2 h-4 w-4" />
                                          <span>Otobüs saatleri</span>
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => copyBusNumber(busNumber)}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        <span>Hat no kopyala</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Otobüs saatleri dialog */}
      {selectedBusSchedule && (
        <BusScheduleImageDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          imageUrl={selectedBusSchedule.url}
          busNumber={selectedBusSchedule.busNumber}
        />
      )}
    </>
  )
}
