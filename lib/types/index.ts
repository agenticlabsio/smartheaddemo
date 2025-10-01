/**
 * Central Type Definitions and Validation Schemas
 * 
 * This file consolidates all shared interfaces across the application to eliminate redundancy
 * and provides runtime validation using Zod schemas. It serves as the single source of truth
 * for type definitions used throughout the codebase.
 * 
 * @fileoverview Unified type system with validation for procurement analytics platform
 */

import { z } from 'zod'

// ===========================================================================================
// CORE DATA TYPES
// ===========================================================================================

/**
 * Data source classification for routing queries to appropriate agents
 * @category Core
 */
export type DataSourceType = 'coupa' | 'baan' | 'combined'

/**
 * Message role types for chat conversations
 * @category Chat
 */
export type MessageRole = 'user' | 'assistant'

/**
 * Feedback types for user responses
 * @category Chat
 */
export type FeedbackType = 'positive' | 'negative' | null

/**
 * Analysis types for query classification
 * @category Analysis
 */
export type AnalysisType = 'financial' | 'procurement' | 'strategic' | 'operational'

/**
 * Priority levels for insights and tasks
 * @category General
 */
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical'

/**
 * Query complexity levels
 * @category Analysis
 */
export type QueryComplexity = 'basic' | 'intermediate' | 'advanced'

/**
 * Analysis depth preferences
 * @category Preferences
 */
export type AnalysisDepth = 'summary' | 'detailed' | 'comprehensive'

/**
 * Visualization preferences
 * @category Preferences
 */
export type VisualizationPreference = 'charts' | 'tables' | 'mixed'

// ===========================================================================================
// CHAT AND CONVERSATION INTERFACES
// ===========================================================================================

/**
 * Analysis mode types for conversations
 * @category Chat
 */
export type AnalysisMode = 'analyst' | 'executive'

/**
 * Chat message interface - consolidated from multiple files
 * 
 * Represents a single message in a conversation with metadata for analytics
 * and reasoning transparency.
 * 
 * @category Chat
 * @example
 * ```typescript
 * const message: ChatMessage = {
 *   id: 'msg_123',
 *   role: 'user',
 *   content: 'Show me top suppliers by spend',
 *   timestamp: new Date(),
 *   metadata: { queryType: 'procurement' }
 * }
 * ```
 */
export interface ChatMessage {
  /** Unique identifier for the message */
  id: string
  /** Role of the message sender */
  role: MessageRole
  /** Content of the message */
  content: string
  /** When the message was created */
  timestamp: Date
  /** Optional reasoning for assistant responses */
  reasoning?: string
  /** SQL query used to generate response (if applicable) */
  sqlQuery?: string
  /** Additional metadata for the message */
  metadata?: Record<string, any>
  /** User feedback on assistant responses */
  feedback?: FeedbackType
  /** Follow-up questions suggested by the assistant */
  followUpQueries?: string[]
  /** Analysis mode for this message (analyst/executive) */
  mode?: AnalysisMode
  /** Evidence reference ID linking to supporting data */
  evidenceReferenceId?: string
}

/**
 * Message feedback interface for user ratings and notes
 * @category Chat
 */
export interface MessageFeedback {
  /** Message ID this feedback is for */
  messageId: string
  /** User ID who provided the feedback */
  userId: string
  /** Rating type (positive/negative) */
  rating: 'positive' | 'negative'
  /** Optional feedback notes */
  notes?: string
  /** Evidence reference ID linked to feedback */
  evidenceReferenceId?: string
  /** Type of feedback (general, accuracy, relevance, completeness) */
  feedbackType?: 'general' | 'accuracy' | 'relevance' | 'completeness'
  /** When feedback was created */
  createdAt: Date
  /** When feedback was last updated */
  updatedAt: Date
}

/**
 * Evidence reference interface for linking messages to supporting data
 * @category Chat
 */
