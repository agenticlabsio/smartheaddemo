import { Database } from './database'
import { MessageFeedback, EvidenceReference, FileUpload } from '@/lib/types'

interface StoredMessage {
  messageId: string
  userId: string
  sqlQuery?: string
  responseData?: any
  timestamp: Date
}

interface MessageWithEvidence {
  messageId: string
  sqlQuery?: string
  responseData?: any
  evidenceReferences: EvidenceReference[]
  feedback?: MessageFeedback
}

export class DatabaseMessageStorage {
  private static instance: DatabaseMessageStorage

  static getInstance(): DatabaseMessageStorage {
    if (!DatabaseMessageStorage.instance) {
      DatabaseMessageStorage.instance = new DatabaseMessageStorage()
    }
    return DatabaseMessageStorage.instance
  }

  async store(messageId: string, userId: string, data: { sqlQuery?: string; responseData?: any }): Promise<void> {
    if (!messageId || !userId) return

    try {
      // Use UPSERT to handle both insert and update cases
      await Database.query(
        `INSERT INTO stored_message_data (message_id, user_id, sql_query, response_data, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (message_id) 
         DO UPDATE SET 
           sql_query = EXCLUDED.sql_query,
           response_data = EXCLUDED.response_data,
           updated_at = NOW()`,
        [
          messageId,
          userId,
          data.sqlQuery || null,
          data.responseData ? JSON.stringify(data.responseData) : null
        ]
      )
    } catch (error) {
      console.error('Failed to store message data:', error)
      throw error
    }
  }

  async getSQLQuery(messageId: string, userId: string): Promise<string | null> {
    if (!messageId || !userId) return null

    try {
      const result = await Database.query(
        'SELECT sql_query FROM stored_message_data WHERE message_id = $1 AND user_id = $2',
        [messageId, userId]
      )

      return result.rows.length > 0 ? result.rows[0].sql_query : null
    } catch (error) {
      console.error('Failed to get SQL query:', error)
      return null
    }
  }

  async getResponseData(messageId: string, userId: string): Promise<any | null> {
    if (!messageId || !userId) return null

    try {
      const result = await Database.query(
        'SELECT response_data FROM stored_message_data WHERE message_id = $1 AND user_id = $2',
        [messageId, userId]
      )

      if (result.rows.length > 0 && result.rows[0].response_data) {
        return JSON.parse(result.rows[0].response_data)
      }
      return null
    } catch (error) {
      console.error('Failed to get response data:', error)
      return null
    }
  }

