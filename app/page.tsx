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

// Otobüs hattı verisi için tip tanımı
interface BusRoute {
  HatNo: string;
  HatAdi: string;
  SaatResim: string;
  onemli_duraklar?: string;
}

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
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false)

  // Canlı arama için state'ler
  const [allBusRoutes, setAllBusRoutes] = useState<BusRoute[]>([])
  const [filteredBusRoutes, setFilteredBusRoutes] = useState<BusRoute[]>([])

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

  // Sayfa yüklendiğinde ve dialog açıldığında tüm otobüs hatlarını çek
  useEffect(() => {
    const fetchAllBusRoutes = async () => {
      // Eğer zaten çekilmişse tekrar çekme
      if (allBusRoutes.length > 0) return

      try {
        const res = await fetch(BUS_SCHEDULE_JSON_URL)
        if (!res.ok) {
          throw new Error("Otobüs hatları yüklenemedi.")
        }
        const data = await res.json()
        if (data && data.otobus) {
          // Gelen veride "D" içeren HatNo'ları temizle
          const cleanedRoutes = data.otobus.map((route: any) => ({
            ...route,
            HatNo: route.HatNo.replace("D", ""),
          }))
          setAllBusRoutes(cleanedRoutes)
        }
      } catch (error) {
        console.error("Tüm otobüs hatları çekilirken hata:", error)
        // Hata durumunda kullanıcıya bilgi verilebilir, şimdilik konsola yazıyoruz.
      }
    }

    if (isBusScheduleDialogOpen) {
      fetchAllBusRoutes()
    }
  }, [isBusScheduleDialogOpen, allBusRoutes.length])

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
    setFilteredBusRoutes([]) // Dialog açıldığında önerileri temizle
    setIsImageLightboxOpen(false) // Lightbox'ı da kapat
  }

  // Otobüs Saatleri Sorgulama (Dialog İçin) - artık isteğe bağlı hatNo alabiliyor
  const handleBusScheduleSearchInDialog = async (hatNo?: string) => {
    const searchTerm = (hatNo || busScheduleInputValue).trim()
    if (!searchTerm) return

    setBusScheduleError("")
    setBusScheduleLoading(true)
    setBusScheduleImageUrl("") // Yeni arama öncesi eski resmi temizle
    setFilteredBusRoutes([]) // Aramayı başlatınca önerileri temizle
    
    try {
      // `allBusRoutes` state'i zaten dolu, tekrar fetch yapmaya gerek yok.
      if (allBusRoutes.length === 0) {
        throw new Error("Otobüs hat listesi henüz yüklenmedi.")
      }
      
      const found = allBusRoutes.find((bus: BusRoute) => bus.HatNo === searchTerm)

      if (found && found.SaatResim) {
        setBusScheduleDialogBusNumber(found.HatNo)
        setBusScheduleImageUrl(found.SaatResim)
        setBusScheduleInputValue(found.HatNo) // Input'u da güncelle
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

  // Canlı arama için input değişimini yöneten fonksiyon
  const handleBusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBusScheduleInputValue(value)
    setBusScheduleImageUrl("") // Yazmaya başlayınca resmi temizle
    setBusScheduleError("") // Yazmaya başlayınca hatayı temizle

    if (value.trim() === "") {
      setFilteredBusRoutes([])
    } else {
      const filtered = allBusRoutes
        .filter(bus => bus.HatNo.startsWith(value))
        .slice(0, 10) // Performans için sonuçları sınırla
      setFilteredBusRoutes(filtered)
    }
  }

  // Öneri listesinden bir hat seçildiğinde
  const handleSuggestionClick = (hatNo: string) => {
    setBusScheduleInputValue(hatNo)
    setFilteredBusRoutes([])
    handleBusScheduleSearchInDialog(hatNo) // Seçilen hat için aramayı direkt yap
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

          <div className="space-y-4 p-1 flex-grow flex flex-col">
            {/* Arama alanı */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Input
                  id="bus-schedule-input-dialog"
                  type="text"
                  placeholder="Otobüs hat numarası girin"
                  value={busScheduleInputValue}
                  onChange={handleBusInputChange}
                  onKeyDown={handleBusScheduleKeyDownInDialog}
                  disabled={busScheduleLoading}
                  className="flex-grow"
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  onClick={() => handleBusScheduleSearchInDialog()}
                  disabled={busScheduleLoading || !busScheduleInputValue}
                >
                  Sorgula
                </Button>
              </div>
              {filteredBusRoutes.length > 0 && (
                <div className="absolute z-50 w-full bg-card border border-border rounded-md shadow-lg bottom-full mb-1 max-h-60 overflow-y-auto">
                  <ul>
                    {filteredBusRoutes.map((bus) => (
                      <li
                        key={bus.HatNo}
                        className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2"
                        onClick={() => handleSuggestionClick(bus.HatNo)}
                      >
                        <span className="font-bold flex-shrink-0">{bus.HatNo}</span>
                        <span className="text-muted-foreground flex-shrink-0">-</span>
                        <span className="text-sm text-muted-foreground font-normal truncate min-w-0">
                          {bus.onemli_duraklar || bus.HatAdi || 'Bilgi yok'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sonuç Alanı */}
            <div className="flex-grow overflow-y-auto pt-2 max-h-[50vh]">
              {busScheduleLoading && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  Getiriliyor...
                </p>
              )}
              {busScheduleError && (
                <p className="text-sm text-center text-destructive pt-2">
                  {busScheduleError}
                </p>
              )}

              {busScheduleImageUrl && (
                <div className="mt-2">
                  <button
                    onClick={() => setIsImageLightboxOpen(true)}
                    className="relative w-full h-auto max-h-[45vh] cursor-zoom-in group block overflow-hidden"
                    aria-label="Otobüs saatleri görselini büyüt"
                  >
                    <Image
                      src={busScheduleImageUrl}
                      alt={`${busScheduleDialogBusNumber} nolu otobüsün sefer saatleri`}
                      width={400}
                      height={600}
                      style={{ objectFit: 'contain', width: '100%', height: 'auto', maxHeight: '45vh' }}
                      className="rounded-md"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                      <p className="text-white font-semibold">Büyütmek için tıkla</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-start px-1 pb-2 border-t pt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full">
                Kapat
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox Dialog */}
      {busScheduleImageUrl && (
        <Dialog open={isImageLightboxOpen} onOpenChange={setIsImageLightboxOpen}>
          <DialogContent className="max-w-fit h-auto max-h-[90vh] p-0 flex items-center justify-center border-0 bg-transparent shadow-none">
            <DialogHeader className="sr-only">
              <DialogTitle>{busScheduleDialogBusNumber} Nolu Otobüs Saatleri - Büyük Görünüm</DialogTitle>
              <DialogDescription>
                Bu, {busScheduleDialogBusNumber} nolu otobüs hattının sefer saatlerini gösteren büyütülmüş bir görseldir.
              </DialogDescription>
            </DialogHeader>
            <Image
              src={busScheduleImageUrl}
              alt={`${busScheduleDialogBusNumber} nolu otobüsün sefer saatleri - büyük görünüm`}
              width={700}
              height={990}
              style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw' }}
              className="rounded-lg"
              unoptimized
            />
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}
