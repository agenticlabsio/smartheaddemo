// Convex Schema for FinSight Financial Analytics
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // User profiles (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("analyst"), v.literal("finance_team"), v.literal("executive")),
    preferences: v.object({
      defaultDataSource: v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined")),
      analysisDepth: v.union(v.literal("quick"), v.literal("detailed"), v.literal("comprehensive")),
      visualizationStyle: v.union(v.literal("charts"), v.literal("tables"), v.literal("mixed")),
      defaultMode: v.union(v.literal("analyst"), v.literal("executive")),
      responseFormat: v.union(v.literal("concise"), v.literal("standard"), v.literal("detailed")),
      followUpSuggestions: v.boolean(),
      confidenceDisplay: v.boolean(),
      locationPreferences: v.optional(v.object({
        timezone: v.optional(v.string()),
        currency: v.optional(v.string()),
        region: v.optional(v.string())
      })),
      analyticsPreferences: v.optional(v.object({
        trackingEnabled: v.optional(v.boolean()),
        performanceMetrics: v.optional(v.boolean()),
        usageAnalytics: v.optional(v.boolean())
      }))
    }),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  // Coupa Financial Transactions
  coupaTransactions: defineTable({
    transaction_id: v.string(),
    supplier_name: v.string(),
    invoice_amount: v.number(),
    invoice_date: v.string(),
    department: v.string(),
    cost_center: v.string(),
    account_code: v.string(),
    commodity_code: v.string(),
    procurement_category: v.string(),
    payment_status: v.string(),
    approval_status: v.string(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    tax_amount: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_amount: v.number(),
    created_at: v.number(),
    updated_at: v.number()
  })
    .index("by_supplier", ["supplier_name"])
    .index("by_department", ["department"])
    .index("by_cost_center", ["cost_center"])
    .index("by_date", ["invoice_date"])
    .index("by_amount", ["invoice_amount"])
    .index("by_category", ["procurement_category"]),

  // Baan Procurement Transactions
  baanTransactions: defineTable({
    transaction_id: v.string(),
    vendor_code: v.string(),
    vendor_name: v.string(),
    purchase_order_number: v.string(),
    line_amount: v.number(),
    order_date: v.string(),
    delivery_date: v.optional(v.string()),
    business_unit: v.string(),
    item_code: v.string(),
    item_description: v.string(),
    quantity: v.number(),
    unit_price: v.number(),
    currency: v.string(),
    status: v.string(),
    buyer_name: v.string(),
    contract_reference: v.optional(v.string()),
    terms_conditions: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number()
  })
    .index("by_vendor", ["vendor_name"])
    .index("by_vendor_code", ["vendor_code"])
    .index("by_business_unit", ["business_unit"])
    .index("by_buyer", ["buyer_name"])
    .index("by_date", ["order_date"])
    .index("by_amount", ["line_amount"])
    .index("by_item", ["item_code"]),

  // Chat conversations
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      mode: v.optional(v.union(v.literal("analyst"), v.literal("executive"))),
      evidenceReferenceId: v.optional(v.string()),
      metadata: v.optional(v.object({
        agent: v.optional(v.string()),
        confidence: v.optional(v.number()),
        executionTime: v.optional(v.number()),
        sqlQuery: v.optional(v.string()),
        dataSource: v.optional(v.string()),
        feedback: v.optional(v.object({
          rating: v.optional(v.union(v.literal("positive"), v.literal("negative"))),
          notes: v.optional(v.string()),
          feedbackType: v.optional(v.union(v.literal("general"), v.literal("accuracy"), v.literal("relevance"), v.literal("completeness"))),
          timestamp: v.optional(v.number())
        })),
        evidence: v.optional(v.object({
          type: v.optional(v.union(v.literal("sql_query"), v.literal("data_analysis"), v.literal("chart"), v.literal("report"), v.literal("insight"))),
          data: v.optional(v.any()),
          confidenceScore: v.optional(v.number()),
          dataSources: v.optional(v.array(v.string())),
          artifactUrl: v.optional(v.string())
        }))
      }))
    })),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_updated", ["updatedAt"]),

  // Saved queries
  savedQueries: defineTable({
    userId: v.string(),
    title: v.string(),
    query: v.string(),
    dataSource: v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined")),
    category: v.optional(v.string()),
    tags: v.array(v.string()),
    executionCount: v.number(),
    lastExecuted: v.optional(v.number()),
    createdAt: v.number(),
    isPublic: v.boolean()
  })
    .index("by_user", ["userId"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"]),

  // Financial insights cache
  insights: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.string()
  })
    .index("by_category", ["category"])
    .index("by_confidence", ["confidence"])
    .index("by_data_source", ["dataSource"])
    .index("by_created", ["createdAt"])
    .index("by_creator", ["createdBy"]),

  // Message feedback for thumbs up/down and notes
  messageFeedback: defineTable({
    messageId: v.string(),
    userId: v.string(),
    conversationId: v.string(),
    rating: v.union(v.literal("positive"), v.literal("negative")),
    notes: v.optional(v.string()),
    evidenceReferenceId: v.optional(v.string()),
    feedbackType: v.union(v.literal("general"), v.literal("accuracy"), v.literal("relevance"), v.literal("completeness")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_conversation", ["conversationId"])
    .index("by_rating", ["rating"]),

  // Evidence references for linking messages to data artifacts
  evidenceReferences: defineTable({
    evidenceId: v.string(),
    messageId: v.string(),
    conversationId: v.string(),
    userId: v.string(),
    evidenceType: v.union(v.literal("sql_query"), v.literal("data_analysis"), v.literal("chart"), v.literal("report"), v.literal("insight")),
    evidenceData: v.any(),
    metadata: v.optional(v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string()))
    })),
    confidenceScore: v.optional(v.number()),
    dataSources: v.optional(v.array(v.string())),
    artifactUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_evidence_id", ["evidenceId"])
    .index("by_message", ["messageId"])
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_type", ["evidenceType"])
    .index("by_confidence", ["confidenceScore"])
})