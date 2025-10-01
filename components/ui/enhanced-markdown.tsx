'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Target, DollarSign } from 'lucide-react'

interface EnhancedMarkdownProps {
  content: string
  className?: string
}

// Professional color scheme for executive reports
const REPORT_COLORS = {
  strategicRecommendations: 'bg-violet-50 border-violet-200 text-violet-900',
  strategicRecommendationsHeader: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white',
  executiveSummary: 'bg-blue-50 border-blue-200 text-blue-900',
  executiveSummaryHeader: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
  keyMetrics: 'bg-green-50 border-green-200 text-green-900',
  keyMetricsHeader: 'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
  warningsRisks: 'bg-orange-50 border-orange-200 text-orange-900',
  warningsRisksHeader: 'bg-gradient-to-r from-orange-600 to-red-600 text-white',
  insights: 'bg-gray-50 border-gray-200 text-gray-900',
  insightsHeader: 'bg-gradient-to-r from-gray-600 to-slate-600 text-white'
}

// Detect section type based on content
const detectSectionType = (content: string): string => {
  const lowerContent = content.toLowerCase()
  if (lowerContent.includes('strategic') || lowerContent.includes('recommendation') || lowerContent.includes('action')) {
    return 'strategicRecommendations'
  }
  if (lowerContent.includes('executive') || lowerContent.includes('summary')) {
    return 'executiveSummary'
  }
  if (lowerContent.includes('metric') || lowerContent.includes('kpi') || lowerContent.includes('performance')) {
    return 'keyMetrics'
  }
  if (lowerContent.includes('warning') || lowerContent.includes('risk') || lowerContent.includes('alert')) {
    return 'warningsRisks'
  }
  return 'insights'
}

// Get appropriate icon for section type
const getSectionIcon = (sectionType: string) => {
  switch (sectionType) {
    case 'strategicRecommendations':
      return <Lightbulb className="h-5 w-5" />
    case 'executiveSummary':
      return <Target className="h-5 w-5" />
    case 'keyMetrics':
      return <TrendingUp className="h-5 w-5" />
    case 'warningsRisks':
      return <AlertTriangle className="h-5 w-5" />
    default:
      return <CheckCircle className="h-5 w-5" />
  }
}

