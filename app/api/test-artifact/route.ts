import { NextRequest } from 'next/server'

// Test endpoint to demonstrate artifact functionality
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = body

    // Create a structured response that will trigger artifacts
    const artifactResponse = `# Financial Analysis Results

**Query:** ${query}

## Executive Summary
Your FinSight platform has successfully completed a comprehensive financial analysis of your $86.6M transaction dataset. This report provides detailed insights into spending patterns, supplier performance, and budget variances across multiple departments and business units.

## Key Findings
• **Top Supplier Concentration:** 42% of total spend is concentrated among top 3 suppliers (Global Supply Co: $15.2M, Tech Solutions Inc: $12.8M, Manufacturing Corp: $9.4M)
• **Budget Variance Analysis:** CFO budget shows $2.7M variance (8.2% over budget) requiring immediate attention
• **Working Capital Impact:** $4.2M in working capital optimization opportunities identified
• **Quarterly Performance:** Q4 2023 showed 8.5% spending increase compared to Q3 2023
• **Risk Assessment:** Medium concentration risk due to supplier dependency patterns

## Recommendations
1. **Diversify Supplier Base** - Reduce dependency on top 3 suppliers to mitigate concentration risk
2. **Implement Cost Controls** - Address the $2.7M budget variance through enhanced approval workflows
3. **Optimize Working Capital** - Pursue the identified $4.2M optimization opportunities
4. **Enhance Monitoring** - Implement real-time budget tracking to prevent future variances
5. **Strategic Sourcing** - Leverage spend volume for better contract terms and pricing

## Data Quality
**Completeness:** 95.2% of transaction records contain complete data
**Accuracy:** 98.7% data accuracy based on validation rules
**Timeliness:** Data refreshed within 24 hours of transaction posting

## Confidence Score
**Overall Analysis Confidence:** 87%
**Data Reliability:** High (based on ERP system integration)
**Methodology:** Statistical analysis with machine learning validation

*This analysis was generated using advanced AI agents with semantic catalog integration and represents the most current view of your financial performance as of ${new Date().toLocaleDateString()}.*`

    return Response.json({
      agent: 'Financial Analysis Engine',
      result: artifactResponse,
      isArtifact: true,
      success: true
    })

  } catch (error) {
    console.error('Test artifact error:', error)
    return Response.json({ 
      error: 'Failed to generate test artifact', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}