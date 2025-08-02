"use client"

import { useEffect, useRef } from "react"
import dynamic from "next/dynamic"

// Leaflet CSS'ini import et
import "leaflet/dist/leaflet.css"

interface LeafletStationMapProps {
  latitude: string
  longitude: string
  className?: string
  onMapReady?: (map: any) => void
}

// Leaflet komponentini client-side only olarak yükle
const DynamicLeafletStationMap = dynamic(() => import("@/components/leaflet-station-map-client"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 flex items-center justify-center">
      <div className="text-xs text-zinc-500 dark:text-zinc-400">Harita yükleniyor...</div>
    </div>
  )
}) as React.ComponentType<{ latitude: string; longitude: string; onMapReady?: (map: any) => void }>

export default function LeafletStationMap({ latitude, longitude, className, onMapReady }: LeafletStationMapProps) {
  return (
    <div className={`w-full h-full ${className || ""}`}>
      <DynamicLeafletStationMap latitude={latitude} longitude={longitude} onMapReady={onMapReady} />
    </div>
  )
}