export function EnhancedMarkdown({ content, className }: EnhancedMarkdownProps) {
  return (
    <div 
      className={cn("prose prose-sm max-w-none font-inter", className)}
      style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Enhanced table styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-900 border-b whitespace-nowrap">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50">
              {children}
            </tr>
          ),
          // Professional executive headings with color coding
          h1: ({ children }) => {
            const content = String(children)
            const sectionType = detectSectionType(content)
            const colors = REPORT_COLORS[sectionType as keyof typeof REPORT_COLORS] || REPORT_COLORS.insights
            const headerColors = REPORT_COLORS[`${sectionType}Header` as keyof typeof REPORT_COLORS] || REPORT_COLORS.insightsHeader
            
            return (
              <div className="mb-6 mt-8 first:mt-0">
                <div className={cn("rounded-t-lg px-6 py-4 flex items-center gap-3", headerColors)}>
                  {getSectionIcon(sectionType)}
                  <h1 className="text-2xl font-bold font-inter m-0" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
                    {children}
                  </h1>
                </div>
                <div className={cn("h-1 rounded-b-lg", colors.split(' ')[0])}></div>
              </div>
            )
          },
          h2: ({ children }) => {
            const content = String(children)
            const sectionType = detectSectionType(content)
            const colors = REPORT_COLORS[sectionType as keyof typeof REPORT_COLORS] || REPORT_COLORS.insights
            const headerColors = REPORT_COLORS[`${sectionType}Header` as keyof typeof REPORT_COLORS] || REPORT_COLORS.insightsHeader
            
            return (
              <div className="mb-5 mt-7 first:mt-0">
                <div className={cn("rounded-t-lg px-5 py-3 flex items-center gap-2", headerColors)}>
                  {getSectionIcon(sectionType)}
                  <h2 className="text-xl font-semibold font-inter m-0" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
                    {children}
                  </h2>
                </div>
                <div className={cn("h-0.5 rounded-b-lg", colors.split(' ')[0])}></div>
              </div>
            )
          },
          h3: ({ children }) => {
            const content = String(children)
            const sectionType = detectSectionType(content)
            const colors = REPORT_COLORS[sectionType as keyof typeof REPORT_COLORS] || REPORT_COLORS.insights
            
            return (
              <div className={cn("rounded-lg border px-4 py-3 mb-4 mt-5", colors)}>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-current rounded-full opacity-60"></div>
                  <h3 className="text-lg font-medium font-inter m-0" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
                    {children}
                  </h3>
                </div>
              </div>
            )
          },
          h4: ({ children }) => {
            const content = String(children)
            const sectionType = detectSectionType(content)
            const isStrategic = sectionType === 'strategicRecommendations'
            
            return (
              <h4 className={cn(
                "text-base font-medium mb-3 mt-4 font-inter flex items-center gap-2",
                isStrategic ? "text-violet-800" : "text-gray-800"
              )} style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
                {isStrategic && <Lightbulb className="h-4 w-4 text-violet-600" />}
                {children}
              </h4>
            )
          },
          p: ({ children }) => (
            <p className="text-sm text-gray-700 leading-relaxed mb-3 font-inter" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
              {children}
            </p>
          ),
          // Professional executive lists with enhanced bullet styling
          ul: ({ children }) => (
            <ul className="space-y-3 mb-6 text-sm text-gray-700 font-inter" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-3 mb-6 text-sm text-gray-700 font-inter" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => {
            // Detect if this is a strategic recommendation
            const content = String(children)
            const isStrategic = content.toLowerCase().includes('action') || 
                              content.toLowerCase().includes('recommend') ||
                              content.toLowerCase().includes('strategy') ||
                              content.toLowerCase().includes('implement')
            
            return (
              <li className={cn(
                "leading-relaxed font-inter flex items-start gap-3 py-2 px-3 rounded-lg",
                isStrategic 
                  ? "bg-violet-50 border-l-4 border-violet-400 text-violet-900" 
                  : "hover:bg-gray-50"
              )} style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
                <div className={cn(
                  "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                  isStrategic ? "bg-violet-500" : "bg-blue-500"
                )}></div>
                <div className="flex-1">{children}</div>
                {isStrategic && <Lightbulb className="h-4 w-4 text-violet-600 flex-shrink-0 mt-1" />}
              </li>
            )
          },
          // Enhanced code blocks
          code: ({ children, ...props }) => {
            const inline = props.node?.tagName !== 'pre'
            return inline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">
                {children}
              </code>
            ) : (
              <code className="block bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-800 overflow-x-auto">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-4">
              {children}
            </pre>
          ),
          // Enhanced blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg mb-4 italic text-sm text-blue-800">
              {children}
            </blockquote>
          ),
          // Enhanced links
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 hover:text-blue-800 underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Executive-level number formatting with enhanced visual hierarchy
          span: ({ children }) => {
            const content = String(children)
            // Enhanced pattern for financial numbers, percentages, and metrics
            const isFinancialNumber = /^[\$€£¥]?[\d,]+\.?\d*[%]?$/.test(content.replace(/\s/g, ''))
            const isPercentage = content.includes('%')
            const isCurrency = /^[\$€£¥]/.test(content)
            const isLargeNumber = isCurrency && parseFloat(content.replace(/[^\d.]/g, '')) > 1000000
            
            if (isFinancialNumber) {
              return (
                <span className={cn(
                  "font-mono font-semibold px-2 py-1 rounded-md inline-flex items-center gap-1",
                  isLargeNumber 
                    ? "bg-green-100 text-green-800 border border-green-200" 
                    : isCurrency 
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : isPercentage 
                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                )}>
                  {isCurrency && <DollarSign className="h-3 w-3" />}
                  {children}
                </span>
              )
            }
            return <span>{children}</span>
          },
          // Strong text with Inter font
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 font-inter" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
              {children}
            </strong>
          ),
          // Emphasis with Inter font
          em: ({ children }) => (
            <em className="italic text-gray-700 font-inter" style={{ fontFamily: 'var(--font-inter), "Inter", ui-sans-serif, system-ui, sans-serif' }}>
              {children}
            </em>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}