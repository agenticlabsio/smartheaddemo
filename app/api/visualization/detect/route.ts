import { NextRequest, NextResponse } from 'next/server'

interface DetectionRequest {
  messageContent: string;
  sqlQuery?: string;
  responseMetadata?: {
    queryType?: string;
    source?: string;
  };
}

interface DetectionResponse {
  shouldVisualize: boolean;
  recommendedChart: 'bar' | 'pie' | 'line' | 'scatter' | null;
  reasoning: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number; // 0-1 scale
}

// Keywords that indicate high visualization value
const HIGH_PRIORITY_KEYWORDS = [
  'spending by supplier', 'supplier analysis', 'supplier concentration',
  'category breakdown', 'commodity analysis', 'spend distribution',
  'trends over time', 'quarterly', 'monthly patterns',
  'top suppliers', 'largest categories', 'comparison',
  'risk analysis', 'concentration risk', 'diversification'
]

const MEDIUM_PRIORITY_KEYWORDS = [
  'analysis', 'breakdown', 'distribution', 'comparison',
  'patterns', 'efficiency', 'performance', 'across',
  'by category', 'by supplier', 'group by'
]

const LOW_PRIORITY_KEYWORDS = [
  'total', 'sum', 'count', 'average', 'single', 'individual'
]

// SQL patterns that indicate visualization opportunities
const SQL_VISUALIZATION_PATTERNS = [
  { pattern: /group by.*supplier/i, chart: 'bar', priority: 'HIGH' },
  { pattern: /group by.*commodity/i, chart: 'bar', priority: 'HIGH' },
  { pattern: /group by.*category/i, chart: 'pie', priority: 'HIGH' },
  { pattern: /sum.*reporting_total.*group by/i, chart: 'bar', priority: 'HIGH' },
  { pattern: /count.*group by/i, chart: 'bar', priority: 'MEDIUM' },
  { pattern: /(month|quarter|year).*group by/i, chart: 'line', priority: 'HIGH' },
  { pattern: /order by.*desc.*limit/i, chart: 'bar', priority: 'MEDIUM' },
  { pattern: /having.*sum/i, chart: 'bar', priority: 'MEDIUM' }
] as const

function analyzeMessageContent(content: string): { score: number; keywords: string[] } {
  const lowerContent = content.toLowerCase()
  const foundKeywords: string[] = []
  let score = 0

  // Check for high priority keywords
  HIGH_PRIORITY_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score += 3
    }
  })

  // Check for medium priority keywords
  MEDIUM_PRIORITY_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score += 2
    }
  })

  // Check for low priority keywords (might indicate single values, less visual)
  LOW_PRIORITY_KEYWORDS.forEach(keyword => {
    if (lowerContent.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword)
      score -= 1
    }
  })

  return { score, keywords: foundKeywords }
}

