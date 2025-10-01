'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  Loader2, 
  Brain, 
  BarChart3, 
  MessageCircle,
  Sparkles,
  TrendingUp,
  FileText,
  StopCircle,
  Zap,
  Plus,
  Save,
  Eye,
  Clock,
  Lightbulb
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { ArtifactReport } from '@/components/ui/artifact-report'
import { EvidenceTabs } from '@/components/ui/lazy-components'
import { FollowUpQueries } from '@/components/ui/follow-up-queries'
import { followUpGenerator, FollowUpContext } from '@/lib/followup-generator'
import { useChats, useSaveChat, useStoreMessage } from '@/lib/hooks/use-api-queries'

// Memoized helper components for performance
const MessageContent = React.memo(({ content, isArtifact }: { content: string; isArtifact: boolean }) => {
  if (isArtifact) {
    return (
      <ArtifactReport 
        title={extractReportTitle(content)}
        content={content}
        className="mt-4"
      />
    )
  }

  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const {className, children, ...rest} = props
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            return !isInline ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...rest}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...rest}>
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

MessageContent.displayName = 'MessageContent'

// Helper function to detect if content should be rendered as an artifact

// Extract report title from content
const extractReportTitle = (content: string): string => {
  const lines = content.split('\n')
  const firstHeader = lines.find(line => line.startsWith('##'))
  if (firstHeader) {
    return firstHeader.replace('##', '').trim()
  }
  
  // Look for key patterns
  if (content.toLowerCase().includes('supplier')) return 'Supplier Analysis Report'
  if (content.toLowerCase().includes('budget')) return 'Budget Analysis Report'
  if (content.toLowerCase().includes('financial')) return 'Financial Analysis Report'
  
  return 'Executive Report'
}

// Helper function to detect if response has evidence data
const hasEvidenceData = (evidenceData: any): boolean => {
  return evidenceData && (
    (evidenceData.data && evidenceData.data.length > 0) ||
    evidenceData.sqlQuery ||
    (evidenceData.chartData && evidenceData.chartData.length > 0)
  )
}

const EvidenceSection = React.memo(({ evidenceData, messageId }: { evidenceData: any; messageId?: string }) => {
  if (!hasEvidenceData(evidenceData)) return null

  return (
    <div className="mt-4">
      <EvidenceTabs evidenceData={evidenceData} />
    </div>
  )
})

EvidenceSection.displayName = 'EvidenceSection'

// Helper function to determine if content should render as artifact
const shouldRenderAsArtifact = (content: string): boolean => {
  const artifactKeywords = [
    'executive summary', 'strategic recommendations', 'analysis report',
    'top 3 suppliers', 'budget variance', 'supplier spending', 'financial insights',
    'performance snapshot', 'risk analysis', 'category insights', 'next steps'
  ]
  
  const lowercaseContent = content.toLowerCase()
  const hasMultipleKeywords = artifactKeywords.filter(keyword => 
    lowercaseContent.includes(keyword)
  ).length >= 2

  const hasStructuredFormat = content.includes('##') && content.includes('•')
  const isSubstantial = content.length > 800

  return hasMultipleKeywords && hasStructuredFormat && isSubstantial
}

