'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Code, BarChart3, ChevronDown, Loader2, Database, Eye } from 'lucide-react'
import { ChatMessage } from '@/app/chat/page'

interface ActionDropdownProps {
  messageId: string
  message: ChatMessage
  onViewQuery: () => void
  onGenerateChart: () => void
  onViewEvidence: () => void
  isLoadingEvidence: boolean
  hasEvidence: boolean
}

export function ActionDropdown({ 
  messageId, 
  message, 
  onViewQuery, 
  onGenerateChart, 
  onViewEvidence,
  isLoadingEvidence,
  hasEvidence
}: ActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (message.role !== 'assistant') return null

  return (
    <div className="mt-3 flex items-center justify-between">
      {/* Metadata badges */}
      <div className="flex items-center gap-2 text-xs">
        {message.metadata?.executionTime && (
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" />
            {message.metadata.executionTime}ms
          </Badge>
        )}
        {message.metadata?.recordCount && (
          <Badge variant="outline" className="text-xs">
            {message.metadata.recordCount} records
          </Badge>
        )}
        {message.metadata?.model && (
          <Badge variant="outline" className="text-xs">
            {message.metadata.model}
          </Badge>
        )}
      </div>

      {/* Action dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs">
            Actions
            <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onViewQuery} className="text-sm">
            <Code className="h-4 w-4 mr-2" />
            View SQL Query
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onViewEvidence} 
            disabled={isLoadingEvidence}
            className="text-sm"
          >
            {isLoadingEvidence ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {isLoadingEvidence ? 'Loading...' : 'View Evidence'}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onGenerateChart}
            disabled={!hasEvidence}
            className="text-sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Chart
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}