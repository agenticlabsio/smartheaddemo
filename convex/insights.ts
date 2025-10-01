// Financial insights functions for Convex
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// Get all insights
export const getAllInsights = query({
  args: {
    category: v.optional(v.string()),
    dataSource: v.optional(v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined"))),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("insights")
    
    if (args.category) {
      q = q.withIndex("by_category", (q) => q.eq("category", args.category))
    } else if (args.dataSource) {
      q = q.withIndex("by_data_source", (q) => q.eq("dataSource", args.dataSource))
    }
    
    return await q.order("desc").take(args.limit || 100)
  }
})

// Create new insight
export const createInsight = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.string(),
    impact: v.string(),
    confidence: v.number(),
    dataSource: v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined")),
    queryData: v.object({
      sql: v.string(),
      results: v.array(v.any()),
      executionTime: v.number()
    }),
    visualization: v.optional(v.object({
      type: v.union(v.literal("bar"), v.literal("pie"), v.literal("line"), v.literal("scatter")),
      data: v.array(v.any())
    })),
    tags: v.array(v.string()),
    governance: v.object({
      level: v.union(v.literal("public"), v.literal("finance"), v.literal("executive")),
      compliance: v.array(v.string())
    }),
    createdBy: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert("insights", {
      ...args,
      createdAt: now,
      updatedAt: now
    })
  }
})

// Get insights by confidence level
export const getHighConfidenceInsights = query({
  args: { minConfidence: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const minConf = args.minConfidence || 0.8
    
    return await ctx.db
      .query("insights")
      .withIndex("by_confidence", (q) => q.gte("confidence", minConf))
      .order("desc")
      .take(50)
  }
})