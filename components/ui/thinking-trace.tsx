"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, X, ChevronDown, ChevronRight } from 'lucide-react'
import { EnhancedMarkdown } from '@/components/ui/enhanced-markdown'

// Parse thinking content into 5 structured steps
function parseThinkingSteps(thinking: string): string[] {
  // Try to extract numbered steps or bullet points
  const stepPatterns = [
    /\d+\.[\s]*([^\n]+)/g, // Numbered lists
    /\*[\s]*([^\n]+)/g,    // Bullet points with *
    /\-[\s]*([^\n]+)/g,    // Bullet points with -
    /[\u2022][\s]*([^\n]+)/g // Bullet points with •
  ]
  
  for (const pattern of stepPatterns) {
    const matches = [...thinking.matchAll(pattern)]
    if (matches.length >= 3) {
      return matches.slice(0, 5).map(match => match[1].trim())
    }
  }
  
  // Fallback: split by paragraphs and take first 5 meaningful sentences
  const paragraphs = thinking.split(/\n\s*\n/)
    .filter(p => p.trim().length > 20)
    .slice(0, 5)
  
  if (paragraphs.length > 0) {
    return paragraphs.map(p => p.trim().substring(0, 150) + (p.length > 150 ? '...' : ''))
  }
  
  // Final fallback: split by sentences
  const sentences = thinking.split(/[.!?]+/)
    .filter(s => s.trim().length > 10)
    .slice(0, 5)
  
  return sentences.length > 0 ? sentences.map(s => s.trim()) : ['Analysis completed with multi-step reasoning']
}

interface ThinkingTraceProps {
  thinking: string
  className?: string
  defaultOpen?: boolean
}

export function ThinkingTrace({ thinking, className, defaultOpen = true }: ThinkingTraceProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [isExpanded, setIsExpanded] = useState(true)

  if (!thinking) return null

  return (
    <div className={className}>
      {/* Always Visible Header */}
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">AI Reasoning Process</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-900 h-6 w-6 p-0"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <ScrollArea className={`${isExpanded ? 'h-96' : 'h-32'} transition-all duration-200`}>
            <div className="space-y-2">
              {thinking ? parseThinkingSteps(thinking).map((step, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                </div>
              )) : (
                <div className="text-sm text-gray-500">No reasoning trace available</div>
              )}
            </div>
          </ScrollArea>
          {!isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  )
}