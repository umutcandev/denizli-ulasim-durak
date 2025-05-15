import { Skeleton } from "@/components/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function BusScheduleSkeleton() {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-3">
        <Skeleton className="h-7 w-3/4 mx-auto mb-4" />
        <div className="mt-4">
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-5 w-48 md:w-64" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
