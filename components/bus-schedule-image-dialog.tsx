import { useState } from "react"
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

  // Resim URL'sini temizle
  const cleanImageUrl = cleanUrl(imageUrl)

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
            <div className={`w-full ${loading ? "hidden" : "block"}`}>
              <Image
                src={cleanImageUrl}
                alt={`${busNumber} Numaralı Hat Saatleri`}
                width={1000}
                height={800}
                className="bus-schedule-image"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
                priority
                unoptimized // Harici kaynaklardan resim yüklemek için
              />
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
} 