export interface EvidenceReference {
  /** Unique evidence identifier */
  evidenceId: string
  /** Message ID this evidence supports */
  messageId: string
  /** User ID who owns this evidence */
  userId: string
  /** Type of evidence (sql_query, data_analysis, chart, report, insight, file types) */
  evidenceType: 'sql_query' | 'data_analysis' | 'chart' | 'report' | 'insight' | 'file_pdf' | 'file_excel' | 'file_word' | 'file_csv' | 'file_image' | 'file_document'
  /** Evidence data (SQL query, analysis results, etc.) */
  evidenceData: any
  /** Additional metadata */
  metadata?: Record<string, any>
  /** Confidence score for this evidence */
  confidenceScore?: number
  /** Data sources used for this evidence */
  dataSources?: string[]
  /** URL to evidence artifact (if applicable) */
  artifactUrl?: string
  /** When evidence was created */
  createdAt: Date
  /** When evidence was last updated */
  updatedAt: Date
}

/**
 * File upload interface for tracking uploaded files
 * @category Files
 */
export interface FileUpload {
  /** Unique file identifier */
  fileId: string
  /** User ID who uploaded the file */
  userId: string
  /** Original filename */
  originalFilename: string
  /** File type (pdf, excel, word, csv, image, document) */
  fileType: string
  /** File size in bytes */
  fileSize: number
  /** MIME type */
  mimeType: string
  /** Object storage path */
  objectPath: string
  /** Upload context (conversationId, messageId, purpose) */
  uploadContext: {
    conversationId?: string
    messageId?: string
    purpose: 'analysis' | 'context' | 'visualization' | 'reference'
    description?: string
    tags?: string[]
  }
  /** Processing status */
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  /** Processing results from FileProcessingService */
  processingResult?: {
    extractedText?: string
    entities?: any[]
    insights?: string[]
    summary?: string
    actionableInsights?: string[]
    relatedQueries?: string[]
    metadata?: Record<string, any>
    analysisType: string
  }
  /** Chat context for AI integration */
  chatContext?: {
    relevantFinancialInfo: string[]
    suggestedFollowUps: string[]
    contextSummary: string
    keyMetrics?: string[]
    dataPatterns?: string[]
  }
  /** Error message if processing failed */
  errorMessage?: string
  /** When file was uploaded */
  createdAt: Date
  /** When file was last updated */
  updatedAt: Date
  /** When file processing was completed */
  processedAt?: Date
}

/**
 * Saved chat conversation interface - consolidated from multiple files
 * 
 * Represents a complete chat session with metadata for organization and retrieval.
 * Note: userId is optional for backward compatibility with localStorage-based storage.
 * 
 * @category Chat
 * @example
 * ```typescript
 * const chat: SavedChat = {
 *   id: 'chat_123',
 *   title: 'Supplier Analysis Q3 2024',
 *   messages: [message1, message2],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   messageCount: 2,
 *   userId: 'user_456'
 * }
 * ```
 */
export interface SavedChat {
  /** Unique identifier for the chat */
  id: string
  /** Human-readable title for the chat */
  title: string
  /** Array of messages in the conversation */
  messages: ChatMessage[]
  /** When the chat was created */
  createdAt: Date
  /** When the chat was last updated */
  updatedAt: Date
  /** Total number of messages in the chat */
  messageCount: number
  /** ID of the user who owns the chat (optional for backward compatibility) */
  userId?: string
  /** Default analysis mode for this conversation */
  defaultMode?: AnalysisMode
  /** Conversation-level evidence references */
  evidenceReferences?: EvidenceReference[]
  /** Conversation-level feedback summary */
  feedbackSummary?: {
    positiveCount: number
    negativeCount: number
    totalCount: number
  }
}

// ===========================================================================================
// AGENT STATE INTERFACES
// ===========================================================================================

/**
 * Base agent state interface - consolidated from multiple agent implementations
 * 
 * Common structure for all agent types with standardized fields for
 * consistency across the agent system.
 * 
 * @category Agent
 */
