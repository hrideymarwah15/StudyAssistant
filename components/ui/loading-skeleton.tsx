import { Card } from "@/components/ui/card"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Today at Glance Skeleton */}
      <Card className="p-6">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Streak Tracker Skeleton */}
      <Card className="p-6">
        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </Card>

      {/* Next Actions Skeleton */}
      <Card className="p-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Focus Hero Skeleton */}
      <Card className="p-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </Card>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="grid gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
