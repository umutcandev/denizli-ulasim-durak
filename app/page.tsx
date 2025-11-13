"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import { fetchBusData } from "@/lib/api"
import BusSchedule from "@/components/bus-schedule"
import StationInput from "@/components/station-input"
import RecentStations from "@/components/recent-stations"
import RecentBusLines from "@/components/recent-bus-lines"
import { BusScheduleSkeleton } from "@/components/bus-schedule-skeleton"
import MobileBottomSpace from "@/components/mobile-bottom-space"
import { QrScannerDialog } from "@/components/qr-scanner-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Bus, MapPin, Search, Plus, Minus, RotateCcw, Sun, Moon, Monitor, Info, Clock, QrCode } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import Image from "next/image"
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
  
  // Lightbox zoom state'leri
  const [lightboxZoom, setLightboxZoom] = useState(1)
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 })
  const [lightboxIsDragging, setLightboxIsDragging] = useState(false)
  const [lightboxDragStart, setLightboxDragStart] = useState({ x: 0, y: 0 })
  const [lightboxLastPan, setLightboxLastPan] = useState({ x: 0, y: 0 })
  
  // Lightbox pinch zoom için state'ler
  const [lightboxInitialPinchDistance, setLightboxInitialPinchDistance] = useState(0)
  const [lightboxInitialZoom, setLightboxInitialZoom] = useState(1)
  const [lightboxIsPinching, setLightboxIsPinching] = useState(false)
  
  const lightboxContainerRef = useRef<HTMLDivElement>(null)
  const lightboxImageRef = useRef<HTMLImageElement>(null)

  // Canlı arama için state'ler
  const [allBusRoutes, setAllBusRoutes] = useState<BusRoute[]>([])
  const [filteredBusRoutes, setFilteredBusRoutes] = useState<BusRoute[]>([])
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)
  const [isFilterLoading, setIsFilterLoading] = useState(false)

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

    const savedLines = localStorage.getItem("recentBusLines")
    if (savedLines) {
      try {
        setRecentBusLines(JSON.parse(savedLines))
      } catch (e) {
        console.error("Kaydedilmiş hatlar yüklenemedi:", e)
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
          // Gelen veride sondaki "D" harfini temizle (T1, T2 gibi anlamlı prefixleri koru)
          const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
            ...route,
            HatNo: route.HatNo.replace(/D$/, ""),
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

  // QR Scanner Dialog State'leri
  const [isQrScannerDialogOpen, setIsQrScannerDialogOpen] = useState(false)

  // Otobüs Saatleri Sorgulama Fonksiyonları
  const openBusScheduleDialog = () => {
    setIsBusScheduleDialogOpen(true)
    setBusScheduleError("") // Dialog açıldığında eski hataları temizle
    setBusScheduleImageUrl("") // Dialog açıldığında eski resmi temizle
    setBusScheduleInputValue("") // Dialog açıldığında inputu temizle
    setFilteredBusRoutes([]) // Dialog açıldığında önerileri temizle
    setIsImageLightboxOpen(false) // Lightbox'ı da kapat
    setIsFilterLoading(false) // Loading state'ini sıfırla
    
    // Dialog açıldığında arka planda tüm otobüs hatlarını yükle
    preloadBusRoutesData()
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
    }
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

  // Dialog açıldığında arka planda veri yükleme fonksiyonu
  const preloadBusRoutesData = async () => {
    try {
      const res = await fetch(BUS_SCHEDULE_JSON_URL)
      if (!res.ok) {
        throw new Error("Otobüs hatları yüklenemedi.")
      }
      const data = await res.json()
      if (data && data.otobus) {
        // Gelen veride sondaki "D" harfini temizle (T1, T2 gibi anlamlı prefixleri koru)
        const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
          ...route,
          HatNo: route.HatNo.replace(/D$/, ""),
        }))
        setAllBusRoutes(cleanedRoutes)
      }
    } catch (error) {
      console.error("Arka plan veri yükleme hatası:", error)
      // Arka plan yükleme hatalarını sessizce yönet, kullanıcıyı rahatsız etme
    }
  }

  // Dialog açılma/kapanma event handler'ı
  const handleBusScheduleDialogChange = (open: boolean) => {
    setIsBusScheduleDialogOpen(open)
    
    if (!open) {
      // Dialog kapandığında verileri temizle - bir sonraki açılışta fresh data için
      setAllBusRoutes([])
      setBusScheduleError("")
      setBusScheduleImageUrl("")
      setBusScheduleInputValue("")
      setFilteredBusRoutes([])
      setIsImageLightboxOpen(false)
      setIsFilterLoading(false)
    }
  }

  // Lightbox için iki parmak arasındaki mesafeyi hesapla
  const getLightboxDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Lightbox pan sınırlarını hesapla
  const constrainLightboxPan = useCallback((newPan: { x: number; y: number }, currentZoom: number) => {
    if (currentZoom <= 1) return { x: 0, y: 0 }
    
    const container = lightboxContainerRef.current
    if (!container) return newPan
    
    // Container boyutları
    const containerRect = container.getBoundingClientRect()
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height
    
    // Zoom'lanmış resmin boyutları
    const scaledWidth = containerWidth * currentZoom
    const scaledHeight = containerHeight * currentZoom
    
    // Maksimum pan mesafesi (resmin yarısından fazla kaydırılmasını engelle)
    const maxPanX = Math.max(0, (scaledWidth - containerWidth) / 2)
    const maxPanY = Math.max(0, (scaledHeight - containerHeight) / 2)
    
    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPan.x)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPan.y))
    }
  }, [])

  // Lightbox zoom fonksiyonları
  const lightboxZoomIn = useCallback(() => {
    setLightboxZoom(prev => {
      const newZoom = Math.min(prev + 0.5, 5)
      // Zoom değiştiğinde pan'ı sınırla
      setLightboxPan(currentPan => constrainLightboxPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainLightboxPan])

  const lightboxZoomOut = useCallback(() => {
    setLightboxZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 0.5)
      // Zoom değiştiğinde pan'ı sınırla
      setLightboxPan(currentPan => constrainLightboxPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainLightboxPan])

  const lightboxResetZoom = useCallback(() => {
    setLightboxZoom(1)
    setLightboxPan({ x: 0, y: 0 })
  }, [])

  // Lightbox mouse wheel zoom
  const handleLightboxWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setLightboxZoom(prev => {
      const newZoom = Math.max(0.5, Math.min(5, prev + delta))
      // Zoom değiştiğinde pan'ı sınırla
      setLightboxPan(currentPan => constrainLightboxPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainLightboxPan])

  // Lightbox mouse drag fonksiyonları
  const handleLightboxMouseDown = useCallback((e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return
    setLightboxIsDragging(true)
    setLightboxDragStart({ x: e.clientX, y: e.clientY })
    setLightboxLastPan(lightboxPan)
  }, [lightboxZoom, lightboxPan])

  const handleLightboxMouseMove = useCallback((e: React.MouseEvent) => {
    if (!lightboxIsDragging || lightboxZoom <= 1) return
    
    const deltaX = e.clientX - lightboxDragStart.x
    const deltaY = e.clientY - lightboxDragStart.y
    
    const newPan = {
      x: lightboxLastPan.x + deltaX,
      y: lightboxLastPan.y + deltaY
    }
    
    setLightboxPan(constrainLightboxPan(newPan, lightboxZoom))
  }, [lightboxIsDragging, lightboxDragStart, lightboxLastPan, lightboxZoom, constrainLightboxPan])

  const handleLightboxMouseUp = useCallback(() => {
    setLightboxIsDragging(false)
  }, [])

  // Lightbox touch fonksiyonları (mobil zoom ve pinch)
  const handleLightboxTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2) {
      // İki parmak - pinch zoom başlat
      const distance = getLightboxDistance(e.touches[0], e.touches[1])
      setLightboxInitialPinchDistance(distance)
      setLightboxInitialZoom(lightboxZoom)
      setLightboxIsPinching(true)
      setLightboxIsDragging(false)
    } else if (e.touches.length === 1) {
      // Tek parmak - drag başlat (sadece zoom > 1 ise)
      if (lightboxZoom > 1) {
        const touch = e.touches[0]
        setLightboxIsDragging(true)
        setLightboxDragStart({ x: touch.clientX, y: touch.clientY })
        setLightboxLastPan(lightboxPan)
      }
      setLightboxIsPinching(false)
    }
  }, [lightboxZoom, lightboxPan, getLightboxDistance])

  const handleLightboxTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2 && lightboxIsPinching) {
      // İki parmak - pinch zoom
      const currentDistance = getLightboxDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / lightboxInitialPinchDistance
      const newZoom = Math.max(0.5, Math.min(5, lightboxInitialZoom * scale))
      setLightboxZoom(newZoom)
      // Zoom değiştiğinde pan'ı sınırla
      setLightboxPan(currentPan => constrainLightboxPan(currentPan, newZoom))
    } else if (e.touches.length === 1 && lightboxIsDragging && lightboxZoom > 1) {
      // Tek parmak - drag
      const touch = e.touches[0]
      const deltaX = touch.clientX - lightboxDragStart.x
      const deltaY = touch.clientY - lightboxDragStart.y
      
      const newPan = {
        x: lightboxLastPan.x + deltaX,
        y: lightboxLastPan.y + deltaY
      }
      
      setLightboxPan(constrainLightboxPan(newPan, lightboxZoom))
    }
  }, [lightboxIsDragging, lightboxDragStart, lightboxLastPan, lightboxZoom, lightboxIsPinching, getLightboxDistance, lightboxInitialPinchDistance, lightboxInitialZoom, constrainLightboxPan])

  const handleLightboxTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setLightboxIsDragging(false)
      setLightboxIsPinching(false)
    } else if (e.touches.length === 1 && lightboxIsPinching) {
      // Pinch'ten tek parmağa geçiş
      setLightboxIsPinching(false)
      if (lightboxZoom > 1) {
        const touch = e.touches[0]
        setLightboxIsDragging(true)
        setLightboxDragStart({ x: touch.clientX, y: touch.clientY })
        setLightboxLastPan(lightboxPan)
      }
    }
  }, [lightboxIsPinching, lightboxZoom, lightboxPan])

  // Lightbox açıldığında zoom ve pan sıfırla
  useEffect(() => {
    if (isImageLightboxOpen) {
      setLightboxZoom(1)
      setLightboxPan({ x: 0, y: 0 })
      setLightboxIsDragging(false)
      setLightboxIsPinching(false)
      setLightboxInitialPinchDistance(0)
      setLightboxInitialZoom(1)
    }
  }, [isImageLightboxOpen])

  // Lightbox wheel event listener ekle
  useEffect(() => {
    const container = lightboxContainerRef.current
    if (container && isImageLightboxOpen) {
      container.addEventListener('wheel', handleLightboxWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleLightboxWheel)
    }
  }, [handleLightboxWheel, isImageLightboxOpen])

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
    const value = e.target.value.toUpperCase()
    
    // Maksimum 4 karakter (T123 gibi)
    if (value.length > 4) {
      return
    }
    
    // Alphanumeric karakterlere izin ver (harfler ve sayılar)
    if (value !== "" && !/^[A-Z0-9]+$/.test(value)) {
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
              HatNo: route.HatNo.replace(/D$/, ""),
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
        // Veriler zaten yüklüyse anında filtreleme yap (loading state gerekmez)
        const filtered = allBusRoutes
          .filter((bus: BusRoute) => bus.HatNo.startsWith(value))
          .slice(0, 10)
        setFilteredBusRoutes(filtered)
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
      <header className="bg-zinc-900 dark:bg-zinc-900 text-white sticky top-0 z-50 py-3 safe-area-inset-top">
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
              <Link href="/" className="font-bold text-sm hover:opacity-80 transition-opacity">
                Denizli Ulaşım
              </Link>
              <span className="text-xs text-white/80">İletişim: <a href="mailto:hi@umutcan.xyz" className="underline">hi@umutcan.xyz</a></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {weatherData ? (
              <div 
                className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium whitespace-nowrap ${getTemperatureStyle(weatherData.temperature)}`}
                role="status"
                aria-label="Current temperature"
              >
                <strong>Hava:</strong>&nbsp;{weatherData.temperature}
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
                <div className="flex items-center rounded-md border border-zinc-700 p-0.5 bg-zinc-800">
                  <button
                    onClick={() => setTheme("system")}
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm flex items-center justify-center transition-colors ${theme === "system" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Sistem teması"
                    aria-label="Sistem teması"
                  >
                    <Monitor className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only">Sistem teması</span>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm flex items-center justify-center transition-colors ${theme === "light" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Açık tema"
                    aria-label="Açık tema"
                  >
                    <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only">Açık tema</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`h-6 w-6 sm:h-7 sm:w-7 rounded-sm flex items-center justify-center transition-colors ${theme === "dark" ? "bg-zinc-700" : "bg-transparent hover:bg-zinc-700"}`}
                    title="Koyu tema"
                    aria-label="Koyu tema"
                  >
                    <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="sr-only">Koyu tema</span>
                  </button>
                </div>
              )
            ) : (
              <div className="h-6 w-6 sm:h-7 sm:w-7 bg-zinc-800 border border-zinc-700 rounded-sm animate-pulse" />
            )}
          </div>
        </div>
      </header>
      {/* Bilgilendirme Componenti */}
      <div className="container mx-auto px-4 pt-4 pb-5 max-w-3xl">
        <div
          className="dark:bg-zinc-900 border border-border rounded-lg p-3 flex gap-2"
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
          <p className="text-xs text-foreground/80 leading-relaxed">
            Bu proje gönüllü geliştirme projesi olup, Denizli Büyükşehir Belediyesi'nin resmi API'leri ile entegre çalışmaktadır. Kaynak kodları <a href="https://github.com/umutcandev/denizli-ulasim-durak" target="_blank" rel="noopener noreferrer" className="underline">burada</a> bulunmaktadır.
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 pb-8 max-w-3xl">

        <div className="space-y-6">
          <StationInput 
            onSubmit={handleStationSubmit} 
            isLoading={loading} 
            onShowBusTimesClick={openBusScheduleDialog}
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
          
          {/* Mobile bottom space */}
          <MobileBottomSpace />
        </div>
      </div>

      {/* Yeni Otobüs Saatleri Dialog */}
      <Dialog open={isBusScheduleDialogOpen} onOpenChange={handleBusScheduleDialogChange}>
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
                  inputMode="text"
                  pattern="[A-Za-z0-9]*"
                  maxLength={4}
                  placeholder="Hat no (örn: 190, T1, T2)"
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
            
            <div 
              ref={lightboxContainerRef}
              className="relative overflow-hidden"
              style={{ 
                cursor: lightboxZoom > 1 ? (lightboxIsDragging ? 'grabbing' : 'grab') : 'default',
                maxHeight: '90vh',
                maxWidth: '90vw',
                touchAction: 'none' // Touch event'lerin tarayıcı tarafından handle edilmesini engelle
              }}
              onMouseDown={handleLightboxMouseDown}
              onMouseMove={handleLightboxMouseMove}
              onMouseUp={handleLightboxMouseUp}
              onMouseLeave={handleLightboxMouseUp}
              onTouchStart={handleLightboxTouchStart}
              onTouchMove={handleLightboxTouchMove}
              onTouchEnd={handleLightboxTouchEnd}
            >
              {/* Zoom Kontrolleri - Sol üst köşe */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={lightboxZoomIn}
                  disabled={lightboxZoom >= 5}
                  className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={lightboxZoomOut}
                  disabled={lightboxZoom <= 0.5}
                  className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                {(lightboxZoom !== 1 || lightboxPan.x !== 0 || lightboxPan.y !== 0) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={lightboxResetZoom}
                    className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                    title="Sıfırla"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Zoom seviyesi göstergesi */}
              {lightboxZoom !== 1 && (
                <div className="absolute top-4 right-16 z-10 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  %{Math.round(lightboxZoom * 100)}
                </div>
              )}

              <div 
                className="flex items-center justify-center"
                style={{
                  transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                  transformOrigin: 'center',
                  transition: lightboxIsDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <Image
                  ref={lightboxImageRef}
                  src={busScheduleImageUrl}
                  alt={`${busScheduleDialogBusNumber} nolu otobüsün sefer saatleri - büyük görünüm`}
                  width={700}
                  height={990}
                  style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '90vh', maxWidth: '90vw' }}
                  className="rounded-lg select-none"
                  unoptimized
                  draggable={false}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Scanner Dialog */}
      <QrScannerDialog
        open={isQrScannerDialogOpen}
        onOpenChange={setIsQrScannerDialogOpen}
        onQrCodeDetected={handleQrCodeDetected}
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
                  onClick={openBusScheduleDialog}
                  aria-label="Otobüs Saatlerini Göster"
                  className="flex-1 h-10 flex items-center justify-center gap-2 bg-zinc-800/80 backdrop-blur-sm border-zinc-700/50 hover:bg-zinc-700/80 text-white transition-colors"
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Otobüs Saatleri</span>
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
