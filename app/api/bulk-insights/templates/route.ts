// Bulk Insights Analysis Templates API
import { NextResponse } from 'next/server'

export async function GET() {
  const templates = [
    {
      id: 'financial_overview',
      name: 'Financial Overview',
      description: 'Comprehensive financial analysis including cost groups, spending trends, and budget variance',
      estimatedTime: '2-3 minutes',
      queries: 5,
      categories: ['financial'],
      dataSources: ['coupa'],
      insights: [
        'Cost group spending breakdown',
        'Top cost centers by spending',
        'Entity spending trends',
        'Budget variance analysis',
        'Quarterly spending comparison'
      ]
    },
    {
      id: 'procurement_analysis',
      name: 'Procurement Analysis',
      description: 'In-depth procurement insights covering suppliers, commodities, and procurement efficiency',
      estimatedTime: '3-4 minutes',
      queries: 6,
      categories: ['procurement'],
      dataSources: ['baan'],
      insights: [
        'Top suppliers by spend',
        'Commodity spending breakdown',
        'Location-based procurement',
        'Supplier performance metrics',
        'Procurement efficiency trends',
        'Contract compliance analysis'
      ]
    },
    {
      id: 'risk_assessment',
      name: 'Risk Assessment',
      description: 'Comprehensive risk analysis identifying financial and operational risks',
      estimatedTime: '2-3 minutes',
      queries: 4,
      categories: ['risk'],
      dataSources: ['coupa', 'baan', 'combined'],
      insights: [
        'Supplier concentration risks',
        'Budget overspend risks',
        'Compliance risk factors',
        'Financial exposure analysis'
      ]
    },
    {
      id: 'performance_metrics',
      name: 'Performance Metrics',
      description: 'Key performance indicators and efficiency metrics across procurement operations',
      estimatedTime: '3-4 minutes',
      queries: 5,
      categories: ['performance'],
      dataSources: ['combined'],
      insights: [
        'Procurement efficiency metrics',
        'Cost savings opportunities',
        'Supplier KPI analysis',
        'Process optimization insights',
        'Performance benchmarking'
      ]
    },
    {
      id: 'comprehensive',
      name: 'Comprehensive Analysis',
      description: 'Complete business intelligence report covering all aspects of financial and procurement operations',
      estimatedTime: '8-10 minutes',
      queries: 20,
      categories: ['financial', 'procurement', 'risk', 'performance'],
      dataSources: ['coupa', 'baan', 'combined'],
      insights: [
        'Full financial overview',
        'Complete procurement analysis',
        'Comprehensive risk assessment',
        'Performance metrics across all areas',
        'Strategic recommendations',
        'Executive summary insights'
      ]
    }
  ]

  const timeframes = [
    {
      id: 'current_quarter',
      name: 'Current Quarter',
      description: 'Analysis for the current fiscal quarter'
    },
    {
      id: 'year_to_date',
      name: 'Year to Date',
      description: 'Analysis from beginning of fiscal year to present'
    },
    {
      id: 'last_12_months',
      name: 'Last 12 Months',
      description: 'Rolling 12-month analysis'
    },
    {
      id: 'custom',
      name: 'Custom Range',
      description: 'Specify custom date range for analysis'
    }
  ]

  const outputFormats = [
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level insights and key findings'
    },
    {
      id: 'detailed_analysis',
      name: 'Detailed Analysis',
      description: 'Comprehensive analysis with supporting data'
    },
    {
      id: 'dashboard_insights',
      name: 'Dashboard Insights',
      description: 'Key metrics optimized for dashboard display'
    },
    {
      id: 'all',
      name: 'All Formats',
      description: 'Complete analysis in all available formats'
    }
  ]

  return NextResponse.json({
    success: true,
    templates,
    timeframes,
    outputFormats,
    metadata: {
      totalTemplates: templates.length,
      averageExecutionTime: '3-5 minutes',
      supportedDataSources: ['coupa', 'baan', 'combined'],
      categories: ['financial', 'procurement', 'risk', 'performance', 'strategic']
    }
  })
}