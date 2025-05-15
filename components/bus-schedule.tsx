import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshProgress } from "@/components/refresh-progress"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

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

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-center">
          {stationName} {stationId && `(${stationId})`} DURAĞI
        </CardTitle>
        <div className="mt-4">
          <RefreshProgress interval={30000} onRefresh={onRefresh} />
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

                  return (
                    <TableRow
                      key={index}
                      className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <TableCell className="font-medium p-2 pl-3 pr-1 sm:p-4">{busNumber}</TableCell>
                      <TableCell className="p-2 px-1 sm:p-4 max-w-[120px] sm:max-w-none truncate">{bus.hatadi || "-"}</TableCell>
                      <TableCell className="text-right p-2 px-1 sm:p-4">
                        <span className={timeTagClass}>{remainingTime}</span>
                      </TableCell>
                      <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4">
                        {busNumber !== "-" && (
                          <Button 
                            onClick={() => navigateToBusRoute(busNumber)}
                            variant="outline" 
                            size="sm"
                            className="h-7 sm:h-9 px-2 sm:px-3 min-w-0 flex items-center gap-1"
                          >
                            <span className="hidden sm:inline">Otobüse İlerle</span>
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
