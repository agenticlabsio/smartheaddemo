// Intelligent Agent Router for Multi-Dataset Analytics
import { QueryClassifier } from './query-classifier'
import { CoupaFinancialAgent } from './coupa-agent'
import { BaanProcurementAgent } from './baan-agent'
import { SimpleFinancialTransactionAgent } from './simple-agent'
import { RouterResult, ClassificationResult } from '@/lib/types'

export class SmartAgentRouter {
  private classifier: QueryClassifier
  private coupaAgent: CoupaFinancialAgent
  private baanAgent: BaanProcurementAgent
  private fallbackAgent: SimpleFinancialTransactionAgent

  constructor() {
    this.classifier = new QueryClassifier()
    this.coupaAgent = new CoupaFinancialAgent()
    this.baanAgent = new BaanProcurementAgent()
    this.fallbackAgent = new SimpleFinancialTransactionAgent()
  }

  async routeQuery(query: string, requestedDataSource?: 'coupa' | 'baan' | 'combined'): Promise<RouterResult> {
    const startTime = Date.now()
    
    try {
      // Step 1: Classify the query to determine optimal routing
      const classification = requestedDataSource 
        ? this.createManualClassification(requestedDataSource, query)
        : await this.classifier.classifyQuery(query)

      console.log('Query classification:', classification)

      // Step 2: Route to appropriate specialized agent
      const result = await this.executeWithSpecializedAgent(query, classification)
      
      // Step 3: Format and return result
      const executionTime = Date.now() - startTime
      return {
        ...result,
        classification,
        executionTime,
        confidence: classification.confidence
      }
    } catch (error) {
      console.error('Agent router error:', error)
      
      // Fallback to simple agent on error
      return this.executeFallback(query, Date.now() - startTime, error)
    }
  }

  private async executeWithSpecializedAgent(query: string, classification: ClassificationResult): Promise<Omit<RouterResult, 'classification' | 'executionTime' | 'confidence'>> {
    switch (classification.dataSource) {
      case 'coupa':
        return this.executeCoupaAgent(query)
        
      case 'baan':
        return this.executeBaanAgent(query)
        
      case 'combined':
        return this.executeCombinedAnalysis(query)
        
      default:
        return this.executeSimpleAgent(query, 'coupa')
    }
  }

  private async executeCoupaAgent(query: string): Promise<Omit<RouterResult, 'classification' | 'executionTime' | 'confidence'>> {
    try {
      const result = await this.coupaAgent.analyze(query)
      
      return {
        success: !result.error,
        response: result.response || 'Coupa financial analysis completed',
        sqlQuery: result.sqlQuery,
        queryResults: result.queryResults,
        evidence: result.evidence,
        insights: result.insights,
        error: result.error,
        agentUsed: 'coupa'
      }
    } catch (error) {
      console.error('Coupa agent execution error:', error)
      return {
        success: false,
        response: 'Coupa agent execution failed',
        error: error instanceof Error ? error.message : 'Unknown Coupa agent error',
        agentUsed: 'coupa'
      }
    }
  }

  private async executeBaanAgent(query: string): Promise<Omit<RouterResult, 'classification' | 'executionTime' | 'confidence'>> {
    try {
      const result = await this.baanAgent.analyze(query)
      
      return {
        success: !result.error,
        response: result.response || 'Baan procurement analysis completed',
        sqlQuery: result.sqlQuery,
        queryResults: result.queryResults,
        evidence: result.evidence,
        insights: result.insights,
        error: result.error,
        agentUsed: 'baan'
      }
    } catch (error) {
      console.error('Baan agent execution error:', error)
      return {
        success: false,
        response: 'Baan agent execution failed',
        error: error instanceof Error ? error.message : 'Unknown Baan agent error',
        agentUsed: 'baan'
      }
    }
  }

  private async executeCombinedAnalysis(query: string): Promise<Omit<RouterResult, 'classification' | 'executionTime' | 'confidence'>> {
    try {
      // For combined analysis, use the simple agent with combined data source
      const result = await this.fallbackAgent.invoke(query, 'combined')
      
      return {
        success: !result.error,
        response: result.response || 'Combined analysis completed',
        sqlQuery: result.sqlQuery,
        queryResults: result.queryResults,
        evidence: result.evidence,
        insights: result.insights,
        error: result.error,
        agentUsed: 'combined'
      }
    } catch (error) {
      console.error('Combined analysis execution error:', error)
      return {
        success: false,
        response: 'Combined analysis failed',
        error: error instanceof Error ? error.message : 'Unknown combined analysis error',
        agentUsed: 'combined'
      }
    }
  }

