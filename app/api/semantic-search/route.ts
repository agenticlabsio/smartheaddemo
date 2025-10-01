// Enhanced Semantic Search API with Google Gemma Embeddings
import { NextRequest, NextResponse } from 'next/server'
import { SemanticSearchService } from '@/lib/semantic-search'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    // Check if this is an internal API call (from system or other endpoints)
    const isInternalCall = request.headers.get('user-agent')?.includes('node') || 
                          request.headers.get('x-internal-call') === 'true'
    
    let userId: string | undefined
    
    if (!isInternalCall) {
      // Check authentication for external calls
      const { userId: authUserId } = await auth()
      if (!authUserId) {
        return NextResponse.json({
          success: false,
          error: 'Authentication required'
        }, { status: 401 })
      }
      userId = authUserId
    } else {
      // For internal calls, set a default user ID
      userId = 'internal-system'
    }

    const body = await request.json()
    const { action, query, options = {} } = body

    const searchService = new SemanticSearchService({
      provider: 'google',
      threshold: 0.7,
      maxResults: 20,
      enableHybridSearch: true
    })

    switch (action) {
      case 'search_suppliers': {
        const results = await searchService.searchSuppliers(query, options)
        return NextResponse.json({
          success: true,
          results,
          count: results.length,
          query,
          provider: 'google',
          action: 'supplier_search'
        })
      }

      case 'search_financial': {
        const results = await searchService.searchFinancialData(query, options)
        return NextResponse.json({
          success: true,
          results,
          count: results.length,
          query,
          provider: 'google',
          action: 'financial_search'
        })
      }

      case 'search_combined': {
        const results = await searchService.searchCombined(query, options)
        return NextResponse.json({
          success: true,
          results,
          count: results.length,
          query,
          provider: 'google',
          action: 'combined_search'
        })
      }

      case 'generate_embeddings': {
        const { table, recordIds } = body
        
        // Get records to process
        let records = []
        if (recordIds && recordIds.length > 0) {
          // Process specific records
          records = await getRecordsByIds(table, recordIds)
        } else {
          // Process all records without embeddings
          records = await getRecordsWithoutEmbeddings(table)
        }

        if (records.length === 0) {
          return NextResponse.json({
            success: true,
            message: 'No records to process',
            processed: 0
          })
        }

        await searchService.generateEmbeddings({ table, records })
        
        return NextResponse.json({
          success: true,
          message: `Generated embeddings for ${records.length} records`,
          processed: records.length,
          table
        })
      }

      case 'test_search': {
        const testResult = await searchService.testSemanticSearch()
        return NextResponse.json({
          success: true,
          test: testResult,
          message: 'Semantic search test completed'
        })
      }

      case 'embedding_stats': {
        const stats = await searchService.getEmbeddingStats()
        return NextResponse.json({
          success: true,
          stats,
          message: 'Embedding coverage statistics'
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: search_suppliers, search_financial, search_combined, generate_embeddings, test_search, embedding_stats'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Semantic search API error:', error)
    return NextResponse.json({
      success: false,
      error: `Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const searchService = new SemanticSearchService({ provider: 'google' })
    const [testResult, stats] = await Promise.all([
      searchService.testSemanticSearch(),
      searchService.getEmbeddingStats()
    ])

    return NextResponse.json({
      status: 'healthy',
      service: 'Enhanced Semantic Search API',
      version: '2.0.0',
      features: [
        'Google Gemma embedding support',
        'Supplier semantic search',
        'Financial data semantic search',
        'Combined dataset search',
        'Hybrid search (semantic + full-text)',
        'Real-time embedding generation',
        'Coverage analytics'
      ],
      test: testResult,
      stats,
      config: {
        provider: 'google',
        embeddingModel: 'text-embedding-004 (Google Gemma optimized)',
        dimensions: 768,
        hybridSearchEnabled: true,
        defaultThreshold: 0.7
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper functions
async function getRecordsByIds(table: string, recordIds: number[]) {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    const placeholders = recordIds.map((_, i) => `$${i + 1}`).join(',')
    const result = await client.query(
      `SELECT * FROM ${table} WHERE id IN (${placeholders})`,
      recordIds
    )
    return result.rows
  } finally {
    client.release()
  }
}

async function getRecordsWithoutEmbeddings(table: string, limit: number = 1000) {
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    let whereClause = ''
    if (table === 'baanspending') {
      whereClause = 'WHERE supplier_embedding IS NULL OR commodity_embedding IS NULL OR combined_text_embedding IS NULL'
    } else if (table === 'financial_data') {
      whereClause = 'WHERE entity_embedding IS NULL OR cost_group_embedding IS NULL OR account_embedding IS NULL OR cost_center_embedding IS NULL OR combined_text_embedding IS NULL'
    }

    const result = await client.query(
      `SELECT * FROM ${table} ${whereClause} LIMIT $1`,
      [limit]
    )
    return result.rows
  } finally {
    client.release()
  }
}