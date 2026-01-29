"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, MapPin, Navigation, MoreHorizontal, Copy, Map as MapIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import DealersMap from "@/components/dealers-map"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"

interface Dealer {
    dealerCode: string
    dealerName: string
    posNo: number
    latitude: string
    longitude: string
    address: string
    distance: number
    phone: string | null
    isActive: boolean
}

type ViewState = "initial" | "requesting" | "loading" | "success" | "error"

export function DealersSection() {
    const [viewState, setViewState] = useState<ViewState>("initial")
    const [errorMessage, setErrorMessage] = useState("")
    const [dealers, setDealers] = useState<Dealer[]>([])
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [recordCount, setRecordCount] = useState<number>(8)
    const [customRecordCount, setCustomRecordCount] = useState<string>("")
    const [isRefreshing, setIsRefreshing] = useState(false)
    const { toast } = useToast()

    const requestLocationPermission = useCallback(async () => {
        setViewState("requesting")
        setErrorMessage("")

        if (!navigator.geolocation) {
            setViewState("error")
            setErrorMessage("Tarayıcınız konum özelliğini desteklemiyor.")
            return
        }

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                })
            })

            const lat = position.coords.latitude
            const lng = position.coords.longitude
            setUserLocation({ lat, lng })

            await fetchDealers(lat, lng, recordCount)
        } catch (error: any) {
            setViewState("error")
            if (error.code === 1) { // PERMISSION_DENIED
                setErrorMessage("Dolum noktalarını görmek için konum izni vermeniz gerekmektedir.")
            } else if (error.code === 2) { // POSITION_UNAVAILABLE
                setErrorMessage("Konum bilgisi alınamadı.")
            } else if (error.code === 3) { // TIMEOUT
                setErrorMessage("Konum alımı zaman aşımına uğradı.")
            } else {
                setErrorMessage("Konum alınırken bir hata oluştu.")
            }
        }
    }, [recordCount])

    // Initial trigger
    useEffect(() => {
        requestLocationPermission()
    }, []) // Empty dependency array to run only once on mount

    const fetchDealers = async (lat: number, lng: number, count: number) => {
        setViewState("loading")
        try {
            const response = await fetch(`/api/dealers?lat=${lat}&lng=${lng}&recordCount=${count}`)
            if (!response.ok) throw new Error("API hatası")

            const data = await response.json()
            if (data.isSuccess && Array.isArray(data.value)) {
                setDealers(data.value)
                setViewState("success")
            } else {
                throw new Error("Geçersiz veri formatı")
            }
        } catch (error) {
            console.error(error)
            setViewState("error")
            setErrorMessage("Dolum noktaları yüklenirken bir sorun oluştu.")
        }
    }

    const handleRefresh = async () => {
        if (!userLocation) {
            requestLocationPermission()
            return
        }

        // Update record count if valid
        const count = customRecordCount ? parseInt(customRecordCount) : recordCount
        if (!isNaN(count) && count > 0 && count <= 50) {
            setRecordCount(count)
            await fetchDealers(userLocation.lat, userLocation.lng, count)
        } else {
            if (customRecordCount !== "") {
                // Invalid custom count, just refresh with current
                await fetchDealers(userLocation.lat, userLocation.lng, recordCount)
            } else {
                await fetchDealers(userLocation.lat, userLocation.lng, recordCount)
            }
        }
    }

    const openGoogleMaps = (latitude: string, longitude: string) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
        window.open(url, "_blank")
    }

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address)
        toast({
            title: "Adres Kopyalandı",
            description: "Bayi adresi panoya kopyalandı.",
        })
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {viewState === "initial" || viewState === "requesting" ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-lg bg-card/50">
                    <Loader2 className="h-8 w-8 animate-spin text-md" />
                    <p className="text-md">Konumunuz alınıyor...</p>
                </div>
            ) : viewState === "error" ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-6 flex flex-row items-center justify-center gap-4">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <p className="text-red-500 flex-1 text-sm">{errorMessage}</p>
                    <Button onClick={requestLocationPermission} variant="destructive" className="h-8 bg-red-500 text-white">
                        Tekrar Dene
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {/* Map Section */}
                    <div className="w-full min-h-[300px] lg:min-h-[400px] rounded-lg overflow-hidden border bg-muted/30 order-1 lg:order-2 z-0 relative">
                        {userLocation && (
                            <DealersMap
                                userLat={userLocation.lat}
                                userLng={userLocation.lng}
                                dealers={dealers}
                            />
                        )}
                    </div>

                    {/* List Section */}
                    <div className="w-full lg:max-h-[500px] flex flex-col border rounded-lg bg-card overflow-hidden order-2 lg:order-1">
                        <div className="flex-1 overflow-y-auto relative">
                            {viewState === "loading" ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-4 items-center">
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : dealers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground p-4">
                                    Yakınınızda dolum noktası bulunamadı.
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                        <TableRow className="h-9 hover:bg-muted/40">
                                            <TableHead className="w-[60%] h-9">Bayi</TableHead>
                                            <TableHead className="text-right h-9">Mesafe</TableHead>
                                            <TableHead className="w-[50px] h-9 text-xs">Eylem</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dealers.map((dealer) => (
                                            <TableRow key={dealer.posNo} className="group h-10">
                                                <TableCell className="font-medium py-1">
                                                    <TooltipProvider delayDuration={0}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-pointer hover:text-primary transition-colors">
                                                                    {dealer.dealerName}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="bottom" align="start" className="max-w-[300px]">
                                                                <p>{dealer.address}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-xs py-1">
                                                    <Badge variant="outline" className="rounded-md font-normal">
                                                        {Math.round(dealer.distance)}m
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-1">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-primary data-[state=open]:bg-muted"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">İşlemler</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Seçiniz</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openGoogleMaps(dealer.latitude, dealer.longitude)}>
                                                                <MapIcon className="mr-2 h-4 w-4" />
                                                                Google Haritaları Aç
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => copyAddress(dealer.address)}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Adresi Kopyala
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <div className="p-2 border-t bg-muted/30 flex items-center justify-between gap-3 text-sm h-12">
                            <div className="flex items-center h-full">
                                <span className="text-muted-foreground text-xs">
                                    Toplam: <span className="font-medium text-foreground">{dealers.length}</span> kayıt
                                </span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">Adet:</span>
                                <Input
                                    type="number"
                                    placeholder="7"
                                    className="bg-background h-8 w-16 text-right"
                                    min={1}
                                    max={50}
                                    value={customRecordCount}
                                    onChange={(e) => setCustomRecordCount(e.target.value)}
                                />
                                <Button onClick={handleRefresh} size="sm" className="h-8 px-3">
                                    {viewState === "loading" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yenile"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
