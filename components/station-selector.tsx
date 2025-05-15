"use client"

import { useState, useEffect } from "react"
import { fetchAllStations } from "@/lib/api"

interface Station {
  id: string
  name: string
}

interface StationSelectorProps {
  currentStationId: string
  onStationChange: (stationId: string) => void
}

export default function StationSelector({ currentStationId, onStationChange }: StationSelectorProps) {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function loadStations() {
      try {
        const stationData = await fetchAllStations()
        setStations(stationData)
      } catch (error) {
        console.error("Duraklar yüklenirken hata:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStations()
  }, [])

  const filteredStations = stations.filter(
    (station) => station.name.toLowerCase().includes(searchTerm.toLowerCase()) || station.id.includes(searchTerm),
  )

  return (
    <div className="mb-4">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/2">
          <label htmlFor="station-search" className="block text-sm font-medium text-gray-700 mb-1">
            Durak Ara
          </label>
          <input
            type="text"
            id="station-search"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Durak adı veya numarası..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/2">
          <label htmlFor="station-select" className="block text-sm font-medium text-gray-700 mb-1">
            Durak Seç
          </label>
          <select
            id="station-select"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={currentStationId}
            onChange={(e) => onStationChange(e.target.value)}
            disabled={loading}
          >
            {loading ? (
              <option>Yükleniyor...</option>
            ) : (
              filteredStations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} ({station.id})
                </option>
              ))
            )}
          </select>
        </div>
      </div>
    </div>
  )
}
