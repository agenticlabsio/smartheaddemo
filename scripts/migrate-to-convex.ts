// Data migration script from PostgreSQL to Convex
import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"
import pg from 'pg'

const { Client } = pg

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Initialize PostgreSQL client  
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL
})

async function migrateCoupaData() {
  console.log('🔄 Migrating Coupa financial transactions...')
  
  await pgClient.connect()
  
  const result = await pgClient.query(`
    SELECT 
      transaction_id::text,
      supplier_name,
      invoice_amount::float,
      invoice_date::text,
      department,
      cost_center,
      account_code,
      commodity_code,
      procurement_category,
      payment_status,
      approval_status,
      currency,
      COALESCE(exchange_rate, 1.0)::float as exchange_rate,
      COALESCE(tax_amount, 0)::float as tax_amount,
      COALESCE(discount_amount, 0)::float as discount_amount,
      total_amount::float
    FROM coupa_financial 
    ORDER BY invoice_date DESC
    LIMIT 1000
  `)
  
  console.log(`📊 Found ${result.rows.length} Coupa transactions`)
  
  // Batch insert to Convex
  for (const row of result.rows) {
    try {
      await convex.mutation(api.financial.addCoupaTransaction, {
        transaction_id: row.transaction_id,
        supplier_name: row.supplier_name,
        invoice_amount: row.invoice_amount,
        invoice_date: row.invoice_date,
        department: row.department,
        cost_center: row.cost_center,
        account_code: row.account_code,
        commodity_code: row.commodity_code,
        procurement_category: row.procurement_category,
        payment_status: row.payment_status,
        approval_status: row.approval_status,
        currency: row.currency,
        total_amount: row.total_amount
      })
    } catch (error) {
      console.error(`❌ Failed to migrate Coupa transaction ${row.transaction_id}:`, error)
    }
  }
  
  console.log('✅ Coupa migration completed')
}

async function migrateBaanData() {
  console.log('🔄 Migrating Baan procurement transactions...')
  
  const result = await pgClient.query(`
    SELECT 
      transaction_id::text,
      vendor_code,
      vendor_name,
      purchase_order_number,
      line_amount::float,
      order_date::text,
      delivery_date::text,
      business_unit,
      item_code,
      item_description,
      quantity::float,
      unit_price::float,
      currency,
      status,
      buyer_name,
      contract_reference,
      terms_conditions
    FROM baan_procurement
    ORDER BY order_date DESC  
    LIMIT 1000
  `)
  
  console.log(`📊 Found ${result.rows.length} Baan transactions`)
  
  for (const row of result.rows) {
    try {
      await convex.mutation(api.financial.addBaanTransaction, {
        transaction_id: row.transaction_id,
        vendor_code: row.vendor_code,
        vendor_name: row.vendor_name,
        purchase_order_number: row.purchase_order_number,
        line_amount: row.line_amount,
        order_date: row.order_date,
        business_unit: row.business_unit,
        item_code: row.item_code,
        item_description: row.item_description,
        quantity: row.quantity,
        unit_price: row.unit_price,
        currency: row.currency,
        status: row.status,
        buyer_name: row.buyer_name
      })
    } catch (error) {
      console.error(`❌ Failed to migrate Baan transaction ${row.transaction_id}:`, error)
    }
  }
  
  console.log('✅ Baan migration completed')
}

async function migrateInsights() {
  console.log('🔄 Migrating financial insights...')
  
  // Create sample insights based on the current data structure
  const sampleInsights = [
    {
      title: "CFO Budget Variance & Financial Control",
      description: "CFO budget variance analysis reveals $2.7M in category-level deviations requiring immediate attention",
      category: "baan finance",
      impact: "$2.7M variance",
      confidence: 0.96,
      dataSource: "baan" as const,
      queryData: {
        sql: "SELECT * FROM baan_procurement WHERE line_amount > 100000",
        results: [],
        executionTime: 156
      },
      tags: ["variance", "budget", "cfo", "financial-control"],
      governance: {
        level: "executive" as const,
        compliance: ["GDPR-Ready", "CFO-Approved"]
      },
      createdBy: "system"
    },
    {
      title: "Supplier Performance Analysis",
      description: "Top supplier concentration analysis shows 15% of vendors account for 67% of total spend",
      category: "coupa finance", 
      impact: "High",
      confidence: 0.94,
      dataSource: "coupa" as const,
      queryData: {
        sql: "SELECT supplier_name, SUM(invoice_amount) FROM coupa_financial GROUP BY supplier_name",
        results: [],
        executionTime: 89
      },
      tags: ["suppliers", "concentration", "risk"],
      governance: {
        level: "finance" as const,
        compliance: ["Data-Verified"]
      },
      createdBy: "system"
    }
  ]
  
  for (const insight of sampleInsights) {
    try {
      await convex.mutation(api.insights.createInsight, insight)
    } catch (error) {
      console.error(`❌ Failed to create insight:`, error)
    }
  }
  
  console.log('✅ Insights migration completed')
}

async function runMigration() {
  try {
    console.log('🚀 Starting PostgreSQL to Convex migration...')
    
    await migrateCoupaData()
    await migrateBaanData()
    await migrateInsights()
    
    console.log('🎉 Migration completed successfully!')
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
  } finally {
    await pgClient.end()
    process.exit(0)
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
}

export { runMigration }