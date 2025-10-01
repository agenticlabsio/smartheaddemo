// Mastra Configuration for FinSight Financial Analytics
import { Mastra } from '@mastra/core'
import { openai } from '@ai-sdk/openai'

// Initialize Mastra with financial analysis configuration
export const mastra = new Mastra()

// AI Gateway Configuration - Use AI_GATEWAY_API_KEY for advanced models
const useAIGateway = process.env.AI_GATEWAY_API_KEY

// Model configurations for different use cases with fallbacks
export const models = {
  // Primary GPT-5 model via AI Gateway with mock fallback for testing
  primary: useAIGateway ? 
    openai('gpt-5-turbo', { 
      apiKey: process.env.AI_GATEWAY_API_KEY,
      baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/openai'
    }) : 
    openai('gpt-4o-mini'),
  
  // Grok-4 reasoning model via AI Gateway with fallback  
  reasoning: useAIGateway ?
    openai('grok-4', {
      apiKey: process.env.AI_GATEWAY_API_KEY, 
      baseURL: 'https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY_ID/xai'
    }) :
    openai('gpt-4o-mini'),
  
  // Fast model for quick responses
  fast: openai('gpt-4o-mini')
}

// User context interface for Clerk integration
export interface UserContext {
  userId: string
  email?: string
  role: 'analyst' | 'finance_team' | 'executive' | 'admin'
  preferences?: {
    defaultDataSource?: 'coupa' | 'baan' | 'combined'
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive'
    visualizationStyle?: 'charts' | 'tables' | 'mixed'
  }
}

// Agent configuration types
export interface AgentConfig {
  name: string
  instructions: string
  model: any
  tools: string[]
  allowedRoles: string[]
  maxExecutionTime?: number
}

export default mastra