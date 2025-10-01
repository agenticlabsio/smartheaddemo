import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import Database from './database';
import EmbeddingService from './embedding-service';
import SemanticCatalog from './semantic-catalog';
import crypto from 'crypto';

export interface DataAgentConfig {
  primaryModel: 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gpt-4o' | 'gpt-4o-mini';
  fallbackModel?: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  maxRetries: number;
  enableReasoning?: boolean;
}

export interface QueryContext {
  query: string;
  queryType: 'semantic' | 'analytical' | 'summary' | 'specific';
  dataSource: 'coupa' | 'baan' | 'coupabaan';
  sqlQuery?: string;
  filters?: {
    entity?: string;
    costGroup?: string;
    year?: number;
    quarter?: number;
    dateRange?: { start: string; end: string };
  };
}

export interface AgentResponse {
  success: boolean;
  response: string;
  data?: any[];
  visualizations?: any[];
  sqlQuery?: string;
  queryType: string;
  executionTime: number;
  model: string;
  confidence: number;
  reasoning?: string;
}

export interface StreamingCallbacks {
  onChunk: (chunk: string) => void;
  onReasoning: (reasoning: string) => void;
  onMetadata: (metadata: any) => void;
  onComplete: (result: AgentResponse) => void;
  onError: (error: Error) => void;
}

interface CacheEntry {
  response_data: any;
  created_at: string;
  expires_at: string;
  hit_count: number;
  model_used: string;
  execution_time_ms: number;
}

class QueryCache {
  private ttlMinutes: number;

  constructor(ttlMinutes: number = 5) {
    this.ttlMinutes = ttlMinutes;
  }

  private hashQuery(query: string): string {
    return crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
  }

