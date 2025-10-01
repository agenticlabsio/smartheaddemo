// Chat conversation functions for Convex
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// Get user conversations
export const getUserConversations = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50)
  }
})

// Get specific conversation
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId)
  }
})

// Create new conversation
export const createConversation = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    initialMessage: v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number()
    })
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert("conversations", {
      userId: args.userId,
      title: args.title,
      messages: [args.initialMessage],
      createdAt: now,
      updatedAt: now
    })
  }
})

// Add message to conversation
export const addMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    message: v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      metadata: v.optional(v.object({
        agent: v.optional(v.string()),
        confidence: v.optional(v.number()),
        executionTime: v.optional(v.number()),
        sqlQuery: v.optional(v.string()),
        dataSource: v.optional(v.string())
      }))
    })
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId)
    if (!conversation) throw new Error("Conversation not found")
    
    const updatedMessages = [...conversation.messages, args.message]
    
    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now()
    })
  }
})

// Update conversation title
export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now()
    })
  }
})