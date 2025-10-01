// Feedback storage service for user ratings on AI responses
export interface ResponseFeedback {
  messageId: string
  feedback: 'positive' | 'negative'
  timestamp: Date
  sessionId?: string
  notes?: string // Optional detailed feedback notes
}

class FeedbackStorage {
  private storageKey = 'liveagent-feedback'
  
  // Store user feedback for a specific message
  storeFeedback(messageId: string, feedback: 'positive' | 'negative', notes?: string): void {
    try {
      const existingFeedback = this.getAllFeedback()
      const newFeedback: ResponseFeedback = {
        messageId,
        feedback,
        timestamp: new Date(),
        sessionId: this.getSessionId(),
        ...(notes && { notes })
      }
      
      // Remove any existing feedback for this message first
      const updatedFeedback = existingFeedback.filter(f => f.messageId !== messageId)
      updatedFeedback.push(newFeedback)
      
      // Keep only the last 1000 feedback entries
      if (updatedFeedback.length > 1000) {
        updatedFeedback.splice(0, updatedFeedback.length - 1000)
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedFeedback))
    } catch (error) {
      console.warn('Failed to store feedback:', error)
    }
  }
  
  // Get feedback for a specific message
  getFeedback(messageId: string): 'positive' | 'negative' | null {
    try {
      const allFeedback = this.getAllFeedback()
      const messageFeedback = allFeedback.find(f => f.messageId === messageId)
      return messageFeedback?.feedback || null
    } catch (error) {
      console.warn('Failed to get feedback:', error)
      return null
    }
  }
  
  // Get all feedback
  getAllFeedback(): ResponseFeedback[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }))
    } catch (error) {
      console.warn('Failed to load feedback:', error)
      return []
    }
  }
  
  // Get feedback statistics
  getFeedbackStats(): { positive: number; negative: number; total: number } {
    const allFeedback = this.getAllFeedback()
    const positive = allFeedback.filter(f => f.feedback === 'positive').length
    const negative = allFeedback.filter(f => f.feedback === 'negative').length
    
    return {
      positive,
      negative,
      total: positive + negative
    }
  }
  
  // Clear all feedback
  clearAllFeedback(): void {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      console.warn('Failed to clear feedback:', error)
    }
  }
  
  // Generate or get session ID
  private getSessionId(): string {
    const sessionKey = 'liveagent-session'
    try {
      let sessionId = localStorage.getItem(sessionKey)
      if (!sessionId) {
        sessionId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem(sessionKey, sessionId)
      }
      return sessionId
    } catch (error) {
      return Date.now().toString() + '_fallback'
    }
  }
}

export const feedbackStorage = new FeedbackStorage()