export interface BaseAgentState {
  /** Array of messages in the conversation */
  messages: Array<{ role: string; content: string }>
  /** Current query being processed */
  currentQuery: string
  /** Generated response from the agent */
  response?: string
  /** SQL query generated for data retrieval */
  sqlQuery?: string
  /** Results from database query execution */
  queryResults?: any[]
  /** Supporting evidence for the response */
  evidence?: any[]
  /** Generated insights from analysis */
  insights?: string[]
  /** Error message if processing failed */
  error?: string
}

/**
 * Simple agent state for basic financial transactions
 * 
 * @category Agent
 * @extends BaseAgentState
 */
export interface SimpleAgentState extends BaseAgentState {
  /** Data source for the query */
  dataSource: DataSourceType
}

/**
 * Specialized agent state for Coupa financial analysis
 * 
 * @category Agent
 * @extends BaseAgentState
 */
export interface CoupaAgentState extends BaseAgentState {
  /** Agent's reasoning process */
  thinkingProcess?: string
  /** Verification notes for quality assurance */
  verificationNotes?: string[]
  /** Whether fallback logic was used */
  fallbackUsed?: string
}

/**
 * Specialized agent state for Baan procurement analysis
 * 
 * @category Agent
 * @extends BaseAgentState
 */
export interface BaanAgentState extends BaseAgentState {
  /** Agent's reasoning process */
  thinkingProcess?: string
  /** Verification notes for quality assurance */
  verificationNotes?: string[]
  /** Whether fallback logic was used */
  fallbackUsed?: string
}

/**
 * Unified agent state interface - consolidates all agent types
 * 
 * This interface provides a comprehensive state structure that can be used
 * by any agent type, eliminating the need for separate state interfaces.
 * 
 * @category Agent
 * @example
 * ```typescript
 * const state: UnifiedAgentState = {
 *   messages: [],
 *   currentQuery: 'Top suppliers by spend',
 *   dataSource: 'baan',
 *   agentType: 'procurement',
 *   thinkingProcess: 'Analyzing supplier data...',
 *   confidence: 85
 * }
 * ```
 */
export interface UnifiedAgentState extends BaseAgentState {
  /** Type of agent processing the query */
  agentType?: 'coupa' | 'baan' | 'simple' | 'combined'
  /** Data source being used */
  dataSource?: DataSourceType
  /** Agent's reasoning process */
  thinkingProcess?: string
  /** Verification notes for quality assurance */
  verificationNotes?: string[]
  /** Whether fallback logic was used */
  fallbackUsed?: string
  /** Confidence score for the response (0-100) */
  confidence?: number
  /** Execution time in milliseconds */
  executionTime?: number
  /** Query complexity assessment */
  queryComplexity?: QueryComplexity
}

// ===========================================================================================
// LANGGRAPH AGENT STATE INTERFACES
// ===========================================================================================

/**
 * User preferences for personalized analytics
 * 
 * @category Preferences
 */
export interface UserPreferences {
  /** Preferred data source for analysis */
  preferredDataSource: DataSourceType
  /** Preferred depth of analysis */
  analysisDepth: AnalysisDepth
  /** Preferred visualization style */
  visualizationPreference: VisualizationPreference
  /** Industry focus areas */
  industryFocus: string[]
  /** Frequently used query types */
  frequentQueryTypes: string[]
}

/**
 * Generated insight from analysis
 * 
 * @category Analysis
 */
export interface GeneratedInsight {
  /** Unique identifier for the insight */
  id: string
  /** Title of the insight */
  title: string
  /** Detailed description */
  description: string
  /** Category classification */
  category: string
  /** Confidence score (0-100) */
  confidence: number
  /** Business impact description */
  impact: string
  /** Priority level */
  priority: PriorityLevel
  /** Actionable recommendations */
  recommendations: string[]
  /** Supporting evidence */
  evidence: any[]
  /** Additional metadata */
  metadata: {
    /** Data source used */
    dataSource: string
    /** Execution time in milliseconds */
    executionTime: number
    /** Query complexity level */
    queryComplexity: string
  }
}

