"use client"

import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"

interface Station {
  stationId: number
  stationName: string
  latitude: string
  longitude: string
  distance: number
}

interface NearbyStationsMapProps {
  userLat: number
  userLng: number
  stations: Station[]
  onStationClick?: (station: Station) => void
}

// Leaflet komponentini client-side only olarak yükle
const DynamicNearbyStationsMap = dynamic(() => import("@/components/nearby-stations-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/50 dark:bg-muted/30 flex items-center justify-center">
      <div className="text-xs text-muted-foreground">Harita yükleniyor...</div>
    </div>
  )
}) as React.ComponentType<NearbyStationsMapProps>

export default function NearbyStationsMap({ userLat, userLng, stations, onStationClick }: NearbyStationsMapProps) {
  return (
    <div className="w-full h-full">
      <DynamicNearbyStationsMap 
        userLat={userLat} 
        userLng={userLng} 
        stations={stations}
        onStationClick={onStationClick}
      />
    </div>
  )
}

