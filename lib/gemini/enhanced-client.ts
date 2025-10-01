// Enhanced Gemini 2.5 Flash Client with Thinking Capabilities
import { GoogleGenerativeAI } from '@google/generative-ai'
import { SmartHeadCacheService } from '../cache/redis-service'

export interface GeminiConfig {
  model: 'gemini-2.5-flash-lite-preview-09-2025' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.0-flash'
  thinkingEnabled: boolean
  thinkingBudget?: number // Up to 32K tokens for deep reasoning
  temperature: number
  topP: number
  maxTokens: number
  tools?: any[]
  multimodalSupport: boolean
}

export interface GeminiThinkingResponse {
  thinking_text?: string        // Visible reasoning process
  response_text: string        // Final response
  tool_calls?: any[]          // Function calling results
  confidence?: number         // Model confidence
  reasoning_steps?: string[]  // Step-by-step breakdown
  multimodal_outputs?: {      // Enhanced capabilities
    generated_images?: string[]
    audio_synthesis?: string
    chart_recommendations?: any[]
  }
  usage?: {
    inputTokens: number
    outputTokens: number
    thinkingTokens?: number
  }
}

export interface ThinkingRequest {
  prompt: string
  systemPrompt?: string
  tools?: any[]
  context?: any
  enableThinking?: boolean
  thinkingBudget?: number
  temperature?: number
  topP?: number
}

export class EnhancedGeminiClient {
  private genAI: GoogleGenerativeAI
  private config: GeminiConfig
  private cache: SmartHeadCacheService

  constructor(apiKey?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GOOGLE_API_KEY || '')
    this.cache = SmartHeadCacheService.getInstance()
    