/**
 * Agent processing steps for workflow tracking
 * 
 * @category Agent
 */
export type AgentStep = 
  | 'query_analysis'
  | 'data_source_selection' 
  | 'semantic_search'
  | 'sql_generation'
  | 'query_execution'
  | 'result_analysis'
  | 'insight_generation'
  | 'response_formatting'
  | 'followup_planning'

/**
 * Comprehensive procurement agent state for LangGraph
 * 
 * @category Agent
 */
export interface ProcurementAgentState {
  // Conversation Context
  /** Messages in the conversation */
  messages: ChatMessage[]
  /** Unique conversation identifier */
  conversationId: string
  /** User identifier */
  userId: string
  
  // Query Processing
  /** Current query being processed */
  currentQuery: string
  /** Query type classification */
  queryType: 'coupa' | 'baan' | 'combined' | 'exploratory'
  /** Assessed query complexity */
  queryComplexity: QueryComplexity
  
  // Data Context
  /** Primary data source */
  dataSource: 'coupa' | 'baan' | 'coupabaan'
  /** Semantic context keywords */
  semanticContext: string[]
  /** Relevant database tables */
  relevantTables: string[]
  
  // Agent Workflow State
  /** Current processing step */
  currentStep: AgentStep
  /** Completed processing steps */
  completedSteps: AgentStep[]
  /** Next planned actions */
  nextActions: string[]
  /** Agent's reasoning */
  reasoning: string
  
  // Results & Metadata
  /** Generated SQL query */
  sqlQuery?: string
  /** Query execution results */
  queryResults?: any[]
  /** Generated insights */
  insights: GeneratedInsight[]
  /** Overall confidence score */
  confidence: number
  /** Total execution time */
  executionTime: number
  
  // Conversation Intelligence
  /** User preferences */
  userPreferences: UserPreferences
  /** Topic history for context */
  topicHistory: string[]
  /** Suggested follow-up questions */
  followUpQuestions: string[]
  
  // Response Data
  /** Formatted response text */
  formattedResponse?: string
  /** Error message if any */
  error?: string
}

// ===========================================================================================
// ROUTER AND CLASSIFICATION INTERFACES
// ===========================================================================================

/**
 * Query classification result
 * 
 * @category Classification
 */
export interface ClassificationResult {
  /** Classified data source */
  dataSource: DataSourceType
  /** Confidence in classification (0-100) */
  confidence: number
  /** Reasoning for the classification */
  reasoning: string
  /** Key terms that influenced classification */
  keyTerms: string[]
  /** Type of analysis required */
  analysisType: AnalysisType
}

/**
 * Router execution result
 * 
 * @category Router
 */
export interface RouterResult {
  /** Whether the routing was successful */
  success: boolean
  /** Generated response */
  response: string
  /** SQL query used (if any) */
  sqlQuery?: string
  /** Query results (if any) */
  queryResults?: any[]
  /** Supporting evidence */
  evidence?: any[]
  /** Generated insights */
  insights?: string[]
  /** Agent's thinking process */
  thinkingProcess?: string
  /** Error message if failed */
  error?: string
  /** Classification that led to routing */
  classification?: ClassificationResult
  /** Which agent was used */
  agentUsed: 'coupa' | 'baan' | 'combined' | 'simple'
  /** Total execution time */
  executionTime: number
  /** Confidence in the result */
  confidence: number
}

// ===========================================================================================
// CONVERSATION AND STATE MANAGEMENT
// ===========================================================================================

/**
 * Conversation state tracking
 * 
 * @category Conversation
 */
