import { Skeleton } from "@/components/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BusScheduleSkeletonProps {
  stationName?: string
  stationId?: string
}

export function BusScheduleSkeleton({ stationName, stationId }: BusScheduleSkeletonProps) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-center">
          {stationName ? `${stationName} ${stationId ? `(${stationId})` : ''} DURAĞI` : <Skeleton className="h-7 w-3/4 mx-auto" />}
        </CardTitle>
        <div className="mt-4">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Otomatik yenileme</span>
              <span>10 saniye</span>
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 dark:border-zinc-800">
                <TableHead className="w-[60px] sm:w-[100px] p-2 pl-3 pr-1 sm:p-4">Hat</TableHead>
                <TableHead className="p-2 px-1 sm:p-4">Güzergah</TableHead>
                <TableHead className="text-right w-[60px] sm:w-[80px] p-2 px-1 sm:p-4">Süre</TableHead>
                <TableHead className="text-right w-[60px] sm:w-[100px] p-2 pl-1 pr-3 sm:p-4">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={index} className="border-zinc-200 dark:border-zinc-800">
                  <TableCell className="p-2 pl-3 pr-1 sm:p-4">
                    <Skeleton className="h-6 w-12" />
                  </TableCell>
                  <TableCell className="p-2 px-1 sm:p-4">
                    <Skeleton className="h-5 w-48 md:w-64" />
                  </TableCell>
                  <TableCell className="text-right p-2 px-1 sm:p-4">
                    <Skeleton className="h-6 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4">
                    <Skeleton className="h-7 w-7 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
