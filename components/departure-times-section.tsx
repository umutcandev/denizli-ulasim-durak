"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Search, Plus, Minus, RotateCcw, Loader2, X } from "lucide-react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import RecentBusLines from "@/components/recent-bus-lines"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Otobüs hattı verisi için tip tanımı (page.tsx'ten alındı)
interface BusRoute {
    HatNo: string
    HatAdi: string
    SaatResim: string
    GuzergahIsmi?: string
}

const BUS_SCHEDULE_JSON_URL = "/api/bus-schedule-search"

export function DepartureTimesSection() {
    // State'ler
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [imageUrl, setImageUrl] = useState("")
    const [selectedBusNumber, setSelectedBusNumber] = useState("")
    const [allBusRoutes, setAllBusRoutes] = useState<BusRoute[]>([])
    const [filteredBusRoutes, setFilteredBusRoutes] = useState<BusRoute[]>([])
    const [recentBusLines, setRecentBusLines] = useState<string[]>([])

    // Lightbox state
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)

    // LocalStorage'dan son arananları yükle
    useEffect(() => {
        const savedLines = localStorage.getItem("recentBusLines")
        if (savedLines) {
            try {
                setRecentBusLines(JSON.parse(savedLines))
            } catch (e) {
                console.error("Kaydedilmiş hatlar yüklenemedi:", e)
            }
        }

        // Arka planda tüm hatları çek
        fetchAllBusRoutes()
    }, [])

    // Tüm otobüs hatlarını çekme fonksiyonu
    const fetchAllBusRoutes = async () => {
        try {
            const res = await fetch(BUS_SCHEDULE_JSON_URL)
            if (!res.ok) throw new Error("Otobüs hatları yüklenemedi.")

            const data = await res.json()
            if (data && data.otobus) {
                const cleanedRoutes = data.otobus.map((route: BusRoute) => ({
                    ...route,
                    HatNo: route.HatNo.replace(/D$/, ""),
                }))
                setAllBusRoutes(cleanedRoutes)
            }
        } catch (error) {
            console.error("Hat listesi yüklenirken hata:", error)
        }
    }

    const addToRecentBusLines = (line: string) => {
        const upperCaseLine = line.toUpperCase()
        const filteredLines = recentBusLines.filter((l) => l.toUpperCase() !== upperCaseLine)
        const updatedLines = [upperCaseLine, ...filteredLines].slice(0, 10)
        setRecentBusLines(updatedLines)
        localStorage.setItem("recentBusLines", JSON.stringify(updatedLines))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase()
        if (value.length > 5) return
        if (value !== "" && !/^[A-Z0-9]+$/.test(value)) return

        setInputValue(value)
        setImageUrl("")
        setError("")

        if (value.trim() === "") {
            setFilteredBusRoutes([])
        } else {
            const filtered = allBusRoutes
                .filter((bus) => bus.HatNo.includes(value))
                .sort((a, b) => {
                    // 1. Tam eşleşme (Exact match)
                    if (a.HatNo === value) return -1
                    if (b.HatNo === value) return 1

                    // 2. İle başlama (Starts with)
                    const aStarts = a.HatNo.startsWith(value)
                    const bStarts = b.HatNo.startsWith(value)
                    if (aStarts && !bStarts) return -1
                    if (!aStarts && bStarts) return 1

                    // 3. Nümerik/Alfabetik sıralama (kısa olanlar önce)
                    return a.HatNo.localeCompare(b.HatNo, undefined, { numeric: true })
                })
                .slice(0, 50) // Limiti biraz artırdık ki daha çok sonuç görünsün
            setFilteredBusRoutes(filtered)
        }
    }

    const handleSearch = async (hatNoOverride?: string) => {
        const searchTerm = (hatNoOverride || inputValue).trim().toUpperCase()
        if (!searchTerm) return

        setLoading(true)
        setError("")
        setImageUrl("")
        setFilteredBusRoutes([])
        // Input değerini güncelle (eğer listeden seçildiyse)
        if (hatNoOverride) setInputValue(hatNoOverride)

        try {
            // Eğer hat listesi henüz yüklenmediyse bekle
            let routes = allBusRoutes
            if (routes.length === 0) {
                const res = await fetch(BUS_SCHEDULE_JSON_URL)
                if (!res.ok) throw new Error("Otobüs hatları yüklenemedi.")
                const data = await res.json()
                if (data && data.otobus) {
                    routes = data.otobus.map((route: BusRoute) => ({
                        ...route,
                        HatNo: route.HatNo.replace(/D$/, ""),
                    }))
                    setAllBusRoutes(routes)
                }
            }

            const found = routes.find((bus) => bus.HatNo.toUpperCase() === searchTerm)

            if (found && found.SaatResim) {
                setSelectedBusNumber(found.HatNo)
                setImageUrl(found.SaatResim)
                addToRecentBusLines(found.HatNo)
            } else {
                setError(`'${searchTerm}' için otobüs saati bulunamadı.`)
            }
        } catch (e) {
            setError("Veri alınırken bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    const handleSuggestionClick = (hatNo: string) => {
        handleSearch(hatNo)
    }

    return (
        <>
            {/* Ana Arama Kartı - StationInput stilinde */}
            <Card className="border-zinc-200 dark:border-zinc-800 overflow-visible">
                <CardHeader className="pb-4">
                    <CardTitle className="text-md">Kalkış Saatleri</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                        Otobüs hat numarasını girerek sefer saatlerini görüntüleyebilirsiniz.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex w-full items-center gap-2">
                        <div className="flex w-full items-center gap-2 relative">
                            <Input
                                type="text"
                                inputMode="text"
                                pattern="[A-Za-z0-9]*"
                                placeholder="Hat numarası girin (örn: 190, T1)"
                                style={{ fontSize: "0.875rem" }}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="h-9 flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
                                disabled={loading}
                                maxLength={5}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-9 px-4 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0"
                                disabled={loading || !inputValue}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Sorgula</>}
                            </Button>

                            {/* Öneriler Dropdown */}
                            {filteredBusRoutes.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {filteredBusRoutes.map((bus) => (
                                        <div
                                            key={bus.HatNo}
                                            className="px-3 py-2 cursor-pointer hover:bg-muted flex items-center gap-2"
                                            onClick={() => handleSuggestionClick(bus.HatNo)}
                                        >
                                            <span className="text-sm bg-primary text-primary-foreground px-2 py-1 rounded font-bold flex-shrink-0">
                                                {bus.HatNo}
                                            </span>
                                            <span className="text-sm text-muted-foreground font-normal truncate min-w-0">
                                                {bus.GuzergahIsmi || bus.HatAdi || 'Güzergah bilgisi yok'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 p-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Sonuç Görseli */}
                    {imageUrl && !loading && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center bg-green-600 text-white px-2.5 py-1 rounded text-sm font-bold">
                                    {selectedBusNumber}
                                </span>
                                <span className="text-sm font-medium text-foreground">Sefer Saatleri</span>
                            </div>
                            <div
                                className="relative border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white cursor-zoom-in group"
                                onClick={() => setIsLightboxOpen(true)}
                            >
                                <Image
                                    src={imageUrl}
                                    alt={`${selectedBusNumber} saatleri`}
                                    width={600}
                                    height={800}
                                    className="w-full h-auto object-contain"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium transition-opacity flex items-center gap-2">
                                        <Search className="w-4 h-4" /> Büyüt
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Son Aranan Hatlar - Ayrı Kart */}
            {recentBusLines.length > 0 && (
                <RecentBusLines
                    lines={recentBusLines}
                    onLineClick={(line) => handleSearch(line)}
                />
            )}

            {/* Lightbox Dialog - react-zoom-pan-pinch ile güncellendi */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-[100vw] w-full h-[100vh] p-0 border-0 bg-black/90 shadow-none overflow-hidden">
                    <DialogHeader className="sr-only">
                        <DialogTitle>{selectedBusNumber} Nolu Hat Sefer Saatleri</DialogTitle>
                        <DialogDescription>
                            {selectedBusNumber} nolu otobüs hattının sefer saatlerini gösteren büyütülmüş görünüm.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Kapat Butonu */}
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 z-[60] bg-black/50 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="w-full h-full">
                        <TransformWrapper
                            initialScale={1}
                            minScale={0.5}
                            maxScale={5}
                            centerOnInit
                            centerZoomedOut={true}
                            limitToBounds={false}
                        >
                            {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                                <>
                                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => zoomIn()}
                                            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 rounded-full w-12 h-12"
                                        >
                                            <Plus className="h-6 w-6" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => zoomOut()}
                                            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 rounded-full w-12 h-12"
                                        >
                                            <Minus className="h-6 w-6" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => centerView(1)}
                                            className="bg-black/70 hover:bg-black/90 text-white border border-white/20 rounded-full w-12 h-12"
                                        >
                                            <RotateCcw className="h-5 w-5" />
                                        </Button>
                                    </div>
                                    <TransformComponent
                                        wrapperStyle={{ width: "100%", height: "100%" }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`${selectedBusNumber} hat saatleri`}
                                            className="max-w-[95vw] max-h-[90vh] w-auto h-auto object-contain"
                                        />
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
