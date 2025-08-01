"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { fetchBusData } from "@/lib/api"
import BusSchedule from "@/components/bus-schedule"
import StationInput from "@/components/station-input"
import RecentStations from "@/components/recent-stations"
import RecentBusLines from "@/components/recent-bus-lines"
import { ThemeToggle } from "@/components/theme-toggle"
import { BusScheduleSkeleton } from "@/components/bus-schedule-skeleton"
import MobileBottomSpace from "@/components/mobile-bottom-space"
import Image from "next/image"
import Link from "next/link"
import { Bus, MapPin, Search } from "lucide-react"
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
  GuzergahIsmi?: string;
}

export default function Home() {
  const [stationId, setStationId] = useState<string>("")
  const [busData, setBusData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [recentStations, setRecentStations] = useState<Array<{ id: string; name: string }>>([])
  const [weatherData, setWeatherData] = useState<{
    temperature: string;
  } | null>(null)
  const [recentBusLines, setRecentBusLines] = useState<string[]>([])
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
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)

  // Hava durumu verilerini çek
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch('/api/weather')
        if (response.ok) {
          const data = await response.json()
          setWeatherData(data)
        }
      } catch (error) {
        console.error('Hava durumu verisi alınamadı:', error)
      }
    }
    
    fetchWeatherData()
    
    // Her 5 dakikada bir hava durumunu güncelle
    const intervalId = setInterval(fetchWeatherData, 5 * 60 * 1000)
    
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

    const savedLines = localStorage.getItem("recentBusLines")
    if (savedLines) {
      try {
        setRecentBusLines(JSON.parse(savedLines))
      } catch (e) {
        console.error("Kaydedilmiş hatlar yüklenemedi:", e)
      }
    }
  }, [])

  // Bu useEffect artık kullanılmıyor - API çağrıları handleBusInputChange içinde yapılıyor

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

  const addToRecentBusLines = (line: string) => {
    const upperCaseLine = line.toUpperCase()
    const filteredLines = recentBusLines.filter((l) => l.toUpperCase() !== upperCaseLine)
    const updatedLines = [upperCaseLine, ...filteredLines].slice(0, 10)
    setRecentBusLines(updatedLines)
    localStorage.setItem("recentBusLines", JSON.stringify(updatedLines))
  }

  const handleStationSubmit = (newStationId: string) => {
    if (newStationId) {
      setStationId(newStationId)
    }
  }

  const handleRecentStationClick = (id: string) => {
    setStationId(id)
  }

  const handleRecentLineClick = async (line: string) => {
    setBusScheduleInputValue(line)
    
    // Eğer veriler henüz yüklenmemişse, önce veriyi yükle
    if (allBusRoutes.length === 0) {
      setBusScheduleLoading(true)
      setBusScheduleError("")
      setBusScheduleImageUrl("")
      setFilteredBusRoutes([])
      
      try {
        const res = await fetch(BUS_SCHEDULE_JSON_URL)
        if (!res.ok) {
          throw new Error("Otobüs hatları yüklenemedi.")
        }
        const data = await res.json()
        if (data && data.otobus) {
          // Gelen veride "D" içeren HatNo'ları temizle
          const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
            ...route,
            HatNo: route.HatNo.replace("D", ""),
          }))
          setAllBusRoutes(cleanedRoutes)
          
          // Veri yüklendikten sonra aramayı yap
          const found = cleanedRoutes.find((bus: BusRoute) => bus.HatNo.toUpperCase() === line.toUpperCase())
          if (found && found.SaatResim) {
            setBusScheduleDialogBusNumber(found.HatNo)
            setBusScheduleImageUrl(found.SaatResim)
            addToRecentBusLines(found.HatNo)
          } else {
            setBusScheduleError(`'${line}' için otobüs saatleri bulunamadı.`)
          }
        }
      } catch (error) {
        console.error("Tüm otobüs hatları çekilirken hata:", error)
        setBusScheduleError("Otobüs hatları yüklenirken bir hata oluştu.")
      } finally {
        setBusScheduleLoading(false)
      }
    } else {
      // Veriler zaten yüklüyse direkt arama yap
      handleBusScheduleSearchInDialog(line)
    }
  }

  // Otobüs Saatleri Sorgulama Fonksiyonları
  const openBusScheduleDialog = () => {
    setIsBusScheduleDialogOpen(true)
    setBusScheduleError("") // Dialog açıldığında eski hataları temizle
    setBusScheduleImageUrl("") // Dialog açıldığında eski resmi temizle
    setBusScheduleInputValue("") // Dialog açıldığında inputu temizle
    setFilteredBusRoutes([]) // Dialog açıldığında önerileri temizle
    setIsImageLightboxOpen(false) // Lightbox'ı da kapat
    setIsFilterLoading(false) // Loading state'ini sıfırla
    
    // Artık dialog açıldığında API çağrısı yapmıyoruz
  }

  // Tüm otobüs hatlarını çekme fonksiyonu
  const fetchAllBusRoutes = async () => {
    try {
      const res = await fetch(BUS_SCHEDULE_JSON_URL)
      if (!res.ok) {
        throw new Error("Otobüs hatları yüklenemedi.")
      }
      const data = await res.json()
      if (data && data.otobus) {
        // Gelen veride "D" içeren HatNo'ları temizle
        const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
          ...route,
          HatNo: route.HatNo.replace("D", ""),
        }))
        setAllBusRoutes(cleanedRoutes)
      }
    } catch (error) {
      console.error("Tüm otobüs hatları çekilirken hata:", error)
      setBusScheduleError("Otobüs hatları yüklenirken bir hata oluştu.")
    }
  }

  // Otobüs Saatleri Sorgulama (Dialog İçin) - artık isteğe bağlı hatNo alabiliyor
  const handleBusScheduleSearchInDialog = async (hatNo?: string) => {
    const searchTerm = (hatNo || busScheduleInputValue).trim().toUpperCase()
    if (!searchTerm) return

    setBusScheduleLoading(true)
    setBusScheduleError("")
    setBusScheduleImageUrl("")
    setFilteredBusRoutes([])

    try {
      if (allBusRoutes.length === 0) {
        throw new Error("Otobüs hat listesi henüz yüklenmedi.")
      }
      
      const found = allBusRoutes.find((bus: BusRoute) => bus.HatNo.toUpperCase() === searchTerm)

      if (found && found.SaatResim) {
        setBusScheduleDialogBusNumber(found.HatNo)
        setBusScheduleImageUrl(found.SaatResim)
        setBusScheduleInputValue(found.HatNo)
        addToRecentBusLines(found.HatNo)
      } else {
        setBusScheduleError(`'${searchTerm}' için otobüs saatleri bulunamadı.`)
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
  const handleBusInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    
    // Sadece sayısal karakterlere (0-9), maksimum 3 haneli ve 0 ile başlayamaz
    if (value.length > 3) {
      return
    }
    
    // Boş string veya 1-9 ile başlayan sayılara izin ver (0 ile başlayamaz)
    if (value !== "" && !/^[1-9][0-9]*$/.test(value)) {
      return
    }
    
    setBusScheduleInputValue(value)
    setBusScheduleImageUrl("") // Yazmaya başlayınca resmi temizle
    setBusScheduleError("") // Yazmaya başlayınca hatayı temizle

    if (value.trim() === "") {
      setFilteredBusRoutes([])
      setShowScrollIndicator(true)
      setIsFilterLoading(false)
    } else {
      // Eğer veriler henüz yüklenmemişse, yükle
      if (allBusRoutes.length === 0) {
        setIsFilterLoading(true)
        try {
          const res = await fetch(BUS_SCHEDULE_JSON_URL)
          if (!res.ok) {
            throw new Error("Otobüs hatları yüklenemedi.")
          }
          const data = await res.json()
          if (data && data.otobus) {
            // Gelen veride "D" içeren HatNo'ları temizle
            const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
              ...route,
              HatNo: route.HatNo.replace("D", ""),
            }))
            setAllBusRoutes(cleanedRoutes)
            
            // Veri yüklendikten sonra filtreleme yap
            const filtered = cleanedRoutes
              .filter((bus: BusRoute) => bus.HatNo.startsWith(value))
              .slice(0, 10)
            setFilteredBusRoutes(filtered)
          }
        } catch (error) {
          console.error("Tüm otobüs hatları çekilirken hata:", error)
          setBusScheduleError("Otobüs hatları yüklenirken bir hata oluştu.")
        } finally {
          setIsFilterLoading(false)
        }
      } else {
        // Veriler zaten yüklüyse filtreleme yap
        setIsFilterLoading(true)
        try {
          const filtered = allBusRoutes
            .filter((bus: BusRoute) => bus.HatNo.startsWith(value))
            .slice(0, 10)
          setFilteredBusRoutes(filtered)
        } finally {
          setIsFilterLoading(false)
        }
      }
      setShowScrollIndicator(true)
    }
  }

  // Scroll pozisyonunu kontrol eden fonksiyon
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5 // 5px tolerans
    setShowScrollIndicator(!isAtBottom)
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
        <div className="relative bg-zinc-900 dark:bg-black text-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-row justify-between items-center">
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
            <div className="sm:relative sm:top-auto sm:right-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <StationInput 
            onSubmit={handleStationSubmit} 
            isLoading={loading} 
            onShowBusTimesClick={openBusScheduleDialog}
            weatherData={weatherData}
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
              Otobüs hat numarasını girerek otobüs saatlerini görüntüleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow flex flex-col min-h-0">
            {/* Arama alanı */}
            <div className="relative px-1 pb-2">
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  maxLength={3}
                  placeholder="Hat no (örn: 190)"
                  value={busScheduleInputValue}
                  onChange={handleBusInputChange}
                  onKeyDown={handleBusScheduleKeyDownInDialog}
                  className="flex-grow"
                  aria-label="Hat No"
                  disabled={busScheduleLoading}
                  autoComplete="off"
                  autoFocus
                />
                <Button
                  onClick={() => handleBusScheduleSearchInDialog()}
                  disabled={busScheduleLoading || !busScheduleInputValue}
                >
                  {busScheduleLoading ? "Yükleniyor..." : "Sorgula"}
                </Button>
              </div>
              {/* Canlı öneriler */}
              {(filteredBusRoutes.length > 0 || isFilterLoading) && (
                <div className="absolute z-50 w-full bg-card border border-border rounded-md shadow-lg bottom-full mb-1 max-h-60 overflow-hidden">
                  <div 
                    className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                    onScroll={handleScroll}
                  >
                    {isFilterLoading ? (
                      <div className="space-y-0">
                        {/* Skeleton Items - Gerçek liste elemanlarını taklit ediyor */}
                        {Array.from({ length: 6 }).map((_, index) => (
                          <div key={index} className="px-3 py-2 flex items-center gap-2 animate-pulse">
                            {/* Hat numarası tag skeleton */}
                            <div className="h-6 w-8 bg-muted rounded flex-shrink-0"></div>
                            {/* Hat açıklaması skeleton - farklı genişliklerde */}
                            <div className={`h-4 bg-muted rounded flex-shrink-0 ${
                              index % 3 === 0 ? 'w-32' : 
                              index % 3 === 1 ? 'w-40' : 'w-36'
                            }`}></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <ul>
                        {filteredBusRoutes.map((bus: BusRoute) => (
                          <li
                            key={bus.HatNo}
                            className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2"
                            onClick={() => handleSuggestionClick(bus.HatNo)}
                          >
                            <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded font-bold flex-shrink-0">{bus.HatNo}</span>
                            <span className="text-sm text-muted-foreground font-normal truncate min-w-0">
                              {bus.GuzergahIsmi || bus.HatAdi || 'Bilgi yok'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {/* Scroll indicator and fade effect */}
                  {!isFilterLoading && filteredBusRoutes.length > 5 && showScrollIndicator && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none flex items-end justify-center pb-1">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>↓</span>
                        <span>{filteredBusRoutes.length - 5}+ hat</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sonuç Alanı */}
            <div className="flex-grow overflow-y-auto px-1 min-h-0 relative">
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
                    className="relative w-full cursor-zoom-in group block overflow-hidden"
                    aria-label="Otobüs saatleri görselini büyüt"
                  >
                    <Image
                      src={busScheduleImageUrl}
                      alt={`${busScheduleDialogBusNumber} nolu otobüsün sefer saatleri`}
                      width={400}
                      height={600}
                      style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
                      className="rounded-md"
                      unoptimized
                    />
                  </button>
                </div>
              )}

              {/* Search Icon Overlay - Scroll container üzerinde */}
              {busScheduleImageUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/60 text-white p-2 rounded-full opacity-80 hover:opacity-100 transition-opacity">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-col gap-3 px-1 pb-2">
            {/* Son Aranan Hatlar - Footer'a taşındı */}
            <div className="w-full">
              <RecentBusLines lines={recentBusLines} onLineClick={handleRecentLineClick} />
            </div>
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
