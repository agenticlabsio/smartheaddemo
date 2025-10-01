// Agent state definitions for LangGraph procurement analytics
// All interfaces consolidated to @/lib/types for consistency
import { 
  ChatMessage, 
  UserPreferences, 
  GeneratedInsight, 
  AgentStep,
  ProcurementAgentState,
  ConversationState,
  QueryAnalysisState,
  BulkAnalysisState
} from '@/lib/types'

// Re-export types for backward compatibility
export type {
  ChatMessage,
  UserPreferences,
  GeneratedInsight,
  AgentStep,
  ProcurementAgentState,
  ConversationState,
  QueryAnalysisState,
  BulkAnalysisState
}

// Additional LangGraph-specific interface for follow-up state
export interface FollowupState {
  queryResults: any[]
  userProfile: UserPreferences
  conversationHistory: ChatMessage[]
  informationGaps: string[]
  suggestedQuestions: string[]
  rankedQuestions: string[]
  relevanceScores: number[]
}