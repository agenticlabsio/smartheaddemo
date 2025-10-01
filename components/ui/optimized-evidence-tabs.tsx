"use client"

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Database, 
  BarChart3, 
  FileText, 
  Copy,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { 
  EvidenceProps, 
  EvidenceData, 
  EvidenceConfig, 
  ChartType, 
  ColumnMetadata, 
  DataType,
  AnalysisType
} from "@/lib/types"

// Lazy load heavy components
import dynamic from 'next/dynamic'

const LazyRechartsComponents = dynamic(() => import('recharts').then(module => ({ default: module })), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="flex items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500" />
        <span className="text-sm">Loading chart...</span>
      </div>
    </div>
  )
})

const LazySyntaxHighlighter = dynamic(() => 
  import('react-syntax-highlighter').then(mod => mod.Prism), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-900 rounded p-4 min-h-[100px] flex items-center justify-center">
      <span className="text-gray-400 text-sm">Loading SQL...</span>
    </div>
  )
})

// Memoized sub-components for performance
const EvidenceHeader = memo(({ 
  title, 
  totalRows, 
  currentPage, 
  totalPages, 
  onPageChange 
}: {
  title: string
  totalRows: number
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) => (
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <CardTitle className="text-lg flex items-center gap-2">
        <Database className="h-5 w-5 text-blue-600" />
        {title}
      </CardTitle>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {totalRows.toLocaleString()} rows
        </Badge>
        {totalPages > 1 && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>
    </div>
  </CardHeader>
))

EvidenceHeader.displayName = 'EvidenceHeader'

const DataTable = memo(({ 
  data, 
  columns, 
  searchTerm, 
  sortColumn, 
  sortDirection,
  onSort 
}: {
  data: any[]
  columns: ColumnMetadata[]
  searchTerm: string
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
}) => {
  const filteredAndSortedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
        }
        
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
        }
      })
    }

    return filtered
  }, [data, searchTerm, sortColumn, sortDirection])

  const formatCellValue = useCallback((value: any, dataType?: DataType): string => {
    if (value === null || value === undefined) return '-'
    
    switch (dataType) {
      case 'currency':
        return typeof value === 'number' ? 
          new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) :
          String(value)
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value)
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : String(value)
      default:
        return typeof value === 'number' ? value.toLocaleString() : String(value)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredAndSortedData.length} of {data.length} rows
        </div>
      </div>
      
      <ScrollArea className="h-[400px] w-full border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={cn(
                    "cursor-pointer hover:bg-gray-50 transition-colors",
                    column.sortable && "select-none"
                  )}
                  onClick={() => column.sortable && onSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <ArrowUpDown className="h-3 w-3 text-gray-400" />
                    )}
                    {sortColumn === column.key && (
                      <span className="text-blue-600 text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, index) => (
              <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                {columns.map((column) => (
                  <TableCell key={column.key} className="font-mono text-sm">
                    {formatCellValue(row[column.key], column.dataType)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
})

DataTable.displayName = 'DataTable'

const ChartVisualization = memo(({ chartData, chartType }: { chartData: any[], chartType: ChartType }) => {
  return (
    <LazyRechartsComponents />
  )
})

ChartVisualization.displayName = 'ChartVisualization'

// Legacy interface for backward compatibility
interface LegacyEvidenceData {
  data?: any[]
  columns?: string[]
  sqlQuery?: string
  chartData?: any[]
  chartType?: 'bar' | 'pie' | 'line'
  insights?: string[]
}

interface LegacyEvidenceTabsProps {
  evidenceData: LegacyEvidenceData
  title?: string
  className?: string
}

type UnifiedEvidenceProps = EvidenceProps | LegacyEvidenceTabsProps

const DEFAULT_CONFIG: Required<EvidenceConfig> = {
  title: 'Analysis Evidence',
  className: '',
  enabledTabs: ['data', 'visualize', 'debug'],
  defaultTab: 'data',
  size: 'normal',
  enableExport: true,
  enableAdvancedFiltering: true,
  customActions: [],
  responsive: {
    hideOnMobile: [],
    collapseOnMobile: false
  }
}

// Main optimized component
export const OptimizedEvidenceTabs = memo((props: UnifiedEvidenceProps) => {
  const isLegacyProps = 'title' in props && 'evidenceData' in props && !('config' in props)
  
  const evidenceData = isLegacyProps 
    ? normalizeEvidenceData((props as LegacyEvidenceTabsProps).evidenceData)
    : (props as EvidenceProps).evidenceData
    
  const config = isLegacyProps
    ? { 
        ...DEFAULT_CONFIG, 
        title: (props as LegacyEvidenceTabsProps).title || DEFAULT_CONFIG.title,
        className: (props as LegacyEvidenceTabsProps).className || DEFAULT_CONFIG.className
      }
    : { ...DEFAULT_CONFIG, ...(props as EvidenceProps).config }

  // Component state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [currentTab, setCurrentTab] = useState(config.defaultTab)

  // Memoized processed data
  const processedColumns = useMemo(() => {
    if (evidenceData.columns) {
      return evidenceData.columns
    }
    return getColumnMetadata(evidenceData.data || [], evidenceData.columnNames)
  }, [evidenceData])

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn])

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab)
  }, [])

  if (!evidenceData.data || evidenceData.data.length === 0) {
    return (
      <Card className={config.className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No evidence data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRows = evidenceData.data.length
  const rowsPerPage = 100
  const totalPages = Math.ceil(totalRows / rowsPerPage)

  return (
    <Card className={cn("w-full", config.className)}>
      <EvidenceHeader
        title={config.title}
        totalRows={totalRows}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      <CardContent>
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="visualize" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              SQL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="mt-4">
            <DataTable
              data={evidenceData.data}
              columns={processedColumns}
              searchTerm={searchTerm}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </TabsContent>

          <TabsContent value="visualize" className="mt-4">
            {evidenceData.chartData ? (
              <ChartVisualization 
                chartData={evidenceData.chartData}
                chartType={evidenceData.chartType || 'bar'}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                <p>No chart data available</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="debug" className="mt-4">
            {evidenceData.sqlQuery ? (
              <LazySyntaxHighlighter
                language="sql"
                style={undefined}
                customStyle={{
                  background: '#1e1e1e',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              >
                {evidenceData.sqlQuery}
              </LazySyntaxHighlighter>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p>No SQL query available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
})

OptimizedEvidenceTabs.displayName = 'OptimizedEvidenceTabs'

// Helper functions
function normalizeEvidenceData(data: LegacyEvidenceData): EvidenceData {
  return {
    data: data.data,
    columnNames: data.columns,
    sqlQuery: data.sqlQuery,
    chartData: data.chartData?.map(item => ({
      name: item.name || String(item[Object.keys(item)[0]]),
      value: item.value || Number(item[Object.keys(item)[1]])
    })),
    chartType: data.chartType,
    insights: data.insights
  }
}

function getColumnMetadata(data: any[], columnNames?: string[]): ColumnMetadata[] {
  if (!data || data.length === 0) return []
  
  const keys = columnNames || Object.keys(data[0] || {})
  
  return keys.map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    dataType: inferDataType(data, key),
    sortable: true,
    searchable: true
  }))
}

function inferDataType(data: any[], key: string): DataType {
  const sample = data.find(row => row[key] !== null && row[key] !== undefined)?.[key]
  
  if (typeof sample === 'number') {
    if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('rate')) {
      return 'percentage'
    }
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost') || 
        key.toLowerCase().includes('price') || key.toLowerCase().includes('spend')) {
      return 'currency'
    }
    return 'number'
  }
  
  if (sample instanceof Date) return 'date'
  if (typeof sample === 'boolean') return 'boolean'
  
  return 'string'
}