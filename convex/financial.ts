// Financial data queries for Convex
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// Query Coupa financial transactions
export const queryCoupaTransactions = query({
  args: {
    limit: v.optional(v.number()),
    supplier: v.optional(v.string()),
    department: v.optional(v.string()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("coupaTransactions")
    
    if (args.supplier) {
      q = q.withIndex("by_supplier", (q) => q.eq("supplier_name", args.supplier))
    } else if (args.department) {
      q = q.withIndex("by_department", (q) => q.eq("department", args.department))
    }
    
    const results = await q.take(args.limit || 100)
    
    // Apply filters
    return results.filter(tx => {
      if (args.minAmount && tx.invoice_amount < args.minAmount) return false
      if (args.maxAmount && tx.invoice_amount > args.maxAmount) return false
      if (args.startDate && tx.invoice_date < args.startDate) return false
      if (args.endDate && tx.invoice_date > args.endDate) return false
      return true
    })
  }
})

// Query Baan procurement transactions
export const queryBaanTransactions = query({
  args: {
    limit: v.optional(v.number()),
    vendor: v.optional(v.string()),
    businessUnit: v.optional(v.string()),
    buyer: v.optional(v.string()),
    minAmount: v.optional(v.number()),
    maxAmount: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("baanTransactions")
    
    if (args.vendor) {
      q = q.withIndex("by_vendor", (q) => q.eq("vendor_name", args.vendor))
    } else if (args.businessUnit) {
      q = q.withIndex("by_business_unit", (q) => q.eq("business_unit", args.businessUnit))
    } else if (args.buyer) {
      q = q.withIndex("by_buyer", (q) => q.eq("buyer_name", args.buyer))
    }
    
    const results = await q.take(args.limit || 100)
    
    return results.filter(tx => {
      if (args.minAmount && tx.line_amount < args.minAmount) return false
      if (args.maxAmount && tx.line_amount > args.maxAmount) return false
      if (args.startDate && tx.order_date < args.startDate) return false
      if (args.endDate && tx.order_date > args.endDate) return false
      return true
    })
  }
})

// Get financial summary statistics
export const getFinancialSummary = query({
  args: {
    dataSource: v.union(v.literal("coupa"), v.literal("baan"), v.literal("combined"))
  },
  handler: async (ctx, args) => {
    const summary = {
      totalTransactions: 0,
      totalAmount: 0,
      topSuppliers: [] as any[],
      recentActivity: [] as any[]
    }
    
    if (args.dataSource === "coupa" || args.dataSource === "combined") {
      const coupaTransactions = await ctx.db.query("coupaTransactions").take(1000)
      summary.totalTransactions += coupaTransactions.length
      summary.totalAmount += coupaTransactions.reduce((sum, tx) => sum + tx.invoice_amount, 0)
      
      // Get top suppliers
      const supplierTotals = coupaTransactions.reduce((acc: any, tx) => {
        acc[tx.supplier_name] = (acc[tx.supplier_name] || 0) + tx.invoice_amount
        return acc
      }, {})
      
      summary.topSuppliers = Object.entries(supplierTotals)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a: any, b: any) => b.amount - a.amount)
        .slice(0, 10)
    }
    
    if (args.dataSource === "baan" || args.dataSource === "combined") {
      const baanTransactions = await ctx.db.query("baanTransactions").take(1000)
      summary.totalTransactions += baanTransactions.length
      summary.totalAmount += baanTransactions.reduce((sum, tx) => sum + tx.line_amount, 0)
      
      if (args.dataSource === "baan") {
        // Get top vendors for Baan only
        const vendorTotals = baanTransactions.reduce((acc: any, tx) => {
          acc[tx.vendor_name] = (acc[tx.vendor_name] || 0) + tx.line_amount
          return acc
        }, {})
        
        summary.topSuppliers = Object.entries(vendorTotals)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a: any, b: any) => b.amount - a.amount)
          .slice(0, 10)
      }
    }
    
    return summary
  }
})

// Add new Coupa transaction
export const addCoupaTransaction = mutation({
  args: {
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
    total_amount: v.number()
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert("coupaTransactions", {
      ...args,
      created_at: now,
      updated_at: now
    })
  }
})

// Add new Baan transaction
export const addBaanTransaction = mutation({
  args: {
    transaction_id: v.string(),
    vendor_code: v.string(),
    vendor_name: v.string(),
    purchase_order_number: v.string(),
    line_amount: v.number(),
    order_date: v.string(),
    business_unit: v.string(),
    item_code: v.string(),
    item_description: v.string(),
    quantity: v.number(),
    unit_price: v.number(),
    currency: v.string(),
    status: v.string(),
    buyer_name: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    return await ctx.db.insert("baanTransactions", {
      ...args,
      created_at: now,
      updated_at: now
    })
  }
})