export interface ConversationState {
  /** Unique conversation identifier */
  conversationId: string
  /** User identifier */
  userId: string
  /** When the session started */
  sessionStart: Date
  /** Last activity timestamp */
  lastActivity: Date
  /** Total message count */
  messageCount: number
  /** Topic progression through conversation */
  topicProgression: string[]
  /** User preferences */
  userPreferences: UserPreferences
  /** Query patterns observed */
  queryPatterns: string[]
  /** Usage statistics by data source */
  dataSourceUsage: Record<string, number>
}

/**
 * Query analysis state
 * 
 * @category Analysis
 */
export interface QueryAnalysisState {
  /** Original user query */
  originalQuery: string
  /** Extracted intent */
  extractedIntent: string
  /** Identified entities */
  identifiedEntities: string[]
  /** Assessed complexity */
  queryComplexity: QueryComplexity
  /** Suggested data source */
  suggestedDataSource: DataSourceType
  /** Alternative query suggestions */
  alternativeQueries: string[]
  /** Confidence in analysis */
  confidence: number
}

/**
 * Bulk analysis state for batch processing
 * 
 * @category Analysis
 */
export interface BulkAnalysisState {
  /** Data source for analysis */
  dataSource: DataSourceType
  /** Analysis categories */
  categories: string[]
  /** Depth of analysis */
  analysisDepth: AnalysisDepth
  /** Parallel agent identifiers */
  parallelAgents: string[]
  /** Completed individual analyses */
  completedAnalyses: GeneratedInsight[]
  /** Synthesized insights from all analyses */
  synthesizedInsights: GeneratedInsight[]
  /** Overall confidence score */
  overallConfidence: number
  /** Total execution time */
  totalExecutionTime: number
}

// ===========================================================================================
// ZOD VALIDATION SCHEMAS
// ===========================================================================================

/**
 * Validation schema for chat messages
 * 
 * @category Validation
 */
export const ChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  role: z.enum(['user', 'assistant'], {
    errorMap: () => ({ message: 'Role must be either "user" or "assistant"' })
  }),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.date(),
  reasoning: z.string().optional(),
  sqlQuery: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  feedback: z.enum(['positive', 'negative']).nullable().optional(),
  followUpQueries: z.array(z.string()).optional()
})

/**
 * Validation schema for saved chats
 * 
 * @category Validation
 */
export const SavedChatSchema = z.object({
  id: z.string().min(1, 'Chat ID is required'),
  title: z.string().min(1, 'Chat title is required'),
  messages: z.array(ChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  messageCount: z.number().min(0),
  userId: z.string().min(1, 'User ID is required')
})

/**
 * Validation schema for user preferences
 * 
 * @category Validation
 */
export const UserPreferencesSchema = z.object({
  preferredDataSource: z.enum(['coupa', 'baan', 'combined']),
  analysisDepth: z.enum(['summary', 'detailed', 'comprehensive']),
  visualizationPreference: z.enum(['charts', 'tables', 'mixed']),
  industryFocus: z.array(z.string()),
  frequentQueryTypes: z.array(z.string())
})

/**
 * Validation schema for generated insights
 * 
 * @category Validation
 */
export const GeneratedInsightSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  confidence: z.number().min(0).max(100),
  impact: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  recommendations: z.array(z.string()),
  evidence: z.array(z.any()),
  metadata: z.object({
    dataSource: z.string(),
    executionTime: z.number().min(0),
    queryComplexity: z.string()
  })
})

/**
 * Validation schema for classification results
 * 
 * @category Validation
 */
export const ClassificationResultSchema = z.object({
  dataSource: z.enum(['coupa', 'baan', 'combined']),
  confidence: z.number().min(0).max(100),
  reasoning: z.string().min(1),
  keyTerms: z.array(z.string()),
  analysisType: z.enum(['financial', 'procurement', 'strategic', 'operational'])
})

/**
 * Validation schema for router results
 * 
 * @category Validation
 */
