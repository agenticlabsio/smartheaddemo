import { Database } from '../database'
import { DatabaseChatStorageService } from '../chat-storage-db'
import { DatabaseMessageStorage } from '../message-storage-db'
import type { ChatMessage, SavedChat, MessageFeedback, EvidenceReference } from '@/lib/types'

/**
 * Unified Storage System - Single Database-Backed Solution
 * 
 * Consolidates dual storage systems (localStorage + database) into single optimized interface.
 * Eliminates memory overhead and redundancy from multiple storage layers.
 * 
 * Benefits:
 * - Single source of truth (PostgreSQL database)
 * - Memory optimization (no localStorage or in-memory redundancy)
 * - Cross-session persistence
 * - User isolation and security
 * - Simplified architecture
 */
export class UnifiedStorageService {
  private static instance: UnifiedStorageService
  private chatStorage: DatabaseChatStorageService
  private messageStorage: DatabaseMessageStorage

  private constructor() {
    this.chatStorage = DatabaseChatStorageService.getInstance()
    this.messageStorage = DatabaseMessageStorage.getInstance()
  }

  static getInstance(): UnifiedStorageService {
    if (!UnifiedStorageService.instance) {
      UnifiedStorageService.instance = new UnifiedStorageService()
    }
    return UnifiedStorageService.instance
  }

  // === CHAT CONVERSATION MANAGEMENT ===

  /**
   * Save or update a chat conversation
   */
  async saveChat(chatId: string, messages: ChatMessage[], userId: string): Promise<SavedChat | null> {
    if (!userId || !chatId || !Array.isArray(messages) || messages.length === 0) {
      return null
    }

    try {
      const savedChat = await this.chatStorage.saveChat(chatId, messages, userId)
      
      // Also store message-specific data (SQL queries, response data)
      for (const message of messages) {
        if (message.sqlQuery || message.metadata) {
          await this.messageStorage.store(message.id, userId, {
            sqlQuery: message.sqlQuery,
            responseData: message.metadata
          })
        }
      }

      return savedChat
    } catch (error) {
      console.error('UnifiedStorage: Failed to save chat:', error)
      return null
    }
  }

