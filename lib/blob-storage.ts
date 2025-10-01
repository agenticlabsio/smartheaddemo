import { put, list, del } from '@vercel/blob'

export interface FeedbackData {
  id: string
  messageId: string
  query: string
  response: string
  rating: 'thumbs_up' | 'thumbs_down' | null
  notes: string
  timestamp: Date
  model: string
  executionTime: number
  reasoning?: string
}

export class BlobStorageService {
  private static instance: BlobStorageService
  
  static getInstance(): BlobStorageService {
    if (!BlobStorageService.instance) {
      BlobStorageService.instance = new BlobStorageService()
    }
    return BlobStorageService.instance
  }
  
  async storeFeedback(feedback: FeedbackData): Promise<string> {
    try {
      const filename = `feedback/${feedback.id}.json`
      const blob = await put(filename, JSON.stringify(feedback), {
        access: 'public',
      })
      return blob.url
    } catch (error) {
      console.error('Failed to store feedback:', error)
      throw error
    }
  }
  
  async getFeedback(feedbackId: string): Promise<FeedbackData | null> {
    try {
      const filename = `feedback/${feedbackId}.json`
      const response = await fetch(`https://blob.vercel-storage.com/${filename}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to get feedback:', error)
      return null
    }
  }
  
  async getAllFeedback(): Promise<FeedbackData[]> {
    try {
      const { blobs } = await list({ prefix: 'feedback/' })
      const feedbackPromises = blobs.map(async (blob) => {
        const response = await fetch(blob.url)
        return await response.json()
      })
      return await Promise.all(feedbackPromises)
    } catch (error) {
      console.error('Failed to get all feedback:', error)
      return []
    }
  }
  
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    try {
      const filename = `feedback/${feedbackId}.json`
      await del(filename)
      return true
    } catch (error) {
      console.error('Failed to delete feedback:', error)
      return false
    }
  }
}

export const blobStorage = BlobStorageService.getInstance()