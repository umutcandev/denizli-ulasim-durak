"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { fetchBusData } from "@/lib/api"
import BusSchedule from "@/components/bus-schedule"
import StationInput from "@/components/station-input"
import RecentStations from "@/components/recent-stations"
import { NearbyStationsDialog } from "@/components/nearby-stations-dialog"
import { DepartureTimesSection } from "@/components/departure-times-section"
import { LineInfoSection } from "@/components/line-info-section"
import { BalanceCheckSection } from "@/components/balance-check-section"
import { BusScheduleSkeleton } from "@/components/bus-schedule-skeleton"
import MobileBottomSpace from "@/components/mobile-bottom-space"
import { QrScannerDialog } from "@/components/qr-scanner-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNavigation } from "@/components/main-navigation"
import Link from "next/link"
import { MapPin, Sun, Moon, Monitor, QrCode, ThermometerSun, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DealersSection } from "@/components/dealers-section"



const themes = ["system", "light", "dark"]

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const isMobile = useIsMobile()
  const [isMobileNavbarReady, setIsMobileNavbarReady] = useState<boolean | undefined>(undefined)
  const [stationId, setStationId] = useState<string>("")
  const [busData, setBusData] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [recentStations, setRecentStations] = useState<Array<{ id: string; name: string }>>([])
  const [weatherData, setWeatherData] = useState<{
    temperature: string;
  } | null>(null)
  // Bildirim gizleme state'i (Varsayılan false: Flash etkisini önlemek için)
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)

  // Main Navigation State
  const [activeTab, setActiveTab] = useState("station-info")

  const scheduleRef = useRef<HTMLDivElement>(null)

  // QR Scanner Dialog State'leri
  const [isQrScannerDialogOpen, setIsQrScannerDialogOpen] = useState(false)

  // Nearby Stations Dialog State'leri
  const [isNearbyStationsDialogOpen, setIsNearbyStationsDialogOpen] = useState(false)

  // Theme mount kontrolü
  useEffect(() => {
    setMounted(true)
  }, [])

  // Mobil navbar hazırlık kontrolü
  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkMobile = () => {
        setIsMobileNavbarReady(window.innerWidth < 768)
      }
      checkMobile()
      const mql = window.matchMedia("(max-width: 767px)")
      const handleChange = () => checkMobile()
      mql.addEventListener("change", handleChange)
      return () => mql.removeEventListener("change", handleChange)
    }
  }, [])

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
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
          })
      })
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

  // Bildirim gizleme kontrolü
  useEffect(() => {
    const notificationHiddenAt = localStorage.getItem("notificationHiddenAt")

    if (!notificationHiddenAt) {
      // Daha önce hiç kapatılmamışsa göster
      setIsNotificationVisible(true)
    } else {
      const hiddenTime = parseInt(notificationHiddenAt)
      const currentTime = Date.now()
      const hoursPassed = (currentTime - hiddenTime) / (1000 * 60 * 60)

      // Eğer 24 saatten fazla zaman geçmişse, localStorage'ı temizle ve bildirimi göster
      if (hoursPassed >= 24) {
        localStorage.removeItem("notificationHiddenAt")
        setIsNotificationVisible(true)
      }
      // Aksi takdirde false kalmaya devam eder (zaten false başlattık)
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

  // QR Scanner Dialog Fonksiyonları
  const openQrScannerDialog = () => {
    setIsQrScannerDialogOpen(true)
  }

  const handleQrCodeDetected = (code: string) => {
    // QR koddan durak numarasını çıkarmaya çalış
    const stationMatch = code.match(/\d+/)
    if (stationMatch) {
      const stationNumber = stationMatch[0]
      setStationId(stationNumber)
      setIsQrScannerDialogOpen(false)
      setActiveTab("station-info") // QR tarandıktan sonra durak bilgisi tabına geç
    }
  }

  // Bildirim kapatma fonksiyonu
  const handleNotificationClose = () => {
    setIsNotificationVisible(false)
    // Mevcut zamanı timestamp olarak kaydet
    localStorage.setItem("notificationHiddenAt", Date.now().toString())
  }

  // Nearby Stations Dialog Fonksiyonları
  const openNearbyStationsDialog = () => {
    setIsNearbyStationsDialogOpen(true)
  }

  const handleStationSelect = (stationId: string) => {
    setStationId(stationId)
    setActiveTab("station-info") // Durak seçildiğinde durak bilgisi tabına geç
  }

  const getLightboxDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Lightbox functions (constrainLightboxPan, lightboxZoomIn, etc.) removed since they are moved to component.




  const getTemperatureStyle = (temperature: string) => {
    // Sıcaklık değerini sayıya çevir (°C işaretini kaldır)
    const temp = parseFloat(temperature.replace(/[^\d.-]/g, ''))

    if (temp < 0) {
      // Çok soğuk - Mavi (light modda ters renkler)
      return "bg-blue-800 border-blue-700 text-blue-100 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200"
    } else if (temp <= 10) {
      // Soğuk - Açık mavi (light modda ters renkler)
      return "bg-sky-800 border-sky-700 text-sky-100 dark:bg-sky-900 dark:border-sky-700 dark:text-sky-200"
    } else if (temp <= 20) {
      // Serin - Yeşil (light modda ters renkler)
      return "bg-green-800 border-green-700 text-green-100 dark:bg-green-900 dark:border-green-700 dark:text-green-200"
    } else if (temp <= 30) {
      // Ilık - Sarı (light modda ters renkler)
      return "bg-yellow-800 border-yellow-700 text-yellow-100 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-200"
    } else if (temp <= 40) {
      // Sıcak - Turuncu (light modda ters renkler)
      return "bg-orange-800 border-orange-700 text-orange-100 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-200"
    } else {
      // Çok sıcak - Kırmızı (light modda ters renkler)
      return "bg-red-800 border-red-700 text-red-100 dark:bg-red-900 dark:border-red-700 dark:text-red-200"
    }
  }

  const handleThemeChange = () => {
    const currentIndex = themes.indexOf(theme ?? "system")
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-zinc-900 dark:bg-zinc-900 text-white py-3 safe-area-inset-top">
        <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between gap-3">
          {/* Logo Section */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src="/images/logo-twins.png"
                alt="Denizli Ulaşım Logo"
                width={40}
                height={40}
                className="object-contain w-full h-full"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col">
              <Link href="/" className="font-bold text-md hover:opacity-80 transition-opacity">
                Denizli Ulaşım
              </Link>
              <span className="text-xs text-white/80">İletişim: <a href="mailto:hi@umutcan.xyz" className="underline">hi@umutcan.xyz</a></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {weatherData ? (
              <div
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap ${getTemperatureStyle(weatherData.temperature)}`}
                role="status"
                aria-label="Current temperature"
              >
                <ThermometerSun className="h-3.5 w-3.5" />
                {weatherData.temperature}
              </div>
            ) : (
              <Skeleton className="h-6 w-20 rounded-md" />
            )}
            {mounted ? (
              isMobile ? (
                <button
                  onClick={handleThemeChange}
                  className="h-6 w-6 sm:h-7 sm:w-7 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/40 flex items-center justify-center"
                  aria-label="Temayı değiştir"
                  title="Temayı değiştir"
                >
                  {theme === "light" && <Sun className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {theme === "dark" && <Moon className="h-3 w-3 sm:h-4 sm:w-4" />}
                  {theme === "system" && <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />}
                  <span className="sr-only">Temayı değiştir</span>
                </button>
              ) : (
                <div className="flex items-center rounded-md border border-zinc-700 p-0.5 bg-zinc-800 h-6">
                  <button
                    onClick={() => setTheme("system")}
                    className={`h-5 w-5 rounded-sm flex items-center justify-center transition-colors ${theme === "system" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Sistem teması"
                    aria-label="Sistem teması"
                  >
                    <Monitor className="h-3 w-3" />
                    <span className="sr-only">Sistem teması</span>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`h-5 w-5 rounded-sm flex items-center justify-center transition-colors ${theme === "light" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Açık tema"
                    aria-label="Açık tema"
                  >
                    <Sun className="h-3 w-3" />
                    <span className="sr-only">Açık tema</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`h-5 w-5 rounded-sm flex items-center justify-center transition-colors ${theme === "dark" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Koyu tema"
                    aria-label="Koyu tema"
                  >
                    <Moon className="h-3 w-3" />
                    <span className="sr-only">Koyu tema</span>
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="h-6 w-6 sm:h-7 sm:w-7 bg-zinc-800 border border-zinc-700 rounded-sm animate-pulse sm:hidden" />
                <div className="hidden sm:flex items-center rounded-md border border-zinc-700 p-0.5 bg-zinc-800 h-6 animate-pulse">
                  <div className="h-5 w-5 rounded-sm bg-zinc-700" />
                  <div className="h-5 w-5 rounded-sm bg-zinc-700" />
                  <div className="h-5 w-5 rounded-sm bg-zinc-700" />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <MainNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Bilgilendirme Componenti + Ana İçerik Container */}
      <div className="container mx-auto px-4 pt-4 pb-8 max-w-3xl">
        {/* Bilgilendirme Kartı */}
        {isNotificationVisible && (
          <div
            className="dark:bg-zinc-900 border border-border rounded-lg p-3 flex gap-2 relative mb-5"
            role="region"
            aria-label="Search instructions"
          >
            <svg
              className="w-4 h-4 text-primary flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-foreground/80 leading-relaxed pr-6">
              Bu proje gönüllü geliştirme projesi olup, projedeki tüm veriler Denizli Büyükşehir Belediyesi'nin ulaşım platformu üzerinden anlık olarak çekilmektedir.
            </p>
            <button
              onClick={handleNotificationClose}
              className="absolute top-2 right-2 p-1 rounded-sm hover:bg-muted/50 transition-colors"
              aria-label="Bildirimi kapat"
              title="Bildirimi kapat"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}

        <div className="space-y-6">
          {activeTab === "station-info" && (
            <>
              <StationInput
                onSubmit={handleStationSubmit}
                isLoading={loading}
                onQrScanClick={openQrScannerDialog}
              />

              {recentStations.length > 0 && (
                <RecentStations stations={recentStations} onStationClick={handleRecentStationClick} />
              )}

              <div ref={scheduleRef}>
                {!stationId ? null : loading ? (
                  <BusScheduleSkeleton stationName={busData?.stationName} stationId={busData?.stationId} />
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 p-6 text-center">
                    {error}
                  </div>
                ) : (
                  <BusSchedule data={busData} onRefresh={loadBusData} />
                )}
              </div>
            </>
          )}

          {activeTab === "departure-times" && (
            <DepartureTimesSection />
          )}

          {activeTab === "line-info" && (
            <LineInfoSection
              onStationSelect={(stationId) => {
                setStationId(stationId)
                setActiveTab("station-info")
              }}
            />
          )}

          {activeTab === "balance-check" && (
            <BalanceCheckSection />
          )}

          {/* Diğer tablar için placeholder veya boş içerik */}
          {activeTab === "reload-points" && (
            <DealersSection />
          )}

          {/* Mobile bottom space */}
          <MobileBottomSpace />
        </div>
      </div>

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        open={isQrScannerDialogOpen}
        onOpenChange={setIsQrScannerDialogOpen}
        onQrCodeDetected={handleQrCodeDetected}
      />

      {/* Nearby Stations Dialog */}
      <NearbyStationsDialog
        open={isNearbyStationsDialogOpen}
        onOpenChange={setIsNearbyStationsDialogOpen}
        onStationSelect={handleStationSelect}
      />

      {/* Mobil Alt Navbar - Glassmorphism */}
      {isMobileNavbarReady === undefined ? (
        // Skeleton navbar - yüklenirken göster
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
          <div className="bg-zinc-900 dark:bg-zinc-900 backdrop-blur-md shadow-lg">
            <div className="container mx-auto px-4 py-3 max-w-3xl">
              <div className="flex items-center justify-center gap-3">
                <Skeleton className="flex-1 h-10 rounded-md bg-zinc-800/50" />
                <Skeleton className="flex-1 h-10 rounded-md bg-zinc-800/50" />
              </div>
            </div>
          </div>
        </nav>
      ) : isMobileNavbarReady ? (
        // Gerçek navbar - mobil görünümde göster
        <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
          <div className="bg-zinc-900 dark:bg-zinc-900 backdrop-blur-md shadow-lg">
            <div className="container mx-auto px-4 py-3 max-w-3xl">
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openNearbyStationsDialog}
                  aria-label="Yakındaki Duraklar"
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-zinc-800/80 backdrop-blur-sm border-zinc-700/50 hover:bg-zinc-700/80 text-white transition-colors"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Yakındaki Duraklar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openQrScannerDialog}
                  aria-label="QR Kod Tarama"
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-zinc-800/80 backdrop-blur-sm border-zinc-700/50 hover:bg-zinc-700/80 text-white transition-colors"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="font-medium">QR Tara</span>
                </Button>
              </div>
            </div>
          </div>
        </nav>
      ) : null}
    </main>
  )
}
