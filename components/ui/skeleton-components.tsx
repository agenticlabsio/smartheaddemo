'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Generic skeleton for UI components
export const Skeleton = memo(({ 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
})

Skeleton.displayName = 'Skeleton'

// Insight Center loading skeleton
export const InsightCenterSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header section */}
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>
    </div>

    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Table skeleton */}
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-64" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-20" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
))

InsightCenterSkeleton.displayName = 'InsightCenterSkeleton'

// Chat interface loading skeleton
export const ChatSkeleton = memo(() => (
  <div className="flex flex-col h-screen bg-gray-50">
    <div className="flex-1 p-6 space-y-6">
      {/* Messages */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} mb-6`}>
          <div className="max-w-[85%] flex items-start gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Card className="flex-1">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>

    {/* Input area */}
    <div className="border-t bg-white p-4">
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-12 rounded-md" />
        <Skeleton className="h-12 w-12 rounded-md" />
      </div>
    </div>
  </div>
))

ChatSkeleton.displayName = 'ChatSkeleton'

// Dashboard loading skeleton
export const DashboardSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Metric cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>

    {/* Recent activity */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
))

DashboardSkeleton.displayName = 'DashboardSkeleton'

// Chart specific skeleton
export const ChartSkeleton = memo(({ height = 300 }: { height?: number }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-40" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
    <div 
      className="bg-gray-100 rounded-lg flex items-center justify-center"
      style={{ height }}
    >
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500" />
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-2 bg-gray-50 rounded">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12 mt-1" />
        </div>
      ))}
    </div>
  </div>
))

ChartSkeleton.displayName = 'ChartSkeleton'

// Evidence tabs skeleton
export const EvidenceTabsSkeleton = memo(() => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        
        {/* Table content */}
        <div className="space-y-3">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
))

EvidenceTabsSkeleton.displayName = 'EvidenceTabsSkeleton'

// Data catalog skeleton
export const DataCatalogSkeleton = memo(() => (
  <div className="space-y-6 p-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-32" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
))

DataCatalogSkeleton.displayName = 'DataCatalogSkeleton'