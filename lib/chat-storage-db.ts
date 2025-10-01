import { Database } from './database'
import { ChatMessage, SavedChat, MessageFeedback, EvidenceReference, AnalysisMode } from '@/lib/types'

export class DatabaseChatStorageService {
  private static instance: DatabaseChatStorageService
  
  static getInstance(): DatabaseChatStorageService {
    if (!DatabaseChatStorageService.instance) {
      DatabaseChatStorageService.instance = new DatabaseChatStorageService()
    }
    return DatabaseChatStorageService.instance
  }

  async saveChat(chatId: string, messages: ChatMessage[], userId: string): Promise<SavedChat | null> {
    if (!Array.isArray(messages) || messages.length === 0 || !userId) return null
    
    try {
      // Generate title from first user message
      const firstUserMessage = messages.find(m => m && m.role === 'user')
      const title = firstUserMessage?.content ? 
        firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') : 
        'New Chat'

      // Start transaction for atomic operations
      const client = await Database.getClient()
      
      try {
        await client.query('BEGIN')

        // Check if session exists
        const sessionResult = await client.query(
          'SELECT id, created_at FROM user_chat_sessions WHERE session_id = $1 AND user_id = $2',
          [chatId, userId]
        )

        let createdAt: Date
        if (sessionResult.rows.length === 0) {
          // Create new session
          await client.query(
            'INSERT INTO user_chat_sessions (user_id, session_id, title, message_count) VALUES ($1, $2, $3, $4)',
            [userId, chatId, title, messages.length]
          )
          createdAt = new Date()
        } else {
          // Update existing session
          await client.query(
            'UPDATE user_chat_sessions SET title = $1, message_count = $2, updated_at = NOW() WHERE session_id = $3 AND user_id = $4',
            [title, messages.length, chatId, userId]
          )
          createdAt = sessionResult.rows[0].created_at
        }

        // Delete existing messages for this session (for updates)
        await client.query(
          'DELETE FROM chat_messages WHERE session_id = $1 AND user_id = $2',
          [chatId, userId]
        )

        // Insert all messages with enhanced fields
        for (const message of messages) {
          await client.query(
            `INSERT INTO chat_messages 
            (session_id, user_id, message_id, role, content, reasoning, sql_query, metadata, mode, evidence_reference_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              chatId, 
              userId, 
              message.id, 
              message.role, 
              message.content, 
              message.reasoning || null,
              message.sqlQuery || null,
              message.metadata ? JSON.stringify(message.metadata) : null,
              message.mode || 'analyst',
              message.evidenceReferenceId || null
            ]
          )
        }

        await client.query('COMMIT')

        return {
          id: chatId,
          title,
          messages,
          createdAt,
          updatedAt: new Date(),
          messageCount: messages.length,
          userId
        }

      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }

    } catch (error) {
      console.error('Failed to save chat:', error)
      return null
    }
  }

  async getAllChats(userId: string): Promise<SavedChat[]> {
    if (!userId) return []
    
    try {
      const result = await Database.query(
        `SELECT s.session_id, s.title, s.created_at, s.updated_at, s.message_count, s.user_id
         FROM user_chat_sessions s 
         WHERE s.user_id = $1 
         ORDER BY s.updated_at DESC 
         LIMIT 50`,
        [userId]
      )

      const chats: SavedChat[] = []
      
      for (const session of result.rows) {
        // Get messages for this session with evidence and feedback data
        const messagesResult = await Database.query(
          `SELECT m.message_id, m.role, m.content, m.reasoning, m.sql_query, m.metadata, m.created_at, m.mode, m.evidence_reference_id,
                  f.rating as feedback_rating, f.notes as feedback_notes, f.feedback_type,
                  e.evidence_type, e.evidence_data, e.confidence_score, e.artifact_url
           FROM chat_messages m
           LEFT JOIN message_feedback f ON m.message_id = f.message_id AND m.user_id = f.user_id
           LEFT JOIN evidence_references e ON m.evidence_reference_id = e.evidence_id
           WHERE m.session_id = $1 AND m.user_id = $2 
           ORDER BY m.created_at ASC`,
          [session.session_id, userId]
        )

        const messages: ChatMessage[] = messagesResult.rows.map(row => ({
          id: row.message_id,
          role: row.role,
          content: row.content,
          timestamp: row.created_at,
          reasoning: row.reasoning,
          sqlQuery: row.sql_query,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
          mode: row.mode as AnalysisMode,
          evidenceReferenceId: row.evidence_reference_id,
          feedback: row.feedback_rating,
          followUpQueries: row.metadata?.followUpQueries || []
        }))

        // Calculate feedback summary
        const feedbackSummary = {
          positiveCount: messages.filter(m => m.feedback === 'positive').length,
          negativeCount: messages.filter(m => m.feedback === 'negative').length,
          totalCount: messages.filter(m => m.feedback).length
        }

        // Get evidence references for this conversation
        const evidenceResult = await Database.query(
          `SELECT DISTINCT e.evidence_id, e.message_id, e.user_id, e.evidence_type, e.evidence_data, 
                  e.metadata, e.confidence_score, e.data_sources, e.artifact_url, e.created_at, e.updated_at
           FROM evidence_references e
           JOIN chat_messages m ON e.message_id = m.message_id
           WHERE m.session_id = $1 AND m.user_id = $2`,
          [session.session_id, userId]
        )

        const evidenceReferences: EvidenceReference[] = evidenceResult.rows.map(row => ({
          evidenceId: row.evidence_id,
          messageId: row.message_id,
          userId: row.user_id,
          evidenceType: row.evidence_type,
          evidenceData: row.evidence_data,
          metadata: row.metadata,
          confidenceScore: row.confidence_score,
          dataSources: row.data_sources,
          artifactUrl: row.artifact_url,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }))

        chats.push({
          id: session.session_id,
          title: session.title,
          messages,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
          messageCount: session.message_count,
          userId: session.user_id,
          defaultMode: messages.length > 0 ? messages[0].mode : 'analyst',
          evidenceReferences,
          feedbackSummary
        })
      }

      return chats
    } catch (error) {
      console.error('Failed to load chats:', error)
      return []
    }
  }

  async getChat(chatId: string, userId: string): Promise<SavedChat | null> {
    if (!chatId || !userId) return null
    
    try {
      const sessionResult = await Database.query(
        'SELECT session_id, title, created_at, updated_at, message_count, user_id FROM user_chat_sessions WHERE session_id = $1 AND user_id = $2',
        [chatId, userId]
      )

      if (sessionResult.rows.length === 0) return null

      const session = sessionResult.rows[0]

      // Get messages for this session with evidence and feedback data
      const messagesResult = await Database.query(
        `SELECT m.message_id, m.role, m.content, m.reasoning, m.sql_query, m.metadata, m.created_at, m.mode, m.evidence_reference_id,
                f.rating as feedback_rating, f.notes as feedback_notes, f.feedback_type,
                e.evidence_type, e.evidence_data, e.confidence_score, e.artifact_url
         FROM chat_messages m
         LEFT JOIN message_feedback f ON m.message_id = f.message_id AND m.user_id = f.user_id
         LEFT JOIN evidence_references e ON m.evidence_reference_id = e.evidence_id
         WHERE m.session_id = $1 AND m.user_id = $2 
         ORDER BY m.created_at ASC`,
        [chatId, userId]
      )

      const messages: ChatMessage[] = messagesResult.rows.map(row => ({
        id: row.message_id,
        role: row.role,
        content: row.content,
        timestamp: row.created_at,
        reasoning: row.reasoning,
        sqlQuery: row.sql_query,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        mode: row.mode as AnalysisMode,
        evidenceReferenceId: row.evidence_reference_id,
        feedback: row.feedback_rating,
        followUpQueries: row.metadata?.followUpQueries || []
      }))

      // Calculate feedback summary
      const feedbackSummary = {
        positiveCount: messages.filter(m => m.feedback === 'positive').length,
        negativeCount: messages.filter(m => m.feedback === 'negative').length,
        totalCount: messages.filter(m => m.feedback).length
      }

      // Get evidence references for this conversation
      const evidenceResult = await Database.query(
        `SELECT DISTINCT e.evidence_id, e.message_id, e.user_id, e.evidence_type, e.evidence_data, 
                e.metadata, e.confidence_score, e.data_sources, e.artifact_url, e.created_at, e.updated_at
         FROM evidence_references e
         JOIN chat_messages m ON e.message_id = m.message_id
         WHERE m.session_id = $1 AND m.user_id = $2`,
        [chatId, userId]
      )

      const evidenceReferences: EvidenceReference[] = evidenceResult.rows.map(row => ({
        evidenceId: row.evidence_id,
        messageId: row.message_id,
        userId: row.user_id,
        evidenceType: row.evidence_type,
        evidenceData: row.evidence_data,
        metadata: row.metadata,
        confidenceScore: row.confidence_score,
        dataSources: row.data_sources,
        artifactUrl: row.artifact_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))

      return {
        id: session.session_id,
        title: session.title,
        messages,
        createdAt: session.created_at,
        updatedAt: session.updated_at,
        messageCount: session.message_count,
        userId: session.user_id,
        defaultMode: messages.length > 0 ? messages[0].mode : 'analyst',
        evidenceReferences,
        feedbackSummary
      }
    } catch (error) {
      console.error('Failed to get chat:', error)
      return null
    }
  }

  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    if (!chatId || !userId) return false
    
    try {
      // Delete session (messages will be deleted due to CASCADE)
      const result = await Database.query(
        'DELETE FROM user_chat_sessions WHERE session_id = $1 AND user_id = $2',
        [chatId, userId]
      )
      
      return (result.rowCount || 0) > 0
    } catch (error) {
      console.error('Failed to delete chat:', error)
      return false
    }
  }

  generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Initialize with pre-generated example chats for demonstration
  async initializeWithExamples(userId: string): Promise<void> {
    if (!userId) return
    
    try {
      const existingChats = await this.getAllChats(userId)
      if (existingChats.length > 0) return // Don't overwrite existing chats

      // Create example chats (same content as before but stored in database)
      const exampleChats = [
        {
          id: `example_1_${userId}`,
          title: 'Top spending entities by manufacturing overhead...',
          messages: [
            {
              id: 'msg_1_user',
              role: 'user' as const,
              content: 'Top spending entities by manufacturing overhead costs',
              timestamp: new Date(Date.now() - 86400000 * 2)
            },
            {
              id: 'msg_1_assistant',
              role: 'assistant' as const,
              content: `## 🎯 **Manufacturing Overhead Analysis - Top Spending Entities**

Based on your comprehensive financial dataset spanning 26,111 transactions worth $48.8M, here's the **Manufacturing Overhead** cost breakdown by entity:

### **📊 Top Manufacturing Overhead Spenders**

| **Entity Name** | **Manufacturing Overhead** | **% of Total** | **Trend** |
|----------------|---------------------------|----------------|-----------|
| **Asheville Manufacturing Hub** | $15.2M | 61.3% | ↗️ +12% YoY |
| **Distribution Center East** | $4.8M | 19.4% | ↘️ -3% YoY |
| **Innovation Campus** | $2.9M | 11.7% | ↗️ +8% YoY |
| **Supply Chain Operations** | $1.9M | 7.6% | → Stable |

### **🔍 Key Insights**

**🚨 Concentration Risk:** Asheville Manufacturing Hub represents 61.3% of all manufacturing overhead - creating significant operational dependency.

**💡 Optimization Opportunities:**
- **Equipment Consolidation:** $890K potential savings through shared resources
- **Energy Efficiency:** 15% reduction possible with LED upgrades
- **Maintenance Optimization:** Predictive maintenance could reduce costs by 8%

**📈 Business Impact:** Manufacturing overhead accounts for 51% of total operational costs, making this the highest-priority area for cost optimization initiatives.`,
              timestamp: new Date(Date.now() - 86400000 * 2),
              reasoning: `1. **Query Understanding**: User wants to analyze manufacturing overhead costs by entity to identify top spenders and optimization opportunities.

2. **Data Analysis**: Processed 26,111 transactions totaling $48.8M across 8 entities, filtering for Manufacturing Overhead cost group which represents $24.8M (51% of total spend).

3. **Context Application**: Manufacturing overhead is critical for operational efficiency in procurement analytics - high concentration in single entity creates both operational risk and optimization potential.

4. **Insight Generation**: Asheville Manufacturing Hub dominates with 61.3% share, indicating potential economies of scale but also dependency risk. Clear opportunities exist in equipment, energy, and maintenance optimization.

5. **Business Impact**: This concentration pattern suggests immediate action needed for risk mitigation and cost optimization, with potential $890K+ savings through consolidation and efficiency improvements.`,
              metadata: {
                queryType: 'entity_analysis',
                executionTime: 847,
                model: 'Gemini 2.5 Flash',
                confidence: 0.94,
                recordCount: 13847,
                status: 'complete'
              }
            }
          ]
        }
      ]

      // Save each example chat
      for (const exampleChat of exampleChats) {
        await this.saveChat(exampleChat.id, exampleChat.messages, userId)
      }

    } catch (error) {
      console.error('Failed to initialize example chats:', error)
    }
  }
}

export const dbChatStorage = DatabaseChatStorageService.getInstance()