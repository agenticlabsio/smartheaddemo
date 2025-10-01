// Structured Report Templates for Business Analytics

export type QueryCategory = 
  | 'spend_analysis'
  | 'supplier_performance' 
  | 'cost_center_analysis'
  | 'volatility_trends'
  | 'compliance_risk'
  | 'general_analysis'

export interface ReportTemplate {
  category: QueryCategory
  sections: {
    title: string
    description: string
    format: 'metrics' | 'insights' | 'recommendations' | 'timeline'
  }[]
}

export interface StructuredReportData {
  category: QueryCategory
  title: string
  executiveSummary: string
  keyMetrics: Array<{
    label: string
    value: string
    trend?: string
    significance: 'high' | 'medium' | 'low'
  }>
  insights: string[]
  recommendations: Array<{
    priority: 'immediate' | 'short_term' | 'long_term'
    action: string
    impact: string
  }>
  dataContext: {
    period: string
    recordCount: number
    dataSource: string
    limitations?: string[]
  }
}

export const REPORT_TEMPLATES: Record<QueryCategory, ReportTemplate> = {
  spend_analysis: {
    category: 'spend_analysis',
    sections: [
      { title: 'Spend Overview', description: 'Total spend, period comparison, key trends', format: 'metrics' },
      { title: 'Spend Distribution', description: 'Category breakdown, top contributors', format: 'insights' },
      { title: 'Optimization Opportunities', description: 'Cost reduction potential, efficiency gains', format: 'recommendations' }
    ]
  },
  
  supplier_performance: {
    category: 'supplier_performance',
    sections: [
      { title: 'Supplier Metrics', description: 'Performance indicators, volume analysis', format: 'metrics' },
      { title: 'Performance Analysis', description: 'Quality, delivery, compliance patterns', format: 'insights' },
      { title: 'Supplier Strategy', description: 'Relationship management, risk mitigation', format: 'recommendations' }
    ]
  },
  
  cost_center_analysis: {
    category: 'cost_center_analysis',
    sections: [
      { title: 'Cost Center Performance', description: 'Budget vs actual, variance analysis', format: 'metrics' },
      { title: 'Spending Patterns', description: 'Trends, anomalies, efficiency metrics', format: 'insights' },
      { title: 'Budget Optimization', description: 'Reallocation opportunities, controls', format: 'recommendations' }
    ]
  },
  
  volatility_trends: {
    category: 'volatility_trends',
    sections: [
      { title: 'Volatility Metrics', description: 'Standard deviation, variance analysis', format: 'metrics' },
      { title: 'Trend Analysis', description: 'Seasonal patterns, anomaly detection', format: 'timeline' },
      { title: 'Volatility Management', description: 'Stabilization strategies, risk controls', format: 'recommendations' }
    ]
  },
  
  compliance_risk: {
    category: 'compliance_risk',
    sections: [
      { title: 'Compliance Metrics', description: 'Adherence rates, exception analysis', format: 'metrics' },
      { title: 'Risk Assessment', description: 'Control gaps, exposure analysis', format: 'insights' },
      { title: 'Risk Mitigation', description: 'Control improvements, process enhancements', format: 'recommendations' }
    ]
  },
  
  general_analysis: {
    category: 'general_analysis',
    sections: [
      { title: 'Analysis Summary', description: 'Key findings and metrics', format: 'metrics' },
      { title: 'Business Insights', description: 'Patterns and implications', format: 'insights' },
      { title: 'Next Steps', description: 'Recommended actions', format: 'recommendations' }
    ]
  }
}

export function categorizeQuery(query: string): QueryCategory {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('volatility') || queryLower.includes('variance') || queryLower.includes('fluctuation')) {
    return 'volatility_trends'
  }
  
  if (queryLower.includes('cost center') || queryLower.includes('cost centre') || queryLower.includes('department')) {
    return 'cost_center_analysis'
  }
  
  if (queryLower.includes('supplier') || queryLower.includes('vendor')) {
    return 'supplier_performance'
  }
  
  if (queryLower.includes('spend') || queryLower.includes('spending') || queryLower.includes('cost')) {
    return 'spend_analysis'
  }
  
  if (queryLower.includes('compliance') || queryLower.includes('risk') || queryLower.includes('control')) {
    return 'compliance_risk'
  }
  
  return 'general_analysis'
}

export function formatStructuredReport(data: StructuredReportData): string {
  const template = REPORT_TEMPLATES[data.category]
  
  let report = `# ${data.title.toUpperCase()}\n\n`
  
  // Executive Summary
  report += `## Executive Summary\n\n${data.executiveSummary}\n\n`
  
  // Key Metrics Section
  if (data.keyMetrics.length > 0) {
    report += `## Key Performance Indicators\n\n`
    data.keyMetrics.forEach(metric => {
      report += `**${metric.label}**: ${metric.value}`
      if (metric.trend) {
        report += ` (${metric.trend})`
      }
      report += `\n\n`
    })
  }
  
  // Business Insights
  if (data.insights.length > 0) {
    report += `## Business Insights\n\n`
    data.insights.forEach((insight) => {
      report += `${insight}\n\n`
    })
  }
  
  // Strategic Recommendations
  if (data.recommendations.length > 0) {
    report += `## Strategic Recommendations\n\n`
    
    const immediateActions = data.recommendations.filter(r => r.priority === 'immediate')
    const shortTermActions = data.recommendations.filter(r => r.priority === 'short_term')
    const longTermActions = data.recommendations.filter(r => r.priority === 'long_term')
    
    if (immediateActions.length > 0) {
      report += `### Immediate Actions\n\n`
      immediateActions.forEach(action => {
        report += `**${action.action}**: ${action.impact}\n\n`
      })
    }
    
    if (shortTermActions.length > 0) {
      report += `### Short-term Initiatives\n\n`
      shortTermActions.forEach(action => {
        report += `**${action.action}**: ${action.impact}\n\n`
      })
    }
    
    if (longTermActions.length > 0) {
      report += `### Long-term Strategy\n\n`
      longTermActions.forEach(action => {
        report += `**${action.action}**: ${action.impact}\n\n`
      })
    }
  }
  
  // Data Context Footer
  report += `---\n\n`
  report += `*Analysis Period: ${data.dataContext.period}*  \n`
  report += `*Data Source: ${data.dataContext.dataSource}*  \n`
  report += `*Records Analyzed: ${data.dataContext.recordCount.toLocaleString()}*\n`
  
  if (data.dataContext.limitations && data.dataContext.limitations.length > 0) {
    report += `\n**Data Limitations**: ${data.dataContext.limitations.join(', ')}\n`
  }
  
  return report
}