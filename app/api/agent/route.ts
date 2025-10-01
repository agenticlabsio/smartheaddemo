// Enhanced Smart Head Agent Endpoint with Redis, Upload Support, and Thinking
import { NextRequest, NextResponse } from 'next/server'
import { ContextAwareAgent } from '@/lib/agents/context-aware-agent'
import { EnhancedSmartAgentRouter, UploadedFile } from '@/lib/agents/enhanced-agent-router'
import { SmartHeadCacheService } from '@/lib/cache/redis-service'
import { EnhancedGeminiClient } from '@/lib/gemini/enhanced-client'
import { MemoryCoordinator } from '@/lib/memory/langgraph-memory'
import { auth } from '@clerk/nextjs/server'
import { DatabaseMessageStorage } from '@/lib/message-storage-db'
import { AgentRequestSchema, validateApiRequest } from '@/lib/types'

interface EnhancedAgentRequest {
  messages: Array<{ role: string; content: string }>
  dataSource?: 'coupa' | 'baan' | 'combined'
  stream?: boolean
  model?: string
  conversationId?: string
  uploads?: UploadedFile[]
  enableThinking?: boolean
  useCache?: boolean
}

// Enhanced streaming handler with caching, uploads, and thinking
async function handleEnhancedStreamingRequest(
  query: string,
  dataSource: 'coupa' | 'baan' | 'combined' = 'coupa',
  userId?: string,
  conversationId?: string,
  uploads: UploadedFile[] = [],
  enableThinking: boolean = true,
  useCache: boolean = true
): Promise<Response> {
  const encoder = new TextEncoder()
  const cache = SmartHeadCacheService.getInstance()
  const enhancedRouter = new EnhancedSmartAgentRouter()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial metadata with enhanced capabilities
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          query: query.trim(),
          dataSource: dataSource,
          userId: userId,
          conversationId: conversationId,
          uploads: uploads.map(u => ({ fileId: u.fileId, type: u.type, name: u.name })),
          enhancedFeatures: {
            thinkingEnabled: enableThinking,
            cacheEnabled: useCache,
            uploadsSupported: uploads.length > 0,
            memoryEnabled: !!userId && !!conversationId
          }
        })}\n\n`))

        // Use enhanced router with caching and upload support
        const result = await enhancedRouter.routeWithCache(
          query,
          uploads,
          userId,
          conversationId,
          dataSource
        )
          
        // Send enhanced processing updates
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'agent_step',
          currentStep: (result.uploadAnalysis && result.uploadAnalysis.length > 0) ? 'upload_processing' : 
                      result.sqlQuery ? 'sql_generation' : 'analysis',
          content: result.response || 'Processing with enhanced capabilities...',
          reasoning: result.thinkingProcess || 'Analyzing with Gemini 2.5 Flash thinking...',
          contextualInsights: result.contextualInsights || [],
          metadata: {
            dataSource: result.agentUsed,
            hasSQL: !!result.sqlQuery,
            hasError: !!result.error,
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            confidence: result.confidence || 85,
            cached: result.cached || false,
            uploadCount: uploads.length,
            memoryContext: result.memoryContext?.contextSummary || null,
            thinkingEnabled: enableThinking
          }
        })}\n\n`))

        // Send upload analysis if available
        if (result.uploadAnalysis && result.uploadAnalysis.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'upload_analysis',
            uploads: result.uploadAnalysis,
            insights: result.uploadAnalysis.map(u => u.analysis?.response_text || 'Processing...').join('; ')
          })}\n\n`))
        }

        // Send thinking process if available
        if (result.thinkingProcess && enableThinking) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'thinking',
            content: result.thinkingProcess,
            steps: result.thinkingProcess || []
          })}\n\n`))
        }

        // Send SQL query if available
        if (result.sqlQuery) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'sql',
            sql: result.sqlQuery,
            metadata: {
              dataSource: result.agentUsed,
              queryType: 'analytics',
              cached: result.cached || false
            }
          })}\n\n`))
          }

        // Send reasoning/data events for UI compatibility
        if (result.response) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'reasoning',
            content: result.response,
            step: 'analysis',
            cached: result.cached || false
          })}\n\n`))
        }

        // Send memory context if available
        if (result.memoryContext) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'memory_context',
            context: result.memoryContext,
            summary: result.memoryContext.contextSummary
          })}\n\n`))
        }

        // Send error if any
        if (result.error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: result.error
          })}\n\n`))
        }

        // Send final enhanced assistant message
        if (result && result.response) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'assistant_message',
            content: result.response,
            contextualInsights: result.contextualInsights || [],
            followUpSuggestions: result.followUpSuggestions || [],
            metadata: {
              sqlQuery: result.sqlQuery,
              dataSource: result.agentUsed,
              model: 'gemini-2.5-flash-lite-preview-09-2025',
              confidence: result.confidence || 85,
              sources: ['database', 'ai_model', 'cache', 'memory'],
              userId: userId,
              conversationId: conversationId,
              cached: result.cached || false,
              uploadCount: uploads.length,
              thinkingProcess: enableThinking ? result.thinkingProcess : null,
              memoryEnhanced: !!result.memoryContext,
              performance: {
                cacheHit: result.cached || false,
                uploadProcessing: uploads.length > 0,
                memoryRetrieval: !!result.memoryContext
              }
            }
          })}\n\n`))

          // Store enhanced result with all metadata
          if (userId && (result.sqlQuery || result.response || result.uploadAnalysis)) {
            const messageId = Date.now().toString()
            const storage = DatabaseMessageStorage.getInstance()
            
            try {
              await storage.store(messageId, userId, {
                sqlQuery: result.sqlQuery,
                responseData: {
                  content: result.response,
                  evidence: result.evidence || [],
                  insights: result.contextualInsights || [],
                  queryResults: result.queryResults || [],
                  dataSource: result.agentUsed,
                  query: query,
                  timestamp: new Date().toISOString(),
                  recordCount: result.queryResults?.length || 0,
                  enhanced: {
                    cached: result.cached || false,
                    uploads: uploads.map(u => ({ fileId: u.fileId, type: u.type })),
                    thinking: result.thinkingProcess,
                    memoryContext: result.memoryContext?.contextSummary,
                    followUpSuggestions: result.followUpSuggestions
                  }
                }
              })
            } catch (storageError) {
              console.error('Failed to store enhanced message data:', storageError)
            }
          }
        }

        // Send completion signal
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()
      } catch (error) {
        console.error('Streaming error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown streaming error'
        })}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal API call (from chat endpoint)
    const isInternalCall = request.headers.get('user-agent')?.includes('node') || 
                          request.headers.get('x-internal-call') === 'true'
    
    let userId: string | undefined
    
    if (!isInternalCall) {
      // Check authentication for external calls
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required'
        }, { status: 401 })
      }
      userId = authUserId
    } else {
      // For internal calls, set a default user ID
      userId = 'internal-system'
    }

    const body: EnhancedAgentRequest & { query?: string } = await request.json()
    const { 
      messages, 
      query, 
      dataSource = 'coupa', 
      stream = false, 
      conversationId,
      uploads = [],
      enableThinking = true,
      useCache = true
    } = body

    // Support both old query format and new messages format for backwards compatibility
    let latestMessage = ""
    if (query) {
      latestMessage = query
    } else if (messages && messages.length > 0) {
      latestMessage = messages[messages.length - 1]?.content || ""
    }
    
    if (!latestMessage.trim()) {
      return NextResponse.json({
        success: false,
        error: 'No query provided'
      }, { status: 400 })
    }

    if (stream) {
      return handleEnhancedStreamingRequest(
        latestMessage, 
        dataSource, 
        userId, 
        conversationId, 
        uploads,
        enableThinking,
        useCache
      )
    }

    // Non-streaming response with enhanced capabilities
    try {
      const enhancedRouter = new EnhancedSmartAgentRouter()
      const result = await enhancedRouter.routeWithCache(
        latestMessage,
        uploads,
        userId,
        conversationId || 'temp',
        dataSource
      )

      // Store enhanced evidence data including all new capabilities
      if (result.sqlQuery || result.response || result.uploadAnalysis) {
        const messageId = Date.now().toString()
        const storage = DatabaseMessageStorage.getInstance()
        
        try {
          await storage.store(messageId, userId, {
            sqlQuery: result.sqlQuery,
            responseData: {
              content: result.response,
              evidence: result.evidence || [],
              insights: result.contextualInsights || [],
              queryResults: result.queryResults || [],
              dataSource: result.agentUsed,
              query: latestMessage,
              timestamp: new Date().toISOString(),
              recordCount: result.queryResults?.length || 0,
              enhanced: {
                cached: result.cached || false,
                uploads: uploads.map(u => ({ fileId: u.fileId, type: u.type })),
                thinking: result.thinkingProcess,
                memoryContext: result.memoryContext?.contextSummary,
                followUpSuggestions: result.followUpSuggestions
              }
            }
          })
        } catch (storageError) {
          console.error('Failed to store enhanced message data:', storageError)
          // Continue without storage (non-critical)
        }
      }

      return NextResponse.json({
        success: true,
        content: result.response || 'Enhanced analysis completed',
        sqlQuery: result.sqlQuery || null,
        reasoning: result.thinkingProcess || null,
        contextualInsights: result.contextualInsights || [],
        followUpSuggestions: result.followUpSuggestions || [],
        metadata: {
          dataSource: result.agentUsed,
          hasError: !!result.error,
          model: 'gemini-2.5-flash',
          confidence: result.confidence || 85,
          sources: ['database', 'ai_model', 'cache', 'memory'],
          processingTime: Date.now(),
          userId: userId,
          conversationId: conversationId,
          enhanced: {
            cached: result.cached || false,
            uploadCount: uploads.length,
            thinkingEnabled: enableThinking,
            memoryEnhanced: !!result.memoryContext,
            cacheEnabled: useCache
          },
          performance: {
            cacheHit: result.cached || false,
            uploadProcessing: uploads.length > 0,
            memoryRetrieval: !!result.memoryContext,
            thinkingProcess: !!result.thinkingProcess
          }
        }
      })
    } catch (agentError) {
      console.error('Agent execution error:', agentError)
      return NextResponse.json({
        success: false,
        error: `Agent execution failed: ${agentError instanceof Error ? agentError.message : 'Unknown error'}`
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Agent API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process agent request'
    }, { status: 500 })
  }
}

export async function GET() {
  // Enhanced health check endpoint
  const cache = SmartHeadCacheService.getInstance()
  const geminiClient = EnhancedGeminiClient.getInstance()
  
  try {
    const [cacheStats, geminiTest] = await Promise.all([
      cache.getCacheStats(),
      geminiClient.testConnection()
    ])

    return NextResponse.json({
      status: 'healthy',
      agent: 'Enhanced Smart Head Agent',
      version: '2.0.0',
      capabilities: [
        'Redis caching for performance optimization',
        'Gemini 2.5 Flash with thinking capabilities',
        'File upload and multimodal analysis',
        'LangGraph memory framework integration',
        'Multi-dataset analysis (Coupa, Baan)',
        'SQL generation with caching',
        'Streaming responses with enhanced metadata',
        'Context-aware memory management',
        'User preference learning and adaptation',
        'Upload-aware query routing',
        'Thinking process visualization',
        'Semantic search integration'
      ],
      config: {
        primaryModel: 'gemini-2.5-flash-lite-preview-09-2025',
        supportedDataSources: ['coupa', 'baan', 'combined'],
        maxTokens: 60000,
        thinkingEnabled: true,
        cacheEnabled: true,
        uploadsSupported: true,
        memoryFramework: 'LangGraph'
      },
      systems: {
        cache: {
          status: cacheStats.connected ? 'connected' : 'disconnected',
          keyCount: cacheStats.keyCount || 0
        },
        gemini: {
          status: geminiTest.success ? 'connected' : 'disconnected',
          model: geminiTest.model,
          capabilities: geminiTest.capabilities
        },
        uploads: {
          status: 'ready',
          supportedTypes: ['chart', 'csv', 'document', 'image']
        },
        memory: {
          status: 'ready',
          types: ['semantic', 'episodic', 'procedural']
        }
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      error: 'Some systems unavailable',
      agent: 'Enhanced Smart Head Agent',
      version: '2.0.0'
    }, { status: 503 })
  }
}