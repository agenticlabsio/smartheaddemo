'use client'

import { lazy, Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load heavy chart components
export const LazyChartVisualization = lazy(() => 
  import('./chart-visualization').then(module => ({ 
    default: module.ChartVisualization 
  }))
)

export const LazyEvidenceTabs = lazy(() => 
  import('./optimized-evidence-tabs').then(module => ({ 
    default: module.OptimizedEvidenceTabs 
  }))
)

export const LazyEvidencePreview = lazy(() => 
  import('./evidence-preview').then(module => ({ 
    default: module.EvidencePreview 
  }))
)

// Lazy load Recharts components - these are heavy  
export const LazyRechartsComponents = lazy(() => 
  import('recharts').then(module => ({
    default: module.BarChart
  }))
)

// Lazy load syntax highlighter - also heavy
export const LazySyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({
    default: module.Prism
  }))
)

// Loading components for different contexts
export function ChartLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading chart visualization...</span>
        </div>
      </div>
    </div>
  )
}

export function EvidenceLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export function TableLoadingSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="h-10 bg-gray-200 rounded animate-pulse" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

export function CodeLoadingSkeleton() {
  return (
    <div className="space-y-2 p-4 bg-gray-900 rounded">
      {Array.from({ length: 6 }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-gray-700 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

// Higher-order component for lazy loading with custom fallback
export function withLazyLoading<T extends object>(
  Component: ComponentType<T>,
  LoadingComponent: ComponentType = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  )
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={<LoadingComponent />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Specific lazy-loaded components with appropriate loading states
export const ChartVisualization = withLazyLoading(
  LazyChartVisualization, 
  ChartLoadingSkeleton
)

export const EvidenceTabs = withLazyLoading(
  LazyEvidenceTabs, 
  EvidenceLoadingSkeleton  
)

export const EvidencePreview = withLazyLoading(
  LazyEvidencePreview,
  TableLoadingSkeleton
)