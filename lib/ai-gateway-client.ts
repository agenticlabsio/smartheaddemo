import { gateway } from 'ai'
// import { experimental_createMCPClient as createMCPClient } from 'ai' // MCP support coming soon

export interface ReasoningTrace {
  step: number
  content: string
  timestamp: number
  type: 'analysis' | 'data_processing' | 'insight_generation' | 'conclusion'
}

export interface StreamingConfig {
  enableReasoningTrace: boolean
  reasoning: {
    includeThinkingSteps: boolean
    stepDelay: number // milliseconds between steps
  }
}

// AI Gateway Configuration with intelligent model routing and streaming via Vercel AI Gateway
export class AIGatewayClient {
  private apiKey: string
  // private mcpClient: any = null // MCP support coming soon

  constructor() {
    this.apiKey = process.env.AI_GATEWAY_API_KEY!
    
    if (!this.apiKey) {
      throw new Error('AI_GATEWAY_API_KEY is required')
    }
  }

  // Get optimal model based on context size and complexity with GPT-5 Mini as primary
  getModel(contextSize?: number, useHighContext?: boolean) {
    // Use xAI Grok-4 for large contexts or file processing (2M context window)
    if (useHighContext || (contextSize && contextSize > 200000)) {
      return gateway('xai/grok-4-fast-reasoning')
    }
    
    // Primary model: GPT-5 Mini with reasoning capabilities (400K context window)
    return gateway('openai/gpt-5-mini')
  }

  // Get GPT-5 Mini specifically for reasoning tasks
  getReasoningModel() {
    return gateway('openai/gpt-5-mini')
  }

  // MCP integration will be added in next phase
  async getMCPTools() {
    // Placeholder for MCP Exa integration
    return {}
  }

  // Smart model configuration for financial queries with streaming support
  getFinancialAnalysisConfig(query: string, contextSize?: number, streaming: boolean = false) {
    const isComplexQuery = query.includes('file') || query.includes('upload') || 
                          query.includes('document') || (contextSize && contextSize > 200000)
    
    return {
      model: this.getModel(contextSize, Boolean(isComplexQuery)),
      // Note: Temperature not supported by reasoning models, removing to avoid warnings
      maxTokens: isComplexQuery ? 4000 : 2000,
      streaming
    }
  }

  // Get streaming configuration for reasoning traces
  getStreamingConfig(query: string): StreamingConfig {
    const needsReasoning = query.includes('analyze') || query.includes('compare') || 
                          query.includes('insights') || query.includes('why') || 
                          query.includes('explain')
    
    return {
      enableReasoningTrace: needsReasoning,
      reasoning: {
        includeThinkingSteps: true,
        stepDelay: 200 // 200ms between reasoning steps for smooth streaming
      }
    }
  }

  // Generate reasoning traces for complex financial analysis
  generateReasoningSteps(query: string, databaseResult: any): ReasoningTrace[] {
    const steps: ReasoningTrace[] = []
    let stepCounter = 1
    
    // Step 1: Query analysis
    steps.push({
      step: stepCounter++,
      content: `Analyzing user query: "${query.substring(0, 100)}${query.length > 100 ? '...' : ''}"`,
      timestamp: Date.now(),
      type: 'analysis'
    })
    
    // Step 2: Database processing
    if (databaseResult.sqlQuery) {
      steps.push({
        step: stepCounter++,
        content: `Executing SQL query to retrieve relevant financial data from ${databaseResult.queryResults?.length || 0} records`,
        timestamp: Date.now() + 200,
        type: 'data_processing'
      })
    }
    
    // Step 3: Data analysis
    if (databaseResult.queryResults && databaseResult.queryResults.length > 0) {
      steps.push({
        step: stepCounter++,
        content: `Processing ${databaseResult.queryResults.length} data points and identifying key patterns`,
        timestamp: Date.now() + 400,
        type: 'analysis'
      })
    }
    
    // Step 4: Insight generation
    steps.push({
      step: stepCounter++,
      content: 'Generating executive insights and identifying actionable recommendations',
      timestamp: Date.now() + 600,
      type: 'insight_generation'
    })
    
    // Step 5: Response formatting
    steps.push({
      step: stepCounter++,
      content: 'Formatting analysis results with visualizations and evidence data',
      timestamp: Date.now() + 800,
      type: 'conclusion'
    })
    
    return steps
  }
}

// Global instance
export const aiGateway = new AIGatewayClient()
