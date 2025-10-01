'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/ui/sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EnhancedDataTable } from '@/components/ui/enhanced-data-table'
import { insightsColumns, insightsFilterOptions } from '@/components/ui/insights-columns'
import { sharedQueries } from '@/lib/shared-queries'
import { 
  Search, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign,
  Target,
  Clock,
  Users,
  Eye,
  BarChart3,
  Lightbulb,
  Shield,
  Zap,
  PieChart,
  Activity,
  Database,
  FileText,
  BarChart2,
  HelpCircle,
  Percent,
  TrendingDown,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Star
} from 'lucide-react'

// Use actual insights data from shared queries
const insightsData = sharedQueries

const categories = ["All", "Variance", "Quarterly", "Accounts", "Trajectory", "Efficiency", "Forecasting", "Pricing", "Temporal", "Cost-Groups", "Vendor-Risk", "Anomalies", "Seasonal", "Transaction-Volume", "Category-Distribution", "Activity-Levels", "After-Hours", "Payment-Frequency", "Cross-Entity", "Growth-Patterns", "Entry-Level", "Medium-Level", "Advanced-Strategic", "Data-Foundation"]

const priorityColors = {
  "Critical": "bg-red-100 text-red-800 border-red-200",
  "High": "bg-orange-100 text-orange-800 border-orange-200", 
  "Medium": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Low": "bg-green-100 text-green-800 border-green-200"
}

// Multi-dimensional governance labels
const governanceLabels = {
  compliance: {
    "SOX-Compliant": "bg-green-100 text-green-800 border-green-200",
    "GDPR-Ready": "bg-blue-100 text-blue-800 border-blue-200", 
    "Audit-Required": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Non-Compliant": "bg-red-100 text-red-800 border-red-200"
  },
  approval: {
    "CFO-Approved": "bg-violet-100 text-violet-800 border-violet-200",
    "CPO-Approved": "bg-indigo-100 text-indigo-800 border-indigo-200",
    "Pending-Review": "bg-orange-100 text-orange-800 border-orange-200",
    "Draft": "bg-gray-100 text-gray-800 border-gray-200"
  },
  dataQuality: {
    "High-Quality": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Medium-Quality": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Needs-Review": "bg-red-100 text-red-800 border-red-200"
  },
  sensitivity: {
    "Public": "bg-blue-100 text-blue-800 border-blue-200",
    "Internal": "bg-yellow-100 text-yellow-800 border-yellow-200", 
    "Confidential": "bg-red-100 text-red-800 border-red-200",
    "Restricted": "bg-purple-100 text-purple-800 border-purple-200"
  }
}

const iconColors = {
  "red": "text-red-600",
  "orange": "text-orange-600", 
  "yellow": "text-yellow-600",
  "green": "text-green-600",
  "blue": "text-blue-600",
  "purple": "text-purple-600"
}

// Generate governance labels for insights
const getGovernanceLabels = (insightId: number) => {
  const labels = []
  
  // Compliance labels based on insight ID
  if (insightId % 4 === 0) labels.push({ type: 'compliance', label: 'SOX-Compliant' })
  else if (insightId % 4 === 1) labels.push({ type: 'compliance', label: 'GDPR-Ready' })
  else if (insightId % 4 === 2) labels.push({ type: 'compliance', label: 'Audit-Required' })
  else labels.push({ type: 'compliance', label: 'Non-Compliant' })
  
  // Approval labels based on insight ID
  if (insightId % 3 === 0) labels.push({ type: 'approval', label: 'CFO-Approved' })
  else if (insightId % 3 === 1) labels.push({ type: 'approval', label: 'CPO-Approved' })
  else labels.push({ type: 'approval', label: 'Pending-Review' })
  
  // Data quality labels based on insight ID
  if (insightId % 5 === 0 || insightId % 5 === 1) labels.push({ type: 'dataQuality', label: 'High-Quality' })
  else if (insightId % 5 === 2 || insightId % 5 === 3) labels.push({ type: 'dataQuality', label: 'Medium-Quality' })
  else labels.push({ type: 'dataQuality', label: 'Needs-Review' })
  
  // Sensitivity labels based on insight ID
  if (insightId % 6 === 0) labels.push({ type: 'sensitivity', label: 'Public' })
  else if (insightId % 6 === 1 || insightId % 6 === 2) labels.push({ type: 'sensitivity', label: 'Internal' })
  else if (insightId % 6 === 3 || insightId % 6 === 4) labels.push({ type: 'sensitivity', label: 'Confidential' })
  else labels.push({ type: 'sensitivity', label: 'Restricted' })
  
  return labels
}

