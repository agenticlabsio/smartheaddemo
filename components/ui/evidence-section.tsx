'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ChartVisualization } from '@/components/ui/chart-visualization'
import { 
  Database,
  BarChart3,
  FileCheck,
  TrendingUp,
  PieChart,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Calendar,
  User,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Props Interface
interface FinancialMetric {
  label: string
  value: string | number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  format?: 'currency' | 'percentage' | 'number' | 'text'
}

interface DataSource {
  name: string
  description: string
  lastUpdated: string
  recordCount: number
  reliability: 'high' | 'medium' | 'low'
  type: 'primary' | 'secondary' | 'derived'
}

interface Assumption {
  id: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  rationale: string
}

interface ConfidenceMetric {
  category: string
  score: number
  factors: string[]
  methodology: string
}

interface Metadata {
  analysisDate: string
  analyst: string
  version: string
  reviewedBy?: string
  approvalStatus: 'draft' | 'reviewed' | 'approved'
  dataQuality: number
  completeness: number
}

interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'scatter'
  title: string
  data: any[]
  config: any
  insights?: string[]
}

export interface EvidenceSectionProps {
  // Data Overview tab props
  data: any[]
  financialMetrics: FinancialMetric[]
  summaryStats: Record<string, any>
  
  // Visualizations tab props
  chartConfig?: ChartConfig
  messageId?: string
  
  // Sources & References tab props
  dataSources: DataSource[]
  assumptions: Assumption[]
  confidence: ConfidenceMetric[]
  metadata: Metadata
  
  // Component configuration
  className?: string
  defaultTab?: 'overview' | 'visualizations' | 'sources'
}

