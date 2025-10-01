"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  FileText, 
  BarChart2, 
  Code, 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Database
} from 'lucide-react'

interface ArtifactResponseProps {
  title: string
  content: string
  metadata?: {
    executionTime?: string
    model?: string
    confidence?: string
    dataPoints?: number
  }
  sqlQuery?: string
  evidenceData?: any
  className?: string
}

export function ArtifactResponse({ 
  title, 
  content, 
  metadata, 
  sqlQuery, 
  evidenceData, 
  className = "" 
}: ArtifactResponseProps) {
  const [showQuery, setShowQuery] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className={`border-l-4 border-l-blue-500 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{title}</CardTitle>
              <div className="flex items-center gap-3 mt-1">
                {metadata && (
                  <>
                    {metadata.model && (
                      <Badge variant="outline" className="text-xs">
                        {metadata.model}
                      </Badge>
                    )}
                    {metadata.confidence && (
                      <Badge variant="outline" className="text-xs">
                        Confidence: {metadata.confidence}
                      </Badge>
                    )}
                    {metadata.executionTime && (
                      <Badge variant="secondary" className="text-xs">
                        {metadata.executionTime}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Content */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="prose prose-sm max-w-none text-gray-700">
            <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          {sqlQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuery(!showQuery)}
              className="text-xs"
            >
              <Code className="h-3 w-3 mr-1" />
              {showQuery ? 'Hide Query' : 'View SQL'}
            </Button>
          )}
          
          {evidenceData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEvidence(!showEvidence)}
              className="text-xs"
            >
              <Database className="h-3 w-3 mr-1" />
              {showEvidence ? 'Hide Evidence' : 'View Evidence'}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(content)}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>

        {/* Expandable SQL Query */}
        {showQuery && sqlQuery && (
          <Card className="bg-gray-900 text-gray-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">SQL Query</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sqlQuery)}
                  className="text-gray-300 hover:text-white"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {sqlQuery}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Expandable Evidence Data */}
        {showEvidence && evidenceData && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">Evidence Data</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-48">
                <pre className="text-xs text-green-800 whitespace-pre-wrap">
                  {JSON.stringify(evidenceData, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Metadata Footer */}
        {metadata && metadata.dataPoints && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Analysis based on {metadata.dataPoints?.toLocaleString()} data points from Asheville operations
          </div>
        )}
      </CardContent>
    </Card>
  )
}