"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Loader2, ArrowRightLeft } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { RouteTimeline } from "@/components/route-timeline"
import RecentBusLines from "@/components/recent-bus-lines"
import { fetchRouteStations, fetchLiveData } from "@/lib/api"

// Tip tanımlamaları
interface Station {
    sequence: number
    stationId: number
    stationName: string
    latitude: string
    longitude: string
}

interface RouteData {
    stations: Station[]
    start: string
    end: string
    routeName: string
}

interface LiveBus {
    stopId: number
    latitude?: number
    longitude?: number
    speed?: number
    plate?: string
}

interface BusRoute {
    HatNo: string
    HatAdi: string
    GuzergahIsmi?: string
}

const BUS_SCHEDULE_JSON_URL = "/api/bus-schedule-search"
const AUTO_REFRESH_INTERVAL = 40000 // 40 saniye

interface LineInfoSectionProps {
    onStationSelect?: (stationId: string) => void
}

export function LineInfoSection({ onStationSelect }: LineInfoSectionProps) {
    // State'ler
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [routeData, setRouteData] = useState<RouteData | null>(null)
    const [liveData, setLiveData] = useState<LiveBus[]>([])
    const [selectedLineNumber, setSelectedLineNumber] = useState("")
    const [direction, setDirection] = useState<"go" | "return">("go")
    const [allBusRoutes, setAllBusRoutes] = useState<BusRoute[]>([])
    const [filteredBusRoutes, setFilteredBusRoutes] = useState<BusRoute[]>([])
    const [recentBusLines, setRecentBusLines] = useState<string[]>([])

    // Auto-refresh için ref
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // LocalStorage'dan son arananları yükle
    useEffect(() => {
        const savedLines = localStorage.getItem("recentBusLinesRoute")
        if (savedLines) {
            try {
                setRecentBusLines(JSON.parse(savedLines))
            } catch (e) {
                console.error("Kaydedilmiş hatlar yüklenemedi:", e)
            }
        }

        // Arka planda tüm hatları çek
        fetchAllBusRoutes()

        // Cleanup interval on unmount
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        }
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
                // Benzersiz hat numaralarını filtrele
                const uniqueRoutes = cleanedRoutes.filter(
                    (route: BusRoute, index: number, self: BusRoute[]) =>
                        index === self.findIndex((r) => r.HatNo === route.HatNo)
                )
                setAllBusRoutes(uniqueRoutes)
            }
        } catch (error) {
            console.error("Hat listesi yüklenirken hata:", error)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase()
        if (value.length > 5) return
        if (value !== "" && !/^[A-Z0-9]+$/.test(value)) return

        setInputValue(value)
        setError("")

        if (value.trim() === "") {
            setFilteredBusRoutes([])
        } else {
            const filtered = allBusRoutes
                .filter((bus) => bus.HatNo.includes(value))
                .sort((a, b) => {
                    if (a.HatNo === value) return -1
                    if (b.HatNo === value) return 1

                    const aStarts = a.HatNo.startsWith(value)
                    const bStarts = b.HatNo.startsWith(value)
                    if (aStarts && !bStarts) return -1
                    if (!aStarts && bStarts) return 1

                    return a.HatNo.localeCompare(b.HatNo, undefined, { numeric: true })
                })
                .slice(0, 50)
            setFilteredBusRoutes(filtered)
        }
    }

    // Canlı veriyi sessizce yenile (auto-refresh için)
    const refreshLiveDataSilently = useCallback(async (lineNum: string, dir: "go" | "return") => {
        const routeCode = dir === "return" ? `${lineNum}D` : lineNum

        try {
            const liveResult = await fetchLiveData(routeCode)
            setLiveData(liveResult)
        } catch (err) {
            console.error("Canlı veri yenileme hatası:", err)
        }
    }, [])

    // Auto-refresh'i başlat
    const startAutoRefresh = useCallback((lineNum: string, dir: "go" | "return") => {
        // Önceki interval'ı temizle
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current)
        }

        // Yeni interval başlat
        refreshIntervalRef.current = setInterval(() => {
            refreshLiveDataSilently(lineNum, dir)
        }, AUTO_REFRESH_INTERVAL)
    }, [refreshLiveDataSilently])

    // Hat verilerini yükle
    const loadRouteData = useCallback(async (lineNumber: string, dir: "go" | "return") => {
        const routeCode = dir === "return" ? `${lineNumber}D` : lineNumber

        try {
            setLoading(true)
            setError("")

            const [routeResult, liveResult] = await Promise.all([
                fetchRouteStations(routeCode),
                fetchLiveData(routeCode),
            ])

            setRouteData(routeResult)
            setLiveData(liveResult)
            setSelectedLineNumber(lineNumber)

            // Auto-refresh başlat
            startAutoRefresh(lineNumber, dir)

            // Son aranan hatlara ekle
            const upperCaseLine = lineNumber.toUpperCase()
            setRecentBusLines((prev) => {
                const filteredLines = prev.filter((l) => l.toUpperCase() !== upperCaseLine)
                const updatedLines = [upperCaseLine, ...filteredLines].slice(0, 10)
                localStorage.setItem("recentBusLinesRoute", JSON.stringify(updatedLines))
                return updatedLines
            })
        } catch (err) {
            console.error("Veri yüklenirken hata:", err)
            setError(`'${lineNumber}' hattı için güzergah bilgisi bulunamadı.`)
            setRouteData(null)
            setLiveData([])

            // Hata durumunda interval'ı temizle
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current)
            }
        } finally {
            setLoading(false)
        }
    }, [startAutoRefresh])

    const handleSearch = async (hatNoOverride?: string) => {
        const searchTerm = (hatNoOverride || inputValue).trim().toUpperCase()
        if (!searchTerm) return

        setFilteredBusRoutes([])
        if (hatNoOverride) setInputValue(hatNoOverride)

        // Arama yapılınca direction'ı sıfırla
        setDirection("go")
        await loadRouteData(searchTerm, "go")
    }

    const handleSuggestionClick = (hatNo: string) => {
        handleSearch(hatNo)
    }

    const handleDirectionSwap = () => {
        const newDirection = direction === "go" ? "return" : "go"
        setDirection(newDirection)

        if (selectedLineNumber) {
            loadRouteData(selectedLineNumber, newDirection)
        }
    }

    return (
        <>
            {/* Ana Arama Kartı */}
            <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-4">
                    <CardTitle className="text-md">Hat Bilgisi</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                        Hat numarasını girerek güzergahı ve canlı otobüs konumlarını görüntüleyebilirsiniz.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex w-full items-center gap-2">
                        <div className="flex w-full items-center gap-2 relative">
                            <Input
                                type="text"
                                inputMode="text"
                                pattern="[A-Za-z0-9]*"
                                placeholder="Hat numarası (örn: 450)"
                                style={{ fontSize: "0.80rem" }}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="h-8 flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
                                disabled={loading}
                                maxLength={5}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-8 px-4 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0"
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

                    {/* Güzergah Bilgisi */}
                    {routeData && !loading && (
                        <div className="mt-5">
                            {/* Yön Seçici - Start ↔ End */}
                            <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                {/* Sol Metin (Başlangıç) */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <span className="block text-xs font-medium text-foreground truncate text-right">
                                        {routeData.start}
                                    </span>
                                </div>

                                {/* Orta Buton - Her zaman ortada */}
                                <button
                                    onClick={handleDirectionSwap}
                                    className="flex-shrink-0 w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                                    title="Yön değiştir"
                                >
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                                </button>

                                {/* Sağ Metin (Bitiş) */}
                                <div className="flex-1 min-w-0 overflow-hidden">
                                    <span className="block text-xs font-medium text-foreground truncate text-left">
                                        {routeData.end}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="mt-4">
                                <RouteTimeline
                                    stations={routeData.stations}
                                    buses={liveData}
                                    lineNumber={selectedLineNumber}
                                    onStationSelect={onStationSelect}
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Son Aranan Hatlar */}
            {recentBusLines.length > 0 && (
                <RecentBusLines
                    lines={recentBusLines}
                    onLineClick={(line) => handleSearch(line)}
                />
            )}
        </>
    )
}