  private async executeSimpleAgent(query: string, dataSource: 'coupa' | 'baan' | 'combined'): Promise<Omit<RouterResult, 'classification' | 'executionTime' | 'confidence'>> {
    try {
      const result = await this.fallbackAgent.invoke(query, dataSource)
      
      return {
        success: !result.error,
        response: result.response || 'Analysis completed',
        sqlQuery: result.sqlQuery,
        queryResults: result.queryResults,
        evidence: result.evidence,
        insights: result.insights,
        error: result.error,
        agentUsed: 'simple'
      }
    } catch (error) {
      console.error('Simple agent execution error:', error)
      return {
        success: false,
        response: 'Simple agent execution failed',
        error: error instanceof Error ? error.message : 'Unknown simple agent error',
        agentUsed: 'simple'
      }
    }
  }

  private async executeFallback(query: string, executionTime: number, originalError: any): Promise<RouterResult> {
    try {
      const result = await this.fallbackAgent.invoke(query, 'coupa')
      
      return {
        success: !result.error,
        response: result.response || 'Fallback analysis completed',
        sqlQuery: result.sqlQuery,
        queryResults: result.queryResults,
        evidence: result.evidence,
        insights: result.insights,
        error: result.error,
        agentUsed: 'simple',
        executionTime,
        confidence: 30, // Low confidence for fallback
        classification: {
          dataSource: 'coupa',
          confidence: 30,
          reasoning: 'Fallback classification due to router error',
          keyTerms: [],
          analysisType: 'operational'
        }
      }
    } catch (fallbackError) {
      console.error('Fallback agent also failed:', fallbackError)
      
      return {
        success: false,
        response: 'All agents failed to process the query',
        error: `Router error: ${originalError instanceof Error ? originalError.message : 'Unknown error'}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error'}`,
        agentUsed: 'simple',
        executionTime,
        confidence: 0,
        classification: {
          dataSource: 'coupa',
          confidence: 0,
          reasoning: 'Complete routing failure',
          keyTerms: [],
          analysisType: 'operational'
        }
      }
    }
  }

  private createManualClassification(dataSource: 'coupa' | 'baan' | 'combined', query: string): ClassificationResult {
    const analysisTypeMap = {
      'coupa': 'financial' as const,
      'baan': 'procurement' as const,
      'combined': 'strategic' as const
    }

    return {
      dataSource,
      confidence: 95, // High confidence for manual specification
      reasoning: 'Manually specified data source',
      keyTerms: [],
      analysisType: analysisTypeMap[dataSource]
    }
  }

  // Quick routing method for known patterns
  async quickRoute(query: string): Promise<'coupa' | 'baan' | 'combined'> {
    const dataSource = await this.classifier.quickClassify(query)
    return dataSource
  }

  // Stream support for real-time responses
  async *streamRoute(query: string, requestedDataSource?: 'coupa' | 'baan' | 'combined'): AsyncGenerator<RouterResult, void, unknown> {
    const startTime = Date.now()
    
    try {
      // Yield initial classification
      const classification = requestedDataSource 
        ? this.createManualClassification(requestedDataSource, query)
        : await this.classifier.classifyQuery(query)

      yield {
        success: true,
        response: `Routing to ${classification.dataSource} agent (confidence: ${classification.confidence}%)`,
        agentUsed: classification.dataSource === 'combined' ? 'combined' : classification.dataSource,
        executionTime: Date.now() - startTime,
        confidence: classification.confidence,
        classification
      }

      // Execute and yield final result
      const result = await this.executeWithSpecializedAgent(query, classification)
      
      yield {
        ...result,
        classification,
        executionTime: Date.now() - startTime,
        confidence: classification.confidence
      }
    } catch (error) {
      console.error('Stream routing error:', error)
      yield await this.executeFallback(query, Date.now() - startTime, error)
    }
  }
}