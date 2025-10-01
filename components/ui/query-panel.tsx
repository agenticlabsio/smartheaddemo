'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Brain, 
  Star,
  PlayCircle,
  Filter,
  X,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  Target,
  PieChart,
  Database,
  Zap,
  Shield,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Layers,
  Eye,
  MoreHorizontal,
  Sparkles,
  TrendingDown,
  ArrowUpRight,
  ExternalLink,
  Info,
  Bookmark,
  Grid3X3,
  List,
  FileText,
  Lightbulb
} from 'lucide-react'
import { SharedQuery, queryCategories, getQueriesByCategory, sharedQueries } from '@/lib/shared-queries'

interface QueryPanelProps {
  collapsed: boolean
  onToggleCollapse: () => void
  onSelectQuery: (query: string) => void
  className?: string
}

// Priority color mapping with enterprise green theme
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200 shadow-sm'
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 shadow-sm'
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm'
    case 'low': return 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm'
    default: return 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm'
  }
}

// Confidence indicator with visual dots
const getConfidenceIndicator = (confidence: string) => {
  switch (confidence?.toLowerCase()) {
    case 'high': return { color: 'text-emerald-600', dots: 3, bg: 'bg-emerald-100' }
    case 'medium': return { color: 'text-yellow-600', dots: 2, bg: 'bg-yellow-100' }
    case 'low': return { color: 'text-red-600', dots: 1, bg: 'bg-red-100' }
    default: return { color: 'text-emerald-600', dots: 2, bg: 'bg-emerald-100' }
  }
}

