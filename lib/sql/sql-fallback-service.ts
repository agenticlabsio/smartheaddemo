// Comprehensive SQL Fallback and Error Handling Service
// Provides progressive retry strategies and graceful degradation for SQL queries

import Database from '@/lib/database'

export interface FallbackQueryOptions {
  dataSource: 'coupa' | 'baan'
  originalQuery: string
  userQuery: string
  errorMessage: string
  attemptNumber: number
}

export interface FallbackResult {
  success: boolean
  query: string
  results?: any[]
  evidence?: any[]
  error?: string
  fallbackType: string
}

export class SQLFallbackService {
  private static readonly MAX_ATTEMPTS = 3
  
  // Coupa-specific table and column mappings
  private static readonly COUPA_TABLE = 'financial_data'
  private static readonly COUPA_SCHEMA = {
    amount: 'amount',
    entity: 'hfm_entity',
    costGroup: 'hfm_cost_group',
    account: 'fim_account',
    costCenter: 'cost_center',
    fiscalYear: 'fiscal_year_number',
    fiscalMonth: 'fiscal_year_month'
  }

  // Baan-specific table and column mappings
  private static readonly BAAN_TABLE = 'baanspending'
  private static readonly BAAN_SCHEMA = {
    amount: 'reporting_total',
    supplier: 'supplier',
    category: 'category',
    date: 'date',
    requestor: 'requestor'
  }