  async cleanup(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Clean up old messages for specific user (keep last 100)
        await Database.query(
          `DELETE FROM stored_message_data 
           WHERE user_id = $1 
           AND message_id NOT IN (
             SELECT message_id FROM stored_message_data 
             WHERE user_id = $1 
             ORDER BY updated_at DESC 
             LIMIT 100
           )`,
          [userId]
        )
      } else {
        // Clean up globally (keep last 1000 messages total)
        await Database.query(
          `DELETE FROM stored_message_data 
           WHERE message_id NOT IN (
             SELECT message_id FROM stored_message_data 
             ORDER BY updated_at DESC 
             LIMIT 1000
           )`
        )
      }
    } catch (error) {
      console.error('Failed to cleanup message data:', error)
    }
  }

  async getUserMessageCount(userId: string): Promise<number> {
    if (!userId) return 0

    try {
      const result = await Database.query(
        'SELECT COUNT(*) as count FROM stored_message_data WHERE user_id = $1',
        [userId]
      )
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error('Failed to get user message count:', error)
      return 0
    }
  }

  // === EVIDENCE REFERENCE METHODS ===

  /**
   * Store evidence reference for a message
   */
  async storeEvidenceReference(evidenceRef: Omit<EvidenceReference, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!evidenceRef.evidenceId || !evidenceRef.messageId || !evidenceRef.userId) return

    try {
      await Database.query(
        `INSERT INTO evidence_references 
        (evidence_id, message_id, user_id, evidence_type, evidence_data, metadata, confidence_score, data_sources, artifact_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        ON CONFLICT (evidence_id)
        DO UPDATE SET 
          evidence_data = EXCLUDED.evidence_data,
          metadata = EXCLUDED.metadata,
          confidence_score = EXCLUDED.confidence_score,
          data_sources = EXCLUDED.data_sources,
          artifact_url = EXCLUDED.artifact_url,
          updated_at = NOW()`,
        [
          evidenceRef.evidenceId,
          evidenceRef.messageId,
          evidenceRef.userId,
          evidenceRef.evidenceType,
          JSON.stringify(evidenceRef.evidenceData),
          evidenceRef.metadata ? JSON.stringify(evidenceRef.metadata) : null,
          evidenceRef.confidenceScore || null,
          evidenceRef.dataSources ? JSON.stringify(evidenceRef.dataSources) : null,
          evidenceRef.artifactUrl || null
        ]
      )
    } catch (error) {
      console.error('Failed to store evidence reference:', error)
      throw error
    }
  }

  /**
   * Get evidence references for a message
   */
  async getEvidenceReferences(messageId: string, userId: string): Promise<EvidenceReference[]> {
    if (!messageId || !userId) return []

    try {
      const result = await Database.query(
        `SELECT evidence_id, message_id, user_id, evidence_type, evidence_data, metadata, 
                confidence_score, data_sources, artifact_url, created_at, updated_at
         FROM evidence_references 
         WHERE message_id = $1 AND user_id = $2`,
        [messageId, userId]
      )

      return result.rows.map(row => ({
        evidenceId: row.evidence_id,
        messageId: row.message_id,
        userId: row.user_id,
        evidenceType: row.evidence_type,
        evidenceData: JSON.parse(row.evidence_data),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        confidenceScore: row.confidence_score,
        dataSources: row.data_sources ? JSON.parse(row.data_sources) : undefined,
        artifactUrl: row.artifact_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Failed to get evidence references:', error)
      return []
    }
  }

  /**
   * Get evidence reference by ID
   */
  async getEvidenceReference(evidenceId: string, userId: string): Promise<EvidenceReference | null> {
    if (!evidenceId || !userId) return null

    try {
      const result = await Database.query(
        `SELECT evidence_id, message_id, user_id, evidence_type, evidence_data, metadata, 
                confidence_score, data_sources, artifact_url, created_at, updated_at
         FROM evidence_references 
         WHERE evidence_id = $1 AND user_id = $2`,
        [evidenceId, userId]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        evidenceId: row.evidence_id,
        messageId: row.message_id,
        userId: row.user_id,
        evidenceType: row.evidence_type,
        evidenceData: JSON.parse(row.evidence_data),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        confidenceScore: row.confidence_score,
        dataSources: row.data_sources ? JSON.parse(row.data_sources) : undefined,
        artifactUrl: row.artifact_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      console.error('Failed to get evidence reference:', error)
      return null
    }
  }

  // === FEEDBACK METHODS ===

  /**
   * Store user feedback for a message
   */
  async storeFeedback(feedback: Omit<MessageFeedback, 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!feedback.messageId || !feedback.userId) return

    try {
      await Database.query(
        `INSERT INTO message_feedback 
        (message_id, user_id, rating, notes, evidence_reference_id, feedback_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (message_id, user_id)
        DO UPDATE SET 
          rating = EXCLUDED.rating,
          notes = EXCLUDED.notes,
          evidence_reference_id = EXCLUDED.evidence_reference_id,
          feedback_type = EXCLUDED.feedback_type,
          updated_at = NOW()`,
        [
          feedback.messageId,
          feedback.userId,
          feedback.rating,
          feedback.notes || null,
          feedback.evidenceReferenceId || null,
          feedback.feedbackType || 'general'
        ]
      )
    } catch (error) {
      console.error('Failed to store feedback:', error)
      throw error
    }
  }

  /**
   * Get feedback for a message
   */
  async getFeedback(messageId: string, userId: string): Promise<MessageFeedback | null> {
    if (!messageId || !userId) return null

    try {
      const result = await Database.query(
        `SELECT message_id, user_id, rating, notes, evidence_reference_id, feedback_type, created_at, updated_at
         FROM message_feedback 
         WHERE message_id = $1 AND user_id = $2`,
        [messageId, userId]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        messageId: row.message_id,
        userId: row.user_id,
        rating: row.rating,
        notes: row.notes,
        evidenceReferenceId: row.evidence_reference_id,
        feedbackType: row.feedback_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    } catch (error) {
      console.error('Failed to get feedback:', error)
      return null
    }
  }

  /**
   * Get all feedback for a user
   */
  async getUserFeedback(userId: string): Promise<MessageFeedback[]> {
    if (!userId) return []

    try {
      const result = await Database.query(
        `SELECT message_id, user_id, rating, notes, evidence_reference_id, feedback_type, created_at, updated_at
         FROM message_feedback 
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      )

      return result.rows.map(row => ({
        messageId: row.message_id,
        userId: row.user_id,
        rating: row.rating,
        notes: row.notes,
        evidenceReferenceId: row.evidence_reference_id,
        feedbackType: row.feedback_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    } catch (error) {
      console.error('Failed to get user feedback:', error)
      return []
    }
  }

  // === COMPREHENSIVE DATA RETRIEVAL ===

  /**
   * Get complete message data including evidence and feedback
   */
  async getMessageWithEvidence(messageId: string, userId: string): Promise<MessageWithEvidence | null> {
    if (!messageId || !userId) return null

    try {
      // Get stored message data
      const messageData = await this.getResponseData(messageId, userId)
      const sqlQuery = await this.getSQLQuery(messageId, userId)
      
      // Get evidence references
      const evidenceReferences = await this.getEvidenceReferences(messageId, userId)
      
      // Get feedback
      const feedback = await this.getFeedback(messageId, userId)

      return {
        messageId,
        sqlQuery,
        responseData: messageData,
        evidenceReferences,
        feedback: feedback || undefined
      }
    } catch (error) {
      console.error('Failed to get message with evidence:', error)
      return null
    }
  }

  /**
   * Get conversation context with all evidence and feedback
   */
  async getConversationContext(messageIds: string[], userId: string): Promise<MessageWithEvidence[]> {
    if (!messageIds.length || !userId) return []

    try {
      const messages: MessageWithEvidence[] = []
      
      for (const messageId of messageIds) {
        const messageWithEvidence = await this.getMessageWithEvidence(messageId, userId)
        if (messageWithEvidence) {
          messages.push(messageWithEvidence)
        }
      }
      
      return messages
    } catch (error) {
      console.error('Failed to get conversation context:', error)
      return []
    }
  }

  /**
   * Get feedback statistics for a user
   */
  async getFeedbackStats(userId: string): Promise<{ positive: number; negative: number; total: number }> {
    if (!userId) return { positive: 0, negative: 0, total: 0 }

    try {
      const result = await Database.query(
        `SELECT 
           SUM(CASE WHEN rating = 'positive' THEN 1 ELSE 0 END) as positive,
           SUM(CASE WHEN rating = 'negative' THEN 1 ELSE 0 END) as negative,
           COUNT(*) as total
         FROM message_feedback 
         WHERE user_id = $1`,
        [userId]
      )

      const row = result.rows[0]
      return {
        positive: parseInt(row.positive) || 0,
        negative: parseInt(row.negative) || 0,
        total: parseInt(row.total) || 0
      }
    } catch (error) {
      console.error('Failed to get feedback stats:', error)
      return { positive: 0, negative: 0, total: 0 }
    }
  }

  // === FILE UPLOAD MANAGEMENT ===

  /**
   * Store file upload metadata
   */
  async storeFileUpload(fileUpload: Omit<FileUpload, 'createdAt' | 'updatedAt' | 'processedAt'>): Promise<void> {
    try {
      await Database.query(
        `INSERT INTO file_uploads (
          file_id, user_id, original_filename, file_type, file_size, mime_type, 
          object_path, upload_context, processing_status, processing_result, 
          chat_context, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          fileUpload.fileId,
          fileUpload.userId,
          fileUpload.originalFilename,
          fileUpload.fileType,
          fileUpload.fileSize,
          fileUpload.mimeType,
          fileUpload.objectPath,
          JSON.stringify(fileUpload.uploadContext),
          fileUpload.processingStatus,
          fileUpload.processingResult ? JSON.stringify(fileUpload.processingResult) : null,
          fileUpload.chatContext ? JSON.stringify(fileUpload.chatContext) : null,
          fileUpload.errorMessage || null
        ]
      )
    } catch (error) {
      console.error('Failed to store file upload:', error)
      throw error
    }
  }

  /**
   * Update file upload processing status and results
   */
  async updateFileUploadProcessing(fileId: string, userId: string, update: {
    processingStatus: 'processing' | 'completed' | 'failed'
    processingResult?: any
    chatContext?: any
    errorMessage?: string
  }): Promise<void> {
    try {
      const fields: string[] = ['processing_status = $3', 'updated_at = NOW()']
      const values: any[] = [fileId, userId, update.processingStatus]
      let paramCount = 3

      if (update.processingResult !== undefined) {
        paramCount++
        fields.push(`processing_result = $${paramCount}`)
        values.push(JSON.stringify(update.processingResult))
      }

      if (update.chatContext !== undefined) {
        paramCount++
        fields.push(`chat_context = $${paramCount}`)
        values.push(JSON.stringify(update.chatContext))
      }

      if (update.errorMessage !== undefined) {
        paramCount++
        fields.push(`error_message = $${paramCount}`)
        values.push(update.errorMessage)
      }

      if (update.processingStatus === 'completed' || update.processingStatus === 'failed') {
        fields.push('processed_at = NOW()')
      }

      await Database.query(
        `UPDATE file_uploads SET ${fields.join(', ')} WHERE file_id = $1 AND user_id = $2`,
        values
      )
    } catch (error) {
      console.error('Failed to update file upload processing:', error)
      throw error
    }
  }

  /**
   * Get file upload by ID
   */
  async getFileUpload(fileId: string, userId: string): Promise<FileUpload | null> {
    try {
      const result = await Database.query(
        `SELECT * FROM file_uploads WHERE file_id = $1 AND user_id = $2`,
        [fileId, userId]
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
        fileId: row.file_id,
        userId: row.user_id,
        originalFilename: row.original_filename,
        fileType: row.file_type,
        fileSize: parseInt(row.file_size),
        mimeType: row.mime_type,
        objectPath: row.object_path,
        uploadContext: row.upload_context ? JSON.parse(row.upload_context) : {},
        processingStatus: row.processing_status,
        processingResult: row.processing_result ? JSON.parse(row.processing_result) : undefined,
        chatContext: row.chat_context ? JSON.parse(row.chat_context) : undefined,
        errorMessage: row.error_message || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : undefined
      }
    } catch (error) {
      console.error('Failed to get file upload:', error)
      return null
    }
  }

  /**
   * Get all file uploads for a user
   */
  async getUserFileUploads(userId: string, limit: number = 50): Promise<FileUpload[]> {
    try {
      const result = await Database.query(
        `SELECT * FROM file_uploads WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [userId, limit]
      )

      return result.rows.map(row => ({
        fileId: row.file_id,
        userId: row.user_id,
        originalFilename: row.original_filename,
        fileType: row.file_type,
        fileSize: parseInt(row.file_size),
        mimeType: row.mime_type,
        objectPath: row.object_path,
        uploadContext: row.upload_context ? JSON.parse(row.upload_context) : {},
        processingStatus: row.processing_status,
        processingResult: row.processing_result ? JSON.parse(row.processing_result) : undefined,
        chatContext: row.chat_context ? JSON.parse(row.chat_context) : undefined,
        errorMessage: row.error_message || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : undefined
      }))
    } catch (error) {
      console.error('Failed to get user file uploads:', error)
      return []
    }
  }

  /**
   * Create evidence reference from file upload analysis
   */
  async createFileEvidenceReference(fileUpload: FileUpload, messageId: string): Promise<string | null> {
    if (!fileUpload.processingResult || fileUpload.processingStatus !== 'completed') {
      return null
    }

    const evidenceId = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Determine evidence type based on file type
    const evidenceTypeMap: Record<string, string> = {
      'pdf': 'file_pdf',
      'excel': 'file_excel',
      'word': 'file_word',
      'csv': 'file_csv',
      'image': 'file_image',
      'text': 'file_document',
      'document': 'file_document'
    }
    
    const evidenceType = evidenceTypeMap[fileUpload.fileType] || 'file_document'

    try {
      await this.storeEvidenceReference({
        evidenceId,
        messageId,
        userId: fileUpload.userId,
        evidenceType: evidenceType as any,
        evidenceData: {
          fileId: fileUpload.fileId,
          filename: fileUpload.originalFilename,
          analysisResult: fileUpload.processingResult,
          chatContext: fileUpload.chatContext
        },
        metadata: {
          fileType: fileUpload.fileType,
          mimeType: fileUpload.mimeType,
          fileSize: fileUpload.fileSize,
          processingDate: fileUpload.processedAt
        },
        confidenceScore: fileUpload.processingResult?.metadata?.extractionQuality || undefined,
        dataSources: ['file_upload'],
        artifactUrl: `/api/files/${fileUpload.fileId}`
      })

      return evidenceId
    } catch (error) {
      console.error('Failed to create file evidence reference:', error)
      return null
    }
  }

  /**
   * Get conversation context from file uploads
   */
  async getConversationFileContext(userId: string, conversationId?: string): Promise<{
    files: FileUpload[]
    relevantInsights: string[]
    suggestedQueries: string[]
  }> {
    try {
      let query = `SELECT * FROM file_uploads WHERE user_id = $1 AND processing_status = 'completed'`
      const params: any[] = [userId]

      if (conversationId) {
        query += ` AND upload_context->>'conversationId' = $2`
        params.push(conversationId)
      }

      query += ` ORDER BY created_at DESC LIMIT 10`

      const result = await Database.query(query, params)

      const files: FileUpload[] = result.rows.map(row => ({
        fileId: row.file_id,
        userId: row.user_id,
        originalFilename: row.original_filename,
        fileType: row.file_type,
        fileSize: parseInt(row.file_size),
        mimeType: row.mime_type,
        objectPath: row.object_path,
        uploadContext: row.upload_context ? JSON.parse(row.upload_context) : {},
        processingStatus: row.processing_status,
        processingResult: row.processing_result ? JSON.parse(row.processing_result) : undefined,
        chatContext: row.chat_context ? JSON.parse(row.chat_context) : undefined,
        errorMessage: row.error_message || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        processedAt: row.processed_at ? new Date(row.processed_at) : undefined
      }))

      // Aggregate insights and suggestions
      const allInsights: string[] = []
      const allSuggestions: string[] = []

      for (const file of files) {
        if (file.chatContext?.relevantFinancialInfo) {
          allInsights.push(...file.chatContext.relevantFinancialInfo)
        }
        if (file.chatContext?.suggestedFollowUps) {
          allSuggestions.push(...file.chatContext.suggestedFollowUps)
        }
      }

      return {
        files,
        relevantInsights: [...new Set(allInsights)].slice(0, 10),
        suggestedQueries: [...new Set(allSuggestions)].slice(0, 5)
      }
    } catch (error) {
      console.error('Failed to get conversation file context:', error)
      return { files: [], relevantInsights: [], suggestedQueries: [] }
    }
  }
}

export const dbMessageStorage = DatabaseMessageStorage.getInstance()