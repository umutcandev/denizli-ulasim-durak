"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HistoryIcon } from "lucide-react"

interface RecentStationsProps {
  stations: Array<{ id: string; name: string }>
  onStationClick: (id: string) => void
}

export default function RecentStations({ stations, onStationClick }: RecentStationsProps) {
  if (!stations.length) return null

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Son Bakılan Duraklar</CardTitle>
        <CardDescription className="mt-1">
          Son 10 bakılan durak burada listelenir. Tarayıcı hafızasında saklanır ve 30 gün boyunca kaybolmaz.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-wrap gap-1.5">
          {stations.map((station) => {
            // Durak adı çok uzunsa kısalt (mobil için)
            let displayName = station.name;
            if (displayName.length > 15) {
              displayName = displayName.substring(0, 13) + '..';
            }
            
            return (
              <Button
                key={station.id}
                onClick={() => onStationClick(station.id)}
                variant="outline"
                size="sm"
                className="h-7 py-0 px-2 text-xs bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 max-w-[calc(50%-6px)] sm:max-w-xs"
              >
                <HistoryIcon className="mr-1 h-3 w-3" />
                <span className="truncate inline-block">{displayName} ({station.id})</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  )
}
