"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, HistoryIcon, X, Info, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCardInfo, CardInfo } from "@/lib/api"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// TC Kimlik numarasını maskele (XX***XXX formatı - ilk 2, son 4 görünür)
function maskCitizenshipNumber(tcNo: string): string {
    if (!tcNo || tcNo.length < 6) return tcNo
    const firstTwo = tcNo.slice(0, 2)
    const lastFour = tcNo.slice(-4)
    const maskedLength = tcNo.length - 6
    const masked = "*".repeat(maskedLength > 0 ? maskedLength : 3)
    return `${firstTwo}${masked}${lastFour}`
}

export function BalanceCheckSection() {
    // State'ler
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [cardData, setCardData] = useState<CardInfo | null>(null)
    const [recentCards, setRecentCards] = useState<string[]>([])
    const [showInfoModal, setShowInfoModal] = useState(false)

    // LocalStorage'dan son arananları yükle
    useEffect(() => {
        const savedCards = localStorage.getItem("recentCards")
        if (savedCards) {
            try {
                setRecentCards(JSON.parse(savedCards))
            } catch (e) {
                console.error("Kaydedilmiş kartlar yüklenemedi:", e)
            }
        }
    }, [])

    const addToRecentCards = (card: string) => {
        const upperCaseCard = card.toUpperCase()
        const filteredCards = recentCards.filter((c) => c.toUpperCase() !== upperCaseCard)
        const updatedCards = [upperCaseCard, ...filteredCards].slice(0, 10)
        setRecentCards(updatedCards)
        localStorage.setItem("recentCards", JSON.stringify(updatedCards))
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase()
        // Sadece alfanumerik karakterler kabul edilir
        if (value !== "" && !/^[A-Z0-9]+$/.test(value)) return

        setInputValue(value)
        setError("")
    }

    const handleSearch = async (cardOverride?: string) => {
        const searchTerm = (cardOverride || inputValue).trim().toUpperCase()
        if (!searchTerm) return

        setLoading(true)
        setError("")
        setCardData(null)
        if (cardOverride) setInputValue(cardOverride)

        try {
            const result = await fetchCardInfo(searchTerm)

            if (result && result.length > 0) {
                setCardData(result[0])
                addToRecentCards(searchTerm)
            } else {
                setError(`'${searchTerm}' için kart bilgisi bulunamadı.`)
            }
        } catch (e) {
            setError("Kart bilgisi alınırken bir hata oluştu. Lütfen geçerli bir kart numarası veya TC kimlik numarası girdiğinizden emin olun.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            {/* Güvenlik Bilgilendirmesi - Özel Tasarım */}
            <div
                className="dark:bg-zinc-900 border border-border rounded-lg p-3 flex gap-2 relative mb-6"
                role="region"
                aria-label="Proje bilgilendirmesi"
            >
                <AlertTriangle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground/80 leading-relaxed">
                    Kimlik numaranız gibi hassas verileriniz kendi tarayıcınız hariç hiçbir yere kaydedilmemektedir. Projenin kodları açık kaynaklıdır ve GitHub üzerinden erişilebilir.
                </p>
            </div>

            {/* Ana Arama Kartı */}
            <Card className="border-zinc-200 dark:border-zinc-800">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-md">Bakiye Sorgulama</CardTitle>
                        <Badge
                            variant="secondary"
                            className="cursor-pointer bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 text-[10px] px-1 h-5 font-medium rounded-sm text-[10px] transition-colors"
                            onClick={() => setShowInfoModal(true)}
                        >
                            <Info className="w-3 h-3 mr-1" />
                            Kart numarası nerede?
                        </Badge>
                    </div>
                    <CardDescription className="mt-1 text-xs">
                        Kart numarası veya TC kimlik numarası ile bakiye sorgulayabilirsiniz.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex w-full items-center gap-2">
                        <div className="flex w-full items-center gap-2 relative">
                            <Input
                                type="text"
                                inputMode="text"
                                pattern="[A-Za-z0-9]*"
                                placeholder="Kart numarası veya TC kimlik no"
                                style={{ fontSize: "0.80rem" }}
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="h-8 flex-1 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-800"
                                disabled={loading}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-8 px-4 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 flex-shrink-0"
                                disabled={loading || !inputValue}
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Sorgula</>}
                            </Button>
                        </div>
                    </form>

                    {/* Hata Mesajı */}
                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800/30 p-4 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Loading Skeleton - Table formatında */}
                    {loading && (
                        <div className="mt-5">
                            {/* Bakiye Skeleton */}
                            <div className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-9 w-28" />
                            </div>
                            {/* Table Skeleton */}
                            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                                <Table>
                                    <TableBody>
                                        {[...Array(9)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="py-2.5 px-3">
                                                    <Skeleton className="h-4 w-32" />
                                                </TableCell>
                                                <TableCell className="py-2.5 px-3 text-right">
                                                    <Skeleton className="h-4 w-28 ml-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Kart Bilgileri - Shadcn Table */}
                    {cardData && !loading && (
                        <div className="mt-5">
                            {/* Bakiye Alanı - Vurgulanmış */}
                            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800/50">
                                <div className="text-xs text-muted-foreground mb-1">Güncel TL Bakiye:</div>
                                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                                    {cardData.currentBalance} TL
                                </div>
                            </div>

                            {/* Detay Bilgileri - Shadcn Table */}
                            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Adı Soyadı:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">{cardData.name} {cardData.surname}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">TC Kimlik No:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium font-mono">{maskCitizenshipNumber(cardData.citizenshipNumber)}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Kart Numarası:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium font-mono">{cardData.mifareId}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Kart Türü:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">{cardData.cardTypeDescription}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Abonman Biniş Sayısı:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">
                                                {cardData.remainingPass === "SINIRSIZ" ? "SINIRSIZ Biniş" : cardData.remainingPass}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Son Vize Tarihi:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">{cardData.validityEndDate}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Son İşlem Tarihi:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">{cardData.lastTransactionDate}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Abonman Bitiş Tarihi:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">
                                                {cardData.subscriptionEndDateTime && cardData.subscriptionEndDateTime !== "0001-01-01T00:00:00"
                                                    ? cardData.subscriptionEndDateTime
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-2.5 px-3 text-muted-foreground">Kart Durumu:</TableCell>
                                            <TableCell className="py-2.5 px-3 text-right font-medium">{cardData.cardStatus}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Son Aranan Kartlar - RecentBusLines stilinde */}
            {recentCards.length > 0 && (
                <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-md">Son Aranan Kartlar</CardTitle>
                        <CardDescription className="mt-1 text-xs">
                            En son aradığınız kartlar, tarayıcı hafızasında saklanır ve kaybolmaz.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <div className="flex flex-wrap gap-1.5">
                            {recentCards.map((card) => (
                                <Button
                                    key={card}
                                    onClick={() => handleSearch(card)}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 py-0 px-2 text-xs bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800"
                                >
                                    <HistoryIcon className="mr-1 h-3 w-3" />
                                    <span>{card}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bilgi Modalı - Fancybox tarzı */}
            <AnimatePresence>
                {showInfoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowInfoModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative bg-transparent rounded-lg overflow-hidden flex items-center justify-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
                                    onClick={() => setShowInfoModal(false)}
                                >
                                    <X className="h-8 w-8 p-2 rounded-full bg-black/50 backdrop-blur-sm" />
                                </Button>
                                <TransformWrapper initialScale={1} minScale={0.5} maxScale={3}>
                                    <TransformComponent wrapperClass="!w-full !h-full flex items-center justify-center">
                                        <img
                                            src="/images/bakiyeinfo.png"
                                            alt="Kart Numarası Bilgisi"
                                            className="max-h-[85vh] w-auto max-w-full object-contain rounded-md"
                                        />
                                    </TransformComponent>
                                </TransformWrapper>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
