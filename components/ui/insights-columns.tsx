"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpDown, 
  ExternalLink, 
  TrendingUp, 
  AlertTriangle,
  Target,
  BarChart3,
  Eye,
  Database
} from "lucide-react"
import { SharedQuery } from "@/lib/shared-queries"
import { SortableHeader } from "@/components/ui/enhanced-data-table"

// Intelligent query generator for Deep Dive functionality
const generateDeepDiveQuery = (insight: SharedQuery) => {
  const baseQuery = insight.query || 'Analyze this financial insight'
  const category = insight.category || 'general'
  const impact = insight.impact
  const priority = insight.priority
  
  // Generate contextual query based on insight metadata
  let enhancedQuery = baseQuery
  
  // Add context based on priority and impact
  if (priority === 'Critical' && impact) {
    enhancedQuery += ` Focus on the ${impact} financial impact and provide immediate action items.`
  } else if (priority === 'High') {
    enhancedQuery += ` Provide detailed analysis with specific recommendations for improvement.`
  }
  
  // Add category-specific context
  const categoryContexts = {
    'variance': ' Include variance analysis with statistical confidence intervals and root cause identification.',
    'quarterly': ' Show quarterly trends with forecasting and seasonal adjustments.',
    'accounts': ' Analyze account-level details with transaction patterns and risk assessment.',
    'vendor-risk': ' Focus on vendor risk scores, concentration analysis, and mitigation strategies.',
    'cost-groups': ' Break down by cost group categories with optimization opportunities.',
  }
  
  const categoryContext = categoryContexts[category.toLowerCase() as keyof typeof categoryContexts]
  if (categoryContext) {
    enhancedQuery += categoryContext
  }
  
  // Add follow-up suggestions based on business insights (null-safe)
  if (insight.business_insights && insight.business_insights.length > 0) {
    enhancedQuery += ` Also provide 3 specific follow-up questions based on these business insights: ${insight.business_insights.substring(0, 200)}...`
  }
  
  return enhancedQuery
}

// Generate additional context for the chat
const generateChatContext = (insight: SharedQuery) => {
  return {
    insightId: insight.id,
    title: insight.title || 'Financial Insight',
    category: insight.category,
    priority: insight.priority,
    impact: insight.impact,
    confidence: insight.confidence,
    summary: insight.summary,
    businessInsights: insight.business_insights,
    recommendations: insight.recommendations,
    followupQuery: insight.followup_query,
    evidence: insight.evidence,
    tags: insight.tags || [],
    autoExecute: true // Flag to auto-execute the query
  }
}

// Evidence data viewer function
const handleViewEvidence = (insight: SharedQuery) => {
  // Determine which dataset is most relevant to this insight's evidence
  let targetDataset = ''
  let searchQuery = ''
  
  if (insight.evidence) {
    // Check if this is Coupa financial data
    if (insight.tags?.some(tag => tag.toLowerCase().includes('coupa')) || 
        insight.category?.toLowerCase().includes('coupa') ||
        insight.evidence.variance_categories || 
        insight.evidence.cost_group_summary) {
      targetDataset = 'coupa-financial'
      searchQuery = 'Coupa Financial Data'
    }
    // Check if this is Baan procurement data
    else if (insight.tags?.some(tag => tag.toLowerCase().includes('baan')) ||
             insight.category?.toLowerCase().includes('baan') ||
             insight.evidence.top_variance_centers ||
             insight.evidence.supplier_data) {
      targetDataset = 'baan-procurement'
      searchQuery = 'Baan Procurement Data'
    }
    // Default to general financial search
    else {
      searchQuery = insight.title || 'Financial Data'
    }
  }
  
  // Create URL parameters for data page
  const urlParams = new URLSearchParams({
    ...(searchQuery && { search: searchQuery }),
    ...(targetDataset && { dataset: targetDataset }),
    evidenceId: insight.id?.toString() || '',
    source: 'insights-center'
  })
  
  // Navigate to data page with evidence context
  window.location.href = `/data?${urlParams.toString()}`
}

