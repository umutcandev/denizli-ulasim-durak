"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// Leaflet CSS'ini import et
import "leaflet/dist/leaflet.css"

interface LeafletMapProps {
  latitude: string
  longitude: string
  className?: string
  onMapReady?: (map: any) => void
}

// Leaflet komponentini client-side only olarak yükle
const DynamicLeafletMap = dynamic(() => import("@/components/leaflet-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/50 dark:bg-muted/30 flex items-center justify-center">
      <div className="text-xs text-muted-foreground">Harita yükleniyor...</div>
    </div>
  )
}) as React.ComponentType<{ latitude: string; longitude: string; onMapReady?: (map: any) => void }>

export default function LeafletMap({ latitude, longitude, className, onMapReady }: LeafletMapProps) {
  return (
    <div className={`w-full h-full ${className || ""}`}>
      <DynamicLeafletMap latitude={latitude} longitude={longitude} onMapReady={onMapReady} />
    </div>
  )
}