// Main optimized component
export function OptimizedFinancialChat() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchParams = useSearchParams()
  
  // React Query hooks for data management
  const { data: chats, isLoading: chatsLoading } = useChats()
  const saveChatMutation = useSaveChat()
  const storeMessageMutation = useStoreMessage()
  
  // Chat management state
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [chatTitle, setChatTitle] = useState('')
  
  // Local state for chat management
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [error, setError] = useState<any>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [insightContext, setInsightContext] = useState<any>(null)
  
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false)
  const [reasoningSteps, setReasoningSteps] = useState<any[]>([])
  const [currentContent, setCurrentContent] = useState('')
  const [streamingMetadata, setStreamingMetadata] = useState<any>(null)
  
  // Follow-up queries state  
  const [followUpQueries, setFollowUpQueries] = useState<string[]>([
    'Analyze spending trends by quarter',
    'Show top 10 suppliers by risk score', 
    'Compare budget vs actual for this period',
    'Identify cost optimization opportunities'
  ])
  const [isGeneratingFollowUps, setIsGeneratingFollowUps] = useState(false)

  // Memoized insight follow-ups generation
  const generateInsightFollowUps = useCallback((context: any) => {
    const category = context.category?.toLowerCase() || ''
    const priority = context.priority?.toLowerCase() || ''
    
    const baseFollowUps = [
      `What are the root causes of this ${category} issue?`,
      `Show me the detailed breakdown of ${context.impact} impact`,
      `What immediate actions should we take for this ${priority} priority item?`
    ]
    
    const categoryFollowUps: Record<string, string[]> = {
      'variance': [
        'Analyze month-over-month variance trends for the affected cost centers',
        'Show statistical confidence intervals for this variance analysis',
        'Which specific account codes are driving the highest volatility?'
      ],
      'quarterly': [
        'Forecast next quarter spending based on current trends',
        'Compare this quarter vs same quarter last year', 
        'What seasonal adjustments should we make to the forecast?'
      ],
      'accounts': [
        'Show transaction frequency analysis for high-risk accounts',
        'Identify consolidation opportunities for low-value transactions',
        'Which vendors should we prioritize for contract negotiations?'
      ]
    }
    
    const specificFollowUps = categoryFollowUps[category] || []
    return [...baseFollowUps, ...specificFollowUps.slice(0, 2)]
  }, [])

  // Optimized auto-execute query handler
  const handleAutoExecuteQuery = useCallback(async (query: string, parsedContext: any) => {
    setChatInput('')
    setIsLoading(true)
    setError(null)
    
    const controller = new AbortController()
    setAbortController(controller)
    
    // Create user message immediately for responsive UI
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
      insightContext: parsedContext
    }
    
    setMessages(prev => [...prev, userMessage])
    
    try {
      // Implement your chat API call here
      // This is a placeholder for the actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Store message using React Query mutation
      storeMessageMutation.mutate({
        content: query,
        role: 'user',
        chatId: parsedContext.chatId,
        insightContext: parsedContext
      })
      
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error)
      }
    } finally {
      setIsLoading(false)
      setAbortController(null)
    }
  }, [storeMessageMutation])

  // Handle URL parameters for Deep Dive functionality  
  useEffect(() => {
    const query = searchParams?.get('query')
    const context = searchParams?.get('context')
    const source = searchParams?.get('source')

    if (query && source === 'insights-center') {
      setMessages([])
      setChatInput('')
      
      if (context) {
        try {
          const parsedContext = JSON.parse(context)
          setInsightContext(parsedContext)
          
          const insightFollowUps = generateInsightFollowUps(parsedContext)
          setFollowUpQueries(insightFollowUps)
          
          if (parsedContext.autoExecute) {
            setTimeout(() => handleAutoExecuteQuery(query, parsedContext), 100)
          } else {
            setChatInput(query)
          }
        } catch (error) {
          console.warn('Failed to parse insight context:', error)
          setChatInput(query)
        }
      } else {
        setChatInput(query)
      }
    }
  }, [searchParams, generateInsightFollowUps, handleAutoExecuteQuery])

  // Memoized follow-up handler
  const handleFollowUpQuery = useCallback((query: string) => {
    setChatInput(query)
    textareaRef.current?.focus()
  }, [])

  // Memoized submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || isLoading) return

    const query = chatInput.trim()
    setChatInput('')
    setIsLoading(true)
    setIsStreaming(true)
    setError(null)
    setCurrentContent('')
    setReasoningSteps([])
    setStreamingMetadata(null)
    
    // Clear follow-up queries when starting a new message
    setFollowUpQueries([])

    // Create user message immediately for responsive UI
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    
    try {
      // Create abort controller for this request
      const controller = new AbortController()
      setAbortController(controller)
      
      // Make streaming API call to our modern agent
      const response = await fetch('/api/modern-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: userMessage.role, content: userMessage.content }], // Clean format for API
          stream: true // Enable streaming
        }),
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error('Failed to get response from agent')
      }

      // Check if response is streaming (SSE)
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (!reader) {
          throw new Error('No reader available for streaming response')
        }

        let buffer = ''
        let finalContent = ''
        let finalEvidenceData: any = null
        let finalMetadata: any = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              
              if (data === '[DONE]') {
                // End of stream
                const assistantMessage = {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant' as const,
                  content: finalContent,
                  evidenceData: finalEvidenceData,
                  metadata: finalMetadata,
                  reasoningSteps: reasoningSteps
                }
                setMessages(prev => [...prev, assistantMessage])
                setIsStreaming(false)
                setIsLoading(false)
                
                // Follow-up queries are managed by setFollowUpQueries state
                return
              }

              try {
                // Handle SSE data - sometimes it's already parsed, sometimes it's JSON string
                let parsed: any
                if (typeof data === 'string') {
                  // If data starts with "{", it's JSON to parse
                  if (data.trim().startsWith('{')) {
                    parsed = JSON.parse(data)
                  } else {
                    // If it's plain text, treat as content
                    parsed = { type: 'content', content: data }
                  }
                } else {
                  // If it's already an object, use it directly
                  parsed = data
                }
                
                switch (parsed.type) {
                  case 'metadata':
                    setStreamingMetadata(parsed.data || parsed)
                    finalEvidenceData = parsed.data?.evidenceData || parsed.evidenceData
                    finalMetadata = {
                      model: parsed.data?.model || parsed.model || 'Financial Analyst',
                      confidence: parsed.data?.confidence || parsed.confidence || 0.87,
                      streamingEnabled: parsed.data?.streamingEnabled || parsed.streamingEnabled || true
                    }
                    break
                    
                  case 'reasoning':
                    setReasoningSteps(prev => [...prev, parsed.data || parsed])
                    break
                    
                  case 'content':
                    const content = parsed.content || parsed.data?.content || data
                    setCurrentContent(content)
                    finalContent = content
                    break
                    
                  case 'completion':
                    finalContent = parsed.content || parsed.data?.content || data
                    finalEvidenceData = parsed.data?.evidenceData || parsed.evidenceData
                    break
                    
                  case 'error':
                    throw new Error(parsed.details || parsed.data?.details || 'Streaming error')
                    
                  default:
                    // If no type specified, treat as content
                    const defaultContent = parsed.content || data
                    setCurrentContent(defaultContent)
                    finalContent = defaultContent
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', data, parseError)
                // If parsing fails completely, treat as plain content
                setCurrentContent(data)
                finalContent = data
              }
            }
          }
        }
      } else {
        // Fallback to non-streaming response for backward compatibility
        const data = await response.json()
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: data.content || 'I received your message but encountered an issue processing it.',
          evidenceData: data.evidenceData,
          metadata: {
            model: data.model,
            executionTime: data.executionTime,
            confidence: data.confidence
          }
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Follow-up queries are managed by setFollowUpQueries state
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled')
      } else {
        console.error('Chat submission error:', error)
        setError(error)
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      setChatInput('')
      setAbortController(null)
      setCurrentContent('')
      setReasoningSteps([])
    }
  }, [chatInput, isLoading, reasoningSteps])

  // Memoized stop handler
  const handleStop = useCallback(() => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      setIsStreaming(false)
    }
  }, [abortController])
  
  // New chat handler
  const handleNewChat = useCallback(() => {
    setMessages([])
    setCurrentChatId(null)
    setChatTitle('')
    setChatInput('')
    setFollowUpQueries([
      'Analyze spending trends by quarter',
      'Show top 10 suppliers by risk score', 
      'Compare budget vs actual for this period',
      'Identify cost optimization opportunities'
    ])
  }, [])
  
  // Save chat handler
  const handleSaveChat = useCallback(async () => {
    if (messages.length === 0) return
    
    const title = chatTitle || messages[0]?.content?.slice(0, 50) + '...' || 'New Chat'
    
    try {
      await saveChatMutation.mutateAsync({
        id: currentChatId || Date.now().toString(),
        title,
        messages,
        timestamp: new Date(),
        metadata: {
          totalMessages: messages.length,
          lastUpdated: new Date()
        }
      })
      
      // Show success feedback
      console.log('Chat saved successfully!')
    } catch (error) {
      console.error('Failed to save chat:', error)
    }
  }, [messages, chatTitle, currentChatId, saveChatMutation])

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  // Memoized messages rendering with follow-up queries inline
  const renderedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const isLastAssistantMessage = message.role === 'assistant' && index === messages.length - 1
      
      return (
        <div key={message.id}>
          <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
            <div className={`max-w-[85%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}>
              <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-green-100 text-green-600'
                }`}>
                  {message.role === 'user' ? <MessageCircle className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                </div>
            
                <Card className={`${message.role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                  <CardContent className="p-4">
                    {message.insightContext && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-900">Deep Dive Analysis</span>
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                            {message.insightContext.category}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <MessageContent 
                      content={message.content}
                      isArtifact={shouldRenderAsArtifact(message.content)}
                    />
                    
                    {message.evidenceData && (
                      <EvidenceSection 
                        evidenceData={message.evidenceData}
                        messageId={message.id}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Follow-up Queries for the last assistant message */}
          {message.role === 'assistant' && isLastAssistantMessage && followUpQueries.length > 0 && (
            <div className="mt-4 max-w-[85%]">
              <FollowUpQueries 
                queries={followUpQueries}
                onQuerySelect={handleFollowUpQuery}
                className="ml-11" // Align with assistant message content
              />
            </div>
          )}
        </div>
      )
    })
  }, [messages, followUpQueries, isGeneratingFollowUps, handleFollowUpQuery])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header with Controls */}
      <div className="border-b bg-white px-4 py-3">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">FinSight AI</h1>
              <p className="text-sm text-gray-500">Financial Analysis Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveChat}
              disabled={messages.length === 0 || saveChatMutation.isPending}
              className="flex items-center gap-2"
            >
              {saveChatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Chat
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Chat Area - Centered like ChatGPT */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Welcome Intro - Show when no messages */}
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-3">
                  Welcome to FinSight AI
                </h1>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Your intelligent financial analysis assistant. Ask questions about your financial data, get insights, and explore trends.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <BarChart3 className="h-5 w-5 text-blue-600 mb-2" />
                    <div className="font-medium text-gray-900">Analyze Data</div>
                    <div className="text-gray-600">Get insights from your financial records</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
                    <div className="font-medium text-gray-900">Track Trends</div>
                    <div className="text-gray-600">Monitor spending and budget patterns</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <FileText className="h-5 w-5 text-purple-600 mb-2" />
                    <div className="font-medium text-gray-900">Generate Reports</div>
                    <div className="text-gray-600">Create executive summaries and analysis</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Messages */}
            <div className="space-y-6">
              {renderedMessages}
              
              {/* Streaming Response with Thinking Traces */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        {/* Thinking Traces */}
                        {reasoningSteps.length > 0 && (
                          <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">AI Thinking Process</span>
                              </div>
                              <div className="space-y-2 text-sm text-blue-800">
                                {reasoningSteps.map((step, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium mt-0.5">
                                      {index + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium">{step.title}</div>
                                      {step.description && (
                                        <div className="text-blue-700 opacity-90">{step.description}</div>
                                      )}
                                    </div>
                                    {step.duration && (
                                      <div className="flex items-center gap-1 text-xs text-blue-600">
                                        <Clock className="h-3 w-3" />
                                        {step.duration}ms
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Streaming Metadata */}
                        {streamingMetadata && (
                          <Card className="bg-gray-50 border-gray-200">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  Model: {streamingMetadata.model || 'GPT-4o Mini'}
                                </div>
                                {streamingMetadata.confidence && (
                                  <div>
                                    Confidence: {(streamingMetadata.confidence * 100).toFixed(0)}%
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  Streaming enabled
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {/* Current Content */}
                        {currentContent && (
                          <Card className="bg-white border-gray-200">
                            <CardContent className="p-4">
                              <MessageContent 
                                content={currentContent}
                                isArtifact={shouldRenderAsArtifact(currentContent)}
                              />
                              {/* Real-time typing indicator */}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span>AI is thinking...</span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhanced Loading State */}
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                      <Card className="bg-white border-gray-200">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Initializing AI analysis...
                            </div>
                            
                            {/* Loading steps animation */}
                            <div className="space-y-2 text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Parsing your query</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
                                <span>Accessing financial data</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '1000ms' }}></div>
                                <span>Generating insights</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom like ChatGPT */}
      <div className="border-t bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your financial data..."
                className="min-h-[52px] max-h-32 resize-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              {isLoading || isStreaming ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleStop}
                  className="h-[52px] w-[52px] text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <StopCircle className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!chatInput.trim() || isLoading}
                  className="h-[52px] w-[52px]"
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}