import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Plus, Minus, RotateCcw } from "lucide-react"
import { cleanUrl } from "@/lib/utils"

interface BusScheduleImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  busNumber: string
}

export function BusScheduleImageDialog({
  open,
  onOpenChange,
  imageUrl,
  busNumber,
}: BusScheduleImageDialogProps) {
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 })
  
  // Pinch zoom için state'ler
  const [initialPinchDistance, setInitialPinchDistance] = useState(0)
  const [initialZoom, setInitialZoom] = useState(1)
  const [isPinching, setIsPinching] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Resim URL'sini temizle
  const cleanImageUrl = cleanUrl(imageUrl)

  // İki parmak arasındaki mesafeyi hesapla
  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  // Pan sınırlarını hesapla
  const constrainPan = useCallback((newPan: { x: number; y: number }, currentZoom: number) => {
    if (currentZoom <= 1) return { x: 0, y: 0 }
    
    const container = containerRef.current
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

  // Zoom fonksiyonları
  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + 0.5, 5)
      // Zoom değiştiğinde pan'ı sınırla
      setPan(currentPan => constrainPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainPan])

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.5, 0.5)
      // Zoom değiştiğinde pan'ı sınırla
      setPan(currentPan => constrainPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainPan])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(prev => {
      const newZoom = Math.max(0.5, Math.min(5, prev + delta))
      // Zoom değiştiğinde pan'ı sınırla
      setPan(currentPan => constrainPan(currentPan, newZoom))
      return newZoom
    })
  }, [constrainPan])

  // Mouse drag fonksiyonları
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setLastPan(pan)
  }, [zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return
    
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    const newPan = {
      x: lastPan.x + deltaX,
      y: lastPan.y + deltaY
    }
    
    setPan(constrainPan(newPan, zoom))
  }, [isDragging, dragStart, lastPan, zoom, constrainPan])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch fonksiyonları (mobil zoom ve pinch)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2) {
      // İki parmak - pinch zoom başlat
      const distance = getDistance(e.touches[0], e.touches[1])
      setInitialPinchDistance(distance)
      setInitialZoom(zoom)
      setIsPinching(true)
      setIsDragging(false)
    } else if (e.touches.length === 1) {
      // Tek parmak - drag başlat (sadece zoom > 1 ise)
      if (zoom > 1) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({ x: touch.clientX, y: touch.clientY })
        setLastPan(pan)
      }
      setIsPinching(false)
    }
  }, [zoom, pan, getDistance])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 2 && isPinching) {
      // İki parmak - pinch zoom
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / initialPinchDistance
      const newZoom = Math.max(0.5, Math.min(5, initialZoom * scale))
      setZoom(newZoom)
      // Zoom değiştiğinde pan'ı sınırla
      setPan(currentPan => constrainPan(currentPan, newZoom))
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Tek parmak - drag
      const touch = e.touches[0]
      const deltaX = touch.clientX - dragStart.x
      const deltaY = touch.clientY - dragStart.y
      
      const newPan = {
        x: lastPan.x + deltaX,
        y: lastPan.y + deltaY
      }
      
      setPan(constrainPan(newPan, zoom))
    }
  }, [isDragging, dragStart, lastPan, zoom, isPinching, getDistance, initialPinchDistance, initialZoom, constrainPan])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false)
      setIsPinching(false)
    } else if (e.touches.length === 1 && isPinching) {
      // Pinch'ten tek parmağa geçiş
      setIsPinching(false)
      if (zoom > 1) {
        const touch = e.touches[0]
        setIsDragging(true)
        setDragStart({ x: touch.clientX, y: touch.clientY })
        setLastPan(pan)
      }
    }
  }, [isPinching, zoom, pan])

  // Dialog açıldığında zoom ve pan sıfırla
  useEffect(() => {
    if (open) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
      setIsDragging(false)
      setIsPinching(false)
      setInitialPinchDistance(0)
      setInitialZoom(1)
    }
  }, [open])

  // Wheel event listener ekle
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[1100]" />
        <DialogContent className="bus-schedule-dialog-content z-[1100]">
          <DialogHeader>
            <DialogTitle className="text-center">{busNumber} Numaralı Hat Saatleri</DialogTitle>
            <DialogDescription className="text-center">
              Denizli Büyükşehir Belediyesi otobüs saatleri
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full flex justify-center">
            {loading && (
              <div className="w-full">
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[90%]" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
              </div>
            )}
            
            <div 
              ref={containerRef}
              className={`relative w-full overflow-hidden ${loading ? "hidden" : "block"}`}
              style={{ 
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                height: 'auto',
                maxHeight: '70vh',
                touchAction: 'none' // Touch event'lerin tarayıcı tarafından handle edilmesini engelle
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Zoom Kontrolleri - Sol üst köşe */}
              {!loading && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={zoomIn}
                    disabled={zoom >= 5}
                    className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={zoomOut}
                    disabled={zoom <= 0.5}
                    className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetZoom}
                      className="w-8 h-8 p-0 bg-black/70 hover:bg-black/80 text-white border-0"
                      title="Sıfırla"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              {/* Zoom seviyesi göstergesi */}
              {!loading && zoom !== 1 && (
                <div className="absolute top-4 right-4 z-10 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  %{Math.round(zoom * 100)}
                </div>
              )}

              <div 
                className="flex justify-center"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <Image
                  ref={imageRef}
                  src={cleanImageUrl}
                  alt={`${busNumber} Numaralı Hat Saatleri`}
                  width={1000}
                  height={800}
                  className="bus-schedule-image select-none"
                  onLoad={() => setLoading(false)}
                  onError={() => setLoading(false)}
                  priority
                  unoptimized // Harici kaynaklardan resim yüklemek için
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 