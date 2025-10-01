"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Database, 
  BarChart3, 
  Code, 
  X, 
  Copy, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Bug,
  FileText
} from 'lucide-react'
import { EvidencePreview } from '@/components/ui/evidence-preview'
import { ChartVisualization } from '@/components/ui/chart-visualization'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { exportToPDF, PDFExportData } from '@/lib/pdf-export'

interface EvidencePanelProps {
  messageId: string
  sqlQuery?: string
  evidenceData?: any
  isLoadingEvidence?: boolean
  onLoadEvidence?: () => void
  className?: string
  reportTitle?: string
  reportSummary?: string
  originalQuery?: string
  insights?: string
  metadata?: {
    executionTime: number
    confidence: number
    modelUsed: string
    timestamp: string
  }
}

// Enhanced CSV download utility with proper formatting
const downloadCSV = (data: any[], filename: string = 'evidence-data') => {
  if (!data || data.length === 0) {
    toast.error('No data available to download')
    return
  }

  try {
    // Convert data to CSV format
    const headers = Object.keys(data[0]).join(',')
    const csvContent = [
      headers,
      ...data.map(row => 
        Object.values(row).map(value => 
          // Properly escape CSV values
          typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
            ? `"${value.replace(/"/g, '""')}"` 
            : String(value || '')
        ).join(',')
      )
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CSV file downloaded successfully')
  } catch (error) {
    console.error('Error downloading CSV:', error)
    toast.error('Failed to download CSV file')
  }
}

export function EvidencePanel({ 
  messageId, 
  sqlQuery, 
  evidenceData, 
  isLoadingEvidence = false,
  onLoadEvidence,
  className = "",
  reportTitle = "Financial Analysis Report",
  reportSummary = "Executive financial data analysis and insights",
  originalQuery = "",
  insights = "",
  metadata = {
    executionTime: 0,
    confidence: 95,
    modelUsed: "Gemini 2.5 Flash",
    timestamp: new Date().toISOString()
  }
}: EvidencePanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('evidence')
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${type} copied to clipboard`)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error(`Failed to copy ${type}`)
    }
  }

  const handlePDFExport = async () => {
    if (!evidenceData && !sqlQuery) {
      toast.error('No data available to export')
      return
    }

    setIsExportingPDF(true)
    
    try {
      const pdfData: PDFExportData = {
        title: reportTitle,
        summary: reportSummary,
        query: originalQuery || 'Financial data analysis query',
        sql: sqlQuery || 'No SQL query available',
        results: evidenceData || [],
        metadata: {
          ...metadata,
          timestamp: metadata.timestamp || new Date().toISOString()
        },
        insights: insights
      }

      await exportToPDF(pdfData)
      toast.success('Executive PDF report exported successfully')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Failed to export PDF report')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen && !evidenceData && onLoadEvidence) {
      onLoadEvidence()
    }
  }

  return (
    <div className={className}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="w-full justify-between text-sm hover:bg-gray-50 border border-gray-200 rounded-lg mb-3"
      >
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-gray-700">Evidence & Results</span>
          <Badge variant="secondary" className="text-xs">
            3 sections
          </Badge>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {/* Expandable Content */}
      {isOpen && (
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-900">Supporting Data & Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePDFExport}
                  disabled={isExportingPDF || (!evidenceData && !sqlQuery)}
                  className="text-violet-600 hover:text-violet-700 border-violet-200 hover:border-violet-300 bg-violet-50 hover:bg-violet-100"
                  title="Export Executive PDF Report"
                >
                  {isExportingPDF ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <FileText className="h-3 w-3 mr-1" />
                  )}
                  {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-600 hover:text-gray-900 h-6 w-6 p-0"
                  title="Close"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="evidence" className="text-sm">
                  <Database className="h-3 w-3 mr-1" />
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-sm">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="debug" className="text-sm">
                  <Bug className="h-3 w-3 mr-1" />
                  Debug
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evidence" className="mt-0">
                <div className="min-h-[200px]">
                  {isLoadingEvidence ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                      <span className="ml-2 text-sm text-gray-600">Loading evidence data...</span>
                    </div>
                  ) : evidenceData ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-gray-600">
                          Raw data output from SQL query execution
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCSV(evidenceData, `${messageId}-evidence`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download CSV
                        </Button>
                      </div>
                      <EvidencePreview messageId={messageId} className="border rounded-lg" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No evidence data available
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="charts" className="mt-0">
                <div className="min-h-[200px]">
                  <div className="text-sm text-gray-600 mb-3">
                    Data visualization and chart analysis
                  </div>
                  <ChartVisualization messageId={messageId} className="border rounded-lg p-4" />
                </div>
              </TabsContent>

              <TabsContent value="debug" className="mt-0">
                <div className="min-h-[200px]">
                  {sqlQuery ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600 font-medium">
                            Generated SQL Query & Debug Information
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(sqlQuery, 'SQL Query')}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy SQL
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const debugInfo = `-- SQL Query Debug Information
-- Generated: ${new Date().toISOString()}
-- Message ID: ${messageId}
-- Query Length: ${sqlQuery.length} characters

${sqlQuery}`
                              copyToClipboard(debugInfo, 'Debug Information')
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Copy Debug
                          </Button>
                        </div>
                      </div>
                      
                      {/* Enhanced SQL Syntax Highlighting */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-800 px-4 py-2 border-b border-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-gray-300 font-mono">SQL Query</span>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-auto">
                          <SyntaxHighlighter
                            language="sql"
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '16px',
                              fontSize: '13px',
                              lineHeight: '1.4',
                              backgroundColor: 'transparent'
                            }}
                            showLineNumbers={true}
                            wrapLines={true}
                          >
                            {sqlQuery}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                      
                      {/* Debug Metadata */}
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-800 font-medium mb-2">Debug Metadata</div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                          <div>
                            <span className="font-medium">Query Length:</span> {sqlQuery.length} characters
                          </div>
                          <div>
                            <span className="font-medium">Generated:</span> {new Date().toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Message ID:</span> {messageId}
                          </div>
                          <div>
                            <span className="font-medium">SQL Type:</span> {sqlQuery.toLowerCase().includes('select') ? 'SELECT Query' : 'Other'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">
                      <Bug className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <div className="mb-2 font-medium">SQL query will be generated automatically</div>
                      <div className="text-xs text-gray-400">Load evidence data to view the generated query and debug information</div>
                      {onLoadEvidence && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onLoadEvidence}
                          className="mt-3 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                        >
                          <Database className="h-3 w-3 mr-1" />
                          Load Evidence Data
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}