export const RouterResultSchema = z.object({
  success: z.boolean(),
  response: z.string().min(1),
  sqlQuery: z.string().optional(),
  queryResults: z.array(z.any()).optional(),
  evidence: z.array(z.any()).optional(),
  insights: z.array(z.string()).optional(),
  thinkingProcess: z.string().optional(),
  error: z.string().optional(),
  classification: ClassificationResultSchema.optional(),
  agentUsed: z.enum(['coupa', 'baan', 'combined', 'simple']),
  executionTime: z.number().min(0),
  confidence: z.number().min(0).max(100)
})

/**
 * Validation schema for unified agent state
 * 
 * @category Validation
 */
export const UnifiedAgentStateSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string()
  })),
  currentQuery: z.string().min(1),
  response: z.string().optional(),
  sqlQuery: z.string().optional(),
  queryResults: z.array(z.any()).optional(),
  evidence: z.array(z.any()).optional(),
  insights: z.array(z.string()).optional(),
  error: z.string().optional(),
  agentType: z.enum(['coupa', 'baan', 'simple', 'combined']).optional(),
  dataSource: z.enum(['coupa', 'baan', 'combined']).optional(),
  thinkingProcess: z.string().optional(),
  verificationNotes: z.array(z.string()).optional(),
  fallbackUsed: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  executionTime: z.number().min(0).optional(),
  queryComplexity: z.enum(['basic', 'intermediate', 'advanced']).optional()
})

// ===========================================================================================
// API REQUEST/RESPONSE SCHEMAS
// ===========================================================================================

/**
 * API request schema for agent endpoint
 * 
 * @category API
 */
export const AgentRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  userId: z.string().min(1, 'User ID is required'),
  conversationId: z.string().optional(),
  dataSource: z.enum(['coupa', 'baan', 'combined']).optional(),
  preferences: UserPreferencesSchema.optional()
})

/**
 * API request schema for chat save endpoint
 * 
 * @category API
 */
export const ChatSaveRequestSchema = z.object({
  chatId: z.string().min(1, 'Chat ID is required'),
  messages: z.array(ChatMessageSchema).min(1, 'At least one message is required'),
  userId: z.string().min(1, 'User ID is required')
})

/**
 * Generic API response schema
 * 
 * @category API
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime()
})

// ===========================================================================================
// TYPE GUARDS AND UTILITIES
// ===========================================================================================

/**
 * Type guard to check if a value is a valid ChatMessage
 * 
 * @param value - Value to check
 * @returns True if value is a valid ChatMessage
 * @category TypeGuard
 */
