'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft, 
  Download, 
  Clock, 
  Target, 
  TrendingUp, 
  DollarSign,
  FileText,
  CheckCircle,
  Star,
  Eye,
  BarChart3,
  Share2,
  MessageSquare,
  Calendar,
  Tag,
  Hash,
  Database,
  Lightbulb,
  Activity,
  AlertCircle,
  Home,
  ChevronRight,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { SharedQuery } from '@/lib/shared-queries'
import { exportToPDF } from '@/lib/pdf-export'
import { toast } from 'sonner'
import NextDynamic from 'next/dynamic'

// Force dynamic rendering for personalized insights data  
export const dynamic = 'force-dynamic'

// Optimized dynamic imports with proper loading states
const EnhancedMarkdown = NextDynamic(() => import('@/components/ui/enhanced-markdown').then(mod => ({ default: mod.EnhancedMarkdown })), {
  loading: () => <div className="flex items-center justify-center p-6">
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    <span className="ml-2 text-gray-500">Loading content...</span>
  </div>,
  ssr: false
})

const EvidenceTabs = NextDynamic(() => import('@/components/ui/optimized-evidence-tabs').then(mod => ({ default: mod.OptimizedEvidenceTabs })), {
  loading: () => <div className="flex items-center justify-center p-12 bg-gray-50 border rounded-lg">
    <div className="text-center">
      <Database className="h-8 w-8 mx-auto mb-3 text-gray-400 animate-pulse" />
      <div className="text-sm text-gray-500">Loading evidence data...</div>
    </div>
  </div>,
  ssr: false
})

// Lazy load utilities with caching
const getSharedQueries = (() => {
  let cachedQueries: SharedQuery[] | null = null
  return async () => {
    if (cachedQueries) return cachedQueries
    cachedQueries = await import('@/lib/shared-queries').then(mod => mod.sharedQueries)
    return cachedQueries
  }
})()


// Enhanced interface for evidence data
interface EvidenceData {
  data?: any[]
  columns?: string[]
  sqlQuery?: string
  chartData?: any[]
  chartType?: 'bar' | 'pie' | 'line'
  insights?: string[]
}

