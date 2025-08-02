import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface BusScheduleSkeletonProps {
  stationName?: string
  stationId?: string
}

export function BusScheduleSkeleton({ stationName, stationId }: BusScheduleSkeletonProps) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-stretch gap-3">
          {/* Sol taraf - Station bilgileri */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              {stationName && stationId ? (
                <>
                  {/* Station ID - Üst satır */}
                  <div className="flex items-center">
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md font-bold text-lg">
                      {stationId}
                    </span>
                  </div>
                  {/* Station Name - Alt satır */}
                  <CardTitle className="text-lg font-semibold">
                    {stationName}
                  </CardTitle>
                </>
              ) : (
                <>
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-6 w-3/4" />
                </>
              )}
            </div>
          </div>
          
          {/* Sağ taraf - Harita skeleton */}
          <div className="relative w-32 sm:w-40 md:w-48 rounded overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0">
            <Skeleton className="w-full h-full" />
            
            {/* Zoom kontrolleri skeleton */}
            <div className="absolute top-1 right-1 z-[1000] flex flex-col gap-0.5">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-5 rounded" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-4">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Otomatik yenileme</span>
              <span>10 saniye</span>
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
        
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Dakika Bilgileri</TabsTrigger>
            <TabsTrigger value="lines">Duraktan Geçen Hatlar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="mt-4">
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
          </TabsContent>
          
          <TabsContent value="lines" className="mt-4">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow className="border-zinc-200 dark:border-zinc-800">
                    <TableHead className="w-[80px] p-2 pl-3 pr-1 sm:p-4">Hat</TableHead>
                    <TableHead className="p-2 px-1 sm:p-4 max-w-0">Hat Adı</TableHead>
                    <TableHead className="text-right w-[80px] p-2 pl-1 pr-3 sm:p-4">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <TableRow key={index} className="border-zinc-200 dark:border-zinc-800">
                      <TableCell className="font-medium p-2 pl-3 pr-1 sm:p-4 w-[80px]">
                        <Skeleton className="h-4 w-12" />
                      </TableCell>
                      <TableCell className="p-2 px-1 sm:p-4 truncate overflow-hidden">
                        <Skeleton className="h-4 w-full max-w-xs" />
                      </TableCell>
                      <TableCell className="text-right p-2 pl-1 pr-3 sm:p-4 w-[80px]">
                        <Skeleton className="h-7 w-7 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