// Priority color mapping
const priorityColors = {
  "Critical": "destructive",
  "High": "secondary", 
  "Medium": "outline",
  "Low": "default"
} as const

// Confidence color mapping
const confidenceColors = {
  "High": "default",
  "Medium": "secondary",
  "Low": "outline"
} as const

export const insightsColumns: ColumnDef<SharedQuery>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader title="Insight Title" column={column} />,
    cell: ({ row }) => {
      const insight = row.original
      const IconComponent = insight.icon
      
      return (
        <div className="flex items-start space-x-3 max-w-md">
          <div className="flex-shrink-0 mt-1">
            <IconComponent className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-sm leading-5 text-gray-900">
              {insight.title}
            </div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {insight.summary}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <SortableHeader title="Category" column={column} />,
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.getValue("category")}
      </Badge>
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader title="Priority" column={column} />,
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <Badge 
          variant={priorityColors[priority as keyof typeof priorityColors] || "default"}
          className="font-medium"
        >
          {priority}
        </Badge>
      )
    },
  },
  {
    accessorKey: "impact",
    header: ({ column }) => <SortableHeader title="Financial Impact" column={column} />,
    cell: ({ row }) => {
      const impact = row.getValue("impact") as string
      const isNegative = impact?.includes('-')
      
      return (
        <div className={`font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
          {impact}
        </div>
      )
    },
  },
  {
    accessorKey: "confidence",
    header: ({ column }) => <SortableHeader title="Confidence" column={column} />,
    cell: ({ row }) => {
      const confidence = row.getValue("confidence") as string
      return (
        <Badge 
          variant={confidenceColors[confidence as keyof typeof confidenceColors] || "default"}
        >
          {confidence}
        </Badge>
      )
    },
  },
  {
    accessorKey: "dimensions",
    header: "Dimensions",
    cell: ({ row }) => {
      const dimensions = row.original.dimensions
      const allDimensions = []
      
      if (dimensions?.account) allDimensions.push(...dimensions.account.slice(0, 2))
      if (dimensions?.costCenter) allDimensions.push(...dimensions.costCenter.slice(0, 1))
      if (dimensions?.facility) allDimensions.push(...dimensions.facility.slice(0, 1))
      
      return (
        <div className="flex flex-wrap gap-1">
          {allDimensions.slice(0, 3).map((dim, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs px-1 py-0.5">
              {dim}
            </Badge>
          ))}
          {allDimensions.length > 3 && (
            <Badge variant="outline" className="text-xs px-1 py-0.5">
              +{allDimensions.length - 3}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "governance",
    header: "Governance",
    cell: ({ row }) => {
      const governance = row.original.dimensions?.governance
      
      if (!governance || governance.length === 0) {
        return <span className="text-gray-400 text-sm">-</span>
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {governance.slice(0, 2).map((item, idx) => (
            <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5">
              {item}
            </Badge>
          ))}
          {governance.length > 2 && (
            <Badge variant="outline" className="text-xs px-1 py-0.5">
              +{governance.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "financialMetrics",
    header: "Key Metrics",
    cell: ({ row }) => {
      const insight = row.original
      const metrics = []
      
      // Extract financial impact from actual data
      if (insight.impact) {
        metrics.push({ 
          label: "Impact", 
          value: insight.impact, 
          color: insight.impact.includes('-') ? "red" : "green" 
        })
      }
      
      // Add confidence level
      if (insight.confidence) {
        metrics.push({ 
          label: "Confidence", 
          value: insight.confidence, 
          color: insight.confidence === 'High' ? "green" : insight.confidence === 'Medium' ? "orange" : "red" 
        })
      }
      
      // Extract variance data from evidence if available
      if (insight.evidence?.variance_categories?.Extreme?.spend_percentage) {
        const variancePercent = insight.evidence.variance_categories.Extreme.spend_percentage
        metrics.push({ 
          label: "Variance", 
          value: `${variancePercent}%`, 
          color: "orange" 
        })
      }
      
      // Extract spend data from evidence
      if (insight.evidence?.top_variance_centers?.length > 0) {
        const topSpend = insight.evidence.top_variance_centers[0].total_spend
        const formatted = new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(topSpend)
        metrics.push({ 
          label: "Top Spend", 
          value: formatted, 
          color: "purple" 
        })
      }
      
      return (
        <div className="flex flex-col gap-1 min-w-[120px]">
          {metrics.slice(0, 2).map((metric, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{metric.label}:</span>
              <span className={`font-medium text-${metric.color}-600`}>{metric.value}</span>
            </div>
          ))}
          {metrics.length === 0 && (
            <span className="text-gray-400 text-xs">No metrics</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "dataContext",
    header: "Data Context",
    cell: ({ row }) => {
      const insight = row.original
      const context = []
      
      // Extract actual time period from query content or evidence
      let timePeriod = null
      if (insight.query?.includes('12 months')) {
        timePeriod = "12M Rolling"
      } else if (insight.query?.includes('quarterly') || insight.category === 'quarterly') {
        timePeriod = "Quarterly"
      } else if (insight.query?.includes('Q4 2024') || insight.followup_response?.includes('Q4 2024')) {
        timePeriod = "Q4 2024"
      } else if (insight.query?.includes('month-to-month')) {
        timePeriod = "Monthly"
      }
      
      if (timePeriod) {
        context.push({ label: "Period", value: timePeriod, icon: "📅" })
      }
      
      // Data source from tags (actual data source identification)
      const dataSource = insight.tags?.find(tag => 
        tag.toLowerCase().includes('coupa') || 
        tag.toLowerCase().includes('erp') || 
        tag.toLowerCase().includes('financial')
      )
      if (dataSource) {
        context.push({ 
          label: "Source", 
          value: dataSource.includes('Coupa') ? "Coupa" : "ERP", 
          icon: "💾" 
        })
      }
      
      // Primary facility from dimensions (real facility data)
      const facility = insight.dimensions?.facility?.[0]
      if (facility) {
        context.push({ 
          label: "Facility", 
          value: facility.replace('Asheville', 'Avl'), 
          icon: "🏭" 
        })
      }
      
      // Data completeness indicator from evidence
      if (insight.evidence && Object.keys(insight.evidence).length > 0) {
        context.push({ 
          label: "Evidence", 
          value: "Available", 
          icon: "📊" 
        })
      }
      
      return (
        <div className="flex flex-col gap-1 min-w-[140px]">
          {context.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs">
              <span className="text-xs">{item.icon}</span>
              <span className="text-gray-500">{item.label}:</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
          {context.length === 0 && (
            <span className="text-gray-400 text-xs">No context</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "riskFactors",
    header: "Risk & Quality",
    cell: ({ row }) => {
      const insight = row.original
      const factors = []
      
      // Risk level based on priority and governance
      const riskLevel = insight.priority === 'Critical' ? 'High' : 
                       insight.priority === 'High' ? 'Medium' : 'Low'
      factors.push({ 
        label: "Risk", 
        value: riskLevel, 
        color: riskLevel === 'High' ? 'red' : riskLevel === 'Medium' ? 'orange' : 'green' 
      })
      
      // Governance compliance from dimensions
      const hasRiskGovernance = insight.dimensions?.governance?.some(g => 
        g.toLowerCase().includes('risk') || g.toLowerCase().includes('critical')
      )
      factors.push({ 
        label: "Governance", 
        value: hasRiskGovernance ? "Risk" : "Standard", 
        color: hasRiskGovernance ? 'red' : 'green' 
      })
      
      // Data confidence as quality indicator
      if (insight.confidence) {
        factors.push({ 
          label: "Confidence", 
          value: insight.confidence, 
          color: insight.confidence === 'High' ? 'green' : 
                insight.confidence === 'Medium' ? 'orange' : 'red' 
        })
      }
      
      return (
        <div className="flex flex-col gap-1 min-w-[100px]">
          {factors.map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{factor.label}:</span>
              <span className={`font-medium text-${factor.color}-600`}>{factor.value}</span>
            </div>
          ))}
        </div>
      )
    },
  },
  {
    accessorKey: "businessTags",
    header: "Business Context",
    cell: ({ row }) => {
      const insight = row.original
      const businessTags = []
      
      // Primary spend categories from dimensions
      if (insight.dimensions?.spendCategory) {
        businessTags.push(...insight.dimensions.spendCategory.slice(0, 2))
      }
      
      // Key commodity categories from dimensions  
      if (insight.dimensions?.commodity && businessTags.length < 3) {
        const remaining = 3 - businessTags.length
        businessTags.push(...insight.dimensions.commodity.slice(0, remaining))
      }
      
      // Core account types from dimensions
      if (insight.dimensions?.account && businessTags.length < 3) {
        const remaining = 3 - businessTags.length
        const accounts = insight.dimensions.account.slice(0, remaining).map(acc => 
          acc.replace('Professional', 'Prof').replace('Fees', '').trim()
        )
        businessTags.push(...accounts)
      }
      
      // Category-based context
      if (businessTags.length < 3) {
        if (insight.category === 'vendor-risk') businessTags.push("Vendor Risk")
        if (insight.category === 'variance') businessTags.push("Volatility")
        if (insight.category === 'quarterly') businessTags.push("Trends")
      }
      
      return (
        <div className="flex flex-wrap gap-1 min-w-[120px]">
          {businessTags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0.5">
              {tag}
            </Badge>
          ))}
          {businessTags.length > 3 && (
            <Badge variant="outline" className="text-xs px-1 py-0.5">
              +{businessTags.length - 3}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const insight = row.original
      
      return (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/insights-center/${insight.id}`}
            className="h-8 px-2"
            title="View insight details"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            data-insight-id={insight.id}
            onClick={() => {
              // Enhanced Deep Dive with intelligent query generation
              const enhancedQuery = generateDeepDiveQuery(insight)
              const chatContext = generateChatContext(insight)
              
              // Add loading state
              const button = document.querySelector(`[data-insight-id="${insight.id}"]`) as HTMLButtonElement
              if (button) {
                button.disabled = true
                button.innerHTML = '<svg class="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading...'
              }
              
              // Create URL with enhanced parameters
              const urlParams = new URLSearchParams({
                query: enhancedQuery,
                context: JSON.stringify(chatContext),
                source: 'insights-center'
              })
              
              // Navigate to chat with pre-populated query and context
              setTimeout(() => {
                window.location.href = `/chat?${urlParams.toString()}`
              }, 300)
            }}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            title="Deep dive analysis in chat"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Deep Dive
          </Button>
          {insight.evidence && Object.keys(insight.evidence).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewEvidence(insight)}
              className="h-8 px-3 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              title="View underlying data for this insight"
            >
              <Database className="h-4 w-4 mr-1" />
              View Data
            </Button>
          )}
        </div>
      )
    },
  },
]

// Filter options for insights table
export const insightsFilterOptions = [
  {
    id: "priority",
    title: "Priority",
    options: [
      { label: "Critical", value: "Critical", icon: AlertTriangle },
      { label: "High", value: "High", icon: TrendingUp },
      { label: "Medium", value: "Medium", icon: Target },
      { label: "Low", value: "Low", icon: BarChart3 },
    ],
  },
  {
    id: "category",
    title: "Category",
    options: [
      { label: "Variance", value: "variance" },
      { label: "Quarterly", value: "quarterly" },
      { label: "Accounts", value: "accounts" },
      { label: "Trajectory", value: "trajectory" },
      { label: "Efficiency", value: "efficiency" },
      { label: "Forecasting", value: "forecasting" },
    ],
  },
  {
    id: "confidence",
    title: "Confidence",
    options: [
      { label: "High", value: "High" },
      { label: "Medium", value: "Medium" },
      { label: "Low", value: "Low" },
    ],
  },
]