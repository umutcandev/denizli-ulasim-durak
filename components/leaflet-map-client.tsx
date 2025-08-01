"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface LeafletMapClientProps {
  latitude: string
  longitude: string
  onMapReady?: (map: L.Map) => void
}

export default function LeafletMapClient({ latitude, longitude, onMapReady }: LeafletMapClientProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Virgülleri nokta ile değiştir
    const lat = parseFloat(latitude.replace(",", "."))
    const lng = parseFloat(longitude.replace(",", "."))

    // Geçerli koordinatları kontrol et
    if (isNaN(lat) || isNaN(lng)) return

    // Haritayı oluştur
    map.current = L.map(mapContainer.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false, // Default zoom controls'u kapat (kendi kontrollerimizi kullanacağız)
      attributionControl: false, // Attribution'u kapat (küçük alan için)
    })

    // OpenStreetMap tile layer ekle
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current)

    // Otobüs ikonu oluştur
    const busIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Pulse efekti için arka plan -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ef4444; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            opacity: 0.3;
            animation: pulse 2s infinite;
          "></div>
          <!-- Ana nokta -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #ef4444; 
            width: 18px; 
            height: 18px; 
            border-radius: 50%; 
            border: 3px solid white;
            box-shadow: 0 0 8px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          ">
            <div style="
              width: 9px; 
              height: 9px; 
              background-color: white; 
              border-radius: 50%;
            "></div>
          </div>
        </div>
        <style>
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.5;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.8);
              opacity: 0.3;
            }
            100% {
              transform: translate(-50%, -50%) scale(2.6);
              opacity: 0;
            }
          }
        </style>
      `,
      className: 'bus-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })

    // Otobüs marker'ını ekle
    const marker = L.marker([lat, lng], { icon: busIcon }).addTo(map.current)

    // Popup ekle
    marker.bindPopup(`
      <div style="font-size: 12px; text-align: center;">
        <strong>Otobüs Konumu</strong><br/>
        ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>
    `)

    // Map ready callback'ini çağır
    if (onMapReady && map.current) {
      onMapReady(map.current)
    }

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [latitude, longitude])

  return <div ref={mapContainer} className="w-full h-full" />
}