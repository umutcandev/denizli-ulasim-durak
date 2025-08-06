"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface LeafletMapClientProps {
  latitude: string
  longitude: string
  stationLatitude?: string
  stationLongitude?: string
  onMapReady?: (map: L.Map) => void
}

export default function LeafletMapClient({ latitude, longitude, stationLatitude, stationLongitude, onMapReady }: LeafletMapClientProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Virgülleri nokta ile değiştir
    const lat = parseFloat(latitude.replace(",", "."))
    const lng = parseFloat(longitude.replace(",", "."))

    // Geçerli koordinatları kontrol et
    if (isNaN(lat) || isNaN(lng)) return

    // Durak koordinatlarını işle (eğer varsa)
    let stationLat: number | null = null
    let stationLng: number | null = null
    
    if (stationLatitude && stationLongitude) {
      stationLat = parseFloat(stationLatitude.replace(",", "."))
      stationLng = parseFloat(stationLongitude.replace(",", "."))
      
      if (isNaN(stationLat) || isNaN(stationLng)) {
        stationLat = null
        stationLng = null
      }
    }

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
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Pulse efekti için arka plan (yeşil) -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #22c55e; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            opacity: 0.4;
            animation: busPulse 2s infinite;
          "></div>
          <!-- Ana otobüs ikonu -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 25px; 
            height: 25px; 
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          ">
            <img src="/images/otobus-real-icon.webp" alt="Otobüs" style="
              width: 25px; 
              height: 25px; 
              object-fit: contain;
            " />
          </div>
        </div>
        <style>
          @keyframes busPulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.6;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.8);
              opacity: 0.4;
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
    const busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map.current)

    // Otobüs popup'ı ekle
    busMarker.bindPopup(`
      <div style="font-size: 12px; text-align: center;">
        <strong>Otobüs Konumu</strong><br/>
        ${lat.toFixed(6)}, ${lng.toFixed(6)}
      </div>
    `)

    // Durak marker'ını ekle (eğer durak koordinatları varsa)
    let stationMarker: L.Marker | null = null
    if (stationLat !== null && stationLng !== null) {
      // Durak ikonu oluştur (webp kullanarak ve pulse efekti ile)
      const stationIcon = L.divIcon({
        html: `
          <div style="
            position: relative;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- Pulse efekti için arka plan (siyah) -->
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background-color: #1f2937; 
              width: 24px; 
              height: 24px; 
              border-radius: 50%; 
              opacity: 0.6;
              animation: stationPulse 2s infinite;
            "></div>
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
          <style>
            @keyframes stationPulse {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.6;
              }
              50% {
                transform: translate(-50%, -50%) scale(1.6);
                opacity: 0.4;
              }
              100% {
                transform: translate(-50%, -50%) scale(2.2);
                opacity: 0;
              }
            }
          </style>
        `,
        className: 'station-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })

      stationMarker = L.marker([stationLat, stationLng], { icon: stationIcon }).addTo(map.current)
      
      // Durak popup'ı ekle
      stationMarker.bindPopup(`
        <div style="font-size: 12px; text-align: center;">
          <strong>Durak Konumu</strong><br/>
          ${stationLat.toFixed(6)}, ${stationLng.toFixed(6)}
        </div>
      `)
    }

    // Map'in ölçeğini hem otobüs hem de durak konumunu kapsayacak şekilde ayarla
    if (stationLat !== null && stationLng !== null) {
      // İki konum arasındaki mesafeyi hesapla
      const busLatLng = L.latLng(lat, lng)
      const stationLatLng = L.latLng(stationLat, stationLng)
      const distance = busLatLng.distanceTo(stationLatLng) // metre cinsinden
      
      // Her iki konumu da kapsayacak bounds oluştur
      const bounds = L.latLngBounds([
        [lat, lng],
        [stationLat, stationLng]
      ])
      
      // Mesafeye göre maxZoom seviyesini belirle
      let maxZoom = 16
      if (distance < 100) {
        maxZoom = 19 // Çok yakın (100m altı) - en yüksek zoom
      } else if (distance < 300) {
        maxZoom = 18 // Yakın (300m altı) - yüksek zoom  
      } else if (distance < 500) {
        maxZoom = 17 // Orta yakın (500m altı) - orta zoom
      }
      
      // Bounds'u fit et ve dinamik maxZoom ile padding ekle
      map.current.fitBounds(bounds, { 
        padding: [20, 20],
        maxZoom: maxZoom
      })
    } else {
      // Sadece otobüs konumu varsa normal zoom kullan
      map.current.setView([lat, lng], 15)
    }

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
  }, [latitude, longitude, stationLatitude, stationLongitude])

  return <div ref={mapContainer} className="w-full h-full" />
}