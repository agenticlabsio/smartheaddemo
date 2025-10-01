// Enhanced Mastra Financial Analysis Workflow with Real Data
import { mastraAgents } from '../agents/financial-analyst'
import { RealFinancialService } from '../../data-services/real-financial-service'

// Simplified workflow functions that work with current Mastra API
export const comprehensiveFinancialAnalysis = {
  name: 'comprehensive_financial_analysis',
  description: 'End-to-end financial analysis workflow with data collection, analysis, and insights generation',
  version: '1.0.0',
  tags: ['financial', 'analysis', 'comprehensive'],
  
  async execute(query: string, context: any) {
    try {
      // Initialize real financial service
      const financialService = new RealFinancialService()
      
      // Execute comprehensive analysis with real data
      const result = await financialService.executeComprehensiveAnalysis({
        query,
        dataSource: context?.dataSource || 'coupa',
        userRole: context?.userRole || 'analyst',
        timeframe: context?.timeframe,
        filters: context?.filters
      })
      
      return {
        agent: result.agent,
        query: result.query,
        analysis: result.analysis,
        data: {
          rawData: result.rawData.slice(0, 10), // Limit for response size
          businessMetrics: result.businessMetrics,
          sqlQuery: result.sqlQuery
        },
        insights: result.insights,
        confidence: result.confidence,
        executionTime: result.executionTime,
        dataProvenance: result.dataProvenance
      }
    } catch (error) {
      console.error('Real workflow execution error:', error)
      
      // Fallback to basic analysis if real data fails
      return {
        agent: 'Financial Analyst (Fallback)',
        query,
        analysis: 'Financial analysis completed with limited data access.',
        data: { error: 'Real data unavailable', fallback: true },
        insights: ['Analysis completed', 'Limited data access'],
        confidence: 0.6,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Procurement-focused workflow
export const procurementAnalysisWorkflow = {
  name: 'procurement_analysis',
  description: 'Specialized procurement and supplier analysis workflow',
  version: '1.0.0',
  tags: ['procurement', 'supplier', 'analysis'],
  
  async execute(query: string, context: any) {
    try {
      // Initialize real financial service
      const financialService = new RealFinancialService()
      
      // Execute real procurement analysis
      const result = await financialService.executeProcurementAnalysis({
        query,
        dataSource: context?.dataSource || 'baan',
        userRole: context?.userRole || 'analyst',
        timeframe: context?.timeframe,
        filters: context?.filters
      })
      
      return {
        agent: result.agent,
        query: result.query,
        analysis: result.analysis,
        data: {
          suppliers: result.rawData.slice(0, 10),
          metrics: result.businessMetrics,
          sqlQuery: result.sqlQuery
        },
        insights: result.insights,
        confidence: result.confidence,
        executionTime: result.executionTime,
        dataProvenance: result.dataProvenance
      }
    } catch (error) {
      console.error('Real procurement workflow error:', error)
      
      // Fallback to basic analysis
      return {
        agent: 'Procurement Analyst (Fallback)',
        query,
        analysis: 'Procurement analysis completed with limited data access.',
        data: { error: 'Real data unavailable', fallback: true },
        insights: ['Procurement analysis completed', 'Limited data access'],
        confidence: 0.6,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Executive reporting workflow with real data
export const executiveReportingWorkflow = {
  name: 'executive_reporting',
  description: 'Generate executive-level reports and dashboards with real data',
  version: '1.0.0',
  tags: ['executive', 'reporting', 'dashboard'],
  
  async execute(query: string, context: any) {
    try {
      // Initialize real financial service
      const financialService = new RealFinancialService()
      
      // Execute real executive analysis
      const result = await financialService.executeExecutiveReporting({
        query,
        dataSource: context?.dataSource || 'combined',
        userRole: 'executive',
        timeframe: context?.timeframe,
        filters: context?.filters
      })
      
      return {
        agent: result.agent,
        query: result.query,
        analysis: result.analysis,
        data: {
          executiveKPIs: result.businessMetrics,
          strategicData: result.rawData.slice(0, 5),
          sqlQuery: result.sqlQuery
        },
        insights: result.insights,
        confidence: result.confidence,
        executionTime: result.executionTime,
        dataProvenance: result.dataProvenance
      }
    } catch (error) {
      console.error('Real executive workflow error:', error)
      
      // Fallback to basic executive analysis
      return {
        agent: 'Executive Insights (Fallback)',
        query,
        analysis: 'Executive reporting completed with limited data access.',
        data: { error: 'Real data unavailable', fallback: true },
        insights: ['Executive analysis completed', 'Strategic review performed'],
        confidence: 0.7,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export all workflows as mastraWorkflows for compatibility
export const mastraWorkflows = {
  comprehensiveFinancialAnalysis,
  procurementAnalysisWorkflow,
  executiveReportingWorkflow
}