    // Default configuration for Smart Head platform with new lite model
    this.config = {
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      thinkingEnabled: true,
      thinkingBudget: 4000, // Optimized for faster responses
      temperature: 0.7,     // Balanced for speed and quality
      topP: 0.9,
      maxTokens: 32000,     // Optimized context window for faster processing
      multimodalSupport: true
    }
  }

  // Enhanced prompts for procurement analytics with thinking
  private getPromptTemplates() {
    return {
      procurement_analyst: `You are an expert procurement analyst with advanced thinking capabilities enabled.

THINKING PROCESS:
1. First, analyze the query thoroughly in your thinking section
2. Identify the most relevant data sources (Coupa financial data, Baan ERP data, or combined analysis)
3. Plan your SQL generation strategy considering business constraints
4. Think through potential business insights and implications
5. Consider visualization opportunities and executive-level reporting needs

BUSINESS CONTEXT:
- Financial data spans FY2023-2025 with 26,111 transactions ($48.8M dataset)
- 8 business entities, 6 cost groups (Manufacturing Overhead is 51%)
- 128 cost centers with variance tracking capabilities
- Critical constraint: 2025 data is limited to Q1-Q2 only

RESPONSE FORMAT:
Use your thinking space to show:
- Query interpretation and disambiguation
- Data source selection reasoning
- SQL construction methodology
- Business insight derivation process
- Risk assessment and recommendations

Then provide a polished executive response with:
- Executive summary of findings
- SQL query (if needed)
- Key business insights
- Actionable recommendations
- Follow-up suggestions`,

      financial_expert: `You are a financial analysis expert with deep thinking capabilities for procurement data.

THINKING APPROACH:
- Break down complex financial queries systematically
- Consider variance analysis, quarterly trends, and risk factors
- Plan visualization recommendations based on data characteristics
- Think through business implications and strategic recommendations
- Assess data quality and confidence levels

ANALYSIS FRAMEWORK:
1. Data interpretation and validation
2. Statistical analysis and trend identification
3. Risk assessment and anomaly detection
4. Business impact evaluation
5. Strategic recommendations

Always show your analytical reasoning in thinking, then deliver
concise executive insights with supporting data and clear next steps.`,

      multimodal_processor: `You are a multimodal content processor with thinking capabilities.

For uploaded files, think through:
1. Content type identification and analysis approach
2. Data extraction strategy (for charts, CSVs, documents)
3. Integration with existing procurement data
4. Insight generation opportunities
5. Visualization and reporting recommendations

Process images, charts, CSV files, and documents with deep analysis
and provide actionable insights for procurement decision-making.`
    }
  }

  async generateWithThinking(request: ThinkingRequest): Promise<GeminiThinkingResponse> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = await this.cache.getCachedThinking(cacheKey)
      if (cached) {
        return { ...cached, cached: true }
      }

      const model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature,
          topP: request.topP ?? this.config.topP,
          maxOutputTokens: this.config.maxTokens
        },
        tools: request.tools || [],
        systemInstruction: request.systemPrompt
      })

      // Enhanced prompt with thinking instructions
      const enhancedPrompt = this.buildThinkingPrompt(request)
      
      const result = await model.generateContent(enhancedPrompt)
      const response = result.response
      
      const processedResponse = this.processThinkingResponse(response)
      
      // Cache the result
      await this.cache.cacheThinkingProcess(cacheKey, processedResponse)
      
      return processedResponse
    } catch (error) {
      console.error('Gemini thinking generation error:', error)
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // New streaming method for real-time responses
  async generateWithThinkingStream(request: ThinkingRequest): Promise<AsyncIterableIterator<string>> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature,
          topP: request.topP ?? this.config.topP,
          maxOutputTokens: this.config.maxTokens
        },
        tools: request.tools || [],
        systemInstruction: request.systemPrompt
      })

      const enhancedPrompt = this.buildThinkingPrompt(request)
      const result = await model.generateContentStream(enhancedPrompt)
      
      return this.processStreamingResponse(result.stream)
    } catch (error) {
      console.error('Gemini streaming error:', error)
      throw new Error(`Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async* processStreamingResponse(stream: any): AsyncIterableIterator<string> {
    let accumulatedText = ''
    let inThinking = false
    let thinkingComplete = false
    
    try {
      for await (const chunk of stream) {
        const chunkText = chunk.text()
        accumulatedText += chunkText
        
        // Handle thinking section
        if (chunkText.includes('<thinking>')) {
          inThinking = true
          continue
        }
        
        if (chunkText.includes('</thinking>')) {
          inThinking = false
          thinkingComplete = true
          continue
        }
        
        // Only yield non-thinking content
        if (!inThinking && thinkingComplete) {
          yield chunkText
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error)
      yield 'Error occurred during streaming response generation.'
    }
  }

  private buildThinkingPrompt(request: ThinkingRequest): string {
    const templates = this.getPromptTemplates()
    
    let systemContext = ''
    if (request.systemPrompt) {
      systemContext = request.systemPrompt
    } else {
      // Default to procurement analyst
      systemContext = templates.procurement_analyst
    }

    const thinkingInstructions = request.enableThinking !== false ? `
<thinking>
Use this section to think through your approach step by step:
1. Understand what the user is asking
2. Identify the best data sources and analysis approach
3. Plan your SQL or analysis strategy
4. Consider business implications and insights
5. Think about visualization and follow-up opportunities

Be thorough in your reasoning - this helps provide better responses.
</thinking>

After your thinking, provide your response:` : ''

    return `${systemContext}

${thinkingInstructions}

User Query: ${request.prompt}

${request.context ? `\nAdditional Context: ${JSON.stringify(request.context)}` : ''}`
  }

  private processThinkingResponse(response: any): GeminiThinkingResponse {
    const text = response.text()
    
    // Extract thinking section if present
    const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/)
    const thinking_text = thinkingMatch ? thinkingMatch[1].trim() : undefined
    
    // Extract main response (everything after thinking or entire text)
    const response_text = thinking_text 
      ? text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim()
      : text

    // Extract reasoning steps from thinking
    const reasoning_steps = thinking_text 
      ? thinking_text.split(/\d+\./).filter((step: string) => step.trim()).map((step: string) => step.trim())
      : []

    // Calculate confidence based on thinking depth and clarity
    const confidence = this.calculateConfidence(thinking_text, response_text)

    // Look for tool calls or structured data
    const tool_calls = this.extractToolCalls(response_text)

    return {
      thinking_text,
      response_text,
      reasoning_steps,
      confidence,
      tool_calls,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
        thinkingTokens: thinking_text ? thinking_text.length / 4 : 0 // Rough estimate
      }
    }
  }

  private calculateConfidence(thinking?: string, response?: string): number {
    let confidence = 0.7 // Base confidence

    if (thinking) {
      // Boost confidence if thinking shows structured reasoning
      if (thinking.includes('1.') && thinking.includes('2.')) confidence += 0.1
      if (thinking.length > 200) confidence += 0.1 // Detailed thinking
      if (thinking.includes('SQL') || thinking.includes('analysis')) confidence += 0.05
    }

    if (response) {
      // Boost confidence for structured responses
      if (response.includes('Executive Summary') || response.includes('Key Insights')) confidence += 0.05
      if (response.includes('SELECT') || response.includes('FROM')) confidence += 0.05
    }

    return Math.min(confidence, 1.0)
  }

  private extractToolCalls(text: string): any[] {
    // Look for SQL queries, function calls, or structured data
    const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/)
    const tools = []
    
    if (sqlMatch) {
      tools.push({
        type: 'sql_query',
        query: sqlMatch[1].trim()
      })
    }

    return tools
  }

  private generateCacheKey(request: ThinkingRequest): string {
    const crypto = require('crypto')
    const keyData = {
      prompt: request.prompt,
      systemPrompt: request.systemPrompt,
      model: this.config.model,
      enableThinking: request.enableThinking,
      temperature: request.temperature
    }
    return crypto.createHash('sha256').update(JSON.stringify(keyData)).digest('hex').substring(0, 16)
  }

  // Specialized methods for Smart Head use cases
  async analyzeProcurementQuery(query: string, dataSource?: string, context?: any): Promise<GeminiThinkingResponse> {
    const templates = this.getPromptTemplates()
    
    return this.generateWithThinking({
      prompt: query,
      systemPrompt: templates.procurement_analyst,
      enableThinking: true,
      context: {
        dataSource: dataSource || 'combined',
        availableData: context?.availableData || ['financial_data', 'baan_procurement'],
        ...context
      }
    })
  }

  async analyzeFinancialData(query: string, financialContext?: any): Promise<GeminiThinkingResponse> {
    const templates = this.getPromptTemplates()
    
    return this.generateWithThinking({
      prompt: query,
      systemPrompt: templates.financial_expert,
      enableThinking: true,
      context: {
        analysisType: 'financial',
        constraints: ['2025 Q1-Q2 only', 'Manufacturing overhead 51%'],
        ...financialContext
      }
    })
  }

  async processUploadedFile(fileInfo: any, query?: string): Promise<GeminiThinkingResponse> {
    const templates = this.getPromptTemplates()
    
    const prompt = query || `Analyze this uploaded file and provide insights for procurement analysis.`
    
    return this.generateWithThinking({
      prompt,
      systemPrompt: templates.multimodal_processor,
      enableThinking: true,
      context: {
        fileType: fileInfo.type,
        fileName: fileInfo.name,
        processingMode: 'multimodal'
      }
    })
  }

  // Utility methods
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): GeminiConfig {
    return { ...this.config }
  }

  async testConnection(): Promise<{success: boolean, model: string, capabilities: string[]}> {
    try {
      const result = await this.generateWithThinking({
        prompt: 'Test connection. Respond with "Connection successful" and current capabilities.',
        enableThinking: false
      })
      
      return {
        success: true,
        model: this.config.model,
        capabilities: [
          'Thinking Process',
          'Multimodal Support',
          'SQL Generation',
          'Executive Analysis',
          'Business Insights'
        ]
      }
    } catch (error) {
      return {
        success: false,
        model: this.config.model,
        capabilities: []
      }
    }
  }

  // Singleton instance
  private static instance: EnhancedGeminiClient

  static getInstance(apiKey?: string): EnhancedGeminiClient {
    if (!EnhancedGeminiClient.instance) {
      EnhancedGeminiClient.instance = new EnhancedGeminiClient(apiKey)
    }
    return EnhancedGeminiClient.instance
  }
}

export default EnhancedGeminiClient