  async get(query: string): Promise<CacheEntry | null> {
    const hash = this.hashQuery(query);
    
    try {
      // Clean up expired entries first
      await Database.query(
        'DELETE FROM query_cache WHERE expires_at < NOW()'
      );

      const result = await Database.query(
        'SELECT * FROM query_cache WHERE query_hash = $1 AND expires_at > NOW()',
        [hash]
      );

      if (result.rows.length > 0) {
        // Update hit count
        await Database.query(
          'UPDATE query_cache SET hit_count = hit_count + 1 WHERE query_hash = $1',
          [hash]
        );
        
        return result.rows[0];
      }
      
      return null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set(query: string, responseData: any, model: string, executionTime: number): Promise<void> {
    const hash = this.hashQuery(query);
    const expiresAt = new Date(Date.now() + this.ttlMinutes * 60 * 1000);
    
    try {
      await Database.query(`
        INSERT INTO query_cache (query_hash, query_text, response_data, expires_at, model_used, execution_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (query_hash) 
        DO UPDATE SET 
          response_data = EXCLUDED.response_data,
          expires_at = EXCLUDED.expires_at,
          hit_count = query_cache.hit_count + 1,
          model_used = EXCLUDED.model_used,
          execution_time_ms = EXCLUDED.execution_time_ms
      `, [hash, query, JSON.stringify(responseData), expiresAt, model, executionTime]);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await Database.query('DELETE FROM query_cache');
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

export class DataAgent {
  private googleAI?: GoogleGenerativeAI;
  private openai?: OpenAI;
  private config: DataAgentConfig;
  private embeddingService: EmbeddingService;
  private semanticCatalog: SemanticCatalog;
  private queryCache: QueryCache;

  constructor(config: DataAgentConfig) {
    this.config = {
      ...config,
      maxRetries: config.maxRetries || 3,
      enableReasoning: config.enableReasoning ?? true
    };

    // Initialize Google AI
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (googleApiKey) {
      this.googleAI = new GoogleGenerativeAI(googleApiKey);
    }

    // Initialize OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey
      });
    }

    // Initialize embedding service
    this.embeddingService = new EmbeddingService({
      provider: 'google',
      maxRetries: 2
    });

    // Initialize semantic catalog
    this.semanticCatalog = new SemanticCatalog({
      catalogName: 'procurement_analytics',
      embeddingModel: 'text-embedding-3-small'
    });

    // Initialize query cache
    this.queryCache = new QueryCache(5); // 5 minutes TTL
  }

  // Streaming version of processQuery
  async processQueryStream(context: QueryContext, callbacks: StreamingCallbacks): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = context.query;
      const cachedResult = await this.queryCache.get(cacheKey);
      
      if (cachedResult) {
        // Parse cached response - check if it's already an object or needs parsing
        const cachedData = typeof cachedResult.response_data === 'string' 
          ? JSON.parse(cachedResult.response_data)
          : cachedResult.response_data;
        
        // Stream cached response with slight delay to simulate processing
        const chunks = cachedData.response.split(' ');
        for (const chunk of chunks) {
          callbacks.onChunk(chunk + ' ');
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        callbacks.onMetadata({
          status: 'cached',
          executionTime: cachedResult.execution_time_ms,
          model: cachedResult.model_used,
          hitCount: cachedResult.hit_count
        });
        
        callbacks.onComplete({
          ...cachedData,
          executionTime: cachedResult.execution_time_ms,
          model: cachedResult.model_used + ' (cached)'
        });
        
        return;
      }

      // Send initial metadata
      callbacks.onMetadata({
        status: 'processing',
        queryType: context.queryType
      });

      // Route query to determine type and extract filters
      const routedQuery = await this.routeQuery(context);

      callbacks.onMetadata({
        status: 'data_retrieval',
        queryType: routedQuery.queryType
      });

      // Execute query based on routed type
      const data = await this.executeQuery(routedQuery);

      callbacks.onMetadata({
        status: 'ai_generation',
        recordCount: data.length
      });

      // Generate streaming response
      const result = await this.generateStreamingResponse(routedQuery, data, callbacks);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      const finalResult = {
        success: true,
        response: result.text,
        data: data,
        visualizations: result.visualizations,
        sqlQuery: routedQuery.sqlQuery,
        queryType: routedQuery.queryType,
        executionTime: executionTime,
        model: result.model,
        confidence: result.confidence,
        reasoning: result.reasoning
      };

      // Cache the result for future queries
      try {
        await this.queryCache.set(cacheKey, finalResult, result.model, executionTime);
      } catch (error) {
        console.warn('Failed to cache query result:', error);
      }

      // Complete the process
      callbacks.onComplete(finalResult);

    } catch (error) {
      console.error('Streaming query processing error:', error);
      callbacks.onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  }

  async processQuery(context: QueryContext): Promise<AgentResponse> {
    const startTime = Date.now();
    
    try {
      // Route query to appropriate handler
      const routedQuery = await this.routeQuery(context);
      
      // Execute the query
      const data = await this.executeQuery(routedQuery);
      
      // Generate intelligent response
      const response = await this.generateResponse(routedQuery, data);
      
      return {
        success: true,
        response: response.text,
        data: data,
        visualizations: response.visualizations,
        sqlQuery: routedQuery.sqlQuery, // Include the SQL query
        queryType: routedQuery.queryType,
        executionTime: Date.now() - startTime,
        model: 'AI Assistant', // Hide actual model name from UI
        confidence: response.confidence,
        reasoning: response.reasoning
      };
    } catch (error) {
      console.error('Data agent query processing failed:', error);
      
      return {
        success: false,
        response: `I apologize, but I encountered an error processing your query: ${error instanceof Error ? error.message : 'Unknown error'}`,
        queryType: context.queryType,
        executionTime: Date.now() - startTime,
        model: 'error',
        confidence: 0
      };
    }
  }

  // Helper methods for data source mapping
  private getTableName(dataSource: string): string {
    switch (dataSource) {
      case 'coupa':
        return 'financial_data';
      case 'baan':
        return 'baanspending';
      case 'coupabaan':
        return 'financial_data'; // Primary table for combined queries
      default:
        return 'financial_data';
    }
  }

  private getColumnMapping(dataSource: string) {
    switch (dataSource) {
      case 'coupa':
        return {
          entity: 'hfm_entity',
          supplier: 'vendor_name',
          amount: 'amount',
          year: 'fiscal_year_number',
          quarter: 'EXTRACT(QUARTER FROM fiscal_day)',
          date: 'fiscal_day',
          costGroup: 'hfm_cost_group',
          commodity: 'description'
        };
      case 'baan':
        return {
          entity: 'po_ship_to_city',
          supplier: 'supplier',
          amount: 'reporting_total',
          year: 'year',
          quarter: 'quarter',
          date: 'invoice_created_date',
          costGroup: 'commodity',
          commodity: 'commodity'
        };
      default:
        return {
          entity: 'hfm_entity',
          supplier: 'vendor_name',
          amount: 'amount',
          year: 'fiscal_year_number',
          quarter: 'EXTRACT(QUARTER FROM fiscal_day)',
          date: 'fiscal_day',
          costGroup: 'hfm_cost_group',
          commodity: 'description'
        };
    }
  }

  private buildWhereClause(context: QueryContext, paramOffset: number = 0): { whereClause: string; params: any[]; paramCount: number } {
    const params: any[] = [];
    let paramCount = paramOffset;
    const columnMapping = this.getColumnMapping(context.dataSource);
    let whereClause = 'WHERE 1=1';

    // Apply filters based on data source
    if (context.filters?.entity) {
      paramCount++;
      whereClause += ` AND ${columnMapping.entity} ILIKE $${paramCount}`;
      params.push(`%${context.filters.entity}%`);
    }

    if (context.filters?.costGroup) {
      paramCount++;
      whereClause += ` AND ${columnMapping.costGroup} ILIKE $${paramCount}`;
      params.push(`%${context.filters.costGroup}%`);
    }

    if (context.filters?.year) {
      paramCount++;
      whereClause += ` AND ${columnMapping.year} = $${paramCount}`;
      params.push(context.filters.year);
    }

    // Handle quarter filtering differently for each data source
    if (context.filters?.quarter) {
      if (context.dataSource === 'baan') {
        paramCount++;
        whereClause += ` AND quarter = $${paramCount}`;
        params.push(`Q${context.filters.quarter}`);
      } else {
        // For Coupa (financial_data)
        paramCount++;
        const quarterStartMonth = (context.filters.quarter - 1) * 3 + 1;
        const quarterEndMonth = context.filters.quarter * 3;
        whereClause += ` AND EXTRACT(MONTH FROM ${columnMapping.date}) BETWEEN $${paramCount} AND $${paramCount + 1}`;
        params.push(quarterStartMonth);
        paramCount++;
        params.push(quarterEndMonth);
      }
    }

    return { whereClause, params, paramCount };
  }

  private async routeQuery(context: QueryContext): Promise<QueryContext> {
    // Enhanced query routing logic with data source consideration
    const query = context.query.toLowerCase();
    
    // Determine query type based on keywords and intent
    let queryType: QueryContext['queryType'] = 'specific';
    
    if (query.includes('similar') || query.includes('like') || query.includes('related')) {
      queryType = 'semantic';
    } else if (query.includes('total') || query.includes('sum') || query.includes('average') || query.includes('trend') || 
               query.includes('spending') || query.includes('spend') || query.includes('category') || 
               query.includes('analysis') || query.includes('compare')) {
      queryType = 'analytical';
    } else if (query.includes('summary') || query.includes('overview') || query.includes('breakdown')) {
      queryType = 'summary';
    }

    // Extract filters from query based on data source
    const filters: QueryContext['filters'] = {};
    
    // Entity detection (adapt based on data source)
    if (context.dataSource === 'coupa' || context.dataSource === 'coupabaan') {
      const entities = ['asheville', 'tiger', 'group'];
      for (const entity of entities) {
        if (query.includes(entity)) {
          filters.entity = entity;
          break;
        }
      }
    }

    // Supplier detection for Baan data
    if (context.dataSource === 'baan' || context.dataSource === 'coupabaan') {
      // Extract supplier names from query for Baan data
      const supplierKeywords = ['supplier', 'vendor'];
      for (const keyword of supplierKeywords) {
        if (query.includes(keyword)) {
          // Extract potential supplier name after the keyword
          const supplierMatch = query.match(new RegExp(`${keyword}\s+([a-zA-Z0-9\s]+)`));
          if (supplierMatch) {
            filters.entity = supplierMatch[1].trim();
            break;
          }
        }
      }
    }

    // Cost group/commodity detection
    const costGroups = ['manufacturing', 'marketing', 'r&d', 'service', 'g&a', 'selling', 'professional services', 'construction', 'it consultant'];
    for (const group of costGroups) {
      if (query.includes(group)) {
        filters.costGroup = group;
        break;
      }
    }

    // Year detection
    const yearMatch = query.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      filters.year = parseInt(yearMatch[1]);
    }

    // Quarter detection (Q1, Q2, Q3, Q4)
    const quarterMatch = query.match(/\bq([1-4])\b/i);
    if (quarterMatch) {
      filters.quarter = parseInt(quarterMatch[1]);
    }

    return {
      ...context,
      queryType,
      filters: Object.keys(filters).length > 0 ? filters : undefined
    };
  }

  private async executeQuery(context: QueryContext): Promise<any[]> {
    switch (context.queryType) {
      case 'semantic':
        return this.executeSemanticQuery(context);
      case 'analytical':
        return this.executeAnalyticalQuery(context);
      case 'summary':
        return this.executeSummaryQuery(context);
      default:
        return this.executeSpecificQuery(context);
    }
  }

  private async executeSemanticQuery(context: QueryContext): Promise<any[]> {
    try {
      const tableName = this.getTableName(context.dataSource);
      const columnMapping = this.getColumnMapping(context.dataSource);
      
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(context.query);
      
      if (context.dataSource === 'coupabaan') {
        // Handle combined data source - search both tables
        context.sqlQuery = `-- Semantic Vector Search (Combined)\n-- Coupa Data:\nSELECT 'coupa' as data_source, * FROM financial_data \nORDER BY embedding <=> '${JSON.stringify(queryEmbedding)}' \nLIMIT 10\nUNION ALL\n-- Baan Data (Text Search):\nSELECT 'baan' as data_source, id::text, invoice_created_date::text as fiscal_day, \n       supplier as vendor_name, commodity as description, reporting_total::text as amount,\n       year::text as fiscal_year_number, quarter, null as hfm_entity, commodity as hfm_cost_group\nFROM baanspending \nWHERE description ILIKE '%${context.query}%' OR supplier ILIKE '%${context.query}%' OR commodity ILIKE '%${context.query}%'\nLIMIT 10`;
        
        // Get results from both sources
        const coupaResults = await Database.semanticSearch(context.query, queryEmbedding, 10, 'financial_data');
        const baanResults = await Database.textSearch(context.query, 10, 'baanspending');
        
        // Combine and normalize results
        return [...coupaResults.map(r => ({ ...r, data_source: 'coupa' })), 
                ...baanResults.map(r => ({ ...r, data_source: 'baan' }))];
      } else {
        // Single data source
        context.sqlQuery = `-- Semantic Vector Search\nSELECT * FROM ${tableName} \nORDER BY embedding <=> '${JSON.stringify(queryEmbedding)}' \nLIMIT 20`;
        
        // Perform semantic search on appropriate table
        const results = await Database.semanticSearch(context.query, queryEmbedding, 20, tableName);
        return results;
      }
    } catch (error) {
      console.warn('Semantic search failed, falling back to text search:', error);
      return this.executeTextSearchFallback(context);
    }
  }

  private async executeTextSearchFallback(context: QueryContext): Promise<any[]> {
    const tableName = this.getTableName(context.dataSource);
    const columnMapping = this.getColumnMapping(context.dataSource);
    
    if (context.dataSource === 'coupabaan') {
      // Combined text search
      context.sqlQuery = `-- Text Search Fallback (Combined)\nSELECT 'coupa' as data_source, * FROM financial_data \nWHERE description ILIKE '%${context.query}%' OR vendor_name ILIKE '%${context.query}%' \nLIMIT 10\nUNION ALL\nSELECT 'baan' as data_source, id::text, invoice_created_date::text as fiscal_day, \n       supplier as vendor_name, commodity as description, reporting_total::text as amount,\n       year::text as fiscal_year_number, quarter, null as hfm_entity, commodity as hfm_cost_group\nFROM baanspending \nWHERE description ILIKE '%${context.query}%' OR supplier ILIKE '%${context.query}%' OR commodity ILIKE '%${context.query}%'\nLIMIT 10`;
      
      const coupaResults = await Database.textSearch(context.query, 10, 'financial_data');
      const baanResults = await Database.textSearch(context.query, 10, 'baanspending');
      return [...coupaResults.map(r => ({ ...r, data_source: 'coupa' })), 
              ...baanResults.map(r => ({ ...r, data_source: 'baan' }))];
    } else {
      // Single table text search
      const searchColumns = context.dataSource === 'baan' 
        ? ['description', 'supplier', 'commodity']
        : ['description', 'vendor_name'];
      
      const whereClause = searchColumns.map(col => `${col} ILIKE '%${context.query}%'`).join(' OR ');
      context.sqlQuery = `-- Text Search Fallback\nSELECT * FROM ${tableName} \nWHERE ${whereClause} \nLIMIT 20`;
      
      return Database.textSearch(context.query, 20, tableName);
    }
  }

  private async executeAnalyticalQuery(context: QueryContext): Promise<any[]> {
    const client = await Database.getClient();
    
    try {
      if (context.dataSource === 'coupabaan') {
        // Combined analytical query - analyze both datasets
        return await this.executeCombinedAnalyticalQuery(context, client);
      } else {
        // Single data source analytical query
        return await this.executeSingleSourceAnalyticalQuery(context, client);
      }
    } finally {
      client.release();
    }
  }

  private async executeSingleSourceAnalyticalQuery(context: QueryContext, client: any): Promise<any[]> {
    const tableName = this.getTableName(context.dataSource);
    const columnMapping = this.getColumnMapping(context.dataSource);
    const { whereClause, params } = this.buildWhereClause(context);

    let analyticalQuery: string;
    
    if (context.dataSource === 'baan') {
      // Baan-specific analytical query
      analyticalQuery = `
        SELECT 
          supplier as entity_name,
          commodity as cost_group,
          COUNT(*) as transaction_count,
          SUM(reporting_total) as total_amount,
          AVG(reporting_total) as avg_amount,
          MIN(reporting_total) as min_amount,
          MAX(reporting_total) as max_amount,
          MIN(invoice_created_date) as earliest_date,
          MAX(invoice_created_date) as latest_date
        FROM ${tableName} 
        ${whereClause}
        AND reporting_total > 0
        GROUP BY supplier, commodity
        ORDER BY total_amount DESC
        LIMIT 50
      `;
    } else {
      // Coupa-specific analytical query
      analyticalQuery = `
        SELECT 
          hfm_entity as entity_name,
          hfm_cost_group as cost_group,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          MIN(fiscal_day) as earliest_date,
          MAX(fiscal_day) as latest_date
        FROM ${tableName} 
        ${whereClause}
        AND amount > 0
        GROUP BY hfm_entity, hfm_cost_group
        ORDER BY total_amount DESC
        LIMIT 50
      `;
    }
    
    // Store the SQL query in the context for display
    context.sqlQuery = analyticalQuery.trim();
    
    const result = await client.query(analyticalQuery, params);
    return result.rows;
  }

  private async executeCombinedAnalyticalQuery(context: QueryContext, client: any): Promise<any[]> {
    // Build where clauses for both tables
    const coupaWhereClause = this.buildWhereClause({ ...context, dataSource: 'coupa' });
    const baanWhereClause = this.buildWhereClause({ ...context, dataSource: 'baan' });

    const combinedQuery = `
      WITH coupa_analysis AS (
        SELECT 
          'coupa' as data_source,
          hfm_entity as entity_name,
          hfm_cost_group as cost_group,
          COUNT(*) as transaction_count,
          SUM(amount) as total_amount,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount,
          MIN(fiscal_day) as earliest_date,
          MAX(fiscal_day) as latest_date
        FROM financial_data 
        ${coupaWhereClause.whereClause}
        AND amount > 0
        GROUP BY hfm_entity, hfm_cost_group
      ),
      baan_analysis AS (
        SELECT 
          'baan' as data_source,
          supplier as entity_name,
          commodity as cost_group,
          COUNT(*) as transaction_count,
          SUM(reporting_total) as total_amount,
          AVG(reporting_total) as avg_amount,
          MIN(reporting_total) as min_amount,
          MAX(reporting_total) as max_amount,
          MIN(invoice_created_date) as earliest_date,
          MAX(invoice_created_date) as latest_date
        FROM baanspending 
        ${baanWhereClause.whereClause}
        AND reporting_total > 0
        GROUP BY supplier, commodity
      )
      SELECT * FROM coupa_analysis
      UNION ALL
      SELECT * FROM baan_analysis
      ORDER BY total_amount DESC
      LIMIT 50
    `;
    
    // Store the SQL query in the context for display
    context.sqlQuery = combinedQuery.trim();
    
    // Combine parameters from both where clauses
    const allParams = [...coupaWhereClause.params, ...baanWhereClause.params];
    
    const result = await client.query(combinedQuery, allParams);
    return result.rows;
  }

  private async executeSummaryQuery(context: QueryContext): Promise<any[]> {
    if (context.dataSource === 'coupabaan') {
      // Combined summary from both data sources
      const coupaContext = { ...context, dataSource: 'coupa' as const };
      const baanContext = { ...context, dataSource: 'baan' as const };
      
      const [coupaSummary, baanSummary] = await Promise.all([
        Database.getFinancialSummary(coupaContext.filters || {}, 'financial_data'),
        Database.getBaanSummary(baanContext.filters || {})
      ]);
      
      // Combine summaries with data source labels
      return [
        ...coupaSummary.map(item => ({ ...item, data_source: 'coupa' })),
        ...baanSummary.map(item => ({ ...item, data_source: 'baan' }))
      ];
    } else if (context.dataSource === 'baan') {
      // Baan-specific summary
      return Database.getBaanSummary(context.filters || {});
    } else {
      // Coupa-specific summary (default)
      return Database.getFinancialSummary(context.filters || {}, 'financial_data');
    }
  }

  private async executeSpecificQuery(context: QueryContext): Promise<any[]> {
    const tableName = this.getTableName(context.dataSource);
    
    if (context.dataSource === 'coupabaan') {
      // Combined specific query - search both tables
      const [coupaResults, baanResults] = await Promise.all([
        Database.textSearch(context.query, 8, 'financial_data'),
        Database.textSearch(context.query, 7, 'baanspending')
      ]);
      
      // Normalize and combine results
      const normalizedCoupaResults = coupaResults.map(item => ({
        ...item,
        data_source: 'coupa',
        entity_name: item.hfm_entity,
        cost_group: item.hfm_cost_group,
        amount_value: item.amount
      }));
      
      const normalizedBaanResults = baanResults.map(item => ({
        ...item,
        data_source: 'baan',
        entity_name: item.supplier,
        cost_group: item.commodity,
        amount_value: item.reporting_total
      }));
      
      context.sqlQuery = `-- Combined Specific Query\n-- Coupa Results (${coupaResults.length} records):\nSELECT 'coupa' as data_source, * FROM financial_data WHERE description ILIKE '%${context.query}%' OR vendor_name ILIKE '%${context.query}%' LIMIT 8\nUNION ALL\n-- Baan Results (${baanResults.length} records):\nSELECT 'baan' as data_source, * FROM baanspending WHERE description ILIKE '%${context.query}%' OR supplier ILIKE '%${context.query}%' OR commodity ILIKE '%${context.query}%' LIMIT 7`;
      
      return [...normalizedCoupaResults, ...normalizedBaanResults];
    } else {
      // Single data source specific query
      context.sqlQuery = `-- Specific Query\nSELECT * FROM ${tableName} WHERE ${this.getSearchColumns(context.dataSource).map(col => `${col} ILIKE '%${context.query}%'`).join(' OR ')} LIMIT 15`;
      return Database.textSearch(context.query, 15, tableName);
    }
  }

  private getSearchColumns(dataSource: string): string[] {
    switch (dataSource) {
      case 'baan':
        return ['description', 'supplier', 'commodity'];
      case 'coupa':
      default:
        return ['description', 'vendor_name'];
    }
  }

  // Streaming response generation
  private async generateStreamingResponse(context: QueryContext, data: any[], callbacks: StreamingCallbacks): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    const prompt = await this.buildPrompt(context, data);
    
    // Try primary model first with streaming
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if ((this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro') && this.googleAI) {
          return await this.generateGeminiStreamingResponse(prompt, context, data, callbacks);
        } else if (this.openai) {
          return await this.generateOpenAIStreamingResponse(prompt, context, data, callbacks);
        }
      } catch (error) {
        console.warn(`Streaming attempt ${attempt} failed with ${this.config.primaryModel}:`, error);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Try fallback model with streaming
    try {
      if ((this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro') && this.openai) {
        console.log('Falling back to OpenAI streaming...');
        return await this.generateOpenAIStreamingResponse(prompt, context, data, callbacks);
      } else if (this.googleAI) {
        console.log('Falling back to Gemini streaming...');
        return await this.generateGeminiStreamingResponse(prompt, context, data, callbacks);
      }
    } catch (fallbackError) {
      console.error('Fallback streaming model also failed:', fallbackError);
    }

    // Return fallback response
    const fallbackReasoning = this.config.enableReasoning ? 
      `1. **Query Understanding**: Processed "${context.query}" as ${context.queryType} query\n2. **Data Analysis**: Found ${data.length} relevant records in the database\n3. **Context Application**: Applied business intelligence and financial transaction analysis context\n4. **Insight Generation**: Generated comprehensive analysis from available data\n5. **Business Impact**: Provided actionable insights for strategic decision-making` : 
      undefined;

    const fallbackResponse = this.generateFallbackResponse(context, data);
    
    // Always send reasoning first if enabled
    if (fallbackReasoning) {
      callbacks.onReasoning(fallbackReasoning);
    }
    
    // Then send the content in chunks for better UX
    const responseChunks = fallbackResponse.split('\n\n');
    for (const chunk of responseChunks) {
      if (chunk.trim()) {
        callbacks.onChunk(chunk.trim() + '\n\n');
        await this.delay(50); // Small delay for streaming effect
      }
    }

    return {
      text: fallbackResponse,
      model: 'AI Assistant (Fallback)',
      confidence: 0.7,
      reasoning: fallbackReasoning
    };
  }

  private async generateResponse(context: QueryContext, data: any[]): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    const prompt = await this.buildPrompt(context, data);
    
    // Try primary model first
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        if ((this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro') && this.googleAI) {
          return await this.generateGeminiResponse(prompt, context, data);
        } else if (this.openai) {
          return await this.generateOpenAIResponse(prompt, context, data);
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed with ${this.config.primaryModel}:`, error);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    // Try fallback model
    try {
      if ((this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro') && this.openai) {
        console.log('Falling back to OpenAI...');
        return await this.generateOpenAIResponse(prompt, context, data);
      } else if (this.googleAI) {
        console.log('Falling back to Gemini...');
        return await this.generateGeminiResponse(prompt, context, data);
      }
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
    }

    // Return fallback response with basic reasoning 
    const fallbackReasoning = this.config.enableReasoning ? 
      `1. **Query Understanding**: Processed "${context.query}" as ${context.queryType} query\n2. **Data Analysis**: Found ${data.length} relevant records\n3. **Context Application**: Applied business context and constraints\n4. **Insight Generation**: Generated summary from available data\n5. **Business Impact**: Provided actionable insights for decision-making` : 
      undefined;

    return {
      text: this.generateFallbackResponse(context, data),
      model: 'AI Assistant',
      confidence: 0.5,
      reasoning: fallbackReasoning
    };
  }

  private async generateGeminiResponse(prompt: string, context: QueryContext, data: any[]): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    // Use Gemini 2.5 Pro with reasoning capabilities
    const modelName = this.config.primaryModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-1.5-pro';
    
    const model = this.googleAI!.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        maxOutputTokens: this.config.maxOutputTokens,
      },
    });

    // Enable reasoning if supported and configured
    let enhancedPrompt = prompt;
    if (this.config.enableReasoning && (this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro')) {
      enhancedPrompt = `ENABLE STEP-BY-STEP REASONING: Show your analytical thinking process before providing the final answer.

## REASONING TRACE
Think through this step by step, showing your analysis process:
1. **Query Understanding**: What is the user asking?
2. **Data Analysis**: What patterns do you see in the data?
3. **Context Application**: How does this relate to financial transaction analysis?
4. **Insight Generation**: What are the key findings?
5. **Business Impact**: What does this mean for decision-making?

---

${prompt}`;
    }

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const fullText = response.text();

    // Extract reasoning trace if present
    let reasoning: string | undefined;
    let finalText = fullText;
    
    if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
      const parts = fullText.split('---');
      if (parts.length >= 2) {
        reasoning = parts[0].replace('## REASONING TRACE', '').trim();
        finalText = parts.slice(1).join('---').trim();
      }
    }

    return {
      text: finalText,
      visualizations: this.generateVisualizations(context, data),
      model: this.config.primaryModel === 'gemini-2.5-flash' ? 'AI Assistant Pro' : 'AI Assistant',
      confidence: this.config.primaryModel === 'gemini-2.5-flash' ? 0.95 : 0.9,
      reasoning
    };
  }

  // Gemini streaming response generation
  private async generateGeminiStreamingResponse(prompt: string, context: QueryContext, data: any[], callbacks: StreamingCallbacks): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    const modelName = this.config.primaryModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-1.5-pro';
    
    const model = this.googleAI!.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: this.config.temperature,
        topP: this.config.topP,
        maxOutputTokens: this.config.maxOutputTokens,
      },
    });

    // Enable reasoning if supported and configured
    let enhancedPrompt = prompt;
    if (this.config.enableReasoning && (this.config.primaryModel === 'gemini-2.5-flash' || this.config.primaryModel === 'gemini-1.5-pro')) {
      enhancedPrompt = `ENABLE STEP-BY-STEP REASONING: Show your analytical thinking process before providing the final answer.

## REASONING TRACE
Think through this step by step, showing your analysis process:
1. **Query Understanding**: What is the user asking?
2. **Data Analysis**: What patterns do you see in the data?
3. **Context Application**: How does this relate to financial transaction analysis?
4. **Insight Generation**: What are the key findings?
5. **Business Impact**: What does this mean for decision-making?

---

${prompt}`;
    }

    // Try to use generateContentStream if available, otherwise fallback
    try {
      const result = await model.generateContentStream(enhancedPrompt);
      let fullText = '';
      let reasoning: string | undefined;

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          
          // Handle reasoning trace streaming
          if (this.config.enableReasoning && fullText.includes('## REASONING TRACE') && !reasoning) {
            const parts = fullText.split('---');
            if (parts.length >= 2) {
              reasoning = parts[0].replace('## REASONING TRACE', '').trim();
              callbacks.onReasoning(reasoning);
              // Start streaming the main content after reasoning
              const contentStart = parts.slice(1).join('---').trim();
              if (contentStart) {
                callbacks.onChunk(contentStart);
              }
            } else if (!fullText.includes('---')) {
              // Still in reasoning section, don't stream yet
              continue;
            }
          } else if (reasoning) {
            // We already sent reasoning, stream all new content chunks
            callbacks.onChunk(chunkText);
          } else if (!this.config.enableReasoning) {
            // No reasoning mode, stream everything immediately
            callbacks.onChunk(chunkText);
          }
          
          // Add small delay to make streaming more visible
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Extract final reasoning and text if needed
      let finalText = fullText;
      if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
        const parts = fullText.split('---');
        if (parts.length >= 2) {
          reasoning = parts[0].replace('## REASONING TRACE', '').trim();
          finalText = parts.slice(1).join('---').trim();
        }
      }

      return {
        text: finalText,
        visualizations: this.generateVisualizations(context, data),
        model: this.config.primaryModel === 'gemini-2.5-flash' ? 'AI Assistant Pro' : 'AI Assistant',
        confidence: this.config.primaryModel === 'gemini-2.5-flash' ? 0.95 : 0.9,
        reasoning
      };

    } catch (streamError: any) {
      // Fallback to non-streaming if streaming fails
      console.warn('Gemini streaming failed, falling back to standard generation:', streamError.message || streamError);
      
      // Handle specific error types
      if (streamError.status === 401) {
        throw new Error('Authentication failed: Please check your Google API key');
      } else if (streamError.status === 403) {
        throw new Error('API access denied: Please check your Google API permissions');
      } else if (streamError.status === 503) {
        console.log('Gemini service overloaded, will retry with OpenAI');
        throw streamError; // Let the caller handle fallback to OpenAI
      } else if (streamError.status === 429) {
        console.log('Gemini rate limit exceeded, will retry with OpenAI');
        throw streamError; // Let the caller handle fallback to OpenAI
      }
      
      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const fullText = response.text();

      // Process the full response and stream it at once
      let reasoning: string | undefined;
      let finalText = fullText;
      
      if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
        const parts = fullText.split('---');
        if (parts.length >= 2) {
          reasoning = parts[0].replace('## REASONING TRACE', '').trim();
          finalText = parts.slice(1).join('---').trim();
          callbacks.onReasoning(reasoning);
        }
      }

      callbacks.onChunk(finalText);

      return {
        text: finalText,
        visualizations: this.generateVisualizations(context, data),
        model: this.config.primaryModel === 'gemini-2.5-flash' ? 'AI Assistant Pro' : 'AI Assistant',
        confidence: this.config.primaryModel === 'gemini-2.5-flash' ? 0.95 : 0.9,
        reasoning
      };
    }
  }

  private async generateOpenAIResponse(prompt: string, context: QueryContext, data: any[]): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    // Enable reasoning if configured - use same logic as Gemini
    let enhancedPrompt = prompt;
    if (this.config.enableReasoning) {
      enhancedPrompt = `ENABLE STEP-BY-STEP REASONING: Show your analytical thinking process before providing the final answer.

## REASONING TRACE
Think through this step by step, showing your analysis process:
1. **Query Understanding**: What is the user asking?
2. **Data Analysis**: What patterns do you see in the data?
3. **Context Application**: How does this relate to financial transaction analysis?
4. **Insight Generation**: What are the key findings?
5. **Business Impact**: What does this mean for decision-making?

---

${prompt}`;
    }

    const response = await this.openai!.chat.completions.create({
      model: this.config.fallbackModel || 'gpt-4o-mini',
      messages: [{ role: 'user', content: enhancedPrompt }],
      temperature: this.config.temperature,
      top_p: this.config.topP,
      max_tokens: this.config.maxOutputTokens,
    });

    const fullText = response.choices[0]?.message?.content || 'No response generated';

    // Extract reasoning trace if present - same logic as Gemini
    let reasoning: string | undefined;
    let finalText = fullText;
    
    if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
      const parts = fullText.split('---');
      if (parts.length >= 2) {
        reasoning = parts[0].replace('## REASONING TRACE', '').trim();
        finalText = parts.slice(1).join('---').trim();
      }
    }

    return {
      text: finalText,
      visualizations: this.generateVisualizations(context, data),
      model: 'AI Assistant (GPT-4)',
      confidence: 0.85,
      reasoning // Now properly extracts reasoning from OpenAI responses
    };
  }

  // OpenAI streaming response generation
  private async generateOpenAIStreamingResponse(prompt: string, context: QueryContext, data: any[], callbacks: StreamingCallbacks): Promise<{
    text: string;
    visualizations?: any[];
    model: string;
    confidence: number;
    reasoning?: string;
  }> {
    // Enable reasoning if configured
    let enhancedPrompt = prompt;
    if (this.config.enableReasoning) {
      enhancedPrompt = `ENABLE STEP-BY-STEP REASONING: Show your analytical thinking process before providing the final answer.

## REASONING TRACE
Think through this step by step, showing your analysis process:
1. **Query Understanding**: What is the user asking?
2. **Data Analysis**: What patterns do you see in the data?
3. **Context Application**: How does this relate to financial transaction analysis?
4. **Insight Generation**: What are the key findings?
5. **Business Impact**: What does this mean for decision-making?

---

${prompt}`;
    }

    try {
      const stream = await this.openai!.chat.completions.create({
        model: this.config.fallbackModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: enhancedPrompt }],
        temperature: this.config.temperature,
        top_p: this.config.topP,
        max_tokens: this.config.maxOutputTokens,
        stream: true,
      });

      let fullText = '';
      let reasoning: string | undefined;
      let reasoningSent = false;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullText += content;
          
          // Stream reasoning separately if we detect the trace
          if (this.config.enableReasoning && fullText.includes('## REASONING TRACE') && !reasoningSent) {
            const parts = fullText.split('---');
            if (parts.length >= 2) {
              reasoning = parts[0].replace('## REASONING TRACE', '').trim();
              callbacks.onReasoning(reasoning);
              reasoningSent = true;
              // Start streaming the main content
              const contentStart = parts.slice(1).join('---').trim();
              if (contentStart) {
                callbacks.onChunk(contentStart);
              }
            } else if (!fullText.includes('---')) {
              // Still in reasoning section
              continue;
            }
          } else if (reasoningSent) {
            // We already sent reasoning, stream all new content chunks
            callbacks.onChunk(content);
          } else if (!this.config.enableReasoning) {
            // No reasoning mode, stream everything immediately
            callbacks.onChunk(content);
          }
          
          // Add small delay to make streaming more visible
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Extract final reasoning and text if needed
      let finalText = fullText;
      if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
        const parts = fullText.split('---');
        if (parts.length >= 2) {
          reasoning = parts[0].replace('## REASONING TRACE', '').trim();
          finalText = parts.slice(1).join('---').trim();
        }
      }

      return {
        text: finalText,
        visualizations: this.generateVisualizations(context, data),
        model: 'AI Assistant (GPT-4)',
        confidence: 0.85,
        reasoning
      };

    } catch (streamError: any) {
      // Fallback to non-streaming if streaming fails
      console.warn('OpenAI streaming failed, falling back to standard generation:', streamError.message || streamError);
      
      // Handle specific error types
      if (streamError.status === 401) {
        throw new Error('Authentication failed: Please check your OpenAI API key');
      } else if (streamError.status === 403) {
        throw new Error('API access denied: Please check your OpenAI API permissions');
      } else if (streamError.status === 429) {
        console.log('OpenAI rate limit exceeded');
        throw streamError; // Let the caller handle retry
      }
      const response = await this.openai!.chat.completions.create({
        model: this.config.fallbackModel || 'gpt-4o-mini',
        messages: [{ role: 'user', content: enhancedPrompt }],
        temperature: this.config.temperature,
        top_p: this.config.topP,
        max_tokens: this.config.maxOutputTokens,
      });

      const fullText = response.choices[0]?.message?.content || 'No response generated';

      // Process the full response and stream it at once
      let reasoning: string | undefined;
      let finalText = fullText;
      
      if (this.config.enableReasoning && fullText.includes('## REASONING TRACE')) {
        const parts = fullText.split('---');
        if (parts.length >= 2) {
          reasoning = parts[0].replace('## REASONING TRACE', '').trim();
          finalText = parts.slice(1).join('---').trim();
          callbacks.onReasoning(reasoning);
        }
      }

      callbacks.onChunk(finalText);

      return {
        text: finalText,
        visualizations: this.generateVisualizations(context, data),
        model: 'AI Assistant (GPT-4)',
        confidence: 0.85,
        reasoning
      };
    }
  }

  private async expandQuery(originalQuery: string): Promise<string> {
    // Enhanced query expansion with reasoning for common financial transaction analysis patterns
    const query = originalQuery.toLowerCase();
    
    // Variance analysis expansion
    if (query.includes('variance') && query.includes('cost center')) {
      return `Variance Analysis for Cost Centers: This requires calculating monthly spending patterns, standard deviation, coefficient of variation, and seasonal trend identification. Key metrics: (1) Monthly spend variance per cost center, (2) Ranking by volatility, (3) Seasonal vs random patterns, (4) Budget deviation analysis, (5) Top 10 cost centers by spend volume and variance intensity.`;
    }
    
    // Monthly trend analysis expansion
    if (query.includes('monthly') && query.includes('trend')) {
      return `Monthly Trend Analysis: Comprehensive time-series analysis requiring month-over-month growth calculations, trend direction identification, seasonality detection, and anomaly flagging. Key components: (1) Monthly aggregation by cost center, (2) Growth rate calculations, (3) Trend pattern classification, (4) Seasonal adjustment factors, (5) Statistical significance testing.`;
    }
    
    // Top N analysis expansion
    if (query.includes('top') && (query.includes('10') || query.includes('5'))) {
      return `Top N Ranking Analysis: Multi-dimensional ranking requiring spend volume calculation, efficiency metrics, variance analysis, and comparative benchmarking. Analysis framework: (1) Primary ranking criteria identification, (2) Spend volume aggregation, (3) Efficiency ratio calculations, (4) Variance pattern analysis, (5) Peer comparison and outlier detection.`;
    }
    
    // Entity comparison expansion
    if (query.includes('entities') || query.includes('entity')) {
      return `Entity Performance Analysis: Cross-entity comparison requiring normalized metrics, efficiency benchmarking, and relative performance assessment. Key dimensions: (1) Entity spend aggregation, (2) Efficiency metrics calculation, (3) Benchmark establishment, (4) Performance ranking, (5) Best practice identification.`;
    }
    
    // Quarterly analysis expansion
    if (query.includes('quarterly') || query.includes('quarter')) {
      return `Quarterly Business Analysis: Comprehensive quarterly performance evaluation requiring QoQ growth analysis, seasonal pattern detection, and business cycle assessment. Framework: (1) Quarterly spend aggregation, (2) Growth rate calculations, (3) Seasonal trend analysis, (4) Business event correlation, (5) Forecast accuracy assessment.`;
    }
    
    // Account analysis expansion
    if (query.includes('account') && (query.includes('consolidation') || query.includes('opportunities'))) {
      return `Account Consolidation Analysis: Strategic account optimization requiring cross-entity account mapping, consolidation opportunity assessment, and efficiency improvement identification. Analysis scope: (1) Account spend distribution, (2) Entity overlap analysis, (3) Consolidation potential scoring, (4) Efficiency gain estimation, (5) Implementation complexity assessment.`;
    }
    
    // Risk analysis expansion
    if (query.includes('risk') || query.includes('dependency')) {
      return `Risk Assessment Analysis: Comprehensive risk evaluation requiring dependency mapping, concentration analysis, and vulnerability assessment. Risk framework: (1) Vendor dependency analysis, (2) Spend concentration assessment, (3) Single-source risk identification, (4) Financial exposure quantification, (5) Mitigation strategy development.`;
    }
    
    // Default expansion for complex queries
    if (query.length > 50) {
      return `Advanced Analytics Query: Multi-faceted analysis requiring comprehensive data examination, statistical analysis, and business insight generation. Framework: (1) Query decomposition, (2) Data aggregation strategy, (3) Statistical analysis methods, (4) Pattern recognition, (5) Actionable insight synthesis.`;
    }
    
    return `Standard Procurement Analysis: Focused analytical review of Asheville operations data with emphasis on spend patterns, efficiency metrics, and actionable business insights.`;
  }

  private async buildPrompt(context: QueryContext, data: any[]): Promise<string> {
    // Get semantic context from catalog
    const semanticContext = await this.semanticCatalog.renderContextForLLM(context.query);
    
    // Enhanced query expansion and reasoning
    const expandedQuery = await this.expandQuery(context.query);
    
    const basePrompt = `ROLE: You are a Procurement Analytics Agent specializing in analyzing financial data and delivering actionable business insights with comprehensive reasoning and query expansion capabilities.

CRITICAL INSTRUCTION: NEVER include SQL code, database queries, or technical implementation details in your response. Focus exclusively on business insights, findings, and recommendations.

DATABASE CONTEXT:
- Database: PostgreSQL
- Primary Table: financial_data  
- Total Records: 26,111 transactions
- Total Spend: $48.8M (FY2023-2025 partial)
- Data Quality: 100% completeness across all fields

CRITICAL DATA CONSTRAINTS:
⚠️ 2025 DATA LIMITATION: Only Q1-Q2 2025 data available
- DO NOT compare Q3/Q4 2025 to any period (data doesn't exist)
- DO NOT calculate annual 2025 totals or YoY comparisons with 2025
- For 2025 analysis: Use only Jan-Jun data explicitly
- For annual/YoY analysis: Use 2023 vs 2024 only
- When asked about "current year" or "this year", clarify 2025 partial data limitation

${semanticContext}

ORIGINAL USER QUERY: "${context.query}"
EXPANDED QUERY ANALYSIS: ${expandedQuery}
QUERY TYPE: ${context.queryType}
DATA RETRIEVED: ${data.length} records

RETRIEVED DATA SAMPLE:
${JSON.stringify(data.slice(0, 3), null, 2)}

QUERY REASONING REQUIREMENTS:
- For variance analysis: Include coefficient of variation, standard deviation, and seasonal patterns
- For trend analysis: Identify time-based patterns, growth rates, and inflection points
- For cost center analysis: Rank by spend volume, efficiency metrics, and variance patterns
- For entity comparisons: Calculate relative performance, benchmark against peers
- For account analysis: Assess concentration risk, consolidation opportunities, and spend efficiency

RESPONSE FORMAT (ALWAYS FOLLOW):

## REASONING TRACE
[Explain your analytical approach and reasoning for this specific query]

---

## EXECUTIVE SUMMARY
[2-3 sentences with key finding and business impact]

## EVIDENCE & RESULTS
[Present detailed findings with supporting data and metrics - NO SQL CODE]

**Primary Finding:** [Key number with context]
**Supporting Data:** [Specific metrics and calculations]  
**Data Period:** [Specify exact date range analyzed]
**Analysis Method:** [Describe the analytical approach used]

## DATA NOTES
[Any limitations, assumptions, or clarifications about the analysis]

AMOUNT HANDLING RULES:
- ALWAYS clean amounts with: CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))
- Filter valid records: WHERE CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2)) > 0
- For 2025 analysis: WHERE fiscal_year_number = 2025 AND fiscal_day <= '2025-06-30'
- For YoY comparisons: WHERE fiscal_year_number IN (2023, 2024)

BUSINESS CONTEXT:
- Manufacturing Overhead = 51% of total spend (largest category)
- Average transaction = $1,897
- 128 cost centers across 8 entities
- Range: $0 to $503,871 per transaction
- Focus on actionable cost savings opportunities

RESPONSE QUALITY RULES:
- ALWAYS use actual cost center names (e.g., "LEAsheville-Manufacturing") instead of generic terms like "Cost Center A"
- Use specific entity names from the data: LEAsheville, LEAshevilleSVC, LETiger-AVL, LEGroupOffice, etc.
- If you don't have relevant information to answer the query, explicitly state: "I don't have sufficient data to answer this question accurately"
- If the query times out, respond: "The query is taking longer than expected. Please try a simpler question or contact support"
- Be specific with actual names, amounts, and dates - avoid generic placeholder terms

Generate your response following this exact format:`;

    return basePrompt;
  }

  private generateVisualizations(context: QueryContext, data: any[]): any[] {
    const visualizations: any[] = [];

    if (data.length === 0) return visualizations;

    // Generate appropriate visualizations based on query type and data
    if (context.queryType === 'analytical' && data[0]?.total_amount) {
      visualizations.push({
        type: 'bar',
        title: 'Spending by Entity and Cost Group',
        data: data.slice(0, 10).map(row => ({
          label: `${row.hfm_entity} - ${row.hfm_cost_group}`,
          value: parseFloat(row.total_amount || 0)
        }))
      });
    }

    if (context.queryType === 'summary') {
      visualizations.push({
        type: 'pie',
        title: 'Cost Distribution',
        data: data.slice(0, 8).map(row => ({
          label: row.hfm_cost_group || 'Unknown',
          value: parseFloat(row.total_amount || 0)
        }))
      });
    }

    return visualizations;
  }

  private generateFallbackResponse(context: QueryContext, data: any[]): string {
    if (data.length === 0) {
      return `## EXECUTIVE SUMMARY\nI couldn't find any financial data matching your query "${context.query}". This could be due to specific entity names, date ranges, or cost center criteria that don't match our database.\n\n## EVIDENCE & RESULTS\n**Primary Finding:** No matching records found in the $48.8M dataset\n**Data Period:** All available periods (FY2023-2025 Q1-Q2)\n**Suggestion:** Try broader search terms or check entity/cost center names\n\n## DATA NOTES\nPlease verify entity names like 'Asheville', 'Tiger Group', or cost groups like 'Manufacturing Overhead'. You can also try semantic searches like "similar to equipment purchases".`;
    }