export function isChatMessage(value: unknown): value is ChatMessage {
  try {
    ChatMessageSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type guard to check if a value is a valid SavedChat
 * 
 * @param value - Value to check
 * @returns True if value is a valid SavedChat
 * @category TypeGuard
 */
export function isSavedChat(value: unknown): value is SavedChat {
  try {
    SavedChatSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type guard to check if a value is a valid RouterResult
 * 
 * @param value - Value to check
 * @returns True if value is a valid RouterResult
 * @category TypeGuard
 */
export function isRouterResult(value: unknown): value is RouterResult {
  try {
    RouterResultSchema.parse(value)
    return true
  } catch {
    return false
  }
}

/**
 * Validation utility for API requests
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validation result with parsed data or errors
 * @category Utility
 */
export function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Validation failed with unknown error']
    }
  }
}

// ===========================================================================================
// EVIDENCE AND VISUALIZATION INTERFACES
// ===========================================================================================

/**
 * Chart types supported by the evidence visualization system
 * 
 * @category Evidence
 */
export type ChartType = 'bar' | 'pie' | 'line' | 'area' | 'scatter'

/**
 * Data type classification for proper rendering
 * 
 * @category Evidence
 */
export type DataType = 'number' | 'string' | 'date' | 'boolean' | 'currency' | 'percentage'

/**
 * Column metadata for evidence data tables
 * 
 * @category Evidence
 */
export interface ColumnMetadata {
  /** Column identifier */
  key: string
  /** Display label for the column */
  label: string
  /** Data type for proper formatting */
  dataType: DataType
  /** Whether this column is sortable */
  sortable?: boolean
  /** Whether this column is searchable */
  searchable?: boolean
  /** Custom formatter function */
  formatter?: (value: any) => string
  /** Column width in pixels or percentage */
  width?: string | number
}

/**
 * Chart data point interface
 * 
 * @category Evidence
 */
export interface ChartDataPoint {
  /** X-axis value or category name */
  name: string
  /** Y-axis value */
  value: number
  /** Additional metadata for the data point */
  metadata?: Record<string, any>
  /** Custom color for this data point */
  color?: string
}

/**
 * Performance metrics for query execution
 * 
 * @category Evidence
 */
export interface QueryPerformance {
  /** Number of records processed */
  recordsProcessed: number
  /** Query execution time in milliseconds */
  executionTime: number
  /** Whether the query was successful */
  success: boolean
  /** Error message if query failed */
  errorMessage?: string
  /** Database tables accessed */
  tablesAccessed: string[]
  /** Query optimization suggestions */
  optimizationSuggestions?: string[]
}

/**
 * Data quality assessment for evidence
 * 
 * @category Evidence
 */
export interface DataQuality {
  /** Overall quality score (0-100) */
  overallScore: number
  /** Individual quality checks */
  checks: {
    /** Data completeness percentage */
    completeness: number
    /** Data accuracy assessment */
    accuracy: number
    /** Data consistency score */
    consistency: number
    /** Timeliness of data */
    timeliness: number
  }
  /** Quality issues found */
  issues: string[]
  /** Quality improvements made */
  improvements: string[]
}

/**
 * Evidence metadata for debugging and traceability
 * 
 * @category Evidence
 */
export interface EvidenceMetadata {
  /** Query performance metrics */
  performance: QueryPerformance
  /** Data quality assessment */
  dataQuality: DataQuality
  /** Analysis type that generated this evidence */
  analysisType: AnalysisType
  /** Data source information */
  dataSource: {
    /** Primary data source name */
    primary: string
    /** Secondary data sources used */
    secondary?: string[]
    /** Data vintage/timestamp */
    vintage: Date
  }
  /** Confidence metrics */
  confidence: {
    /** Overall confidence score (0-100) */
    overall: number
    /** Data reliability score */
    dataReliability: number
    /** Analysis accuracy score */
    analysisAccuracy: number
  }
}

/**
 * Comprehensive evidence data structure
 * 
 * @category Evidence
 */
export interface EvidenceData {
  /** Raw data rows */
  data?: any[]
  /** Column definitions with metadata */
  columns?: ColumnMetadata[]
  /** Simple column names (for backward compatibility) */
  columnNames?: string[]
  /** SQL query that generated this data */
  sqlQuery?: string
  /** Chart data for visualization */
  chartData?: ChartDataPoint[]
  /** Preferred chart type for visualization */
  chartType?: ChartType
  /** Generated insights from the data */
  insights?: string[]
  /** Evidence metadata for debugging */
  metadata?: EvidenceMetadata
  /** Custom configuration for rendering */
  renderConfig?: {
    /** Maximum rows to display in table */
    maxRows?: number
    /** Default sort column */
    defaultSort?: { column: string; direction: 'asc' | 'desc' }
    /** Columns to hide by default */
    hiddenColumns?: string[]
    /** Custom color scheme for charts */
    colorScheme?: string[]
  }
}

/**
 * Evidence component configuration options
 * 
 * @category Evidence
 */
export interface EvidenceConfig {
  /** Component title */
  title?: string
  /** Additional CSS classes */
  className?: string
  /** Enable/disable specific tabs */
  enabledTabs?: ('data' | 'visualize' | 'debug')[]
  /** Default active tab */
  defaultTab?: 'data' | 'visualize' | 'debug'
  /** Component size variant */
  size?: 'compact' | 'normal' | 'expanded'
  /** Enable export functionality */
  enableExport?: boolean
  /** Enable advanced filtering */
  enableAdvancedFiltering?: boolean
  /** Custom action buttons */
  customActions?: Array<{
    label: string
    icon?: any
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'outline'
  }>
  /** Responsive breakpoints configuration */
  responsive?: {
    /** Hide certain elements on mobile */
    hideOnMobile?: string[]
    /** Collapse to accordion on mobile */
    collapseOnMobile?: boolean
  }
}

/**
 * Evidence component props interface
 * 
 * @category Evidence
 */
export interface EvidenceProps {
  /** Evidence data to display */
  evidenceData: EvidenceData
  /** Component configuration */
  config?: EvidenceConfig
  /** Callback when data is exported */
  onExport?: (data: any[], format: 'csv' | 'json' | 'excel') => void
  /** Callback when filter is applied */
  onFilter?: (filteredData: any[]) => void
  /** Callback when sort is applied */
  onSort?: (sortedData: any[], column: string, direction: 'asc' | 'desc') => void
  /** Callback when chart type is changed */
  onChartTypeChange?: (chartType: ChartType) => void
  /** Loading state */
  isLoading?: boolean
  /** Error state */
  error?: string
}

// ===========================================================================================
// VALIDATION SCHEMAS FOR EVIDENCE
// ===========================================================================================

/**
 * Validation schema for column metadata
 * 
 * @category Validation
 */
export const ColumnMetadataSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  dataType: z.enum(['number', 'string', 'date', 'boolean', 'currency', 'percentage']),
  sortable: z.boolean().optional(),
  searchable: z.boolean().optional(),
  formatter: z.function().optional(),
  width: z.union([z.string(), z.number()]).optional()
})

