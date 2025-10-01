import { Skeleton } from '@/components/ui/skeleton-components'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="space-y-4 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
        </div>
      </div>
    </div>
  )
}