// Bulk Insights Status and Active Jobs API
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BulkInsightOrchestrator } from '@/lib/bulk-insight-orchestrator'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const orchestrator = BulkInsightOrchestrator.getInstance()
    
    // Get active jobs from database for cross-instance visibility
    const activeJobs = await orchestrator.getActiveJobs()
    
    // Filter to user's jobs only
    const userActiveJobs = activeJobs.filter(job => job.userId === userId)
    
    return NextResponse.json({
      success: true,
      activeJobs: userActiveJobs.map(job => ({
        id: job.id,
        analysisType: job.analysisType,
        status: job.status,
        createdAt: job.createdAt,
        currentInsights: job.insights.length,
        executionTime: job.executionTime
      })),
      totalActiveJobs: userActiveJobs.length,
      systemActiveJobs: activeJobs.length
    })

  } catch (error) {
    console.error('Bulk insights status API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get bulk insights status'
    }, { status: 500 })
  }
}