/**
 * Validation schema for chart data points
 * 
 * @category Validation
 */
export const ChartDataPointSchema = z.object({
  name: z.string(),
  value: z.number(),
  metadata: z.record(z.any()).optional(),
  color: z.string().optional()
})

/**
 * Validation schema for evidence data
 * 
 * @category Validation
 */
export const EvidenceDataSchema = z.object({
  data: z.array(z.any()).optional(),
  columns: z.array(ColumnMetadataSchema).optional(),
  columnNames: z.array(z.string()).optional(),
  sqlQuery: z.string().optional(),
  chartData: z.array(ChartDataPointSchema).optional(),
  chartType: z.enum(['bar', 'pie', 'line', 'area', 'scatter']).optional(),
  insights: z.array(z.string()).optional(),
  metadata: z.any().optional(),
  renderConfig: z.object({
    maxRows: z.number().optional(),
    defaultSort: z.object({
      column: z.string(),
      direction: z.enum(['asc', 'desc'])
    }).optional(),
    hiddenColumns: z.array(z.string()).optional(),
    colorScheme: z.array(z.string()).optional()
  }).optional()
})

/**
 * Validation schema for evidence configuration
 * 
 * @category Validation
 */
export const EvidenceConfigSchema = z.object({
  title: z.string().optional(),
  className: z.string().optional(),
  enabledTabs: z.array(z.enum(['data', 'visualize', 'debug'])).optional(),
  defaultTab: z.enum(['data', 'visualize', 'debug']).optional(),
  size: z.enum(['compact', 'normal', 'expanded']).optional(),
  enableExport: z.boolean().optional(),
  enableAdvancedFiltering: z.boolean().optional(),
  customActions: z.array(z.object({
    label: z.string(),
    icon: z.any().optional(),
    onClick: z.function(),
    variant: z.enum(['primary', 'secondary', 'outline']).optional()
  })).optional(),
  responsive: z.object({
    hideOnMobile: z.array(z.string()).optional(),
    collapseOnMobile: z.boolean().optional()
  }).optional()
})

// ===========================================================================================
// EXPORTS
// ===========================================================================================

// Export all schemas and types - consolidated exports
// All schemas are already exported above where they are defined