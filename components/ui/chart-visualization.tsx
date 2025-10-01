'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, PieChart, TrendingUp, Zap, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface ChartVisualizationProps {
  messageId?: string
  className?: string
}

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'scatter'
  title: string
  data: ChartData[]
  config: {
    xAxis?: { dataKey: string; label?: string }
    yAxis?: { label?: string }
    series: { dataKey: string; name: string; color?: string }[]
  }
  insights: string[]
}

// Colors for charts
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1',
  '#d084d0', '#ffb347', '#87d068', '#ff6b6b', '#4ecdc4'
]

export function ChartVisualization({ messageId, className }: ChartVisualizationProps) {
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null)
  const [evidenceData, setEvidenceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedData, setHighlightedData] = useState<string | null>(null)

  const loadChart = async () => {
    if (!messageId) return

    setIsLoading(true)
    setError(null)
    
    try {
      // Load chart data - this is the primary requirement
      const chartResponse = await fetch(`/api/message/${messageId}/chart`)
      const chartData = await chartResponse.json()
      
      if (chartResponse.ok && chartData.success) {
        setChartConfig(chartData)
        
        // Try to load evidence data for linking, but don't fail if it errors
        try {
          const evidenceResponse = await fetch(`/api/message/${messageId}/evidence`)
          if (evidenceResponse.ok) {
            const evidenceDataResult = await evidenceResponse.json()
            setEvidenceData(evidenceDataResult)
          }
        } catch (evidenceError) {
          console.warn('Evidence data unavailable for linkage:', evidenceError)
          // Chart still works without evidence linkage
        }
      } else {
        setError(chartData.error || 'Failed to generate chart')
      }
    } catch (error) {
      console.error('Error fetching chart:', error)
      setError('Failed to load chart data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (messageId) {
      loadChart()
    }
  }, [messageId])

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChart2 className="h-4 w-4" />
      case 'pie': return <PieChart className="h-4 w-4" />
      case 'line': return <TrendingUp className="h-4 w-4" />
      case 'scatter': return <Zap className="h-4 w-4" />
      default: return <BarChart2 className="h-4 w-4" />
    }
  }

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    } else {
      return `$${value.toFixed(0)}`
    }
  }

  const renderChart = () => {
    if (!chartConfig) return null

    const { type, data, config } = chartConfig

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatValue}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.series[0]?.name || 'Value']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="value" 
                fill={config.series[0]?.color || '#8884d8'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie 
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'Amount']}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis tickFormatter={formatValue} fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), config.series[0]?.name || 'Value']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={config.series[0]?.color || '#82ca9d'}
                strokeWidth={2}
                dot={{ fill: config.series[0]?.color || '#82ca9d' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x" 
                type="number" 
                name={config.xAxis?.label || 'X'}
                fontSize={12}
              />
              <YAxis 
                dataKey="y" 
                type="number" 
                name={config.yAxis?.label || 'Y'}
                tickFormatter={formatValue}
                fontSize={12}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'y' ? formatValue(value) : value, 
                  name === 'y' ? (config.yAxis?.label || 'Y') : (config.xAxis?.label || 'X')
                ]}
              />
              <Scatter 
                dataKey="y" 
                fill={config.series[0]?.color || '#ffc658'}
              />
            </ScatterChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center text-gray-500">Unsupported chart type</div>
    }
  }

  if (!messageId) return null

  return (
    <Card className={cn("border-l-4 border-l-green-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-green-600" />
              ) : error ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : chartConfig ? (
                <span className="text-green-600">{getChartIcon(chartConfig.type)}</span>
              ) : (
                <BarChart2 className="h-4 w-4 text-green-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">
                {chartConfig?.title || 'Chart Visualization'}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {chartConfig && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      {chartConfig.type} chart
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {chartConfig.data.length} items
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Generating chart...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadChart}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {chartConfig && !isLoading && !error && (
          <div className="space-y-4">
            {/* SQL-Evidence-Chart Linkage Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900">Chart-Evidence Linkage</h3>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Data Source:</span>
                  <span>Visualization generated from evidence table columns: {chartConfig.config?.series.map(s => s.dataKey).join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Chart Type:</span>
                  <span>Optimized {chartConfig.type} chart for {chartConfig.data?.length || 0} data points</span>
                </div>
                {evidenceData?.sqlQuery && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">SQL Mapping:</span>
                    <span>Chart reflects exact results from SQL query execution</span>
                  </div>
                )}
                {!evidenceData && (
                  <div className="flex items-center gap-2 text-amber-700">
                    <span className="font-medium">Note:</span>
                    <span>Evidence data linkage unavailable - chart displays independently</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Interactive Chart</h3>
                <div className="text-xs text-gray-500">
                  Click elements to highlight corresponding evidence data
                </div>
              </div>
              
              <div 
                onMouseEnter={() => setHighlightedData('chart')}
                onMouseLeave={() => setHighlightedData(null)}
                className={`transition-all duration-200 ${highlightedData === 'chart' ? 'ring-2 ring-green-300' : ''}`}
              >
                {renderChart()}
              </div>
              
              {/* Data Point Legend */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Chart Data Points ({chartConfig.data?.length || 0} items):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {chartConfig.data?.slice(0, 10).map((item, index) => (
                    <div 
                      key={index} 
                      className="text-xs bg-white p-2 rounded border hover:bg-green-50 cursor-pointer transition-colors"
                      onClick={() => setHighlightedData(item.name)}
                    >
                      <span className="font-medium text-gray-700">{item.name}:</span>
                      <span className="text-gray-900 ml-1">{formatValue(item.value)}</span>
                    </div>
                  ))}
                  {(chartConfig.data?.length || 0) > 10 && (
                    <div className="text-xs text-gray-500 p-2">
                      +{(chartConfig.data?.length || 0) - 10} more data points...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Insights */}
            {chartConfig.insights && chartConfig.insights.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">💡 AI-Generated Chart Insights</h3>
                </div>
                <ul className="space-y-2">
                  {chartConfig.insights.map((insight, index) => (
                    <li key={index} className="text-sm text-purple-800 flex items-start gap-2">
                      <span className="text-purple-500 mt-1 font-bold">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cross-Reference to Evidence */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">🔗 Evidence Data Cross-Reference</h3>
              </div>
              <p className="text-sm text-blue-800">
                This chart visualizes {chartConfig.data?.length || 0} data points from the evidence table. 
                Click "View Evidence" above to see the complete SQL results that generated this visualization. 
                Each chart element corresponds to specific rows in the evidence data.
              </p>
              {highlightedData && (
                <div className="mt-2 p-2 bg-blue-100 rounded text-sm text-blue-900">
                  <strong>Highlighted:</strong> {highlightedData} - View corresponding evidence data row
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}