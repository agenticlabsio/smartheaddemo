// Enhanced Semantic Search Service with Google Gemma Embeddings
import { Pool } from 'pg'
import { EmbeddingService } from './embedding-service'

export interface SemanticSearchConfig {
  provider: 'google' | 'openai'
  threshold?: number
  maxResults?: number
  enableHybridSearch?: boolean
}

export interface SearchResult {
  id: number
  content: string
  similarity: number
  metadata: any
  table: 'financial_data' | 'baanspending'
}

export interface SupplierSearchResult extends SearchResult {
  supplier: string
  commodity: string
  total_amount: number
  year: number
  month: number
  description: string
}

export interface FinancialSearchResult extends SearchResult {
  entity: string
  cost_group: string
  account: string
  cost_center: string
  amount: number
  fiscal_year: number
}

export class SemanticSearchService {
  private embeddingService: EmbeddingService
  private pool: Pool
  private config: SemanticSearchConfig

  constructor(config: SemanticSearchConfig = { provider: 'google' }) {
    this.config = {
      threshold: 0.7,
      maxResults: 10,
      enableHybridSearch: true,
      ...config
    }
    
    this.embeddingService = new EmbeddingService({
      provider: this.config.provider,
      useLatestModel: true,
      dimensions: 768 // Optimized for Google Gemma embeddings
    })

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    })
  }

  // Enhanced supplier semantic search with Google Gemma embeddings
  async searchSuppliers(query: string, options: {
    includeFinancialData?: boolean
    commodityFilter?: string[]
    timeRange?: { startYear?: number, endYear?: number }
  } = {}): Promise<SupplierSearchResult[]> {
    try {
      // Generate query embedding using Google Gemma formatting
      const queryEmbedding = await this.embeddingService.generateEmbedding(query)
      
      let sqlQuery = `
        SELECT 
          bs.id,
          bs.supplier,
          bs.commodity,
          bs.description,
          bs.reporting_total as total_amount,
          bs.year,
          bs.month,
          bs.po_ship_to_city,
          bs.chart_of_accounts,
          COALESCE(
            1 - (bs.supplier_embedding_768 <=> $1::vector),
            1 - (bs.commodity_embedding_768 <=> $1::vector),
            1 - (bs.combined_text_embedding_768 <=> $1::vector)
          ) as similarity,
          'baanspending' as table_name
        FROM baanspending bs
        WHERE 
          GREATEST(
            1 - (bs.supplier_embedding_768 <=> $1::vector),
            1 - (bs.commodity_embedding_768 <=> $1::vector), 
            1 - (bs.combined_text_embedding_768 <=> $1::vector)
          ) > $2
      `

      const params: any[] = [`[${queryEmbedding.join(',')}]`, this.config.threshold]
      let paramIndex = 3

      // Add commodity filter
      if (options.commodityFilter && options.commodityFilter.length > 0) {
        sqlQuery += ` AND bs.commodity = ANY($${paramIndex})`
        params.push(options.commodityFilter)
        paramIndex++
      }

      // Add time range filter
      if (options.timeRange?.startYear) {
        sqlQuery += ` AND bs.year >= $${paramIndex}`
        params.push(options.timeRange.startYear)
        paramIndex++
      }
      
      if (options.timeRange?.endYear) {
        sqlQuery += ` AND bs.year <= $${paramIndex}`
        params.push(options.timeRange.endYear)
        paramIndex++
      }

      // Add hybrid search with full-text search if enabled
      if (this.config.enableHybridSearch) {
        sqlQuery += ` 
          UNION ALL
          SELECT 
            bs.id,
            bs.supplier,
            bs.commodity,
            bs.description,
            bs.reporting_total as total_amount,
            bs.year,
            bs.month,
            bs.po_ship_to_city,
            bs.chart_of_accounts,
            ts_rank(to_tsvector('english', bs.search_text), plainto_tsquery('english', $${paramIndex})) as similarity,
            'baanspending' as table_name
          FROM baanspending bs
          WHERE 
            to_tsvector('english', bs.search_text) @@ plainto_tsquery('english', $${paramIndex})
            AND ts_rank(to_tsvector('english', bs.search_text), plainto_tsquery('english', $${paramIndex})) > 0.1
        `
        params.push(query)
        paramIndex++
      }

      sqlQuery += `
        ORDER BY similarity DESC
        LIMIT $${paramIndex}
      `
      params.push(this.config.maxResults)

      const client = await this.pool.connect()
      try {
        const result = await client.query(sqlQuery, params)
        
        return result.rows.map(row => ({
          id: row.id,
          content: `${row.supplier} - ${row.commodity}: ${row.description}`,
          similarity: row.similarity,
          metadata: {
            po_ship_to_city: row.po_ship_to_city,
            chart_of_accounts: row.chart_of_accounts
          },
          table: 'baanspending' as const,
          supplier: row.supplier,
          commodity: row.commodity,
          total_amount: parseFloat(row.total_amount),
          year: row.year,
          month: row.month,
          description: row.description
        }))
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Supplier semantic search error:', error)
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Enhanced financial data semantic search
  async searchFinancialData(query: string, options: {
    entityFilter?: string[]
    costGroupFilter?: string[]
    fiscalYearFilter?: number[]
    amountRange?: { min?: number, max?: number }
  } = {}): Promise<FinancialSearchResult[]> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query)
      
      let sqlQuery = `
        SELECT 
          fd.id,
          fd.hfm_entity as entity,
          fd.hfm_cost_group as cost_group,
          fd.account,
          fd.cost_center,
          fd.amount,
          fd.fiscal_year_number as fiscal_year,
          GREATEST(
            1 - (fd.entity_embedding_768 <=> $1::vector),
            1 - (fd.cost_group_embedding_768 <=> $1::vector),
            1 - (fd.account_embedding_768 <=> $1::vector),
            1 - (fd.cost_center_embedding_768 <=> $1::vector),
            1 - (fd.combined_text_embedding_768 <=> $1::vector)
          ) as similarity,
          'financial_data' as table_name
        FROM financial_data fd
        WHERE 
          GREATEST(
            1 - (fd.entity_embedding_768 <=> $1::vector),
            1 - (fd.cost_group_embedding_768 <=> $1::vector),
            1 - (fd.account_embedding_768 <=> $1::vector),
            1 - (fd.cost_center_embedding_768 <=> $1::vector),
            1 - (fd.combined_text_embedding_768 <=> $1::vector)
          ) > $2
      `

      const params: any[] = [`[${queryEmbedding.join(',')}]`, this.config.threshold]
      let paramIndex = 3

      // Add entity filter
      if (options.entityFilter && options.entityFilter.length > 0) {
        sqlQuery += ` AND fd.hfm_entity = ANY($${paramIndex})`
        params.push(options.entityFilter)
        paramIndex++
      }

      // Add cost group filter
      if (options.costGroupFilter && options.costGroupFilter.length > 0) {
        sqlQuery += ` AND fd.hfm_cost_group = ANY($${paramIndex})`
        params.push(options.costGroupFilter)
        paramIndex++
      }

      // Add fiscal year filter
      if (options.fiscalYearFilter && options.fiscalYearFilter.length > 0) {
        sqlQuery += ` AND fd.fiscal_year_number = ANY($${paramIndex})`
        params.push(options.fiscalYearFilter)
        paramIndex++
      }

      // Add amount range filter
      if (options.amountRange?.min !== undefined) {
        sqlQuery += ` AND fd.amount >= $${paramIndex}`
        params.push(options.amountRange.min)
        paramIndex++
      }
      
      if (options.amountRange?.max !== undefined) {
        sqlQuery += ` AND fd.amount <= $${paramIndex}`
        params.push(options.amountRange.max)
        paramIndex++
      }

      sqlQuery += `
        ORDER BY similarity DESC
        LIMIT $${paramIndex}
      `
      params.push(this.config.maxResults)

      const client = await this.pool.connect()
      try {
        const result = await client.query(sqlQuery, params)
        
        return result.rows.map(row => ({
          id: row.id,
          content: `${row.entity} - ${row.cost_group} - ${row.account}`,
          similarity: row.similarity,
          metadata: {
            cost_center: row.cost_center,
            fiscal_year: row.fiscal_year
          },
          table: 'financial_data' as const,
          entity: row.entity,
          cost_group: row.cost_group,
          account: row.account,
          cost_center: row.cost_center,
          amount: parseFloat(row.amount),
          fiscal_year: row.fiscal_year
        }))
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Financial data semantic search error:', error)
      throw new Error(`Financial semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Combined semantic search across both datasets
  async searchCombined(query: string, options: {
    preferSupplierData?: boolean
    includeMetadata?: boolean
  } = {}): Promise<(SupplierSearchResult | FinancialSearchResult)[]> {
    try {
      const [supplierResults, financialResults] = await Promise.all([
        this.searchSuppliers(query),
        this.searchFinancialData(query)
      ])

      // Combine and sort by similarity
      const combinedResults = [...supplierResults, ...financialResults]
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.config.maxResults)

      return combinedResults
    } catch (error) {
      console.error('Combined semantic search error:', error)
      throw new Error(`Combined search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Generate embeddings for new data
  async generateEmbeddings(data: {
    table: 'financial_data' | 'baanspending'
    records: any[]
  }): Promise<void> {
    try {
      const client = await this.pool.connect()
      
      try {
        for (const record of data.records) {
          if (data.table === 'baanspending') {
            // Generate embeddings for Baan supplier data
            const supplierEmbedding = await this.embeddingService.generateEmbedding(record.supplier || '')
            const commodityEmbedding = await this.embeddingService.generateEmbedding(record.commodity || '')
            const combinedText = `${record.supplier} ${record.commodity} ${record.description}`.trim()
            const combinedEmbedding = await this.embeddingService.generateEmbedding(combinedText)

            await client.query(`
              UPDATE baanspending 
              SET 
                supplier_embedding_768 = $1,
                commodity_embedding_768 = $2,
                combined_text_embedding_768 = $3,
                search_text = $4,
                updated_at = NOW()
              WHERE id = $5
            `, [
              `[${supplierEmbedding.join(',')}]`,
              `[${commodityEmbedding.join(',')}]`,
              `[${combinedEmbedding.join(',')}]`,
              combinedText,
              record.id
            ])
          } else if (data.table === 'financial_data') {
            // Generate embeddings for financial data
            const entityEmbedding = await this.embeddingService.generateEmbedding(record.hfm_entity || '')
            const costGroupEmbedding = await this.embeddingService.generateEmbedding(record.hfm_cost_group || '')
            const accountEmbedding = await this.embeddingService.generateEmbedding(record.account || '')
            const costCenterEmbedding = await this.embeddingService.generateEmbedding(record.cost_center || '')
            const combinedText = `${record.hfm_entity} ${record.hfm_cost_group} ${record.account} ${record.cost_center}`.trim()
            const combinedEmbedding = await this.embeddingService.generateEmbedding(combinedText)

            await client.query(`
              UPDATE financial_data 
              SET 
                entity_embedding_768 = $1,
                cost_group_embedding_768 = $2,
                account_embedding_768 = $3,
                cost_center_embedding_768 = $4,
                combined_text_embedding_768 = $5,
                search_text = $6,
                updated_at = NOW()
              WHERE id = $7
            `, [
              `[${entityEmbedding.join(',')}]`,
              `[${costGroupEmbedding.join(',')}]`,
              `[${accountEmbedding.join(',')}]`,
              `[${costCenterEmbedding.join(',')}]`,
              `[${combinedEmbedding.join(',')}]`,
              combinedText,
              record.id
            ])
          }
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Embedding generation error:', error)
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Test semantic search functionality
  async testSemanticSearch(): Promise<{
    success: boolean
    supplierSearchResults: number
    financialSearchResults: number
    embeddingProvider: string
  }> {
    try {
      const [supplierResults, financialResults] = await Promise.all([
        this.searchSuppliers('manufacturing equipment supplier'),
        this.searchFinancialData('manufacturing overhead costs')
      ])

      return {
        success: true,
        supplierSearchResults: supplierResults.length,
        financialSearchResults: financialResults.length,
        embeddingProvider: this.config.provider
      }
    } catch (error) {
      console.error('Semantic search test failed:', error)
      return {
        success: false,
        supplierSearchResults: 0,
        financialSearchResults: 0,
        embeddingProvider: this.config.provider
      }
    }
  }

  // Get statistics about embeddings coverage
  async getEmbeddingStats(): Promise<{
    baanSpending: { total: number, withEmbeddings: number, coverage: string }
    financialData: { total: number, withEmbeddings: number, coverage: string }
  }> {
    try {
      const client = await this.pool.connect()
      
      try {
        const [baanStats, financialStats] = await Promise.all([
          client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN supplier_embedding_768 IS NOT NULL THEN 1 END) as with_embeddings
            FROM baanspending
          `),
          client.query(`
            SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN entity_embedding_768 IS NOT NULL THEN 1 END) as with_embeddings
            FROM financial_data
          `)
        ])

        const baanData = baanStats.rows[0]
        const financialData = financialStats.rows[0]

        return {
          baanSpending: {
            total: parseInt(baanData.total),
            withEmbeddings: parseInt(baanData.with_embeddings),
            coverage: `${Math.round((baanData.with_embeddings / baanData.total) * 100)}%`
          },
          financialData: {
            total: parseInt(financialData.total),
            withEmbeddings: parseInt(financialData.with_embeddings),
            coverage: `${Math.round((financialData.with_embeddings / financialData.total) * 100)}%`
          }
        }
      } finally {
        client.release()
      }
    } catch (error) {
      console.error('Embedding stats error:', error)
      throw new Error(`Failed to get embedding stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export default SemanticSearchService