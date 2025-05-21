"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { fetchBusData } from "@/lib/api"
import BusSchedule from "@/components/bus-schedule"
import StationInput from "@/components/station-input"
import RecentStations from "@/components/recent-stations"
import { ThemeToggle } from "@/components/theme-toggle"
import { BusScheduleSkeleton } from "@/components/bus-schedule-skeleton"
import MobileBottomSpace from "@/components/mobile-bottom-space"
import Image from "next/image"
import Link from "next/link"
import { Bus, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

// Otobüs saatleri JSON endpointi
const BUS_SCHEDULE_JSON_URL = "/api/bus-schedule-search"

export default function Home() {
  const [stationId, setStationId] = useState<string>("")
  const [busData, setBusData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [recentStations, setRecentStations] = useState<Array<{ id: string; name: string }>>([])
  const [currentTime, setCurrentTime] = useState<string>("")
  const scheduleRef = useRef<HTMLDivElement>(null)

  // Otobüs Saatleri Sorgulama State'leri
  const [busScheduleInputValue, setBusScheduleInputValue] = useState("")
  const [busScheduleLoading, setBusScheduleLoading] = useState(false)
  const [busScheduleError, setBusScheduleError] = useState("")
  const [busScheduleImageUrl, setBusScheduleImageUrl] = useState("")
  const [busScheduleDialogBusNumber, setBusScheduleDialogBusNumber] = useState("")
  const [isBusScheduleDialogOpen, setIsBusScheduleDialogOpen] = useState(false)

  // Tarayıcı tarafında çalıştığında zamanı ayarla
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }))
    }
    
    updateTime()
    
    // Her saniye zamanı güncelle
    const intervalId = setInterval(updateTime, 1000)
    
    return () => clearInterval(intervalId)
  }, [])

  // Service Worker'ı kaydet - sadece production ortamında ve tarayıcıda çalışırken
  useEffect(() => {
    // Tarayıcıda çalışıp çalışmadığını kontrol et
    if (typeof window === "undefined") return

    // Geliştirme ortamında veya preview ortamında service worker'ı kaydetme
    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/),
    )

    // Service worker'ı sadece production ortamında kaydet
    if ("serviceWorker" in navigator && !isLocalhost) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Service Worker registered with scope:", registration.scope)
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
          })
      })
    } else {
      console.log("Service Worker is disabled in development or preview environment")
    }
  }, [])

  // Sayfa yüklendiğinde localStorage'dan son bakılan durakları al
  useEffect(() => {
    const savedStations = localStorage.getItem("recentStations")
    if (savedStations) {
      try {
        setRecentStations(JSON.parse(savedStations))
      } catch (e) {
        console.error("Kaydedilmiş duraklar yüklenemedi:", e)
      }
    }
  }, [])

  // Veri çekme fonksiyonu
  const loadBusData = useCallback(async () => {
    if (!stationId) return

    try {
      setLoading(true)
      setError(null)
      const data = await fetchBusData(stationId)
      setBusData(data)

      // Durak adını al ve son bakılan duraklara ekle
      if (data && data.stationName) {
        addToRecentStations(stationId, data.stationName)
      }
      
      // Veri yüklendikten sonra, durak bilgilerine scroll yap
      setTimeout(() => {
        if (scheduleRef.current) {
          scheduleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    } catch (err) {
      setError("Veri yüklenirken bir hata oluştu. Lütfen geçerli bir durak numarası girdiğinizden emin olun.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [stationId])

  // Durak numarası değiştiğinde veri çek
  useEffect(() => {
    if (stationId) {
      loadBusData()
    }
  }, [stationId, loadBusData])

  // Son bakılan duraklara ekle
  const addToRecentStations = (id: string, name: string) => {
    const newStation = { id, name }

    // Eğer durak zaten listede varsa, onu çıkar (en başa eklemek için)
    const filteredStations = recentStations.filter((station) => station.id !== id)

    // Yeni durak listesi oluştur (en fazla 10 durak)
    const updatedStations = [newStation, ...filteredStations].slice(0, 10)

    // State ve localStorage'ı güncelle
    setRecentStations(updatedStations)
    localStorage.setItem("recentStations", JSON.stringify(updatedStations))
  }

  const handleStationSubmit = (newStationId: string) => {
    if (newStationId) {
      setStationId(newStationId)
    }
  }

  const handleRecentStationClick = (id: string) => {
    setStationId(id)
  }

  // Otobüs Saatleri Sorgulama Fonksiyonları
  const openBusScheduleDialog = () => {
    setIsBusScheduleDialogOpen(true)
    setBusScheduleError("") // Dialog açıldığında eski hataları temizle
    setBusScheduleImageUrl("") // Dialog açıldığında eski resmi temizle
    setBusScheduleInputValue("") // Dialog açıldığında inputu temizle
  }

  // Otobüs Saatleri Sorgulama (Dialog İçin)
  const handleBusScheduleSearchInDialog = async () => {
    setBusScheduleError("")
    setBusScheduleLoading(true)
    setBusScheduleImageUrl("") // Yeni arama öncesi eski resmi temizle
    try {
      const res = await fetch(BUS_SCHEDULE_JSON_URL)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || `API isteği başarısız: ${res.status}`)
      }
      const data = await res.json()
      const found = data.otobus.find((bus: any) => bus.HatNo === busScheduleInputValue.trim())
      if (found && found.SaatResim) {
        setBusScheduleDialogBusNumber(found.HatNo) // Bu state dialog başlığında kullanılabilir
        setBusScheduleImageUrl(found.SaatResim)
      } else {
        setBusScheduleError("Girilen numarada otobüs bulunamadı veya saat bilgisi yok.")
      }
    } catch (e: any) {
      setBusScheduleError(e.message || "Veri alınırken bir hata oluştu.")
    } finally {
      setBusScheduleLoading(false)
    }
  }

  const handleBusScheduleKeyDownInDialog = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleBusScheduleSearchInDialog()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-zinc-900 dark:bg-black text-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center">
              <div className="pl-2 mr-3 sm:mr-4">
                <Image 
                  src="/images/logo-twins.png" 
                  alt="Logo" 
                  width={50} 
                  height={50} 
                  className="object-contain" 
                  loading="lazy"
                />
              </div>
              <div>
                <Link href="/">
                  <h1 className="text-xl sm:text-2xl font-bold">Denizli Akıllı Durak</h1>
                </Link>
                <p className="text-xs text-gray-400">Denizli Ulaşım'ın durak saatleri için hazırlanmıştır.</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 sm:mt-0 sm:justify-end sm:gap-4">
              <div className="text-sm">{currentTime}</div>
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <StationInput 
            onSubmit={handleStationSubmit} 
            isLoading={loading} 
            onShowBusTimesClick={openBusScheduleDialog} 
          />

          {recentStations.length > 0 && (
            <RecentStations stations={recentStations} onStationClick={handleRecentStationClick} />
          )}

          <div ref={scheduleRef}>
            {!stationId ? (
              <div className="bg-card text-card-foreground rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm p-3 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <Bus className="h-6 w-6 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Yukarıdan bir durak numarası girin...</p>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <BusScheduleSkeleton stationName={busData?.stationName} stationId={busData?.stationId} />
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 p-6 text-center">
                {error}
              </div>
            ) : (
              <BusSchedule data={busData} onRefresh={loadBusData} />
            )}
          </div>
          
          {/* Mobile bottom space */}
          <MobileBottomSpace />
        </div>
      </div>

      {/* Yeni Otobüs Saatleri Dialog */}
      <Dialog open={isBusScheduleDialogOpen} onOpenChange={setIsBusScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Otobüs Saatlerini Sorgula</DialogTitle>
            <DialogDescription>
              Otobüs hat numarasını girerek ({busScheduleDialogBusNumber ? `${busScheduleDialogBusNumber} için gösteriliyor` : "örn: 190"}) saatlerini görüntüleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 flex-grow overflow-y-auto">
            <div className="flex items-center space-x-2 px-1">
              <Input 
                id="bus-schedule-input-dialog"
                type="text"
                placeholder="Otobüs hat numarasını girin"
                value={busScheduleInputValue}
                onChange={(e) => setBusScheduleInputValue(e.target.value)}
                onKeyDown={handleBusScheduleKeyDownInDialog}
                disabled={busScheduleLoading}
                className="flex-grow"
                autoFocus
              />
              <Button 
                onClick={handleBusScheduleSearchInDialog} 
                disabled={busScheduleLoading || !busScheduleInputValue}
              >
                Sorgula
              </Button>
            </div>
            {busScheduleLoading && <p className="text-sm text-center text-muted-foreground">Getiriliyor...</p>}
            {busScheduleError && <p className="text-sm text-center text-red-500">{busScheduleError}</p>}
            {busScheduleImageUrl && (
              <div className="mt-4 border rounded-lg overflow-hidden">
                <Image
                  src={busScheduleImageUrl} 
                  alt={`${busScheduleDialogBusNumber || 'Otobüs'} Hat Saatleri`}
                  width={700}
                  height={1000}
                  style={{ 
                    width: '100%', 
                    height: 'auto',
                    display: 'block'
                  }} 
                  onLoad={() => console.log("Image loaded: ", busScheduleImageUrl)} 
                  onError={() => setBusScheduleError("Saat görseli yüklenemedi.")} 
                  priority 
                  unoptimized 
                />
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-start mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Kapat
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
