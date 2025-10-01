'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Database, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Table, 
  BarChart3, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Copy,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EvidencePreviewProps {
  messageId?: string
  query?: string
  className?: string
}

interface EvidenceData {
  columns: { name: string; type: string }[]
  rows: any[]
  totalRows: number
  sqlQuery: string
  chartable: boolean
  metadata: {
    executionTime: number
    source: string
    queryType: string
  }
}

export function EvidencePreview({ messageId, query, className }: EvidencePreviewProps) {
  const [evidenceData, setEvidenceData] = useState<EvidenceData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const rowsPerPage = 25

  const loadEvidence = async () => {
    if (!messageId && !query) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/message/${messageId}/evidence`)
      const data = await response.json()
      
      if (response.ok) {
        setEvidenceData(data)
        setIsExpanded(true) // Auto-expand to show complete data
      } else {
        setError(data.error || 'Failed to load evidence')
      }
    } catch (error) {
      console.error('Error fetching evidence:', error)
      setError('Failed to load evidence data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (messageId) {
      loadEvidence()
    }
  }, [messageId])

  if (!messageId && !query) return null

  // Calculate business insights from data
  const getBusinessInsights = () => {
    if (!evidenceData?.rows || evidenceData.rows.length === 0) return null
    
    const totalRecords = evidenceData.totalRows || evidenceData.rows.length
    const source = evidenceData.metadata.source
    const queryType = evidenceData.metadata.queryType
    
    // Calculate total amounts if we have financial data
    let totalAmount = 0
    let avgAmount = 0
    const amountColumns = evidenceData.columns.filter(col => 
      col.name.toLowerCase().includes('amount') || 
      col.name.toLowerCase().includes('total') ||
      col.name.toLowerCase().includes('spend')
    )
    
    if (amountColumns.length > 0) {
      const amounts = evidenceData.rows.map(row => {
        const val = row[amountColumns[0].name]
        return typeof val === 'number' ? val : parseFloat(String(val).replace(/[,$]/g, '')) || 0
      }).filter(val => !isNaN(val))
      
      totalAmount = amounts.reduce((sum, val) => sum + val, 0)
      avgAmount = amounts.length > 0 ? totalAmount / amounts.length : 0
    }
    
    return {
      totalRecords,
      totalAmount,
      avgAmount,
      source,
      queryType,
      hasFinancialData: amountColumns.length > 0
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const insights = getBusinessInsights()
  
  // Pagination for complete data display
  const totalPages = evidenceData ? Math.ceil(evidenceData.rows.length / rowsPerPage) : 0
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, evidenceData?.rows.length || 0)
  const currentRows = evidenceData?.rows.slice(startIndex, endIndex) || []

  return (
    <Card className={cn("border-l-4 border-l-blue-500", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-base font-medium text-gray-900">Query Results</CardTitle>
          </div>
          {evidenceData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-3"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
              <p className="text-sm text-gray-600">Loading complete evidence data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Error Loading Evidence</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}


        {/* Raw Data Table */}
        {isExpanded && evidenceData && evidenceData.rows.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">{evidenceData.rows.length} rows</span>
              </div>
            </div>

            <ScrollArea className="h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {evidenceData.columns.map((col, index) => (
                      <th key={index} className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200">
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((row, rowIndex) => (
                    <tr key={startIndex + rowIndex} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                      {evidenceData.columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 text-gray-900">
                          <div className="max-w-48 truncate">
                            {String(row[col.name] || '')}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    Showing {startIndex + 1}-{endIndex} of {evidenceData.rows.length} records
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="h-8 px-3 text-xs"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0 text-xs"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsed Preview */}
        {!isExpanded && evidenceData && evidenceData.rows.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">
              Preview (first 3 rows) - Click expand to view complete {evidenceData.rows.length} records
            </div>
            <div className="space-y-2">
              {evidenceData.rows.slice(0, 3).map((row, index) => (
                <div key={index} className="bg-white p-3 rounded border text-xs">
                  {evidenceData.columns.slice(0, 4).map((col, colIndex) => (
                    <span key={colIndex} className="mr-4 inline-block">
                      <span className="font-medium text-gray-600">{col.name}:</span>
                      <span className="text-gray-900 ml-1">{String(row[col.name] || '')}</span>
                    </span>
                  ))}
                  {evidenceData.columns.length > 4 && (
                    <span className="text-gray-500">...+{evidenceData.columns.length - 4} more columns</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}