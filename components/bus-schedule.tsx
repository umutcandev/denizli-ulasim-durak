import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshProgress } from "@/components/refresh-progress"

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
      <CardContent>
        {busList.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">Bu duraktan şu an için geçecek otobüs yoktur.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 dark:border-zinc-800">
                <TableHead className="w-[100px]">Hat No</TableHead>
                <TableHead>Güzergah</TableHead>
                <TableHead className="text-right">Kalan Süre</TableHead>
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
                    remainingTime = `${hours} saat ${mins} dk`
                  } else {
                    remainingTime = `${mins} dk`
                  }
                } else {
                  remainingTime = "Bilinmiyor"
                }

                const timeTagClass = getTimeTagClass(minutes)

                return (
                  <TableRow
                    key={index}
                    className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    <TableCell className="font-medium">{bus.hatno?.replace("D", "") || "-"}</TableCell>
                    <TableCell>{bus.hatadi || "-"}</TableCell>
                    <TableCell className="text-right">
                      <span className={timeTagClass}>{remainingTime}</span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
