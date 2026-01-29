"use client"

import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

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

interface DealersMapProps {
    userLat: number
    userLng: number
    dealers: Dealer[]
    onDealerClick?: (dealer: Dealer) => void
}

const DynamicDealersMap = dynamic(() => import("@/components/dealers-map-client"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-muted/50 dark:bg-muted/30 flex items-center justify-center">
            <div className="text-xs text-muted-foreground">Harita yükleniyor...</div>
        </div>
    )
}) as React.ComponentType<DealersMapProps>

export default function DealersMap({ userLat, userLng, dealers, onDealerClick }: DealersMapProps) {
    return (
        <div className="w-full h-full">
            <DynamicDealersMap
                userLat={userLat}
                userLng={userLng}
                dealers={dealers}
                onDealerClick={onDealerClick}
            />
        </div>
    )
}
