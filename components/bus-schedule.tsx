import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshProgress } from "@/components/refresh-progress"
import { Button } from "@/components/ui/button"
import { ExternalLink, MoreHorizontal, Copy, Map, Route, Clock, ChevronDown, ChevronUp } from "lucide-react"
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

interface BusData {
  stationName: string
  stationId: string
  busList: Array<{
    hatno: string
    hatadi: string
    sure: string
    kalanduraksayisi: number
    kalkisaKadarkiDakika: number
    plaka: string
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

  // Otobüs saatlerini çek
  const fetchScheduleUrls = useCallback(async () => {
    try {
      const urls = await fetchBusSchedules()
      setScheduleUrls(urls)
    } catch (error) {
      console.error("Otobüs saatleri yüklenirken hata oluştu:", error)
    }
  }, [])

  // İlk yüklemede ve her yenilemede çalıştır
  useEffect(() => {
    fetchScheduleUrls()
  }, [fetchScheduleUrls])

  // Yenileme işlemini özelleştir
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    
    // Önce otobüs saatlerini yenile
    fetchScheduleUrls()
    
    // Sonra ana veriyi yenile
    onRefresh()
    
    // Kısa bir süre sonra yenileme durumunu kapat
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }, [fetchScheduleUrls, onRefresh])

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
      .then(() => {
        // İsteğe bağlı olarak bir bildirim gösterilebilir
        console.log(`Hat ${busNumber} kopyalandı`)
      })
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

  // Eğer yenileme yapılıyorsa, sadece tablo içeriğini skeleton olarak göster
  if (isRefreshing) {
    return <BusScheduleSkeleton stationName={stationName} stationId={stationId} />
  }

  return (
    <>
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl text-center">
            {stationName} {stationId && `(${stationId})`} DURAĞI
          </CardTitle>
          <div className="mt-4">
            <RefreshProgress interval={30000} onRefresh={handleRefresh} />
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
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
                        remainingTime = `${hours}s ${mins}d`
                      } else {
                        remainingTime = `${mins}dk`
                      }
                    } else {
                      remainingTime = "Bilinmiyor"
                    }

                    const timeTagClass = getTimeTagClass(minutes)
                    const busNumber = bus.hatno?.replace("D", "") || "-"
                    const isExpanded = expandedRows[index] || false

                    return (
                      <React.Fragment key={`bus-item-${index}`}>
                        <TableRow
                          key={`row-${index}`}
                          className={`border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer ${
                            isExpanded ? "bg-zinc-50 dark:bg-zinc-900" : ""
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
                            <span className={timeTagClass}>{remainingTime}</span>
                          </TableCell>
                          <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
                            {busNumber !== "-" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 sm:h-9 px-2 sm:px-3 min-w-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigateToBusRoute(busNumber)}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    <span>Otobüs detayları</span>
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
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                        <TableRow key={`detail-${index}`} className="border-t-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                          <TableCell colSpan={4} className="p-0">
                            <div className={`row-details-container ${isExpanded ? 'row-details-enter-active' : 'row-details-enter'}`}>
                              <div className="p-3 px-4 sm:px-6">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <div className="font-semibold text-zinc-500 dark:text-zinc-400">Kalan Durak</div>
                                    <div>
                                      {bus.kalanduraksayisi !== undefined ? (
                                        <span className={`time-tag ${
                                          bus.kalanduraksayisi <= 5 ? "time-tag-success" : 
                                          bus.kalanduraksayisi <= 15 ? "time-tag-warning" : 
                                          "time-tag-danger"
                                        }`}>
                                          {bus.kalanduraksayisi}
                                        </span>
                                      ) : "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-zinc-500 dark:text-zinc-400">İlk Kalkışa Kalan</div>
                                    <div>
                                      {bus.kalkisaKadarkiDakika <= 0 ? 
                                        "Otobüs Hareket Halinde" : 
                                        bus.kalkisaKadarkiDakika !== undefined ? 
                                          `${bus.kalkisaKadarkiDakika} dk` : 
                                          "Otobüs Hareket Halinde"
                                      }
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-zinc-500 dark:text-zinc-400">Plaka</div>
                                    <div>{bus.plaka && bus.plaka !== "EnYakinKalkis" && bus.plaka !== "ilkDurakKalkan" ? bus.plaka : "-"}</div>
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
