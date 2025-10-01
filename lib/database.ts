import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close clients after 30 seconds of inactivity
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

export class Database {
  static async getClient() {
    try {
      return await pool.connect();
    } catch (error) {
      console.error('Database connection error:', error);
      throw new Error('Failed to connect to database');
    }
  }

  static async query(text: string, params?: any[]) {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  static async setupBaanDatabase() {
    const client = await this.getClient();
    
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create the baanspending table based on CSV structure
      await client.query(`
        CREATE TABLE IF NOT EXISTS baanspending (
          id SERIAL PRIMARY KEY,
          invoice_created_date DATE,
          year INTEGER,
          month INTEGER,
          quarter VARCHAR(5),
          quarter_year VARCHAR(10),
          commodity VARCHAR(200),
          description TEXT,
          supplier VARCHAR(300),
          reporting_total DECIMAL(15,2),
          po_ship_to_city VARCHAR(100),
          chart_of_accounts VARCHAR(50),
          accounting_currency VARCHAR(10),
          invoice_number VARCHAR(100),
          
          -- Vector columns for semantic search
          supplier_embedding vector(1536),
          commodity_embedding vector(1536),
          combined_text_embedding vector(1536),
          
          -- Full text search
          search_text TEXT,
          
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_invoice_date 
        ON baanspending(invoice_created_date);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_year 
        ON baanspending(year);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_quarter 
        ON baanspending(quarter);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_supplier 
        ON baanspending(supplier);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_commodity 
        ON baanspending(commodity);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_amount 
        ON baanspending(reporting_total);
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_city 
        ON baanspending(po_ship_to_city);
      `);

      // Create vector similarity search indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_supplier_embedding 
        ON baanspending USING ivfflat (supplier_embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_commodity_embedding 
        ON baanspending USING ivfflat (commodity_embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_combined_embedding 
        ON baanspending USING ivfflat (combined_text_embedding vector_cosine_ops)
        WITH (lists = 100);
      `);

      // Create full text search index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_baanspending_search_text 
        ON baanspending USING gin(to_tsvector('english', search_text));
      `);

      console.log('Baan database setup completed successfully');
      return true;
    } catch (error) {
      console.error('Baan database setup failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async setupDatabase() {
    const client = await this.getClient();
    
    try {
      // Enable pgvector extension
      await client.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create the financial_data table based on CSV structure
      await client.query(`
        CREATE TABLE IF NOT EXISTS financial_data (
          id SERIAL PRIMARY KEY,
          fiscal_year_number INTEGER,
          fiscal_year_month VARCHAR(10),
          fiscal_year_week VARCHAR(10),
          fiscal_day DATE,
          finalization_date DATE,
          hfm_entity VARCHAR(100),
          hfm_cost_group VARCHAR(100),
          fim_account VARCHAR(100),
          account_code VARCHAR(20),
          account VARCHAR(200),
          cost_center_code VARCHAR(20),
          cost_center VARCHAR(200),
          amount DECIMAL(15,2),
          
          -- Vector columns for semantic search
          entity_embedding vector(1536),
          cost_group_embedding vector(1536),
          account_embedding vector(1536),
          cost_center_embedding vector(1536),
          combined_text_embedding vector(1536),
          
          -- Full text search
          search_text TEXT,
          
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_fiscal_year 
        ON financial_data(fiscal_year_number);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_entity 
        ON financial_data(hfm_entity);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_cost_group 
        ON financial_data(hfm_cost_group);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_amount 
        ON financial_data(amount);
      `);

      // Create vector similarity search indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_entity_embedding 
        ON financial_data USING ivfflat (entity_embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_combined_embedding 
        ON financial_data USING ivfflat (combined_text_embedding vector_cosine_ops)
        WITH (lists = 100);
      `);

      // Create full text search index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_financial_data_search_text 
        ON financial_data USING gin(to_tsvector('english', search_text));
      `);

      // Create user chat sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_chat_sessions (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL UNIQUE,
          title VARCHAR(500),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          message_count INTEGER DEFAULT 0
        )
      `);

      // Create chat messages table
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          message_id VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
          content TEXT NOT NULL,
          reasoning TEXT,
          sql_query TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (session_id) REFERENCES user_chat_sessions(session_id) ON DELETE CASCADE
        )
      `);

      // Create stored message data table for SQL queries and evidence
      await client.query(`
        CREATE TABLE IF NOT EXISTS stored_message_data (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL UNIQUE,
          user_id VARCHAR(255) NOT NULL,
          sql_query TEXT,
          response_data JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for chat tables
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_user_id 
        ON user_chat_sessions(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_chat_sessions_updated_at 
        ON user_chat_sessions(updated_at DESC);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id 
        ON chat_messages(session_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id 
        ON chat_messages(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_stored_message_data_message_id 
        ON stored_message_data(message_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_stored_message_data_user_id 
        ON stored_message_data(user_id);
      `);

      // Add new columns to existing chat_messages table if they don't exist
      await client.query(`
        ALTER TABLE chat_messages 
        ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'analyst' CHECK (mode IN ('analyst', 'executive'));
      `);
      
      await client.query(`
        ALTER TABLE chat_messages 
        ADD COLUMN IF NOT EXISTS evidence_reference_id VARCHAR(255);
      `);

      // Add new columns to existing user_conversation_profiles table if they don't exist
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS default_mode VARCHAR(50) DEFAULT 'analyst' CHECK (default_mode IN ('analyst', 'executive'));
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS analysis_depth VARCHAR(50) DEFAULT 'detailed' CHECK (analysis_depth IN ('quick', 'detailed', 'comprehensive'));
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS visualization_style VARCHAR(50) DEFAULT 'mixed' CHECK (visualization_style IN ('charts', 'tables', 'mixed'));
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS response_format VARCHAR(50) DEFAULT 'standard' CHECK (response_format IN ('concise', 'standard', 'detailed'));
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS follow_up_suggestions BOOLEAN DEFAULT true;
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'combined' CHECK (data_source IN ('coupa', 'baan', 'combined'));
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS confidence_display BOOLEAN DEFAULT true;
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS location_preferences JSONB;
      `);
      
      await client.query(`
        ALTER TABLE user_conversation_profiles 
        ADD COLUMN IF NOT EXISTS analytics_preferences JSONB;
      `);

      // Create message feedback table for thumbs up/down feedback
      await client.query(`
        CREATE TABLE IF NOT EXISTS message_feedback (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          rating VARCHAR(20) NOT NULL CHECK (rating IN ('positive', 'negative')),
          notes TEXT,
          evidence_reference_id VARCHAR(255),
          feedback_type VARCHAR(50) DEFAULT 'general' CHECK (feedback_type IN ('general', 'accuracy', 'relevance', 'completeness')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(message_id, user_id)
        )
      `);

      // Create evidence references table for linking messages to evidence
      await client.query(`
        CREATE TABLE IF NOT EXISTS evidence_references (
          id SERIAL PRIMARY KEY,
          evidence_id VARCHAR(255) NOT NULL UNIQUE,
          message_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN (
            'sql_query', 'data_analysis', 'chart', 'report', 'insight',
            'file_pdf', 'file_excel', 'file_word', 'file_csv', 'file_image', 'file_document'
          )),
          evidence_data JSONB NOT NULL,
          metadata JSONB,
          confidence_score DECIMAL(5,2),
          data_sources JSONB,
          artifact_url TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create file uploads table for tracking uploaded files
      await client.query(`
        CREATE TABLE IF NOT EXISTS file_uploads (
          id SERIAL PRIMARY KEY,
          file_id VARCHAR(255) NOT NULL UNIQUE,
          user_id VARCHAR(255) NOT NULL,
          original_filename VARCHAR(500),
          file_type VARCHAR(100),
          file_size BIGINT,
          mime_type VARCHAR(200),
          object_path TEXT,
          upload_context JSONB,
          processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
          processing_result JSONB,
          chat_context JSONB,
          error_message TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          processed_at TIMESTAMP
        )
      `);

      // Create enhanced conversation context tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_conversation_profiles (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL UNIQUE,
          query_patterns JSONB,
          user_preferences JSONB,
          data_source_usage JSONB,
          preferred_agent VARCHAR(50),
          frequent_queries JSONB,
          expertise_level VARCHAR(50) DEFAULT 'beginner',
          interaction_style VARCHAR(50) DEFAULT 'detailed',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS conversation_episodes (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          conversation_id VARCHAR(255) NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          topic_summary TEXT,
          key_insights JSONB,
          user_satisfaction INTEGER,
          query_types JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create indexes for file uploads table
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id 
        ON file_uploads(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_uploads_file_id 
        ON file_uploads(file_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_uploads_status 
        ON file_uploads(processing_status);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at 
        ON file_uploads(created_at DESC);
      `);

      // Create indexes for conversation context tables
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_conversation_profiles_user_id 
        ON user_conversation_profiles(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversation_episodes_user_id 
        ON conversation_episodes(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversation_episodes_conversation_id 
        ON conversation_episodes(conversation_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_conversation_episodes_end_time 
        ON conversation_episodes(end_time DESC);
      `);

      // Create indexes for new tables and columns
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_mode 
        ON chat_messages(mode);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_evidence_reference_id 
        ON chat_messages(evidence_reference_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id 
        ON message_feedback(message_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id 
        ON message_feedback(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_feedback_rating 
        ON message_feedback(rating);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_feedback_evidence_reference_id 
        ON message_feedback(evidence_reference_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_evidence_references_evidence_id 
        ON evidence_references(evidence_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_evidence_references_message_id 
        ON evidence_references(message_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_evidence_references_user_id 
        ON evidence_references(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_evidence_references_type 
        ON evidence_references(evidence_type);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_evidence_references_confidence 
        ON evidence_references(confidence_score DESC);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_conversation_profiles_default_mode 
        ON user_conversation_profiles(default_mode);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_user_conversation_profiles_data_source 
        ON user_conversation_profiles(data_source);
      `);

      // Create bulk insight jobs table for orchestrated analytics
      await client.query(`
        CREATE TABLE IF NOT EXISTS bulk_insight_jobs (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          analysis_type VARCHAR(100) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'pending',
          insights JSONB,
          execution_time INTEGER DEFAULT 0,
          confidence DECIMAL(5,2) DEFAULT 0,
          data_sources_used JSONB,
          total_queries INTEGER DEFAULT 0,
          records_analyzed INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP,
          error TEXT
        )
      `);

      // Create indexes for bulk insight jobs
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_insight_jobs_user_id 
        ON bulk_insight_jobs(user_id);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_insight_jobs_status 
        ON bulk_insight_jobs(status);
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bulk_insight_jobs_created_at 
        ON bulk_insight_jobs(created_at DESC);
      `);

      // Setup Baan database tables
      await this.setupBaanDatabase();

      console.log('Database setup completed successfully');
      return true;
    } catch (error) {
      console.error('Database setup failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async importCSVData(csvData: any[]) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing data
      await client.query('TRUNCATE TABLE financial_data RESTART IDENTITY');
      
      const insertQuery = `
        INSERT INTO financial_data (
          fiscal_year_number, fiscal_year_month, fiscal_year_week, 
          fiscal_day, finalization_date, hfm_entity, hfm_cost_group,
          fim_account, account_code, account, cost_center_code, 
          cost_center, amount, search_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      let importedCount = 0;
      
      for (const row of csvData) {
        try {
          // Parse amount (remove $ and commas)
          const amountStr = row.Amount?.toString().replace(/[$,\s]/g, '') || '0';
          const amount = parseFloat(amountStr) || 0;
          
          // Parse dates
          const fiscalDay = row['Fiscal Day'] ? new Date(row['Fiscal Day']) : null;
          const finalizationDate = row['Finalization Date'] ? new Date(row['Finalization Date']) : null;
          
          // Create search text for full-text search
          const searchText = [
            row['HFM Entity'],
            row['HFM Cost Group'],
            row['Account'],
            row['Cost Center']
          ].filter(Boolean).join(' ');

          await client.query(insertQuery, [
            parseInt(row['Fiscal Year Number']) || null,
            row['Fiscal Year Month'],
            row['Fiscal Year Week'],
            fiscalDay,
            finalizationDate,
            row['HFM Entity'],
            row['HFM Cost Group'],
            row['FIM Account'],
            row['Account Code'],
            row['Account'],
            row['Cost Center Code'],
            row['Cost Center'],
            amount,
            searchText
          ]);
          
          importedCount++;
          
          if (importedCount % 1000 === 0) {
            console.log(`Imported ${importedCount} records...`);
          }
        } catch (rowError) {
          console.error(`Error importing row ${importedCount + 1}:`, rowError);
          // Continue with next row
        }
      }
      
      await client.query('COMMIT');
      console.log(`Successfully imported ${importedCount} records`);
      return importedCount;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('CSV import failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async importBaanCSVData(csvData: any[]) {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      // Clear existing data
      await client.query('TRUNCATE TABLE baanspending RESTART IDENTITY');
      
      const insertQuery = `
        INSERT INTO baanspending (
          invoice_created_date, year, month, quarter, quarter_year,
          commodity, description, supplier, reporting_total, po_ship_to_city,
          chart_of_accounts, accounting_currency, invoice_number, search_text
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `;

      let importedCount = 0;
      
      for (const row of csvData) {
        try {
          // Parse amount (remove $ and commas)
          const amountStr = row['Reporting Total']?.toString().replace(/[$,\s]/g, '') || '0';
          const amount = parseFloat(amountStr) || 0;
          
          // Parse invoice created date
          const invoiceDate = row['Invoice Created Date'] ? new Date(row['Invoice Created Date']) : null;
          
          // Create search text for full-text search
          const searchText = [
            row['Commodity'],
            row['Description'],
            row['Supplier'],
            row['PO Ship-To City']
          ].filter(Boolean).join(' ');

          await client.query(insertQuery, [
            invoiceDate,
            parseInt(row['Year']) || null,
            parseInt(row['Month']) || null,
            row['Quarter'],
            row['QY'],
            row['Commodity'],
            row['Description'],
            row['Supplier'],
            amount,
            row['PO Ship-To City'],
            row['Chart Of Accounts'],
            row['Accounting Total Currency'],
            row['Invoice #'],
            searchText
          ]);
          
          importedCount++;
          
          if (importedCount % 1000 === 0) {
            console.log(`Imported ${importedCount} Baan records...`);
          }
        } catch (rowError) {
          console.error(`Error importing Baan row ${importedCount + 1}:`, rowError);
          // Continue with next row
        }
      }
      
      await client.query('COMMIT');
      console.log(`Successfully imported ${importedCount} Baan records`);
      return importedCount;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Baan CSV import failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async semanticSearch(query: string, embedding: number[], limit: number = 10, tableName: string = 'financial_data') {
    const client = await this.getClient();
    
    try {
      const searchQuery = `
        SELECT 
          *,
          1 - (combined_text_embedding <=> $1::vector) AS similarity_score
        FROM ${tableName} 
        WHERE combined_text_embedding IS NOT NULL
        ORDER BY combined_text_embedding <=> $1::vector
        LIMIT $2
      `;
      
      const result = await client.query(searchQuery, [JSON.stringify(embedding), limit]);
      return result.rows;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async textSearch(query: string, limit: number = 10, tableName: string = 'financial_data') {
    const client = await this.getClient();
    
    try {
      const searchQuery = `
        SELECT *,
               ts_rank(to_tsvector('english', search_text), plainto_tsquery('english', $1)) as rank
        FROM ${tableName} 
        WHERE to_tsvector('english', search_text) @@ plainto_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2
      `;
      
      const result = await client.query(searchQuery, [query, limit]);
      return result.rows;
    } catch (error) {
      console.error('Text search failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getFinancialSummary(filters: any = {}, tableName: string = 'financial_data') {
    const client = await this.getClient();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (filters.entity) {
        paramCount++;
        whereClause += ` AND hfm_entity ILIKE $${paramCount}`;
        params.push(`%${filters.entity}%`);
      }

      if (filters.costGroup) {
        paramCount++;
        whereClause += ` AND hfm_cost_group ILIKE $${paramCount}`;
        params.push(`%${filters.costGroup}%`);
      }

      if (filters.year) {
        paramCount++;
        whereClause += ` AND fiscal_year_number = $${paramCount}`;
        params.push(filters.year);
      }

      const summaryQuery = `
        SELECT 
          hfm_entity,
          hfm_cost_group,
          COUNT(*) as transaction_count,
          SUM(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as total_amount,
          AVG(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as avg_amount,
          MIN(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as min_amount,
          MAX(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as max_amount
        FROM ${tableName} 
        ${whereClause}
        AND CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2)) > 0
        GROUP BY hfm_entity, hfm_cost_group
        ORDER BY total_amount DESC
        LIMIT 50
      `;
      
      const result = await client.query(summaryQuery, params);
      return result.rows;
    } catch (error) {
      console.error('Financial summary failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async getBaanSummary(filters: any = {}) {
    const client = await this.getClient();
    
    try {
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramCount = 0;

      if (filters.entity) {
        paramCount++;
        whereClause += ` AND supplier ILIKE $${paramCount}`;
        params.push(`%${filters.entity}%`);
      }

      if (filters.costGroup) {
        paramCount++;
        whereClause += ` AND commodity ILIKE $${paramCount}`;
        params.push(`%${filters.costGroup}%`);
      }

      if (filters.year) {
        paramCount++;
        whereClause += ` AND year = $${paramCount}`;
        params.push(filters.year);
      }

      if (filters.quarter) {
        paramCount++;
        whereClause += ` AND quarter = $${paramCount}`;
        params.push(`Q${filters.quarter}`);
      }

      const summaryQuery = `
        SELECT 
          supplier as hfm_entity,
          commodity as hfm_cost_group,
          COUNT(*) as transaction_count,
          SUM(CAST(REPLACE(REPLACE(reporting_total, '$', ''), ',', '') AS DECIMAL(15,2))) as total_amount,
          AVG(CAST(REPLACE(REPLACE(reporting_total, '$', ''), ',', '') AS DECIMAL(15,2))) as avg_amount,
          MIN(CAST(REPLACE(REPLACE(reporting_total, '$', ''), ',', '') AS DECIMAL(15,2))) as min_amount,
          MAX(CAST(REPLACE(REPLACE(reporting_total, '$', ''), ',', '') AS DECIMAL(15,2))) as max_amount
        FROM baanspending 
        ${whereClause}
        AND CAST(REPLACE(REPLACE(reporting_total, '$', ''), ',', '') AS DECIMAL(15,2)) > 0
        GROUP BY supplier, commodity
        ORDER BY total_amount DESC
        LIMIT 50
      `;
      
      const result = await client.query(summaryQuery, params);
      return result.rows;
    } catch (error) {
      console.error('Baan summary failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async close() {
    await pool.end();
  }
}

export default Database;