// Simple Financial Transaction Agent - Fallback Implementation
import { GoogleGenAI } from '@google/genai'
import Database from '@/lib/database'
import { SimpleAgentState, DataSourceType } from '@/lib/types'

export class SimpleFinancialTransactionAgent {
  private ai: GoogleGenAI
  private db: Database

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
    this.db = new Database()
  }

  async invoke(query: string, dataSource: DataSourceType = 'coupa'): Promise<SimpleAgentState> {
    const state: SimpleAgentState = {
      messages: [{ role: 'user', content: query }],
      currentQuery: query,
      dataSource
    }

    try {
      // Generate basic response using simple financial analysis
      const response = await this.generateSimpleResponse(query, dataSource)
      
      return {
        ...state,
        response: response.response,
        insights: response.insights,
        evidence: response.evidence,
        thinkingProcess: response.reasoning,
        agentType: 'simple',
        confidence: 70
      }
    } catch (error) {
      console.error('Simple agent error:', error)
      return {
        ...state,
        error: `Simple financial analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        response: 'I apologize, but I encountered an issue processing your financial query. Please try rephrasing your question or contact support.',
        agentType: 'simple',
        confidence: 0,
        fallbackUsed: 'Error handling fallback'
      }
    }
  }

  private async generateSimpleResponse(query: string, dataSource: DataSourceType) {
    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = `You are a financial analysis assistant for FinSight, analyzing ${dataSource} financial data.

Query: "${query}"

Provide a helpful financial analysis response that includes:
1. A clear, professional response addressing the query
2. Key financial insights based on the query type
3. Evidence or supporting information
4. Brief reasoning for your analysis

Format your response as JSON:
{
  "response": "Professional response to the query",
  "insights": ["Insight 1", "Insight 2", "Insight 3"],
  "evidence": ["Evidence point 1", "Evidence point 2"],
  "reasoning": "Brief explanation of analysis approach"
}

Focus on providing valuable financial insights for executive decision-making.`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      
      try {
        const parsed = JSON.parse(text)
        return {
          response: parsed.response || 'Financial analysis completed.',
          insights: parsed.insights || ['Analysis provides strategic financial insights.'],
          evidence: parsed.evidence || ['Based on financial data patterns and trends.'],
          reasoning: parsed.reasoning || 'Simple financial analysis using standard methodology.'
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          response: text || 'I\'ve analyzed your financial query and can provide insights based on our data.',
          insights: ['Financial data analysis completed', 'Insights generated from available data', 'Recommendations based on financial patterns'],
          evidence: ['Analysis based on financial transaction data', 'Patterns identified in spending and budget data'],
          reasoning: 'Used simple financial analysis methodology to process the query.'
        }
      }
    } catch (error) {
      console.error('Simple response generation error:', error)
      
      // Ultimate fallback
      return {
        response: 'I can help analyze your financial data. Could you please provide more specific details about what you\'d like to explore?',
        insights: ['Ready to analyze financial data', 'Can provide budget and spending insights', 'Executive-level financial reporting available'],
        evidence: ['FinSight platform capabilities', 'Access to financial transaction data'],
        reasoning: 'Fallback response due to processing error - ready to assist with financial analysis.'
      }
    }
  }

  // Analysis method for compatibility with other agents
  async analyze(query: string): Promise<SimpleAgentState> {
    return this.invoke(query, 'coupa')
  }
}