// Intelligent query generator for Deep Dive functionality
const generateDeepDiveQuery = (insight: any) => {
  const baseQuery = insight.query
  const category = insight.category
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
  
  // Add follow-up suggestions based on business insights
  if (insight.business_insights) {
    enhancedQuery += ` Also provide 3 specific follow-up questions based on these business insights: ${insight.business_insights.substring(0, 200)}...`
  }
  
  return enhancedQuery
}

// Generate additional context for the chat
const generateChatContext = (insight: any) => {
  return {
    insightId: insight.id,
    title: insight.title,
    category: insight.category,
    priority: insight.priority,
    impact: insight.impact,
    confidence: insight.confidence,
    summary: insight.summary,
    businessInsights: insight.business_insights,
    recommendations: insight.recommendations,
    followupQuery: insight.followup_query,
    evidence: insight.evidence,
    tags: insight.tags,
    autoExecute: true // Flag to auto-execute the query
  }
}

export default function InsightsCenterPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortField, setSortField] = useState<'title' | 'impact' | 'category' | 'confidence'>('title')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Enhanced Deep Dive handler with intelligent query generation
  const handleDeepDive = (insight: any) => {
    // Generate enhanced query with contextual information
    const enhancedQuery = generateDeepDiveQuery(insight)
    const chatContext = generateChatContext(insight)
    
    // Add loading state and smooth transition
    const button = document.querySelector(`[data-insight-id="${insight.id}"]`) as HTMLButtonElement
    if (button) {
      button.disabled = true
      button.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading...'
    }
    
    // Create URL with enhanced parameters
    const urlParams = new URLSearchParams({
      query: enhancedQuery,
      context: JSON.stringify(chatContext),
      source: 'insights-center'
    })
    
    // Prefetch the chat route for instant navigation
    router.prefetch('/chat')
    
    // Navigate to chat with pre-populated query and context
    setTimeout(() => {
      router.push(`/chat?${urlParams.toString()}`)
    }, 200) // Small delay to show loading state
  }

  const handleSort = (field: 'title' | 'impact' | 'category' | 'confidence') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 text-blue-600" /> : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const filteredInsights = useMemo(() => {
    let filtered = insightsData.filter(insight => {
      const matchesSearch = insight.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           insight.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           insight.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           insight.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = selectedCategory === "All" || 
                             insight.category.toLowerCase() === selectedCategory.toLowerCase() ||
                             (selectedCategory === "Risk" && insight.category === "vendor-risk") ||
                             (selectedCategory === "Cost-Groups" && insight.category === "cost-groups")
      
      return matchesSearch && matchesCategory
    })

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number
      
      switch (sortField) {
        case 'title':
          aValue = (a.title?.toLowerCase() || a.query.toLowerCase()) as string
          bValue = (b.title?.toLowerCase() || b.query.toLowerCase()) as string
          break
        case 'impact':
          aValue = (a.impact?.toLowerCase() || '') as string
          bValue = (b.impact?.toLowerCase() || '') as string
          break
        case 'category':
          aValue = a.category.toLowerCase() as string
          bValue = b.category.toLowerCase() as string
          break
        case 'confidence':
          aValue = (a.confidence || 0) as number
          bValue = (b.confidence || 0) as number
          break
        default:
          return 0
      }
      
      if (sortField === 'confidence' && typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue)
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      return 0
    })

    return filtered
  }, [searchTerm, selectedCategory, sortField, sortDirection])

  return (
    <Sidebar>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Lightbulb className="h-8 w-8 text-blue-600" />
              <span>Insights Center</span>
            </h1>
            <p className="text-gray-600 mt-2">Professional financial analytics with governance controls and evidence details</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="/product-demo">
                <MessageSquare className="h-4 w-4 mr-2" />
                View Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search insights by title, category, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.slice(0, 8).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Professional Insights Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span>Financial Analytics Insights</span>
              <Badge variant="outline" className="ml-2">
                {filteredInsights.length} insights
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedDataTable
              columns={insightsColumns}
              data={filteredInsights}
              searchKey="title"
              placeholder="Search insights..."
              filterableColumns={insightsFilterOptions}
              enableRowSelection={false}
              enableColumnVisibility={true}
              enableExport={true}
              exportFileName="financial-insights"
              onRowClick={(insight) => {
                window.location.href = `/insights-center/${insight.id}`
              }}
            />
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  )
}
