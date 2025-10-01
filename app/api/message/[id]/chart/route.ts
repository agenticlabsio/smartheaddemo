import { NextRequest, NextResponse } from 'next/server'
import { unifiedStorage } from '@/lib/storage/unified-storage'
import { auth } from '@clerk/nextjs/server'

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'scatter';
  title: string;
  data: ChartData[];
  config: {
    xAxis?: { dataKey: string; label?: string };
    yAxis?: { label?: string };
    series: { dataKey: string; name: string; color?: string }[];
  };
  insights: string[];
}

// Enhanced chart generation for Baan procurement data
function generateChartFromData(data: any, sqlQuery: string): ChartConfig | null {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null
  }

  const sample = data[0]
  const keys = Object.keys(sample)
  
  // Baan-specific column detection
  const spendKeys = keys.filter(key => 
    key.toLowerCase().includes('spend') ||
    key.toLowerCase().includes('total') ||
    key.toLowerCase().includes('amount') ||
    key.toLowerCase().includes('reporting_total')
  )
  
  const countKeys = keys.filter(key =>
    key.toLowerCase().includes('count') ||
    key.toLowerCase().includes('transaction') ||
    key.toLowerCase().includes('frequency')
  )
  
  const supplierKeys = keys.filter(key =>
    key.toLowerCase().includes('supplier')
  )
  
  const categoryKeys = keys.filter(key =>
    key.toLowerCase().includes('commodity') ||
    key.toLowerCase().includes('category') ||
    key.toLowerCase().includes('group')
  )
  
  const timeKeys = keys.filter(key =>
    key.toLowerCase().includes('month') ||
    key.toLowerCase().includes('quarter') ||
    key.toLowerCase().includes('year') ||
    key.toLowerCase().includes('date')
  )

  // Determine best chart type and configuration
  let chartType: 'bar' | 'pie' | 'line' | 'scatter' = 'bar'
  let valueKey = spendKeys[0] || countKeys[0] || keys.find(k => typeof sample[k] === 'number')
  let labelKey = supplierKeys[0] || categoryKeys[0] || keys.find(k => typeof sample[k] === 'string')
  let title = 'Analysis'
  
  if (!valueKey || !labelKey) return null

  // Chart type logic
  if (timeKeys.length > 0) {
    chartType = 'line'
    labelKey = timeKeys[0]
    title = 'Trends Over Time'
  } else if (supplierKeys.length > 0 && spendKeys.length > 0) {
    chartType = data.length <= 8 ? 'pie' : 'bar'
    title = 'Supplier Spending Analysis'
  } else if (categoryKeys.length > 0) {
    chartType = data.length <= 6 ? 'pie' : 'bar' 
    title = 'Category Analysis'
  } else if (countKeys.length > 0 && spendKeys.length > 0) {
    chartType = 'scatter'
    title = 'Spend vs Transaction Analysis'
  }

  // Transform data for chart
  let chartData: ChartData[]
  
  if (chartType === 'scatter' && countKeys.length > 0 && spendKeys.length > 0) {
    // Scatter plot with x=count, y=spend
    chartData = data.slice(0, 20).map((row, index) => ({
      name: String(row[labelKey] || `Item ${index + 1}`),
      value: parseFloat(String(row[spendKeys[0]] || 0).replace(/[^0-9.-]/g, '')) || 0,
      count: parseFloat(String(row[countKeys[0]] || 0).replace(/[^0-9.-]/g, '')) || 0,
      x: parseFloat(String(row[countKeys[0]] || 0).replace(/[^0-9.-]/g, '')) || 0,
      y: parseFloat(String(row[spendKeys[0]] || 0).replace(/[^0-9.-]/g, '')) || 0
    })).filter(item => item.value > 0 && item.count > 0)
  } else {
    // Standard bar/pie/line chart
    chartData = data.slice(0, chartType === 'pie' ? 8 : 15).map((row, index) => ({
      name: String(row[labelKey] || `Item ${index + 1}`).substring(0, 30), // Truncate long names
      value: parseFloat(String(row[valueKey] || 0).replace(/[^0-9.-]/g, '')) || 0
    })).filter(item => item.value > 0)
  }

  if (chartData.length === 0) return null

  // Sort data appropriately
  if (chartType !== 'line') {
    chartData.sort((a, b) => b.value - a.value)
  }

  // Generate insights
  const insights = generateInsights(chartData, chartType, title, valueKey)

  // Configure chart
  const config = {
    xAxis: chartType === 'scatter' 
      ? { dataKey: 'x', label: countKeys[0] || 'Count' }
      : chartType === 'line' 
      ? { dataKey: 'name', label: labelKey }
      : undefined,
    yAxis: { 
      label: chartType === 'scatter' 
        ? spendKeys[0] || 'Spend' 
        : valueKey.includes('spend') || valueKey.includes('total') 
        ? 'Amount ($)' 
        : 'Count'
    },
    series: [
      {
        dataKey: chartType === 'scatter' ? 'y' : 'value',
        name: valueKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        color: getChartColor(chartType)
      }
    ]
  }

  return {
    type: chartType,
    title,
    data: chartData,
    config,
    insights
  }
}

