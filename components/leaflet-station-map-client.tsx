"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface LeafletStationMapClientProps {
  latitude: string
  longitude: string
  onMapReady?: (map: L.Map) => void
}

export default function LeafletStationMapClient({ latitude, longitude, onMapReady }: LeafletStationMapClientProps) {
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

    // Harita container'a pointer cursor ekle
    mapContainer.current.style.cursor = 'pointer'

    // OpenStreetMap tile layer ekle
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current)

    // Durak ikonu oluştur (webp kullanarak)
    const stationIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Ana icon -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px; 
            height: 16px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          ">
            <img src="/images/durak-icon.webp" alt="Durak" style="
              width: 16px; 
              height: 16px; 
              object-fit: contain;
            " />
          </div>
        </div>
      `,
      className: 'station-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    // Durak marker'ını ekle
    const marker = L.marker([lat, lng], { icon: stationIcon }).addTo(map.current)

    // Google Maps'e yönlendirme için click event
    const openInGoogleMaps = () => {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      window.open(googleMapsUrl, '_blank')
    }

    // Marker'a click event ekle
    marker.on('click', openInGoogleMaps)
    
    // Haritanın kendisine de click event ekle
    map.current.on('click', openInGoogleMaps)

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