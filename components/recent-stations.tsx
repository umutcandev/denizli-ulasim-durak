"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RecentStationsProps {
  stations: Array<{ id: string; name: string }>
  onStationClick: (id: string) => void
}

export default function RecentStations({ stations, onStationClick }: RecentStationsProps) {
  if (!stations.length) return null

  return (
    <Card className="border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Son Bakılan Duraklar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {stations.map((station) => (
            <Button
              key={station.id}
              onClick={() => onStationClick(station.id)}
              variant="outline"
              size="sm"
              className="h-8 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              {station.name} ({station.id})
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
