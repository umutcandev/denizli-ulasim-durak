"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Camera, AlertCircle, X, Loader2 } from "lucide-react"
import jsQR from "jsqr"

interface QrScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQrCodeDetected?: (code: string) => void
}

type ScannerState = "idle" | "loading" | "scanning" | "error"

export function QrScannerDialog({
  open,
  onOpenChange,
  onQrCodeDetected,
}: QrScannerDialogProps) {
  const [scannerState, setScannerState] = useState<ScannerState>("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [errorTitle, setErrorTitle] = useState("Kamera Hatası")
  const [retry, setRetry] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  const startScanningAgain = () => {
    setScannerState("idle")
    setRetry(c => c + 1)
  }

  useEffect(() => {
    if (!open) {
      setScannerState("idle")
      return
    }

    // Only start if we are in the initial state.
    // The retry logic resets the state to 'idle' to allow re-entry.
    if (scannerState !== "idle") {
      return
    }

    let stream: MediaStream | null = null
    let animationFrameId: number | undefined

    const cleanup = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      stream?.getTracks().forEach(track => track.stop())
      const video = videoRef.current
      if (video) {
        video.pause()
        video.srcObject = null
        video.onplaying = null // Change from onloadeddata
        video.onerror = null
      }
    }

    const scanQRCode = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scanQRCode)
        return
      }

      const ctx = canvas.getContext("2d")
      if (ctx) {
        canvas.height = video.videoHeight
        canvas.width = video.videoWidth
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          const extractStationNumber = (url: string): string | null => {
            try {
              const urlObj = new URL(url)
              const hostname = urlObj.hostname

              // Check if URL is from the correct domain
              if (hostname !== "ulasim.denizli.bel.tr") {
                return null
              }

              // Try new format first: ?page=akilliDurak&durakNo=12
              const durakNo = urlObj.searchParams.get("durakNo")
              if (durakNo) {
                return durakNo
              }

              // Try old format: /akillidurak/?durakno=12
              const durakno = urlObj.searchParams.get("durakno")
              if (durakno) {
                return durakno
              }

              return null
            } catch {
              return null
            }
          }
          const stationNumber = extractStationNumber(code.data)
          if (stationNumber) {
            onQrCodeDetected?.(stationNumber)
            handleClose()
          } else {
            setErrorTitle("Geçersiz QR Kod")
            setErrorMessage(`Geçersiz QR kod. Lütfen durak tabelasındaki kodu taradığınızdan emin olun.\n\nTaranan içerik: ${code.data}`)
            setScannerState("error")
          }
          return // Stop scanning
        }
      }
      animationFrameId = requestAnimationFrame(scanQRCode)
    }

    const initializeScanner = async () => {
      setScannerState("loading")
      setErrorMessage("")
      setErrorTitle("Kamera Hatası")

      if (!videoRef.current) {
        // Give it a moment to render after dialog opens
        await new Promise(resolve => setTimeout(resolve, 200))
        if (!videoRef.current) {
          setErrorMessage("Video elementi yüklenemedi. Lütfen tekrar deneyin.")
          setScannerState("error")
          return
        }
      }
      const video = videoRef.current

      // Timeout'u biraz uzatalım çünkü birkaç deneme yapacağız
      const loadTimeout = setTimeout(() => {
        setErrorMessage("Kamera başlatılamadı (zaman aşımı). Lütfen sayfayı yenileyip tekrar deneyin.")
        setScannerState("error")
      }, 10000)

      try {
        // Tier 1: Optimal constraints (Main Camera explicit preference)
        // 4:3 aspect ratio (1.333...) çoğu ana kameranın native sensör oranıdır.
        // Ultra-wide kameralar ise genelde daha düşük çözünürlüklü veya wide (16:9) çalışır.
        // Ayrıca yüksek çözünürlük isteyerek (1920x1440 gibi) ana sensörü zorluyoruz.
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1440 }, // 4:3 ratio for 1920 width
              aspectRatio: { ideal: 1.333333 } // Explicitly request 4:3
            }
          })
          console.log("Tier 1 camera connected")
        } catch (t1Error) {
          console.warn("Tier 1 camera failed, trying Tier 2", t1Error)

          // Tier 2: Basic environment camera fallback
          // Eğer 4:3 ve yüksek çözünürlük desteklenmiyorsa, sadece "arka kamera" isteyelim
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" }
            })
            console.log("Tier 2 camera connected")
          } catch (t2Error) {
            console.warn("Tier 2 camera failed, trying Tier 3", t2Error)

            // Tier 3: Any available camera fallback
            stream = await navigator.mediaDevices.getUserMedia({
              video: true
            })
            console.log("Tier 3 camera connected")
          }
        }

        // Stream başarılı şekilde alındıysa video elementine bağla
        video.srcObject = stream

        video.onplaying = () => {
          clearTimeout(loadTimeout)
          setScannerState("scanning")
          animationFrameId = requestAnimationFrame(scanQRCode)
        }

        video.onerror = () => {
          clearTimeout(loadTimeout)
          setErrorMessage("Video yüklenirken bir hata oluştu.")
          setScannerState("error")
        }

        // Try to play the video. The `onplaying` event will confirm success.
        await video.play()

      } catch (err) {
        clearTimeout(loadTimeout)
        let msg = "Bilinmeyen bir kamera hatası oluştu."
        if (err instanceof Error) {
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            msg = "Kamera izni, yalnızca durak numarasını okumak için gereklidir. Otobüs listesini görüntülemek için lütfen kamera izni verin."
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            msg = "Kamera bulunamadı. Cihazınızda kamera olduğundan ve başka bir uygulama tarafından kullanılmadığından emin olun."
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            msg = "Kamera başlatılamadı. Kamera başka bir uygulama tarafından kullanılıyor olabilir."
          } else {
            msg = err.message
          }
        }
        setErrorMessage(msg)
        setScannerState("error")
      }
    }

    initializeScanner()

    return cleanup
  }, [open, retry, handleClose, onQrCodeDetected])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPortal>
        <DialogOverlay className="z-[1100]" />
        <DialogContent className="z-[1100] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Kod Tarama
            </DialogTitle>
            <DialogDescription className="text-center">
              Durak tabelasındaki QR kodunu kamera ile tarayarak durak bilgilerini alın
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {scannerState === "error" ? (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      {errorTitle}
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={startScanningAgain}
                    size="sm"
                    className="flex-1"
                  >
                    Tekrar Dene
                  </Button>
                  <Button
                    onClick={handleClose}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-square bg-stone-50 dark:bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    playsInline={true}
                    muted={true}
                    autoPlay={true}
                    style={{
                      opacity: scannerState === "scanning" ? 1 : 0,
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {scannerState === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="text-foreground text-lg mt-4 font-medium">
                        Kamera başlatılıyor...
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Lütfen bekleyin
                      </p>
                    </div>
                  )}

                  {scannerState === "scanning" && (
                    <>
                      {/* Scanner Frame */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full h-full max-w-[250px] max-h-[250px] relative">
                          {/* Corners */}
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>

                          {/* Laser Scanner Line */}
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/70 rounded-full shadow-[0_0_10px_theme('colors.primary')] animate-scan"></div>
                        </div>
                      </div>

                      {/* Helper Text */}
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <p className="text-secondary-foreground text-sm bg-secondary/90 px-4 py-1 rounded-full inline-block">
                          QR kodu çerçeveye yaklaştırın
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
