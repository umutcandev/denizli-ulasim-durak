"use client"

import { useRef, useEffect, useMemo } from "react"
import { Bus, MapPin, Info } from "lucide-react"
import { motion } from "framer-motion"

// Tip tanımlamaları
interface Station {
    sequence: number
    stationId: number
    stationName: string
    latitude: string
    longitude: string
}

interface LiveBus {
    stopId: number
    latitude?: number
    longitude?: number
    speed?: number
    plate?: string
}

interface RouteTimelineProps {
    stations: Station[]
    buses: LiveBus[]
    lineNumber: string
    onStationSelect?: (stationId: string) => void
}

// Her durak satırının yaklaşık yüksekliği (px)
const STATION_ROW_HEIGHT = 56
// Otobüs satırının yaklaşık yüksekliği (px)
const BUS_ROW_HEIGHT = 56
// Görünür durak sayısı (üstte 2 + otobüs + altta 2 = yaklaşık 5 satır)
const VISIBLE_ROWS = 5

export function RouteTimeline({ stations, buses, lineNumber, onStationSelect }: RouteTimelineProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const busElementRefs = useRef<Map<number, HTMLDivElement>>(new Map())

    // Her otobüsün hangi sequence'da olduğunu hesapla
    const busPositions = useMemo(() => buses.map((bus) => {
        const station = stations.find((s) => s.stationId === bus.stopId)
        return {
            ...bus,
            sequence: station?.sequence ?? -1,
            stationName: station?.stationName ?? "Bilinmeyen",
        }
    }), [buses, stations])

    // İlk otobüsün sequence'ını bul
    const firstBusSequence = useMemo(() => {
        const validBuses = busPositions.filter(b => b.sequence > 0)
        if (validBuses.length === 0) return -1
        return Math.min(...validBuses.map(b => b.sequence))
    }, [busPositions])

    // Bir sequence'da otobüs var mı kontrol et
    const getBusAtSequence = (sequence: number) => {
        return busPositions.filter((bus) => bus.sequence === sequence)
    }

    // İlk otobüse otomatik scroll
    useEffect(() => {
        if (firstBusSequence <= 0 || !scrollContainerRef.current) return

        // Kısa bir gecikme ile scroll yap (DOM'un render olmasını bekle)
        const timeoutId = setTimeout(() => {
            const busElement = busElementRefs.current.get(firstBusSequence)
            if (busElement && scrollContainerRef.current) {
                const container = scrollContainerRef.current
                const containerRect = container.getBoundingClientRect()
                const busRect = busElement.getBoundingClientRect()

                // Otobüsü container'ın ortasına getir
                const scrollOffset = busRect.top - containerRect.top - (containerRect.height / 2) + (busRect.height / 2)

                container.scrollTo({
                    top: container.scrollTop + scrollOffset,
                    behavior: "smooth"
                })
            }
        }, 100)

        return () => clearTimeout(timeoutId)
    }, [firstBusSequence, stations])

    // Container max yüksekliği hesapla
    const containerMaxHeight = useMemo(() => {
        return VISIBLE_ROWS * STATION_ROW_HEIGHT
    }, [])

    return (
        <div className="py-2">
            {/* Otobüs yoksa bilgilendirme - Üstte */}
            {buses.length === 0 && (
                <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Şu an bu hatta aktif otobüs bulunmamaktadır.
                    </p>
                </div>
            )}

            {/* Timeline - Scrollable Container */}
            <div
                ref={scrollContainerRef}
                className="relative overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
                style={{
                    maxHeight: `${containerMaxHeight}px`,
                    maskImage: 'linear-gradient(to bottom, transparent, black 24px, black calc(100% - 24px), transparent)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 24px, black calc(100% - 24px), transparent)'
                }}
            >
                {/* Inner padding container - fade alanı için boşluk */}
                <div className="py-6">
                    {stations.map((station, index) => {
                        const isLastStation = index === stations.length - 1
                        const busesAtThisStop = getBusAtSequence(station.sequence)
                        const hasBusAfterThisStop = busesAtThisStop.length > 0

                        return (
                            <div key={station.stationId} className="relative">
                                {/* Durak Satırı */}
                                <div className="flex items-center py-2">
                                    {/* Sol: Durak İkonu */}
                                    <div className="relative flex items-center justify-center w-10 flex-shrink-0">
                                        {/* Sürekli Bağlantı Çizgisi */}
                                        {!isLastStation && (
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[2px] h-full bg-zinc-200 dark:bg-zinc-700" />
                                        )}
                                        {index > 0 && (
                                            <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-[2px] h-full bg-zinc-200 dark:bg-zinc-700" />
                                        )}

                                        {/* Durak Noktası */}
                                        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center z-10">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-zinc-400 dark:bg-zinc-500" />
                                        </div>
                                    </div>

                                    {/* Orta: Durak Adı - Tek satır, tıklanabilir */}
                                    <div className="flex-1 min-w-0 px-3 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                if (onStationSelect) {
                                                    onStationSelect(station.stationId.toString())
                                                }
                                            }}
                                            className="inline-flex items-center max-w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-x-auto scrollbar-hide hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                            title="Durak bilgisini görüntüle"
                                        >
                                            <span className="text-xs font-medium text-foreground whitespace-nowrap">
                                                ({station.stationId}) {station.stationName}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Sağ: İkon Butonları */}
                                    <div className="flex-shrink-0 flex items-center gap-1.5 pr-2">
                                        {/* Durak Bilgisi İkonu */}
                                        <button
                                            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            onClick={() => {
                                                if (onStationSelect) {
                                                    onStationSelect(station.stationId.toString())
                                                }
                                            }}
                                            title="Durak bilgisini görüntüle"
                                        >
                                            <Info className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        </button>

                                        {/* Harita İkonu */}
                                        <button
                                            className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                            onClick={() => {
                                                const lat = station.latitude.replace(",", ".")
                                                const lng = station.longitude.replace(",", ".")
                                                window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
                                            }}
                                            title="Haritada göster"
                                        >
                                            <MapPin className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        </button>
                                    </div>
                                </div>

                                {/* Otobüs (durağı geçmiş, sonraki durağa gidiyor) */}
                                {hasBusAfterThisStop && !isLastStation && (
                                    <motion.div
                                        ref={(el) => {
                                            if (el) busElementRefs.current.set(station.sequence, el)
                                        }}
                                        className="relative py-2"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center">
                                            {/* Sol: Otobüs İkonu */}
                                            <div className="relative flex items-center justify-center w-10 flex-shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shadow-lg z-10">
                                                    <Bus className="w-5 h-5 text-white dark:text-zinc-900" />
                                                </div>

                                                {/* Bağlantı Çizgisi - Üst */}
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[calc(50%-20px)] bg-zinc-200 dark:bg-zinc-700" />

                                                {/* Bağlantı Çizgisi - Alt */}
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[calc(50%-20px)] bg-zinc-200 dark:bg-zinc-700" />
                                            </div>

                                            {/* Hat Numarası Badge */}
                                            <div className="px-3">
                                                <div className="inline-flex items-center px-3 py-1.5 bg-zinc-900 dark:bg-white rounded-lg">
                                                    <span className="text-sm font-bold text-white dark:text-zinc-900">{lineNumber}</span>
                                                </div>
                                            </div>

                                            {/* Plaka Badge - TR Etiketli */}
                                            {busesAtThisStop[0]?.plate && (
                                                <div className="flex shadow-sm group cursor-pointer transition-all duration-300">
                                                    {/* TR Etiketi */}
                                                    <div className="bg-blue-600 rounded-l-lg px-1.5 py-0.5 flex items-center">
                                                        <span className="font-mono text-xs text-white font-medium">TR</span>
                                                    </div>
                                                    {/* Plaka Alanı */}
                                                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 border-l-0 rounded-r-lg px-2 py-0.5">
                                                        {(() => {
                                                            const plateValue = busesAtThisStop[0].plate || "";
                                                            const shortPlate = plateValue.includes("/") ? plateValue.split("/")[0] : plateValue;
                                                            return (
                                                                <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap transition-all duration-300">
                                                                    <span className="group-hover:hidden">{shortPlate}</span>
                                                                    <span className="hidden group-hover:inline">{plateValue}</span>
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