    // Process data to generate meaningful insights
    const totalAmount = data.reduce((sum, record) => {
      const amount = parseFloat(record.total_amount || record.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const summary = `## EXECUTIVE SUMMARY\nAnalyzed ${data.length} records from your query "${context.query}" with total value of $${totalAmount.toLocaleString()}. Key insights and patterns identified below.\n\n## EVIDENCE & RESULTS\n**Primary Finding:** $${totalAmount.toLocaleString()} across ${data.length} transactions\n**Supporting Data:** Analysis covers multiple entities and cost centers\n**Data Period:** ${data[0]?.fiscal_day ? `From ${data[0].fiscal_day}` : 'Multiple periods'}\n\n`;
    
    const topRecords = data.slice(0, 5).map((record, index) => {
      const amount = parseFloat(record.total_amount || record.amount || 0);
      const entityName = record.hfm_entity || 'Unknown Entity';
      const costGroup = record.hfm_cost_group || 'Unknown Cost Group';
      return `${index + 1}. **${entityName}** - ${costGroup}: $${amount.toLocaleString()}`;
    }).join('\n');

    return summary + topRecords + `\n\n## DATA NOTES\nAnalysis based on available financial data. For detailed breakdowns or specific questions, try follow-up queries about individual entities or cost centers.`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DataAgent;