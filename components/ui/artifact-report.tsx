"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, TrendingUpIcon, FileTextIcon, CheckCircleIcon } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { cn } from "@/lib/utils"

interface ArtifactReportProps {
  title: string
  content: string
  metadata?: {
    generatedAt?: string
    executionTime?: string
    confidence?: number
    model?: string
  }
  type?: 'financial' | 'analysis' | 'summary' | 'recommendation'
  className?: string
}

export function ArtifactReport({ 
  title, 
  content, 
  metadata, 
  type = 'financial',
  className 
}: ArtifactReportProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'financial': return <TrendingUpIcon className="h-5 w-5 text-blue-600" />
      case 'analysis': return <FileTextIcon className="h-5 w-5 text-purple-600" />
      case 'summary': return <CheckCircleIcon className="h-5 w-5 text-green-600" />
      default: return <FileTextIcon className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeBadge = () => {
    const badges = {
      financial: { label: 'Financial Report', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      analysis: { label: 'Data Analysis', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      summary: { label: 'Executive Summary', color: 'bg-green-100 text-green-800 border-green-200' },
      recommendation: { label: 'Recommendations', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    }
    return badges[type] || { label: 'Report', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }

  return (
    <div className={cn(
      "relative border border-gray-200 bg-white shadow-xl rounded-2xl overflow-hidden",
      "max-w-5xl mx-auto my-8",
      "transition-all duration-200 hover:shadow-2xl",
      className
    )}>
      {/* Artifact Header - Claude-style */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100 px-6 py-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              {getTypeIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                {title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge className={`px-3 py-1 font-medium border ${getTypeBadge().color}`}>
                  {getTypeBadge().label}
                </Badge>
                {metadata?.confidence && (
                  <Badge 
                    className={`px-3 py-1 font-medium border ${
                      metadata.confidence > 0.85 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : metadata.confidence > 0.7
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}
                  >
                    {Math.round(metadata.confidence * 100)}% Confidence
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Metadata Panel */}
          {metadata && (
            <div className="hidden sm:block text-right">
              <div className="text-xs text-gray-500 space-y-1">
                {metadata.generatedAt && (
                  <div className="flex items-center gap-2 justify-end">
                    <CalendarIcon className="h-3 w-3" />
                    <span>{new Date(metadata.generatedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {metadata.executionTime && (
                  <div className="flex items-center gap-2 justify-end">
                    <span>⚡</span>
                    <span>{metadata.executionTime}</span>
                  </div>
                )}
                {metadata.model && (
                  <div className="flex items-center gap-2 justify-end">
                    <span>🤖</span>
                    <span className="font-mono text-xs">{metadata.model}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Content Container */}
      <div className="bg-white">
        <ScrollArea className="h-[700px] w-full">
          <div className="px-8 py-6">
            <div className="prose prose-lg prose-gray max-w-none">
              <ReactMarkdown
                components={{
                // Custom styling for markdown elements
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-black mb-4 border-b border-grey-200 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-black mb-3 mt-6">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-medium text-black mb-2 mt-4">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-700 mb-3 leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2 mb-4 ml-4">
                    {children}
                  </ul>
                ),
                li: ({ children }) => (
                  <li className="text-gray-700 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span className="flex-1">{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-black">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-gray-600 italic">
                    {children}
                  </em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-purple-200 pl-4 py-2 bg-purple-50/50 text-gray-700 italic my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-left font-semibold text-black">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border-b border-gray-100 px-4 py-2 text-gray-700">
                    {children}
                  </td>
                ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

// Example usage component for testing
export function ArtifactReportExample() {
  const sampleContent = `## Executive Summary

• **Total Supplier Spending**: $12.5M across 247 active suppliers
• **Top 3 Suppliers**: Represent **66%** of total procurement spend  
• **Cost Optimization Potential**: **$1.8M** in identified savings opportunities

### Key Financial Metrics

• **Average Invoice Size**: $42,850 
• **Payment Terms Compliance**: **94%** within agreed terms
• **Category Concentration Risk**: High exposure in *Manufacturing* (45% of spend)

### Strategic Recommendations

• **Immediate Actions** *(Next 30 days)*:
  • Renegotiate terms with Supplier A for volume discounts
  • Implement competitive sourcing for IT services category
  • Review payment terms optimization opportunities

• **Medium-term Initiatives** *(Next 90 days)*:
  • Diversify supplier base in high-concentration categories  
  • Establish preferred supplier agreements for recurring services
  • Deploy automated invoice processing for efficiency gains

### Risk Assessment

• **Supplier Concentration**: **High** - Top supplier represents 34% of total spend
• **Geographic Risk**: **Medium** - 67% of suppliers in single region  
• **Performance Risk**: **Low** - 98% supplier performance score average

### Next Steps

1. **Executive Review**: Schedule C-suite presentation of findings
2. **Procurement Strategy**: Implement recommended sourcing initiatives  
3. **Monitoring**: Establish monthly supplier performance dashboards`

  return (
    <ArtifactReport
      title="Q4 Supplier Spending Analysis"
      content={sampleContent}
      type="financial"
      metadata={{
        generatedAt: new Date().toISOString(),
        executionTime: "2.3s",
        confidence: 0.94,
        model: "GPT-5 Mini"
      }}
    />
  )
}