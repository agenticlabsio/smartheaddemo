// API endpoint to test the enhanced agentic system
import { NextRequest, NextResponse } from 'next/server'
import { runMockedEnhancedSystemTest } from '@/lib/tests/mocked-enhanced-system-test'

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Starting Enhanced Agentic System Test...')
    
    const testResults = await runMockedEnhancedSystemTest()
    
    return NextResponse.json({
      success: true,
      testResults,
      message: 'Enhanced agentic system test completed successfully'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Enhanced system test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Enhanced agentic system test failed'
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Enhanced Agentic System Test Endpoint',
    description: 'POST to run comprehensive tests of the enhanced agentic architecture',
    features: [
      'Intelligent Query Routing',
      'Collaborative Agent Framework', 
      'Real Data Integration',
      'SQL Tool Framework',
      'Reflection and Self-Critique',
      'Memory Integration',
      'End-to-End Accuracy Verification'
    ]
  })
}