export default function InsightDetailPage() {
  const params = useParams()
  const router = useRouter()
  const insightId = parseInt(params.id as string)
  
  // Core state management
  const [insight, setInsight] = useState<SharedQuery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [viewHistory, setViewHistory] = useState(0)
  
  // Performance optimization with memoized evidence data
  const evidenceData = useMemo(() => {
    if (!insight?.evidence) return null
    
    // Transform insight evidence to EvidenceTabs format
    return {
      data: insight.evidence.top_variance_centers || 
            insight.evidence.quarterly_trends || 
            insight.evidence.account_distribution ||
            [],
      columns: insight.evidence.top_variance_centers ? ['center', 'total_spend', 'spend_cv', 'spend_percentage'] :
               insight.evidence.quarterly_trends ? ['period', 'spend', 'qoq_growth'] :
               insight.evidence.account_distribution ? ['account', 'total_spend', 'percentage'] :
               [],
      sqlQuery: insight.sql_code || 'SELECT * FROM analysis_data',
      chartData: insight.evidence.top_variance_centers?.slice(0, 8)?.map(item => ({
        name: item.center || item.account || item.period,
        value: parseFloat(String(item.total_spend || item.spend || 0).replace(/[^0-9.-]/g, ''))
      })) || [],
      chartType: 'bar' as const,
      insights: [
        insight.business_insights || '',
        ...(insight.recommendations || [])
      ].filter(Boolean)
    } as EvidenceData
  }, [insight])

  // Instant loading implementation
  useEffect(() => {
    let isMounted = true
    
    const loadInsight = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load with caching for instant subsequent loads
        const queries = await getSharedQueries()
        
        if (!isMounted) return
        
        const foundInsight = queries.find(q => q.id === insightId)
        if (foundInsight) {
          setInsight(foundInsight)
          setViewHistory(Math.floor(Math.random() * 50) + 10) // Mock analytics
          
          // Preload next/prev insights for instant navigation
          const currentIndex = queries.findIndex(q => q.id === insightId)
          if (currentIndex > 0) {
            router.prefetch(`/insights-center/${queries[currentIndex - 1].id}`)
          }
          if (currentIndex < queries.length - 1) {
            router.prefetch(`/insights-center/${queries[currentIndex + 1].id}`)
          }
        } else {
          setError('Insight not found')
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load insight')
          console.error('Error loading insight:', err)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInsight()
    
    return () => {
      isMounted = false
    }
  }, [insightId, router])

  // Enhanced action handlers
  const handleDeepDive = () => {
    if (!insight) return
    
    const urlParams = new URLSearchParams({
      query: insight.query,
      context: JSON.stringify({
        insightId: insight.id,
        title: insight.title,
        category: insight.category,
        source: 'insights-center'
      }),
      source: 'insights-center'
    })
    
    router.push(`/chat?${urlParams.toString()}`)
  }

  const handleFavorite = () => {
    setIsFavorite(!isFavorite)
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
  }

  const handleExportPDF = async () => {
    if (!insight) return
    
    try {
      await exportToPDF({
        title: insight.title || 'Insight Report',
        summary: insight.summary || 'Financial insight analysis',
        query: insight.query || '',
        sql: insight.sql_query || '',
        results: insight.evidence ? Object.values(insight.evidence).flat() : [],
        metadata: {
          executionTime: insight.execution_time || 0,
          confidence: insight.confidence_score || 0,
          modelUsed: 'Gemini 2.5 Flash',
          timestamp: new Date().toISOString()
        },
        insights: insight.followup_response || insight.business_insights
      })
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error('PDF export error:', error)
    }
  }

  const getPriorityBadge = (impact?: string) => {
    if (!impact) return { className: 'bg-gray-100 text-gray-800', label: 'TBD' }
    
    if (impact.includes('Critical') || impact.includes('$')) {
      return { className: 'bg-red-100 text-red-800', label: impact }
    }
    if (impact.includes('High') || impact.includes('%')) {
      return { className: 'bg-orange-100 text-orange-800', label: impact }
    }
    return { className: 'bg-blue-100 text-blue-800', label: impact }
  }

  const getConfidenceBadge = (confidence?: string) => {
    const level = confidence?.toLowerCase() || 'medium'
    if (level === 'high') return { className: 'bg-green-100 text-green-800', icon: CheckCircle }
    if (level === 'medium') return { className: 'bg-yellow-100 text-yellow-800', icon: Clock }
    return { className: 'bg-red-100 text-red-800', icon: AlertCircle }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-violet-600 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600">Loading insight details...</div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !insight) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Insight Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested insight could not be found.'}</p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href="/insights-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Insights Center
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const IconComponent = insight.icon
  const priorityBadge = getPriorityBadge(insight.impact)
  const confidenceBadge = getConfidenceBadge(insight.confidence)
  const ConfidenceIcon = confidenceBadge.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/insights-center" className="hover:text-gray-900 transition-colors">
              Insights Center
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium">Insight #{insight.id}</span>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100">
                <Link href="/insights-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Insights Center
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Hash className="h-4 w-4" />
                <span>ID: {insight.id}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFavorite}
                className={`transition-colors ${isFavorite ? 'text-yellow-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              
              <Button
                onClick={handleDeepDive}
                className="bg-violet-600 hover:bg-violet-700 text-white"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Deep Dive
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div id="insight-content" className="space-y-8">
          {/* Enhanced Header Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-b border-violet-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="p-3 rounded-xl bg-white border border-violet-200 shadow-sm">
                      <IconComponent className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                        {insight.title || insight.query}
                      </CardTitle>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {viewHistory} views
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Updated today
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 flex-wrap gap-2">
                    <Badge variant="outline" className={priorityBadge.className}>
                      <DollarSign className="h-3 w-3 mr-1" />
                      {priorityBadge.label}
                    </Badge>
                    
                    <Badge variant="outline" className={confidenceBadge.className}>
                      <ConfidenceIcon className="h-3 w-3 mr-1" />
                      {insight.confidence || 'Medium'} Confidence
                    </Badge>
                    
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      <Tag className="h-3 w-3 mr-1" />
                      {insight.category.replace('-', ' ')}
                    </Badge>
                    
                    {insight.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <p className="text-gray-700 text-lg leading-relaxed">
                {insight.summary}
              </p>
            </CardContent>
          </Card>

          {/* Business Insights */}
          {insight.business_insights && (
            <Card className="shadow-sm border-l-4 border-l-violet-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-violet-600" />
                  <span>Business Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="prose prose-gray max-w-none">
                  <EnhancedMarkdown content={insight.business_insights} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {insight.recommendations && insight.recommendations.length > 0 && (
            <Card className="shadow-sm border-l-4 border-l-green-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Strategic Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {insight.recommendations.map((recommendation, index) => (
                    <div
                      key={index}
                      className="p-4 border border-green-200 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 text-gray-800">
                          <EnhancedMarkdown content={recommendation} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unified Evidence Component */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Database className="h-5 w-5 text-violet-600" />
                <span>Supporting Evidence</span>
                <Badge variant="secondary" className="ml-2">
                  Data • Visualize • Debug
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Interactive evidence with data tables, visualizations, and technical details
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              {evidenceData ? (
                <EvidenceTabs
                  evidenceData={evidenceData}
                  title="Analysis Evidence"
                  className="border-0"
                />
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="text-lg font-medium text-gray-600 mb-2">No Evidence Available</div>
                  <div className="text-sm">Evidence data will appear here when available</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Follow-up Section */}
          {insight.followup_query && (
            <Card className="shadow-sm border-t-4 border-t-blue-500">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Follow-up Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-2">Follow-up Query:</div>
                  <div className="text-blue-800">{insight.followup_query}</div>
                </div>
                
                {insight.followup_response && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-2">Analysis Response:</div>
                    <div className="prose prose-sm prose-gray max-w-none">
                      <EnhancedMarkdown content={insight.followup_response} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}