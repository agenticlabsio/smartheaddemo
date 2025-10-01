// Bulk Insight Generation API with Agent Orchestration
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BulkInsightOrchestrator, BulkInsightRequest } from '@/lib/bulk-insight-orchestrator'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body: BulkInsightRequest = await request.json()
    
    // Validate request
    if (!body.analysisType) {
      return NextResponse.json({
        success: false,
        error: 'Analysis type is required'
      }, { status: 400 })
    }

    // Add userId to request
    body.userId = userId

    const orchestrator = BulkInsightOrchestrator.getInstance()

    // Check if streaming is requested
    const isStreaming = request.headers.get('accept') === 'text/event-stream'

    if (isStreaming) {
      return handleStreamingRequest(body, orchestrator)
    }

    // Non-streaming bulk insight generation
    const result = await orchestrator.generateBulkInsights(body)

    return NextResponse.json({
      success: true,
      jobId: result.id,
      status: result.status,
      insights: result.insights,
      metadata: {
        analysisType: result.analysisType,
        executionTime: result.executionTime,
        confidence: result.confidence,
        dataSourcesUsed: result.dataSourcesUsed,
        totalQueries: result.totalQueries,
        recordsAnalyzed: result.recordsAnalyzed,
        completedAt: result.completedAt
      }
    })

  } catch (error) {
    console.error('Bulk insights API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate bulk insights'
    }, { status: 500 })
  }
}

// Streaming handler for real-time bulk insight generation
async function handleStreamingRequest(
  request: BulkInsightRequest,
  orchestrator: BulkInsightOrchestrator
): Promise<Response> {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial metadata
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'start',
          analysisType: request.analysisType,
          userId: request.userId,
          timestamp: new Date().toISOString()
        })}\n\n`))

        let jobId = ''
        let totalInsights = 0

        // Stream bulk insights as they're generated
        for await (const progress of orchestrator.streamBulkInsights(request)) {
          if (progress.id && !jobId) {
            jobId = progress.id
          }

          // Send progress updates
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            jobId: progress.id,
            status: progress.status,
            insights: progress.insights || [],
            totalQueries: progress.totalQueries || 0,
            timestamp: new Date().toISOString()
          })}\n\n`))

          // Count insights generated
          if (progress.insights) {
            totalInsights += progress.insights.length
          }

          // Send individual insight updates
          if (progress.insights && progress.insights.length > 0) {
            for (const insight of progress.insights) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'insight',
                jobId: progress.id,
                insight: {
                  title: insight.title,
                  category: insight.category,
                  priority: insight.priority,
                  summary: insight.summary,
                  confidence: insight.confidence,
                  dataSource: insight.dataSource
                },
                timestamp: new Date().toISOString()
              })}\n\n`))
            }
          }
        }

        // Send completion signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          jobId: jobId,
          totalInsights: totalInsights,
          message: 'Bulk insight generation completed',
          timestamp: new Date().toISOString()
        })}\n\n`))

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
        controller.close()

      } catch (error) {
        console.error('Streaming bulk insights error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown streaming error',
          timestamp: new Date().toISOString()
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
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }
  })
}

// GET endpoint for retrieving job status and results
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const url = new URL(request.url)
    const jobId = url.searchParams.get('jobId')
    const limit = parseInt(url.searchParams.get('limit') || '10')

    const orchestrator = BulkInsightOrchestrator.getInstance()

    if (jobId) {
      // Get specific job
      const job = await orchestrator.getJob(jobId)
      
      if (!job) {
        return NextResponse.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 })
      }

      // Check if user owns the job
      if (job.userId !== userId) {
        return NextResponse.json({
          success: false,
          error: 'Access denied'
        }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        job: job
      })
    } else {
      // Get user's jobs
      const jobs = await orchestrator.getUserJobs(userId, limit)
      
      return NextResponse.json({
        success: true,
        jobs: jobs,
        count: jobs.length
      })
    }

  } catch (error) {
    console.error('Bulk insights GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve bulk insights'
    }, { status: 500 })
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    },
  })
}