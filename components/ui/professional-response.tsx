"use client"

import React from 'react'
import { EnhancedMarkdown } from '@/components/ui/enhanced-markdown'

interface ProfessionalResponseProps {
  content: string
  metadata?: any
  className?: string
}

export function ProfessionalResponse({ 
  content, 
  metadata, 
  className = "" 
}: ProfessionalResponseProps) {
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Executive Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="prose prose-lg max-w-none text-gray-900">
          <EnhancedMarkdown content={content} />
        </div>
      </div>
      
      {/* Analysis Metadata */}
      {metadata && (
        <div className="text-xs text-gray-500 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-6 flex-wrap">
            {metadata.model && (
              <span>Model: {metadata.model}</span>
            )}
            {metadata.executionTime && (
              <span>Analysis Time: {Math.round(metadata.executionTime / 1000)}s</span>
            )}
            {metadata.confidence && (
              <span>Confidence: {Math.round(metadata.confidence * 100)}%</span>
            )}
            {metadata.agentUsed && (
              <span>Data Source: {metadata.agentUsed.toUpperCase()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}