// Generate insights based on chart data
function generateInsights(data: ChartData[], chartType: string, title: string, valueKey: string): string[] {
  const insights: string[] = []
  
  if (data.length === 0) return insights

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const topItem = data[0]
  const topPercentage = ((topItem.value / total) * 100).toFixed(1)
  
  // Top performer insight
  insights.push(`${topItem.name} leads with ${topPercentage}% of total ${valueKey.includes('spend') ? 'spending' : 'volume'}`)
  
  // Concentration analysis
  if (data.length >= 3) {
    const top3Total = data.slice(0, 3).reduce((sum, item) => sum + item.value, 0)
    const top3Percentage = ((top3Total / total) * 100).toFixed(1)
    insights.push(`Top 3 items represent ${top3Percentage}% of total`)
  }
  
  // Distribution insights
  if (chartType === 'pie' && parseFloat(topPercentage) > 50) {
    insights.push('High concentration risk detected - consider diversification')
  } else if (chartType === 'bar' && data.length > 10) {
    insights.push('Well-distributed portfolio with multiple significant contributors')
  }
  
  // Value-specific insights
  if (valueKey.includes('spend') || valueKey.includes('total')) {
    const avgValue = total / data.length
    const formattedAvg = avgValue > 1000000 
      ? `$${(avgValue / 1000000).toFixed(1)}M` 
      : avgValue > 1000 
      ? `$${(avgValue / 1000).toFixed(1)}K` 
      : `$${avgValue.toFixed(0)}`
    insights.push(`Average value per item: ${formattedAvg}`)
  }
  
  return insights
}

// Get appropriate color for chart type
function getChartColor(chartType: string): string {
  const colors = {
    bar: '#8884d8',
    pie: '#8884d8', 
    line: '#82ca9d',
    scatter: '#ffc658'
  }
  return colors[chartType as keyof typeof colors] || '#8884d8'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const messageId = id
    
    // First try to get evidence data from the evidence API (use localhost to avoid SSL issues)
    const evidenceResponse = await fetch(`http://localhost:5000/api/message/${id}/evidence`)
    
    let chartData: ChartConfig | null = null
    
    if (evidenceResponse.ok) {
      const evidenceData = await evidenceResponse.json()
      
      // Check if data is chartable
      if (evidenceData.chartable && evidenceData.rows?.length > 0) {
        chartData = generateChartFromData(evidenceData.rows, evidenceData.sqlQuery || '')
      }
    } else {
      // Fallback to stored data if evidence API fails
      const responseData = await unifiedStorage.getMessageResponseData(messageId, userId)
      const sqlQuery = await unifiedStorage.getMessageSQLQuery(messageId, userId)
      
      if (responseData) {
        chartData = generateChartFromData(responseData, sqlQuery || '')
      }
    }

    if (!chartData) {
      return NextResponse.json(
        { error: 'Unable to generate chart from available data' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId,
      ...chartData
    })
  } catch (error) {
    console.error('Error generating chart:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate chart',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}