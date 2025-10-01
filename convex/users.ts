// User management functions for Convex + Clerk
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

// Get or create user profile from Clerk
export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()
  }
})

// Create user profile (called via Clerk webhook)
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("analyst"), v.literal("finance_team"), v.literal("executive"))
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role: args.role || "analyst",
      preferences: {
        defaultDataSource: "combined",
        analysisDepth: "detailed",
        visualizationStyle: "mixed"
      },
      createdAt: now,
      updatedAt: now
    })
  }
})

// Update user preferences
export const updateUserPreferences = mutation({
  args: {
    clerkId: v.string(),
    preferences: v.object({
      defaultDataSource: v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined")),
      analysisDepth: v.union(v.literal("quick"), v.literal("detailed"), v.literal("comprehensive")),
      visualizationStyle: v.union(v.literal("charts"), v.literal("tables"), v.literal("mixed"))
    })
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()
    
    if (!user) throw new Error("User not found")
    
    await ctx.db.patch(user._id, {
      preferences: args.preferences,
      updatedAt: Date.now()
    })
  }
})