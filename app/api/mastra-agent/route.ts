// Mastra Agent API Route - Replaces existing agent routes
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { mastraRouter } from '@/lib/mastra/mastra-agent-router'
import { UserContext } from '@/lib/mastra/config'

export async function POST(request: NextRequest) {
  try {
    // Get user authentication from Clerk
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { query, dataSource, analysisType = 'detailed', userRole = 'analyst' } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Create user context for Mastra agents
    const userContext: UserContext = {
      userId,
      role: userRole,
      preferences: {
        defaultDataSource: dataSource || 'combined',
        analysisDepth: analysisType,
        visualizationStyle: 'mixed'
      }
    }

    // Route query through Mastra agent system
    const result = await mastraRouter.routeQuery({
      query,
      userContext,
      requestedDataSource: dataSource,
      analysisType
    })

    // Format response for existing frontend
    const response = {
      success: true,
      agent: result.agent,
      response: result.result?.content || result.result,
      executionTime: result.executionTime,
      confidence: result.confidence,
      workflow: result.workflow,
      metadata: {
        timestamp: new Date().toISOString(),
        userId,
        agent: result.agent,
        dataSource: dataSource || 'combined'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Mastra agent error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        agent: 'error_handler'
      },
      { status: 500 }
    )
  }
}

// Streaming endpoint for real-time responses
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Authentication required', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const dataSource = searchParams.get('dataSource')
    const userRole = searchParams.get('userRole') || 'analyst'

    if (!query) {
      return new Response('Query parameter required', { status: 400 })
    }

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const userContext: UserContext = {
            userId,
            role: userRole as any,
            preferences: {
              defaultDataSource: (dataSource as any) || 'combined',
              analysisDepth: 'detailed',
              visualizationStyle: 'mixed'
            }
          }

          // Start analysis
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'start', 
              message: 'Starting financial analysis...',
              agent: 'mastra_router'
            })}\n\n`)
          )

          const result = await mastraRouter.routeQuery({
            query,
            userContext,
            requestedDataSource: dataSource as any,
            analysisType: 'detailed'
          })

          // Send result chunks if available
          if (result.result?.content) {
            const chunks = result.result.content.split('\n')
            for (const chunk of chunks) {
              if (chunk.trim()) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'content', 
                    content: chunk,
                    agent: result.agent
                  })}\n\n`)
                )
              }
            }
          } else {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'content', 
                content: JSON.stringify(result.result),
                agent: result.agent
              })}\n\n`)
            )
          }

          // Send completion
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'done', 
              executionTime: result.executionTime,
              confidence: result.confidence,
              agent: result.agent
            })}\n\n`)
          )

          controller.close()

        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`)
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Streaming error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}