  /**
   * Retrieve all chats for a user
   */
  async getAllChats(userId: string): Promise<SavedChat[]> {
    if (!userId) return []

    try {
      return await this.chatStorage.getAllChats(userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get all chats:', error)
      return []
    }
  }

  /**
   * Retrieve a specific chat by ID
   */
  async getChat(chatId: string, userId: string): Promise<SavedChat | null> {
    if (!userId || !chatId) return null

    try {
      return await this.chatStorage.getChat(chatId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get chat:', error)
      return null
    }
  }

  /**
   * Delete a chat conversation
   */
  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    if (!userId || !chatId) return false

    try {
      const success = await this.chatStorage.deleteChat(chatId, userId)
      
      // Also cleanup related message data
      if (success) {
        await this.messageStorage.cleanup(userId)
      }
      
      return success
    } catch (error) {
      console.error('UnifiedStorage: Failed to delete chat:', error)
      return false
    }
  }

  // === MESSAGE-SPECIFIC DATA MANAGEMENT ===

  /**
   * Store SQL query and response data for a specific message
   */
  async storeMessageData(messageId: string, userId: string, data: { sqlQuery?: string; responseData?: any }): Promise<void> {
    if (!userId || !messageId) return

    try {
      await this.messageStorage.store(messageId, userId, data)
    } catch (error) {
      console.error('UnifiedStorage: Failed to store message data:', error)
    }
  }

  /**
   * Retrieve SQL query for a specific message
   */
  async getMessageSQLQuery(messageId: string, userId: string): Promise<string | null> {
    if (!userId || !messageId) return null

    try {
      return await this.messageStorage.getSQLQuery(messageId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get SQL query:', error)
      return null
    }
  }

  /**
   * Retrieve response data for a specific message
   */
  async getMessageResponseData(messageId: string, userId: string): Promise<any | null> {
    if (!userId || !messageId) return null

    try {
      return await this.messageStorage.getResponseData(messageId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get response data:', error)
      return null
    }
  }

  // === EVIDENCE REFERENCE METHODS ===

  /**
   * Store evidence reference for a message
   */
  async storeEvidenceReference(evidenceRef: Omit<EvidenceReference, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.messageStorage.storeEvidenceReference(evidenceRef)
    } catch (error) {
      console.error('UnifiedStorage: Failed to store evidence reference:', error)
    }
  }

  /**
   * Get evidence references for a message
   */
  async getEvidenceReferences(messageId: string, userId: string): Promise<EvidenceReference[]> {
    try {
      return await this.messageStorage.getEvidenceReferences(messageId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get evidence references:', error)
      return []
    }
  }

  /**
   * Get evidence reference by ID
   */
  async getEvidenceReference(evidenceId: string, userId: string): Promise<EvidenceReference | null> {
    try {
      return await this.messageStorage.getEvidenceReference(evidenceId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get evidence reference:', error)
      return null
    }
  }

  // === FEEDBACK METHODS ===

  /**
   * Store user feedback for a message
   */
  async storeFeedback(feedback: Omit<MessageFeedback, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      await this.messageStorage.storeFeedback(feedback)
    } catch (error) {
      console.error('UnifiedStorage: Failed to store feedback:', error)
    }
  }

  /**
   * Get feedback for a message
   */
  async getFeedback(messageId: string, userId: string): Promise<MessageFeedback | null> {
    try {
      return await this.messageStorage.getFeedback(messageId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get feedback:', error)
      return null
    }
  }

  /**
   * Get all feedback for a user
   */
  async getUserFeedback(userId: string): Promise<MessageFeedback[]> {
    try {
      return await this.messageStorage.getUserFeedback(userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get user feedback:', error)
      return []
    }
  }

  /**
   * Get feedback statistics for a user
   */
  async getFeedbackStats(userId: string): Promise<{ positive: number; negative: number; total: number }> {
    try {
      return await this.messageStorage.getFeedbackStats(userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get feedback stats:', error)
      return { positive: 0, negative: 0, total: 0 }
    }
  }

  /**
   * Get complete message data including evidence and feedback
   */
  async getMessageWithEvidence(messageId: string, userId: string): Promise<any> {
    try {
      return await this.messageStorage.getMessageWithEvidence(messageId, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get message with evidence:', error)
      return null
    }
  }

  /**
   * Get conversation context with all evidence and feedback
   */
  async getConversationContext(messageIds: string[], userId: string): Promise<any[]> {
    try {
      return await this.messageStorage.getConversationContext(messageIds, userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to get conversation context:', error)
      return []
    }
  }

  // === UTILITY METHODS ===

  /**
   * Generate a unique chat ID
   */
  generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Initialize user with example chats (for new users)
   */
  async initializeUserWithExamples(userId: string): Promise<void> {
    if (!userId) return

    try {
      await this.chatStorage.initializeWithExamples(userId)
    } catch (error) {
      console.error('UnifiedStorage: Failed to initialize examples:', error)
    }
  }

  /**
   * Cleanup old data for user (maintain performance)
   */
  async cleanupUserData(userId: string): Promise<void> {
    if (!userId) return

    try {
      // Cleanup message-specific data
      await this.messageStorage.cleanup(userId)
      
      // Could add chat cleanup here if needed (keep last N chats)
      console.log(`UnifiedStorage: Cleanup completed for user ${userId}`)
    } catch (error) {
      console.error('UnifiedStorage: Failed to cleanup user data:', error)
    }
  }

  // === MIGRATION HELPERS ===

  /**
   * Migration helper: Import data from localStorage to database
   * This helps transition from old localStorage system to unified database system
   */
  async migrateFromLocalStorage(userId: string): Promise<{ migrated: number; errors: number }> {
    if (!userId) return { migrated: 0, errors: 0 }

    let migrated = 0
    let errors = 0

    try {
      // Check if localStorage has data (client-side only)
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedChats = localStorage.getItem('finsight-chats')
        if (storedChats) {
          const chats = JSON.parse(storedChats)
          
          for (const chat of chats) {
            try {
              await this.saveChat(chat.id, chat.messages, userId)
              migrated++
            } catch (error) {
              console.error('Failed to migrate chat:', chat.id, error)
              errors++
            }
          }

          // Clear localStorage after successful migration
          if (migrated > 0) {
            localStorage.removeItem('finsight-chats')
            console.log(`UnifiedStorage: Migrated ${migrated} chats from localStorage`)
          }
        }
      }
    } catch (error) {
      console.error('UnifiedStorage: Migration failed:', error)
      errors++
    }

    return { migrated, errors }
  }
}

// Export singleton instance
export const unifiedStorage = UnifiedStorageService.getInstance()

// Export types for compatibility
export type { ChatMessage, SavedChat, MessageFeedback, EvidenceReference }