  static async executeWithFallbacks(options: FallbackQueryOptions): Promise<FallbackResult> {
    const { dataSource, originalQuery, userQuery, errorMessage, attemptNumber } = options

    try {
      // Attempt 1: Try to fix common SQL syntax issues
      if (attemptNumber === 1) {
        const syntaxFixedQuery = this.fixCommonSyntaxIssues(originalQuery, dataSource)
        if (syntaxFixedQuery !== originalQuery) {
          const result = await this.executeQuery(syntaxFixedQuery, dataSource)
          if (result.success) {
            return { ...result, fallbackType: 'syntax_fix' }
          }
        }
      }

      // Attempt 2: Generate simplified query based on error type
      if (attemptNumber <= 2) {
        const simplifiedQuery = this.generateSimplifiedQuery(userQuery, dataSource, errorMessage)
        const result = await this.executeQuery(simplifiedQuery, dataSource)
        if (result.success) {
          return { ...result, fallbackType: 'simplified_query' }
        }
      }

      // Attempt 3: Use basic safe aggregation query
      if (attemptNumber <= 3) {
        const safeQuery = this.generateSafeQuery(userQuery, dataSource)
        const result = await this.executeQuery(safeQuery, dataSource)
        if (result.success) {
          return { ...result, fallbackType: 'safe_aggregation' }
        }
      }

      // All attempts failed
      return {
        success: false,
        query: originalQuery,
        error: 'All fallback attempts failed',
        fallbackType: 'all_failed'
      }
    } catch (error) {
      return {
        success: false,
        query: originalQuery,
        error: `Fallback service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallbackType: 'service_error'
      }
    }
  }

  private static async executeQuery(query: string, dataSource: string): Promise<FallbackResult> {
    try {
      const results = await Database.query(query)
      return {
        success: true,
        query,
        results: results.rows || [],
        evidence: (results.rows || []).slice(0, 10),
        fallbackType: 'success'
      }
    } catch (error) {
      return {
        success: false,
        query,
        error: error instanceof Error ? error.message : 'Unknown query error',
        fallbackType: 'query_failed'
      }
    }
  }

  private static fixCommonSyntaxIssues(query: string, dataSource: 'coupa' | 'baan'): string {
    let fixed = query

    // Fix GROUP BY issues - ensure all SELECT columns are in GROUP BY
    const selectMatch = fixed.match(/SELECT\s+([\s\S]*?)\s+FROM/i)
    const groupByMatch = fixed.match(/GROUP\s+BY\s+([\s\S]*?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+HAVING|$)/i)
    
    if (selectMatch && groupByMatch) {
      const selectCols = selectMatch[1]
        .split(',')
        .map(col => col.trim())
        .filter(col => !col.includes('(')) // Exclude aggregate functions
        .map(col => col.replace(/\s+AS\s+\w+/i, '').trim()) // Remove aliases

      if (selectCols.length > 0) {
        const groupByCols = selectCols.join(', ')
        fixed = fixed.replace(/GROUP\s+BY\s+[\s\S]*?(?=\s+ORDER\s+BY|\s+LIMIT|\s+HAVING|$)/i, `GROUP BY ${groupByCols}`)
      }
    }

    // Ensure proper table routing
    const table = dataSource === 'coupa' ? this.COUPA_TABLE : this.BAAN_TABLE
    fixed = fixed.replace(/\b(FROM|JOIN)\s+\w+/gi, `$1 ${table}`)

    // Add fiscal year filter for Coupa queries if missing
    if (dataSource === 'coupa' && !fixed.includes('fiscal_year_number')) {
      if (fixed.includes('WHERE')) {
        fixed = fixed.replace(/WHERE\s+/, 'WHERE fiscal_year_number = 2025 AND ')
      } else {
        fixed = fixed.replace(/(\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i, ' WHERE fiscal_year_number = 2025$1')
      }
    }

    return fixed
  }

  private static generateSimplifiedQuery(userQuery: string, dataSource: 'coupa' | 'baan', errorMessage: string): string {
    const lowerQuery = userQuery.toLowerCase()
    const lowerError = errorMessage.toLowerCase()

    if (dataSource === 'coupa') {
      // Coupa-specific simplified queries
      if (lowerQuery.includes('manufacturing') || lowerQuery.includes('cost') || lowerQuery.includes('overhead')) {
        return `
          SELECT 
            hfm_cost_group,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount,
            AVG(amount) as avg_amount
          FROM ${this.COUPA_TABLE}
          WHERE fiscal_year_number = 2025 
            AND hfm_cost_group IS NOT NULL
            AND amount IS NOT NULL
          GROUP BY hfm_cost_group
          ORDER BY total_amount DESC
          LIMIT 20
        `
      }

      if (lowerQuery.includes('entity') || lowerQuery.includes('location')) {
        return `
          SELECT 
            hfm_entity,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM ${this.COUPA_TABLE}
          WHERE fiscal_year_number = 2025 
            AND hfm_entity IS NOT NULL
            AND amount IS NOT NULL
          GROUP BY hfm_entity
          ORDER BY total_amount DESC
          LIMIT 15
        `
      }

      if (lowerQuery.includes('account') || lowerQuery.includes('category')) {
        return `
          SELECT 
            fim_account,
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
          FROM ${this.COUPA_TABLE}
          WHERE fiscal_year_number = 2025 
            AND fim_account IS NOT NULL
            AND amount IS NOT NULL
          GROUP BY fim_account
          ORDER BY total_amount DESC
          LIMIT 15
        `
      }
    } else {
      // Baan-specific simplified queries
      if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor')) {
        return `
          SELECT 
            supplier,
            COUNT(*) as transaction_count,
            SUM(reporting_total) as total_amount,
            AVG(reporting_total) as avg_amount
          FROM ${this.BAAN_TABLE}
          WHERE supplier IS NOT NULL
            AND reporting_total IS NOT NULL
          GROUP BY supplier
          ORDER BY total_amount DESC
          LIMIT 20
        `
      }

      if (lowerQuery.includes('category') || lowerQuery.includes('spend')) {
        return `
          SELECT 
            category,
            COUNT(*) as transaction_count,
            SUM(reporting_total) as total_amount
          FROM ${this.BAAN_TABLE}
          WHERE category IS NOT NULL
            AND reporting_total IS NOT NULL
          GROUP BY category
          ORDER BY total_amount DESC
          LIMIT 15
        `
      }

      if (lowerQuery.includes('requestor') || lowerQuery.includes('user')) {
        return `
          SELECT 
            requestor,
            COUNT(*) as transaction_count,
            SUM(reporting_total) as total_amount
          FROM ${this.BAAN_TABLE}
          WHERE requestor IS NOT NULL
            AND reporting_total IS NOT NULL
          GROUP BY requestor
          ORDER BY total_amount DESC
          LIMIT 15
        `
      }
    }

    // Default simplified query by data source
    return this.generateSafeQuery(userQuery, dataSource)
  }

  private static generateSafeQuery(userQuery: string, dataSource: 'coupa' | 'baan'): string {
    if (dataSource === 'coupa') {
      return `
        SELECT 
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM ${this.COUPA_TABLE}
        WHERE fiscal_year_number = 2025
          AND amount IS NOT NULL
      `
    } else {
      return `
        SELECT 
          COUNT(*) as transaction_count,
          SUM(reporting_total) as total_amount,
          AVG(reporting_total) as avg_amount,
          MIN(reporting_total) as min_amount,
          MAX(reporting_total) as max_amount
        FROM ${this.BAAN_TABLE}
        WHERE reporting_total IS NOT NULL
      `
    }
  }

  static categorizeError(errorMessage: string): string {
    const lowerError = errorMessage.toLowerCase()

    if (lowerError.includes('group by')) return 'GROUP_BY_ERROR'
    if (lowerError.includes('syntax error')) return 'SYNTAX_ERROR'
    if (lowerError.includes('column') && lowerError.includes('does not exist')) return 'COLUMN_ERROR'
    if (lowerError.includes('table') && lowerError.includes('does not exist')) return 'TABLE_ERROR'
    if (lowerError.includes('aggregate')) return 'AGGREGATE_ERROR'
    if (lowerError.includes('permission')) return 'PERMISSION_ERROR'
    if (lowerError.includes('timeout')) return 'TIMEOUT_ERROR'
    
    return 'UNKNOWN_ERROR'
  }

  static getErrorDescription(errorCategory: string): string {
    switch (errorCategory) {
      case 'GROUP_BY_ERROR': return 'SQL grouping clause issue - using simplified aggregation'
      case 'SYNTAX_ERROR': return 'SQL syntax problem - attempting corrected query'
      case 'COLUMN_ERROR': return 'Unknown column referenced - using available schema'
      case 'TABLE_ERROR': return 'Table access issue - using correct data source'
      case 'AGGREGATE_ERROR': return 'Aggregation function problem - using basic calculations'
      case 'PERMISSION_ERROR': return 'Database access restriction - using safe query'
      case 'TIMEOUT_ERROR': return 'Query too complex - using simplified version'
      default: return 'Database query issue - attempting alternative approach'
    }
  }
}