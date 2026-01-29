"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
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

interface DealersMapClientProps {
    userLat: number
    userLng: number
    dealers: Dealer[]
    onDealerClick?: (dealer: Dealer) => void
}

export default function DealersMapClient({
    userLat,
    userLng,
    dealers,
    onDealerClick,
}: DealersMapClientProps) {
    const mapContainer = useRef<HTMLDivElement>(null)
    const map = useRef<L.Map | null>(null)
    const markersRef = useRef<L.Marker[]>([])
    const userMarkerRef = useRef<L.Marker | null>(null)

    // Initialize Map
    useEffect(() => {
        if (!mapContainer.current || map.current) return

        map.current = L.map(mapContainer.current, {
            center: [userLat, userLng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
        })

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map.current)

        return () => {
            if (map.current) {
                markersRef.current.forEach(marker => marker.remove())
                markersRef.current = []
                if (userMarkerRef.current) userMarkerRef.current.remove()
                map.current.remove()
                map.current = null
            }
        }
    }, []) // Mount only

    // Update User Marker
    useEffect(() => {
        if (!map.current) return

        if (userMarkerRef.current) {
            userMarkerRef.current.remove()
            userMarkerRef.current = null
        }

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
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #3b82f6;
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            opacity: 0.3;
            animation: userPulse 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes userPulse {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        </style>
      `,
            className: 'user-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })

        userMarkerRef.current = L.marker([userLat, userLng], { icon: userIcon }).addTo(map.current)
    }, [userLat, userLng])

    // Update Dealer Markers
    useEffect(() => {
        if (!map.current) return

        markersRef.current.forEach(marker => marker.remove())
        markersRef.current = []

        if (dealers.length === 0) return

        const dealerIcon = L.divIcon({
            html: `
        <div style="
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #10b981;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      `,
            className: 'dealer-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        })

        const addMarkers = () => {
            if (!map.current) return
            map.current.invalidateSize()

            const allPoints: [number, number][] = [[userLat, userLng]]

            dealers.forEach((dealer) => {
                const lat = parseFloat(dealer.latitude.replace(",", "."))
                const lng = parseFloat(dealer.longitude.replace(",", "."))

                if (isNaN(lat) || isNaN(lng) || !map.current) return

                const marker = L.marker([lat, lng], { icon: dealerIcon }).addTo(map.current!)

                marker.bindPopup(`
          <div style="font-size: 13px; text-align: center; min-width: 150px; font-family: sans-serif;">
            <strong style="display:block; margin-bottom: 4px; color: #111;">${dealer.dealerName}</strong>
            <span style="color: #555; font-size: 11px; display:block; margin-bottom: 4px;">${dealer.address}</span>
            <span style="color: #10b981; font-weight: 600;">${Math.round(dealer.distance)}m</span>
          </div>
        `)

                marker.on('click', () => {
                    if (onDealerClick) onDealerClick(dealer)
                })

                markersRef.current.push(marker)
                allPoints.push([lat, lng])
            })

            // Fit bounds
            if (allPoints.length > 1) {
                const bounds = L.latLngBounds(allPoints)
                map.current.fitBounds(bounds, { padding: [50, 50], animate: true })
            } else {
                map.current.setView([userLat, userLng], 15)
            }
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(addMarkers)
        })

    }, [dealers, userLat, userLng, onDealerClick])

    return <div ref={mapContainer} className="w-full h-full" />
}