function analyzeSQLQuery(sql: string): { 
  score: number; 
  recommendedChart: 'bar' | 'pie' | 'line' | 'scatter' | null;
  patterns: string[] 
} {
  if (!sql) return { score: 0, recommendedChart: null, patterns: [] }

  let score = 0
  let recommendedChart: 'bar' | 'pie' | 'line' | 'scatter' | null = null
  const foundPatterns: string[] = []

  // Check SQL patterns
  for (const { pattern, chart, priority } of SQL_VISUALIZATION_PATTERNS) {
    if (pattern.test(sql)) {
      foundPatterns.push(pattern.source)
      
      if (priority === 'HIGH') {
        score += 4
        if (!recommendedChart) recommendedChart = chart as any
      } else if (priority === 'MEDIUM') {
        score += 2
        if (!recommendedChart) recommendedChart = chart as any
      }
    }
  }

  // Bonus for GROUP BY with aggregates (very chart-friendly)
  if (/group by/i.test(sql) && /(sum|count|avg|max|min)\(/i.test(sql)) {
    score += 2
  }

  // Penalty for simple SELECT without aggregation
  if (!/group by/i.test(sql) && !/sum|count|avg|max|min/i.test(sql)) {
    score -= 2
  }

  return { score, recommendedChart, patterns: foundPatterns }
}

function determineChartType(
  messageContent: string, 
  sqlQuery: string, 
  sqlRecommendation: string | null
): 'bar' | 'pie' | 'line' | 'scatter' | null {
  
  // Start with SQL recommendation
  if (sqlRecommendation) return sqlRecommendation as any

  const lowerContent = messageContent.toLowerCase()
  const lowerSql = sqlQuery.toLowerCase()

  // Time-based analysis → Line chart
  if (lowerContent.includes('trends') || lowerContent.includes('over time') ||
      lowerSql.includes('month') || lowerSql.includes('quarter')) {
    return 'line'
  }

  // Risk/efficiency analysis with multiple metrics → Scatter
  if ((lowerContent.includes('risk') && lowerContent.includes('efficiency')) ||
      (lowerContent.includes('performance') && lowerContent.includes('analysis'))) {
    return 'scatter'
  }

  // Small number of categories → Pie chart
  if (lowerContent.includes('distribution') || lowerContent.includes('breakdown')) {
    return 'pie'
  }

  // Default to bar chart for comparisons
  return 'bar'
}

function calculateConfidence(
  contentScore: number,
  sqlScore: number,
  hasValidData: boolean = true
): number {
  const baseScore = (contentScore + sqlScore) / 10 // Normalize to 0-1
  
  // Adjust for data availability
  const dataMultiplier = hasValidData ? 1.0 : 0.5
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, baseScore * dataMultiplier))
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectionRequest = await request.json()
    const { messageContent, sqlQuery = '', responseMetadata } = body

    if (!messageContent) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Analyze message content
    const contentAnalysis = analyzeMessageContent(messageContent)
    
    // Analyze SQL query
    const sqlAnalysis = analyzeSQLQuery(sqlQuery)
    
    // Calculate total score
    const totalScore = contentAnalysis.score + sqlAnalysis.score
    
    // Determine if visualization is recommended
    const shouldVisualize = totalScore > 2
    
    // Determine priority
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
    if (totalScore >= 6) priority = 'HIGH'
    else if (totalScore >= 3) priority = 'MEDIUM'
    
    // Determine recommended chart type
    const recommendedChart = shouldVisualize 
      ? determineChartType(messageContent, sqlQuery, sqlAnalysis.recommendedChart)
      : null
    
    // Calculate confidence
    const confidence = calculateConfidence(contentAnalysis.score, sqlAnalysis.score)
    
    // Generate reasoning
    let reasoning = ''
    if (shouldVisualize) {
      const reasons = []
      
      if (contentAnalysis.keywords.length > 0) {
        reasons.push(`Found visualization keywords: ${contentAnalysis.keywords.slice(0, 3).join(', ')}`)
      }
      
      if (sqlAnalysis.patterns.length > 0) {
        reasons.push(`SQL contains chart-friendly patterns (GROUP BY with aggregations)`)
      }
      
      if (recommendedChart) {
        const chartReasons = {
          bar: 'for comparing values across categories',
          pie: 'for showing distribution/breakdown',
          line: 'for displaying trends over time',
          scatter: 'for analyzing relationships between metrics'
        }
        reasons.push(`${recommendedChart} chart recommended ${chartReasons[recommendedChart]}`)
      }
      
      reasoning = reasons.join('. ')
    } else {
      reasoning = 'Content appears to focus on single values or text-based analysis rather than comparative data visualization'
    }

    const response: DetectionResponse = {
      shouldVisualize,
      recommendedChart,
      reasoning,
      priority,
      confidence: Math.round(confidence * 100) / 100 // Round to 2 decimal places
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in visualization detection:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze visualization opportunities',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for simple query analysis
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const sql = searchParams.get('sql')
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
      { status: 400 }
    )
  }

  // Use POST logic with simpler interface
  const detection = await POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      messageContent: query,
      sqlQuery: sql || ''
    })
  }))

  return detection
}