// Helper Functions
const formatMetricValue = (value: string | number, format?: string): string => {
  if (typeof value === 'string') return value
  
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`
    case 'number':
      return value.toLocaleString()
    default:
      return String(value)
  }
}

const getChangeColor = (changeType?: string) => {
  switch (changeType) {
    case 'positive': return 'text-green-600'
    case 'negative': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const getReliabilityBadge = (reliability: string) => {
  switch (reliability) {
    case 'high':
      return <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">High</Badge>
    case 'medium':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>
    case 'low':
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Low</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

const getConfidenceColor = (score: number) => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function EvidenceSection({
  data,
  financialMetrics,
  summaryStats,
  chartConfig,
  messageId,
  dataSources,
  assumptions,
  confidence,
  metadata,
  className,
  defaultTab = 'overview'
}: EvidenceSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'visualizations' | 'sources'>(defaultTab)

  // Memoized calculations for performance
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.slice(0, 100) // Limit for performance
  }, [data])

  const tableColumns = useMemo(() => {
    if (!processedData.length) return []
    return Object.keys(processedData[0]).slice(0, 8) // Limit columns for readability
  }, [processedData])

  return (
    <Card className={cn("w-full border-l-4 border-l-blue-500 shadow-lg", className)}>
      <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-900">Analysis Evidence</CardTitle>
              <div className="flex items-center gap-4 mt-1">
                <Badge variant="outline" className="text-xs bg-white">
                  {processedData.length.toLocaleString()} records
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {metadata.approvalStatus}
                </Badge>
                <span className="text-xs text-gray-500">
                  Quality: {metadata.dataQuality}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>Analyzed: {metadata.analysisDate}</div>
            <div>By: {metadata.analyst}</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'visualizations' | 'sources')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-blue-50 border-b">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4" />
              Data Overview
            </TabsTrigger>
            <TabsTrigger 
              value="visualizations"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BarChart3 className="h-4 w-4" />
              Visualizations
            </TabsTrigger>
            <TabsTrigger 
              value="sources"
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileCheck className="h-4 w-4" />
              Sources & References
            </TabsTrigger>
          </TabsList>

          {/* Data Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            {/* Key Financial Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Key Financial Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {financialMetrics.map((metric, index) => (
                  <Card key={index} className="border border-blue-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {metric.label}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatMetricValue(metric.value, metric.format)}
                      </div>
                      {metric.change !== undefined && (
                        <div className={cn("text-sm flex items-center gap-1", getChangeColor(metric.changeType))}>
                          {metric.change > 0 ? '↗' : metric.change < 0 ? '↘' : '→'}
                          {metric.change}% vs previous
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                Summary Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(summaryStats).map(([key, value]) => (
                  <div key={key} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-lg font-semibold text-blue-900 mt-1">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Data Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Data Preview
              </h3>
              <div className="border border-blue-200 rounded-lg">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        {tableColumns.map((column) => (
                          <TableHead key={column} className="font-semibold text-blue-900 border-b border-blue-200">
                            {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedData.map((row, index) => (
                        <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                          {tableColumns.map((column) => (
                            <TableCell key={column} className="border-b border-gray-100">
                              {typeof row[column] === 'number' 
                                ? row[column].toLocaleString() 
                                : String(row[column] || '-')
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Interactive Charts & Analytics
              </h3>
              
              {chartConfig ? (
                <div className="space-y-4">
                  <Card className="border-blue-200">
                    <CardHeader className="bg-blue-50 border-b border-blue-200">
                      <CardTitle className="text-blue-900">{chartConfig.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-white">
                          {chartConfig.type} chart
                        </Badge>
                        <Badge variant="secondary">
                          {chartConfig.data?.length || 0} data points
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* This would integrate with your existing chart component */}
                      <div className="h-[400px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                          <p>Chart visualization would render here</p>
                          <p className="text-sm">Integrating with ChartVisualization component</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {chartConfig.insights && chartConfig.insights.length > 0 && (
                    <Card className="border-blue-200">
                      <CardHeader className="bg-blue-50">
                        <CardTitle className="text-blue-900 flex items-center gap-2">
                          <Info className="h-5 w-5" />
                          Chart Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <ul className="space-y-2">
                          {chartConfig.insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : messageId ? (
                <ChartVisualization messageId={messageId} className="border-blue-200" />
              ) : (
                <Card className="border-blue-200">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Visualization Data</h4>
                    <p className="text-gray-500">Chart data or message ID required to display visualizations</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Sources & References Tab */}
          <TabsContent value="sources" className="p-6 space-y-6">
            {/* Data Sources */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Data Sources
              </h3>
              <div className="space-y-3">
                {dataSources.map((source, index) => (
                  <Card key={index} className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{source.name}</h4>
                            {getReliabilityBadge(source.reliability)}
                            <Badge variant={source.type === 'primary' ? 'default' : 'secondary'} className="text-xs">
                              {source.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{source.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Updated: {source.lastUpdated}
                            </span>
                            <span>Records: {source.recordCount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Assumptions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                Key Assumptions
              </h3>
              <div className="space-y-3">
                {assumptions.map((assumption) => (
                  <Card key={assumption.id} className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 flex-1">{assumption.description}</h4>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant={assumption.impact === 'high' ? 'destructive' : assumption.impact === 'medium' ? 'secondary' : 'outline'}>
                            {assumption.impact} impact
                          </Badge>
                          <div className={cn("text-sm font-medium", getConfidenceColor(assumption.confidence))}>
                            {assumption.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{assumption.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Confidence Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Star className="h-5 w-5 text-blue-600" />
                Confidence & Methodology
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {confidence.map((metric, index) => (
                  <Card key={index} className="border border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{metric.category}</h4>
                        <div className={cn("text-lg font-bold", getConfidenceColor(metric.score))}>
                          {metric.score}%
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{metric.methodology}</p>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">Contributing Factors:</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {metric.factors.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0"></span>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Analysis Metadata
              </h3>
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-blue-900">Analyst</div>
                      <div className="text-blue-700 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {metadata.analyst}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Version</div>
                      <div className="text-blue-700">{metadata.version}</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Data Quality</div>
                      <div className={cn("font-medium", getConfidenceColor(metadata.dataQuality))}>
                        {metadata.dataQuality}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">Completeness</div>
                      <div className={cn("font-medium", getConfidenceColor(metadata.completeness))}>
                        {metadata.completeness}%
                      </div>
                    </div>
                    {metadata.reviewedBy && (
                      <div>
                        <div className="font-medium text-blue-900">Reviewed By</div>
                        <div className="text-blue-700">{metadata.reviewedBy}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default EvidenceSection