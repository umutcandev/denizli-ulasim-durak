"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface Station {
  stationId: number
  stationName: string
  latitude: string
  longitude: string
  distance: number
}

interface NearbyStationsMapClientProps {
  userLat: number
  userLng: number
  stations: Station[]
  onStationClick?: (station: Station) => void
}

export default function NearbyStationsMapClient({
  userLat,
  userLng,
  stations,
  onStationClick,
}: NearbyStationsMapClientProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)

  // Haritayı oluştur (sadece bir kez)
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Haritayı oluştur
    map.current = L.map(mapContainer.current, {
      center: [userLat, userLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    })

    // OpenStreetMap tile layer ekle
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current)

    // Cleanup
    return () => {
      if (map.current) {
        // Tüm marker'ları temizle
        markersRef.current.forEach(marker => {
          if (marker && map.current) {
            marker.remove()
          }
        })
        markersRef.current = []
        
        if (userMarkerRef.current && map.current) {
          userMarkerRef.current.remove()
          userMarkerRef.current = null
        }
        
        map.current.remove()
        map.current = null
      }
    }
  }, []) // Sadece mount/unmount'ta çalış


  // Kullanıcı marker'ını güncelle
  useEffect(() => {
    if (!map.current) return

    // Eski kullanıcı marker'ını temizle
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }

    // Kullanıcı konumu için circle ikonu oluştur
    const userIcon = L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #3b82f6;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 2;
          "></div>
        </div>
      `,
      className: 'user-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    })

    // Kullanıcı marker'ını ekle
    userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map.current)
    userMarkerRef.current.bindPopup(`
      <div style="font-size: 12px; text-align: center;">
        <strong>Konumunuz</strong><br/>
        ${userLat.toFixed(6)}, ${userLng.toFixed(6)}
      </div>
    `)
  }, [userLat, userLng])

  // Durak marker'larını güncelle
  useEffect(() => {
    if (!map.current) return

    // Eski marker'ları temizle
    markersRef.current.forEach(marker => {
      if (marker && map.current) {
        marker.remove()
      }
    })
    markersRef.current = []

    if (stations.length === 0) return

    // Durak ikonu oluştur
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
          <!-- Pulse efekti için arka plan -->
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

    // Harita tamamen yüklendikten sonra marker'ları ekle
    const addMarkers = () => {
      if (!map.current) return

      // Harita boyutlarını güncelle (container görünür olmalı)
      map.current.invalidateSize()

      const formatDistance = (distance: number) => {
        if (distance < 1000) {
          return `${Math.round(distance)}m`
        }
        return `${(distance / 1000).toFixed(1)}km`
      }

      // Durak marker'larını ekle
      stations.forEach((station) => {
        const lat = parseFloat(station.latitude.replace(",", "."))
        const lng = parseFloat(station.longitude.replace(",", "."))

        if (isNaN(lat) || isNaN(lng) || !map.current) return

        try {
          const marker = L.marker([lat, lng], { icon: stationIcon }).addTo(map.current)
          
          marker.bindPopup(`
            <div style="font-size: 12px; text-align: center; min-width: 120px;">
              <strong>${station.stationName}</strong><br/>
              <span style="color: #666;">Durak No: ${station.stationId}</span><br/>
              <span style="color: #666;">Mesafe: ${formatDistance(station.distance)}</span>
            </div>
          `)

          marker.on('click', () => {
            if (onStationClick) {
              onStationClick(station)
            }
          })

          markersRef.current.push(marker)
        } catch (error) {
          console.error("Marker eklenirken hata:", error)
        }
      })

      // Tüm marker'lar eklendikten sonra haritayı ayarla
      const fitMapToAllMarkers = () => {
        if (!map.current) return

        const allPoints: [number, number][] = []

        // Kullanıcı konumunu ekle
        if (userMarkerRef.current) {
          allPoints.push([userLat, userLng])
        }

        // Tüm durak konumlarını ekle
        markersRef.current.forEach(marker => {
          if (marker) {
            try {
              const latLng = marker.getLatLng()
              allPoints.push([latLng.lat, latLng.lng])
            } catch (error) {
              console.error("Marker konumu alınırken hata:", error)
            }
          }
        })

        // Stations array'inden de ekle (marker henüz eklenmemişse)
        stations.forEach((station) => {
          const lat = parseFloat(station.latitude.replace(",", "."))
          const lng = parseFloat(station.longitude.replace(",", "."))
          if (!isNaN(lat) && !isNaN(lng)) {
            // Bu nokta zaten eklenmiş mi kontrol et
            const exists = allPoints.some(([pLat, pLng]) => 
              Math.abs(pLat - lat) < 0.0001 && Math.abs(pLng - lng) < 0.0001
            )
            if (!exists) {
              allPoints.push([lat, lng])
            }
          }
        })

        if (allPoints.length > 0) {
          try {
            const bounds = L.latLngBounds(allPoints)
            
            // Harita boyutlarını güncelle
            map.current.invalidateSize()
            
            // Tüm marker'ları kapsayacak şekilde zoom yap
            map.current.fitBounds(bounds, {
              padding: [50, 50], // Kenarlara boşluk (üst-alt, sol-sağ)
              animate: true // Animasyonlu geçiş
            })
          } catch (error) {
            console.error("Bounds ayarlanırken hata:", error)
            if (map.current) {
              map.current.setView([userLat, userLng], 15)
            }
          }
        } else if (map.current) {
          map.current.setView([userLat, userLng], 15)
        }
      }

      // Tüm marker'lar eklendikten sonra haritayı ayarla
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitMapToAllMarkers()
        })
      })
    }

    // Harita hazır olduğunda marker'ları ekle (bir sonraki frame'de)
    requestAnimationFrame(() => {
      requestAnimationFrame(addMarkers)
    })
  }, [stations, userLat, userLng, onStationClick])

  return <div ref={mapContainer} className="w-full h-full" />
}

