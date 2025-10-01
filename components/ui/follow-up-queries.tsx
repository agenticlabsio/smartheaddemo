'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Search,
  ArrowRight,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowUpQueriesProps {
  queries: string[]
  onQuerySelect: (query: string) => void
  isLoading?: boolean
  className?: string
}

export function FollowUpQueries({ queries, onQuerySelect, isLoading = false, className }: FollowUpQueriesProps) {
  if (!queries || queries.length === 0) {
    return null
  }

  // Get appropriate icon for query type
  const getQueryIcon = (query: string) => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('pattern') || lowerQuery.includes('forecast')) {
      return <TrendingUp className="w-4 h-4" />
    }
    if (lowerQuery.includes('compare') || lowerQuery.includes('benchmark') || lowerQuery.includes('vs')) {
      return <BarChart3 className="w-4 h-4" />
    }
    if (lowerQuery.includes('analyze') || lowerQuery.includes('review') || lowerQuery.includes('identify')) {
      return <Search className="w-4 h-4" />
    }
    
    return <Lightbulb className="w-4 h-4" />
  }

  // Get category for styling
  const getQueryCategory = (query: string) => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      return 'trend'
    }
    if (lowerQuery.includes('compare') || lowerQuery.includes('benchmark') || lowerQuery.includes('vs')) {
      return 'comparative'
    }
    if (lowerQuery.includes('risk') || lowerQuery.includes('variance') || lowerQuery.includes('analyze')) {
      return 'analytical'
    }
    
    return 'exploration'
  }

  // Category-based styling
  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'trend':
        return {
          border: 'border-green-200 hover:border-green-300',
          bg: 'bg-green-50 hover:bg-green-100',
          text: 'text-green-700 hover:text-green-800',
          icon: 'text-green-600'
        }
      case 'comparative':
        return {
          border: 'border-blue-200 hover:border-blue-300',
          bg: 'bg-blue-50 hover:bg-blue-100',
          text: 'text-blue-700 hover:text-blue-800',
          icon: 'text-blue-600'
        }
      case 'analytical':
        return {
          border: 'border-purple-200 hover:border-purple-300',
          bg: 'bg-purple-50 hover:bg-purple-100',
          text: 'text-purple-700 hover:text-purple-800',
          icon: 'text-purple-600'
        }
      default:
        return {
          border: 'border-gray-200 hover:border-gray-300',
          bg: 'bg-gray-50 hover:bg-gray-100',
          text: 'text-gray-700 hover:text-gray-800',
          icon: 'text-gray-600'
        }
    }
  }

  return (
    <Card className={cn("border border-gray-200 bg-white shadow-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Suggested follow-up questions</span>
          <Badge variant="secondary" className="text-xs">
            AI-powered
          </Badge>
        </div>
        
        <div className="space-y-2">
          {queries.map((query, index) => {
            const category = getQueryCategory(query)
            const colors = getCategoryColors(category)
            const icon = getQueryIcon(query)
            
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={() => onQuerySelect(query)}
                disabled={isLoading}
                className={cn(
                  "w-full justify-start h-auto p-3 text-left transition-all duration-200",
                  colors.border,
                  colors.bg,
                  colors.text,
                  "hover:scale-[1.02] hover:shadow-sm",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
                    {icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed">
                      {query}
                    </p>
                  </div>
                  
                  <ArrowRight className={cn(
                    "w-4 h-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                    colors.icon
                  )} />
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
              Generating follow-up suggestions...
            </div>
          </div>
        )}
        
        {/* Empty state hint */}
        {!isLoading && queries.length === 0 && (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">
              Start a conversation to see intelligent follow-up suggestions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}