// Enhanced category display with enterprise green theme
const categoryConfig = {
  'all': { name: 'All Insights', icon: Sparkles, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'variance': { name: 'Variance Analysis', icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  'quarterly': { name: 'Quarterly Reports', icon: BarChart3, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'accounts': { name: 'Account Analysis', icon: PieChart, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  'trajectory': { name: 'Trends & Patterns', icon: Activity, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  'efficiency': { name: 'Efficiency Metrics', icon: Zap, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
  'forecasting': { name: 'Forecasting', icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
  'pricing': { name: 'Pricing Analysis', icon: DollarSign, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  'cost-groups': { name: 'Cost Groups', icon: Layers, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  'vendor-risk': { name: 'Vendor Risk', icon: Shield, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  'data-foundation': { name: 'Data Foundation', icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  'seasonal': { name: 'Seasonal Analysis', icon: Calendar, color: 'text-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'entity-analysis': { name: 'Entity Analysis', icon: Users, color: 'text-emerald-500', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' }
}

export function QueryPanel({ collapsed, onToggleCollapse, onSelectQuery, className = '' }: QueryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['variance', 'quarterly', 'accounts', 'trajectory', 'efficiency', 'forecasting', 'pricing', 'cost-groups', 'vendor-risk', 'data-foundation', 'seasonal', 'entity-analysis']))
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const [hoveredQuery, setHoveredQuery] = useState<number | null>(null)
  const [expandedQuery, setExpandedQuery] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and organize queries
  const filteredQueries = useMemo(() => {
    let queries = getQueriesByCategory(selectedCategory)
    
    if (searchTerm) {
      queries = queries.filter(query => 
        query.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        query.business_insights?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Group by category if showing all
    if (selectedCategory === 'all') {
      const grouped = queries.reduce((acc, query) => {
        if (!acc[query.category]) acc[query.category] = []
        acc[query.category].push(query)
        return acc
      }, {} as Record<string, SharedQuery[]>)
      return grouped
    }

    return { [selectedCategory]: queries }
  }, [selectedCategory, searchTerm])

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleFavorite = (queryId: number) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(queryId)) {
      newFavorites.delete(queryId)
    } else {
      newFavorites.add(queryId)
    }
    setFavorites(newFavorites)
  }

  const handleQueryClick = (query: SharedQuery) => {
    onSelectQuery(query.query)
  }

  const handleViewDetails = (query: SharedQuery) => {
    setExpandedQuery(expandedQuery === query.id ? null : query.id)
  }

  // Get main categories that have queries
  const mainCategories = ['variance', 'quarterly', 'accounts', 'trajectory', 'efficiency', 'forecasting']

  if (collapsed) {
    return (
      <div className={`bg-gradient-to-b from-emerald-50 to-green-50 border-r border-emerald-200 shadow-lg transition-all duration-300 w-16 flex flex-col ${className}`}>
        <div className="p-3 border-b border-emerald-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full h-8 p-0 hover:bg-emerald-100 transition-colors rounded-lg"
            title="Expand Smart Queries"
          >
            <ChevronRight className="h-4 w-4 text-emerald-700" />
          </Button>
        </div>
        <div className="p-2 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 p-0 hover:bg-emerald-100 transition-colors rounded-lg"
            title="Smart Insights"
          >
            <Sparkles className="h-4 w-4 text-emerald-700" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 p-0 hover:bg-yellow-100 transition-colors rounded-lg"
            title="Favorites"
          >
            <Star className="h-4 w-4 text-yellow-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8 p-0 hover:bg-emerald-100 transition-colors rounded-lg"
            title="Search"
          >
            <Search className="h-4 w-4 text-emerald-700" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-b from-white to-emerald-50/30 border-r border-emerald-200 shadow-lg transition-all duration-300 flex flex-col ${className}`}>
      {/* Enhanced Professional Header */}
      <div className="p-4 border-b border-emerald-200 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 font-inter">
                Smart Financial Insights
              </h2>
              <p className="text-sm text-emerald-700 font-medium">
                {sharedQueries.length} AI-Powered Analytics
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 hover:bg-emerald-100 transition-colors rounded-lg"
            title="Collapse Panel"
          >
            <ChevronLeft className="h-4 w-4 text-emerald-700" />
          </Button>
        </div>

        {/* Enhanced Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-600" />
          <Input
            placeholder="Search insights, impacts, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-sm border-emerald-200 focus:border-emerald-400 focus:ring-emerald-200 bg-white shadow-sm"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-emerald-100 rounded-full"
            >
              <X className="h-3 w-3 text-emerald-600" />
            </Button>
          )}
        </div>

        {/* View Toggle and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-emerald-200">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-7 px-3 text-xs"
            >
              <Grid3X3 className="h-3 w-3 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-7 px-3 text-xs"
            >
              <List className="h-3 w-3 mr-1" />
              List
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {favorites.size > 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                <Star className="h-3 w-3 mr-1" />
                {favorites.size} Saved
              </Badge>
            )}
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              {Object.values(filteredQueries).flat().length} Results
            </Badge>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="p-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className={`text-xs h-8 px-3 transition-all ${
              selectedCategory === 'all' 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            All Insights
            <span className="ml-2 text-xs opacity-80 bg-white/20 px-1.5 py-0.5 rounded">
              {sharedQueries.length}
            </span>
          </Button>
          {mainCategories.map((key) => {
            const config = categoryConfig[key as keyof typeof categoryConfig]
            if (!config) return null
            const count = getQueriesByCategory(key).length
            if (count === 0) return null
            
            return (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={`text-xs h-8 px-3 transition-all ${
                  selectedCategory === key 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <config.icon className="h-3 w-3 mr-1" />
                {config.name.split(' ')[0]}
                <span className="ml-2 text-xs opacity-80 bg-white/20 px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Favorites Section */}
      {favorites.size > 0 && (
        <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-yellow-50 to-amber-50">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">Saved Insights</span>
            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
              {favorites.size} items
            </Badge>
          </div>
          <div className="grid gap-2">
            {Array.from(favorites).slice(0, 3).map(queryId => {
              const query = sharedQueries.find(q => q.id === queryId)
              if (!query) return null
              return (
                <Card
                  key={queryId}
                  className="cursor-pointer transition-all duration-200 hover:shadow-md border-yellow-200 bg-white/80 hover:bg-white"
                  onClick={() => handleQueryClick(query)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-yellow-900 truncate">
                          {query.title}
                        </h4>
                        {query.impact && (
                          <p className="text-xs text-yellow-700 font-semibold">
                            {query.impact}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-yellow-600 hover:bg-yellow-100"
                      >
                        <PlayCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Query Categories and Cards */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.entries(filteredQueries).map(([category, queries]) => {
            const categoryInfo = categoryConfig[category as keyof typeof categoryConfig] || 
              { name: category.charAt(0).toUpperCase() + category.slice(1), icon: Brain, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' }
            const isExpanded = expandedCategories.has(category)

            return (
              <div key={category} className="space-y-3">
                {/* Category Header */}
                {selectedCategory === 'all' && (
                  <div className={`${categoryInfo.bgColor} ${categoryInfo.borderColor} border rounded-lg p-3 shadow-sm`}>
                    <Button
                      variant="ghost"
                      onClick={() => toggleCategory(category)}
                      className="w-full justify-between p-0 h-auto hover:bg-white/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center shadow-sm`}>
                          <categoryInfo.icon className={`h-4 w-4 ${categoryInfo.color}`} />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-gray-800">
                            {categoryInfo.name}
                          </span>
                          <p className="text-xs text-gray-600">
                            {queries.length} insights available
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs h-5 px-2 bg-white/60">
                          {queries.length}
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </Button>
                  </div>
                )}

                {/* Query Cards */}
                {(selectedCategory !== 'all' || isExpanded) && (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3' : 'space-y-3'}>
                    {queries.map((query) => (
                      <Card
                        key={query.id}
                        className={`group cursor-pointer transition-all duration-300 border-2 hover:shadow-xl transform hover:-translate-y-1 ${
                          hoveredQuery === query.id 
                            ? 'bg-emerald-50 border-emerald-300 shadow-xl' 
                            : 'border-gray-200 hover:bg-emerald-50/30 hover:border-emerald-200'
                        } ${expandedQuery === query.id ? 'border-emerald-400 shadow-lg' : ''}`}
                        onMouseEnter={() => setHoveredQuery(query.id)}
                        onMouseLeave={() => setHoveredQuery(null)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`w-6 h-6 ${categoryInfo.bgColor} rounded-md flex items-center justify-center`}>
                                  <categoryInfo.icon className={`h-3 w-3 ${categoryInfo.color}`} />
                                </div>
                                <CardTitle className="text-sm font-semibold text-gray-900 truncate">
                                  {query.title || `Insight ${query.id}`}
                                </CardTitle>
                              </div>
                              
                              <div className="flex items-center gap-2 mb-2">
                                {query.priority && (
                                  <Badge className={`text-xs h-5 px-2 border ${getPriorityColor(query.priority)}`}>
                                    {query.priority}
                                  </Badge>
                                )}
                                {query.confidence && (
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getConfidenceIndicator(query.confidence).bg}`}>
                                    <span className={`text-xs font-medium ${getConfidenceIndicator(query.confidence).color}`}>
                                      {query.confidence}
                                    </span>
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: getConfidenceIndicator(query.confidence).dots }).map((_, i) => (
                                        <div key={i} className={`w-1 h-1 rounded-full ${getConfidenceIndicator(query.confidence || 'medium').color.replace('text', 'bg')}`} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {query.impact && (
                                <div className="bg-gradient-to-r from-emerald-100 to-green-100 border border-emerald-200 rounded-lg p-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-bold text-emerald-800">
                                      {query.impact}
                                    </span>
                                    <span className="text-xs text-emerald-600 bg-emerald-200 px-2 py-0.5 rounded">
                                      Financial Impact
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(query.id)
                                }}
                                className={`h-8 w-8 p-0 transition-all ${
                                  favorites.has(query.id) 
                                    ? 'text-yellow-600 bg-yellow-50 shadow-sm' 
                                    : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                                }`}
                                title="Save to Favorites"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                          {/* Business Insights Preview */}
                          {query.business_insights && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-blue-800 mb-1">Key Insight</p>
                                  <p className="text-xs text-blue-700 leading-relaxed">
                                    {expandedQuery === query.id 
                                      ? query.business_insights
                                      : query.business_insights.slice(0, 120) + (query.business_insights.length > 120 ? '...' : '')
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Summary */}
                          {query.summary && (
                            <p className="text-xs text-gray-600 leading-relaxed mb-3">
                              {expandedQuery === query.id 
                                ? query.summary
                                : query.summary.slice(0, 100) + (query.summary.length > 100 ? '...' : '')
                              }
                            </p>
                          )}

                          {/* Recommendations Preview */}
                          {query.recommendations && expandedQuery === query.id && (
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3 mb-3">
                              <div className="flex items-start gap-2 mb-2">
                                <Target className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs font-medium text-purple-800">Recommendations</span>
                              </div>
                              <div className="space-y-2">
                                {query.recommendations.slice(0, 2).map((rec, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0 mt-1.5" />
                                    <p className="text-xs text-purple-700 leading-relaxed">{rec}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleQueryClick(query)}
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                Run Query
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(query)}
                                className="h-8 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                {expandedQuery === query.id ? 'Less' : 'Details'}
                              </Button>
                            </div>
                            
                            {/* Tags */}
                            {query.tags && query.tags.length > 0 && (
                              <div className="flex gap-1">
                                {query.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-[10px] h-5 px-1.5 border-gray-300 text-gray-600">
                                    {tag}
                                  </Badge>
                                ))}
                                {query.tags.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-gray-300 text-gray-600">
                                    +{query.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* No Results */}
          {Object.values(filteredQueries).flat().length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No insights found</h3>
              <p className="text-xs text-gray-500 mb-4">
                Try adjusting your search terms or category filters
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Footer */}
      <div className="p-4 border-t border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-green-50/50">
        <div className="flex items-center justify-between text-xs text-emerald-700">
          <div className="flex items-center gap-4">
            <span className="font-medium">
              {Object.values(filteredQueries).flat().length} insights
            </span>
            {favorites.size > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {favorites.size} saved
              </span>
            )}
          </div>
          {searchTerm && (
            <span className="text-emerald-600 font-medium">
              Filtered: "{searchTerm}"
            </span>
          )}
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500">
            AI-powered financial insights • Real-time analytics
          </p>
        </div>
      </div>
    </div>
  )
}