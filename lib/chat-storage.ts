interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatData {
  id: string
  messages: ChatMessage[]
  metadata: {
    timestamp: string
    messageCount: number
    [key: string]: any
  }
}

export class ChatStorage {
  static async saveChat(messages: ChatMessage[], chatId?: string, metadata?: any): Promise<string> {
    try {
      const response = await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          chatId,
          metadata,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save chat")
      }

      return result.chatId
    } catch (error) {
      console.error("Error saving chat:", error)
      throw error
    }
  }

  static async loadChats(): Promise<any[]> {
    try {
      const response = await fetch("/api/chat/load")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load chats")
      }

      return result.chats
    } catch (error) {
      console.error("Error loading chats:", error)
      throw error
    }
  }

  static async loadChat(chatId: string): Promise<ChatData> {
    try {
      const response = await fetch(`/api/chat/load/${chatId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to load chat")
      }

      return result.chat
    } catch (error) {
      console.error("Error loading specific chat:", error)
      throw error
    }
  }

  static async deleteChat(chatId: string): Promise<void> {
    try {
      const response = await fetch("/api/chat/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
      throw error
    }
  }

  // Helper method to auto-save chats periodically
  static async autoSaveChat(messages: ChatMessage[], chatId?: string): Promise<string> {
    // Only auto-save if there are messages and it's been a reasonable interval
    if (messages.length === 0) {
      return chatId || ""
    }

    try {
      return await this.saveChat(messages, chatId, {
        autoSaved: true,
        lastActivity: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Auto-save failed:", error)
      return chatId || ""
    }
  }
}
