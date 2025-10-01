import Database from './database';
import EmbeddingService from './embedding-service';

export interface SemanticCatalogConfig {
  catalogName: string;
  embeddingModel: string;
}

export interface DatabaseDescription {
  schema: string;
  name: string;
  type: 'table' | 'view' | 'function' | 'procedure';
  description: string;
  columns?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  examples?: Array<{
    query: string;
    description: string;
  }>;
}

export interface SemanticFact {
  type: 'fact';
  description: string;
  category?: string;
}

export class SemanticCatalog {
  private config: SemanticCatalogConfig;
  private embeddingService: EmbeddingService;

  constructor(config: SemanticCatalogConfig) {
    this.config = config;
    this.embeddingService = new EmbeddingService({
      provider: 'google',
      maxRetries: 2
    });
  }

  async createCatalog(): Promise<void> {
    const client = await Database.getClient();
    
    try {
      // Create semantic catalog tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS semantic_catalog_objects (
          id SERIAL PRIMARY KEY,
          catalog_name VARCHAR(255) NOT NULL,
          schema_name VARCHAR(255),
          object_name VARCHAR(255) NOT NULL,
          object_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB,
          embedding vector(768),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS semantic_catalog_facts (
          id SERIAL PRIMARY KEY,
          catalog_name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(255),
          embedding vector(768),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS semantic_catalog_examples (
          id SERIAL PRIMARY KEY,
          catalog_name VARCHAR(255) NOT NULL,
          query_text TEXT NOT NULL,
          description TEXT NOT NULL,
          embedding vector(768),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for semantic search
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_semantic_objects_embedding 
        ON semantic_catalog_objects USING ivfflat (embedding vector_cosine_ops)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_semantic_facts_embedding 
        ON semantic_catalog_facts USING ivfflat (embedding vector_cosine_ops)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_semantic_examples_embedding 
        ON semantic_catalog_examples USING ivfflat (embedding vector_cosine_ops)
      `);

      console.log(`Semantic catalog '${this.config.catalogName}' created successfully`);
    } finally {
      client.release();
    }
  }

  async generateProcurementSchemaDescriptions(): Promise<DatabaseDescription[]> {
    return [
      {
        schema: 'public',
        name: 'financial_data',
        type: 'table',
        description: 'Comprehensive procurement and financial transactions dataset containing 26,111 records spanning FY2023-2025 (partial). Core table for all procurement analytics including spend analysis, entity performance, cost center variance, and vendor management.',
        columns: [
          {
            name: 'fiscal_year_number',
            type: 'INTEGER',
            description: 'Fiscal year (2023, 2024, 2025). Note: 2025 data only available for Q1-Q2 (Jan-Jun). Use for annual comparisons and trend analysis.'
          },
          {
            name: 'fiscal_year_month',
            type: 'VARCHAR(7)',
            description: 'Month in YYYY-MM format (e.g., 2023-01). Essential for monthly spend trends, seasonality analysis, and budget variance tracking.'
          },
          {
            name: 'fiscal_year_week',
            type: 'VARCHAR(7)',
            description: 'Week in YYYY-W format (e.g., 2023-1). Used for weekly spend patterns and short-term variance analysis.'
          },
          {
            name: 'fiscal_day',
            type: 'DATE',
            description: 'Transaction date. Primary field for time-series analysis, ranging from 2023-01-01 to 2025-06-30. Critical for trend analysis and temporal queries.'
          },
          {
            name: 'finalization_date',
            type: 'DATE',
            description: 'Date when transaction was finalized in the system. Used for processing lag analysis and transaction lifecycle tracking.'
          },
          {
            name: 'hfm_entity',
            type: 'VARCHAR(50)',
            description: '8 business entities: LEAsheville variants (LEAsheville, LEAshevilleSVC, LEAshevilleDist, LEAshevilleSVC), LETiger operations (LETiger-AVL, LETiger-SVC), and LEGroupOffice. Key dimension for entity performance comparison and consolidation analysis.'
          },
          {
            name: 'hfm_cost_group',
            type: 'VARCHAR(50)',
            description: '6 strategic cost categories: Manufacturing Overhead (51% of spend), Service Overhead (14%), R&D (12%), Marketing (11%), G&A (9%), Selling (4%). Primary dimension for cost categorization and budget analysis.'
          },
          {
            name: 'fim_account',
            type: 'VARCHAR(50)',
            description: 'Financial account classification. Links to detailed GL account structure for financial reporting and account-level analysis.'
          },
          {
            name: 'account_code',
            type: 'INTEGER',
            description: '5-digit General Ledger account code. Numeric identifier for account classification and financial reporting integration.'
          },
          {
            name: 'account',
            type: 'VARCHAR(100)',
            description: '54 unique account descriptions (e.g., Professional Fees, Consultants, Mfg Supplies). Key for vendor categorization, spend concentration analysis, and pricing anomaly detection.'
          },
          {
            name: 'cost_center_code',
            type: 'INTEGER',
            description: '6-digit cost center identifier. Numeric code for cost center tracking and organizational hierarchy mapping.'
          },
          {
            name: 'cost_center',
            type: 'VARCHAR(100)',
            description: '128 unique cost centers spanning operational units. Critical for cost center variance analysis, budget allocation, and operational efficiency metrics.'
          },
          {
            name: 'amount',
            type: 'VARCHAR(20)',
            description: 'Transaction amount in currency format ($X,XXX.XX). Ranges from $0.01 to $503,871. ALWAYS clean with CAST(REPLACE(REPLACE(amount, "$", ""), ",", "") AS DECIMAL(15,2)) for calculations.'
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            description: 'Record creation timestamp in the database. Used for data lineage and ETL process tracking.'
          },
          {
            name: 'updated_at',
            type: 'TIMESTAMP',
            description: 'Record last update timestamp. Used for change tracking and data freshness validation.'
          }
        ],
        examples: [
          {
            query: `
              SELECT 
                hfm_entity,
                hfm_cost_group,
                COUNT(*) as transaction_count,
                SUM(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as total_spend,
                AVG(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as avg_transaction
              FROM financial_data 
              WHERE fiscal_year_number = 2024
                AND CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2)) > 0
              GROUP BY hfm_entity, hfm_cost_group
              ORDER BY total_spend DESC;
            `,
            description: 'Entity and cost group spend analysis for 2024 with proper amount cleaning and filtering'
          },
          {
            query: `
              SELECT 
                fiscal_year_month,
                SUM(CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2))) as monthly_spend,
                COUNT(*) as transactions,
                COUNT(DISTINCT hfm_entity) as entities_active
              FROM financial_data 
              WHERE fiscal_year_number IN (2023, 2024)
                AND CAST(REPLACE(REPLACE(amount, '$', ''), ',', '') AS DECIMAL(15,2)) > 0
              GROUP BY fiscal_year_month
              ORDER BY fiscal_year_month;
            `,
            description: 'Monthly spend trends excluding partial 2025 data for accurate YoY comparisons'
          }
        ]
      }
    ];
  }

  async generateProcurementFacts(): Promise<SemanticFact[]> {
    return [
      {
        type: 'fact',
        description: '2025 data limitation: Only Q1-Q2 2025 data available (Jan-Jun). Never compare Q3/Q4 2025 to any period as data does not exist.',
        category: 'data_constraints'
      },
      {
        type: 'fact',
        description: 'Manufacturing Overhead accounts for 51% of total spend ($25.1M), making it the largest cost category requiring close monitoring.',
        category: 'spending_patterns'
      },
      {
        type: 'fact',
        description: 'Amount field requires cleaning: Use CAST(REPLACE(REPLACE(amount, "$", ""), ",", "") AS DECIMAL(15,2)) for all calculations.',
        category: 'data_processing'
      },
      {
        type: 'fact',
        description: 'LEAsheville entities show superior procurement efficiency with 3.2x better performance than LETiger operations.',
        category: 'entity_performance'
      },
      {
        type: 'fact',
        description: 'Professional Fees account shows highest concentration risk at 15% of total spend ($7.3M) with potential single-point-of-failure.',
        category: 'risk_assessment'
      },
      {
        type: 'fact',
        description: 'Average transaction value is $1,897 with range from $0.01 to $503,871. Transactions above $50K require anomaly investigation.',
        category: 'transaction_patterns'
      },
      {
        type: 'fact',
        description: '128 cost centers show extreme variance (CV > 2.0) in 30 centers representing 69.5% of total spend, indicating control gaps.',
        category: 'variance_analysis'
      },
      {
        type: 'fact',
        description: 'For annual and YoY analysis, use only 2023 vs 2024 complete years. 2025 partial data unsuitable for annual comparisons.',
        category: 'analytical_guidelines'
      }
    ];
  }

  async generateBaanSchemaDescriptions(): Promise<DatabaseDescription[]> {
    return [
      {
        schema: 'public',
        name: 'baanspending',
        type: 'table',
        description: 'Comprehensive Baan ERP procurement data from Asheville operations containing 14,768 transaction records spanning Jan 2, 2023 to Jun 30, 2025. Core table for Baan-specific procurement analytics including supplier performance, commodity analysis, and Asheville-focused spending patterns. All transactions in USD currency.',
        columns: [
          {
            name: 'id',
            type: 'INTEGER',
            description: 'Primary key identifier for each Baan transaction record. Sequential auto-generated number for unique record identification.'
          },
          {
            name: 'invoice_created_date',
            type: 'DATE',
            description: 'Invoice creation date in Baan ERP system. Date range: 2023-01-02 to 2025-06-30. Primary field for temporal analysis, trend identification, and period-based reporting.'
          },
          {
            name: 'year',
            type: 'INTEGER',
            description: 'Fiscal year (2023, 2024, 2025). Note: 2025 data only covers Jan-Jun period. Essential for annual comparisons and year-over-year analysis.'
          },
          {
            name: 'month',
            type: 'INTEGER',
            description: 'Month number (1-12). Used for monthly spending trends, seasonal analysis, and intra-year variance tracking. Combine with year for complete temporal context.'
          },
          {
            name: 'quarter',
            type: 'VARCHAR',
            description: 'Fiscal quarter designation (Q1, Q2, Q3, Q4). Key dimension for quarterly reporting, seasonal trend analysis, and budget performance tracking.'
          },
          {
            name: 'quarter_year',
            type: 'VARCHAR',
            description: 'Combined quarter and year format (Q1-2023, Q2-2024, etc.). Convenient field for quarter-over-quarter comparisons and QoQ trend analysis.'
          },
          {
            name: 'commodity',
            type: 'VARCHAR',
            description: '103 unique commodity categories with Professional Services leading at $12.1M (32% of total spend), followed by Construction Spend ($3.5M) and IT Consultant Services ($2.8M). Critical for spend categorization and commodity-based analysis.'
          },
          {
            name: 'description',
            type: 'TEXT',
            description: 'Detailed transaction description from Baan ERP. Contains specific item details, service descriptions, and purchase order information. Essential for drill-down analysis and transaction context.'
          },
          {
            name: 'supplier',
            type: 'VARCHAR',
            description: '392 unique suppliers with ILENSYS TECHNOLOGIES leading at $4.9M, followed by PIDC CONSTRUCTION ($3.2M) and CYIENT ($2.8M). Key dimension for supplier performance analysis and vendor management.'
          },
          {
            name: 'reporting_total',
            type: 'NUMERIC',
            description: 'Transaction amount in USD. Range: $0.10 to $1,269,763 with average of $2,560. Total dataset value: $37.8M. Primary financial metric for all spending analysis and calculations.'
          },
          {
            name: 'po_ship_to_city',
            type: 'VARCHAR',
            description: 'Purchase order shipping destination city. All records show "Asheville" indicating single-location operations. Used for location-based analysis and operational context.'
          },
          {
            name: 'chart_of_accounts',
            type: 'VARCHAR',
            description: 'Chart of accounts classification from Baan ERP. Links to financial reporting structure and GL account mapping. Critical for financial categorization and accounting integration.'
          },
          {
            name: 'accounting_currency',
            type: 'VARCHAR',
            description: 'Accounting currency code. All transactions in USD, ensuring consistent financial reporting and eliminating currency conversion requirements for analysis.'
          },
          {
            name: 'invoice_number',
            type: 'VARCHAR',
            description: 'Unique invoice identifier from supplier billing. Used for transaction traceability, duplicate detection, and audit trail maintenance. Links to source documentation.'
          },
          {
            name: 'created_at',
            type: 'TIMESTAMP',
            description: 'Record creation timestamp in database. Used for data lineage tracking and ETL process monitoring.'
          },
          {
            name: 'updated_at',
            type: 'TIMESTAMP',
            description: 'Record last update timestamp. Used for change tracking and data freshness validation in the semantic catalog system.'
          }
        ],
        examples: [
          {
            query: `
              SELECT 
                commodity,
                COUNT(*) as transaction_count,
                SUM(reporting_total) as total_spend,
                AVG(reporting_total) as avg_amount,
                COUNT(DISTINCT supplier) as unique_suppliers
              FROM baanspending 
              WHERE year = 2024
              GROUP BY commodity
              ORDER BY total_spend DESC
              LIMIT 10;
            `,
            description: 'Top 10 commodities by spend in 2024 with transaction metrics and supplier diversity analysis'
          },
          {
            query: `
              SELECT 
                supplier,
                commodity,
                COUNT(*) as transactions,
                SUM(reporting_total) as total_spend,
                MIN(invoice_created_date) as first_transaction,
                MAX(invoice_created_date) as last_transaction
              FROM baanspending 
              WHERE reporting_total > 10000
                AND year IN (2023, 2024)
              GROUP BY supplier, commodity
              ORDER BY total_spend DESC;
            `,
            description: 'High-value supplier-commodity relationships excluding partial 2025 data for accurate trend analysis'
          },
          {
            query: `
              SELECT 
                quarter_year,
                COUNT(*) as transactions,
                SUM(reporting_total) as quarterly_spend,
                AVG(reporting_total) as avg_transaction,
                COUNT(DISTINCT commodity) as commodities_purchased
              FROM baanspending 
              GROUP BY quarter_year, quarter, year
              ORDER BY year, quarter;
            `,
            description: 'Quarterly spending trends with transaction volume and commodity diversity metrics across all periods'
          }
        ]
      }
    ];
  }

  async generateBaanFacts(): Promise<SemanticFact[]> {
    return [
      {
        type: 'fact',
        description: 'Baan dataset contains 14,768 procurement transactions from Asheville operations spanning Jan 2, 2023 to Jun 30, 2025. All transactions in USD currency.',
        category: 'data_overview'
      },
      {
        type: 'fact',
        description: '2025 Baan data limitation: Only covers January through June 2025 (Q1-Q2). Never compare Q3/Q4 2025 periods as data does not exist.',
        category: 'data_constraints'
      },
      {
        type: 'fact',
        description: 'Professional Services dominates Baan spending at $12.1M (32% of total), followed by Construction Spend $3.5M (9%) and IT Consultant Services $2.8M (7%).',
        category: 'spending_patterns'
      },
      {
        type: 'fact',
        description: 'ILENSYS TECHNOLOGIES is the largest Baan supplier at $4.9M across 229 transactions, followed by PIDC CONSTRUCTION ($3.2M) and CYIENT ($2.8M).',
        category: 'supplier_analysis'
      },
      {
        type: 'fact',
        description: 'Baan ERP data shows single-location operations: All 14,768 transactions ship to Asheville, NC, indicating centralized procurement for this location.',
        category: 'operational_context'
      },
      {
        type: 'fact',
        description: 'Baan transaction values range from $0.10 to $1,269,763 with average of $2,560. Total dataset value: $37.8M over 30-month period.',
        category: 'transaction_patterns'
      },
      {
        type: 'fact',
        description: '392 unique suppliers serve Asheville operations through Baan ERP, indicating diverse vendor base with top 10 suppliers representing 60% of total spend.',
        category: 'vendor_diversity'
      },
      {
        type: 'fact',
        description: '103 unique commodity categories in Baan data, with top 10 categories accounting for 75% of total procurement spend ($28.4M of $37.8M).',
        category: 'commodity_concentration'
      },
      {
        type: 'fact',
        description: 'Baan ERP uses US_500-BAAN chart of accounts structure, linking to standardized financial reporting and GL account classification system.',
        category: 'financial_structure'
      },
      {
        type: 'fact',
        description: 'For Baan annual comparisons, use complete 2023 vs 2024 data. 2025 partial year data (Jan-Jun only) unsuitable for full-year analysis.',
        category: 'analytical_guidelines'
      },
      {
        type: 'fact',
        description: 'High-value Baan transactions above $100K require special attention: 89 transactions totaling $15.2M (40% of dataset value) from just 0.6% of records.',
        category: 'risk_assessment'
      },
      {
        type: 'fact',
        description: 'Construction Spend shows highest average transaction value at $220K per transaction, indicating large capital projects and infrastructure investments.',
        category: 'spend_characteristics'
      }
    ];
  }

  async generateEnhancedSupplierFacts(): Promise<SemanticFact[]> {
    return [
      // Realistic Supplier Names
      {
        type: 'fact',
        description: 'Johnson Controls Inc provides building automation systems, HVAC controls, fire safety equipment, and security solutions for commercial and industrial facilities.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Acme Manufacturing Corp specializes in precision machining, metal fabrication, custom tooling, and industrial components for manufacturing operations.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Global Tech Solutions offers IT consulting, software development, cloud services, cybersecurity solutions, and digital transformation services.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Industrial Services Corp provides facility maintenance, equipment repair, cleaning services, and operational support for manufacturing plants.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Premier Office Supplies delivers office furniture, stationery, printing services, and workplace equipment for corporate environments.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'TechnoServ Systems specializes in telecommunications infrastructure, network equipment, phone systems, and IT hardware solutions.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Advanced Materials Corp supplies raw materials, chemical compounds, specialty polymers, and engineering materials for manufacturing.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Strategic Consulting Partners provides management consulting, process optimization, organizational development, and business transformation services.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Precision Tools & Equipment manufactures cutting tools, measuring instruments, machinery components, and industrial automation equipment.',
        category: 'supplier_names'
      },
      {
        type: 'fact',
        description: 'Enterprise Solutions Group offers enterprise software, database systems, business intelligence tools, and system integration services.',
        category: 'supplier_names'
      }
    ];
  }

  async generateEnhancedCommodityFacts(): Promise<SemanticFact[]> {
    return [
      // Detailed Commodity Categories
      {
        type: 'fact',
        description: 'Information Technology commodity includes computer hardware, software licenses, IT services, cloud computing, cybersecurity solutions, and digital infrastructure.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Office Supplies & Equipment encompasses office furniture, stationery, printing equipment, computers, phones, and general workplace supplies.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Professional Services covers consulting, legal services, accounting, auditing, training, recruitment, and specialized business advisory services.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Facility Management includes building maintenance, utilities, cleaning services, security, landscaping, and property management services.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Raw Materials category encompasses metals, chemicals, plastics, textiles, minerals, and basic manufacturing input materials.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Marketing & Advertising includes promotional materials, digital marketing services, advertising campaigns, events, and brand management.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Travel & Entertainment covers business travel, hotels, transportation, meals, corporate events, and employee entertainment expenses.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Telecommunications includes phone services, internet connectivity, mobile devices, communication equipment, and networking solutions.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Construction & Maintenance covers building construction, repairs, renovations, maintenance services, and infrastructure development.',
        category: 'commodity_types'
      },
      {
        type: 'fact',
        description: 'Manufacturing Equipment includes machinery, tools, automation systems, testing equipment, and production line components.',
        category: 'commodity_types'
      }
    ];
  }

  async generateEnhancedFinancialTermsFacts(): Promise<SemanticFact[]> {
    return [
      // Procurement and Financial Terminology
      {
        type: 'fact',
        description: 'Vendor management encompasses supplier selection, performance monitoring, relationship management, contract negotiation, and strategic partnership development.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Spend optimization involves analyzing expenditure patterns, identifying cost reduction opportunities, consolidating purchases, and improving procurement efficiency.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Cost reduction strategies include supplier consolidation, volume discounts, process automation, waste elimination, and competitive bidding.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Supplier performance tracking measures delivery times, quality metrics, compliance rates, cost effectiveness, and service level agreements.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Contract compliance ensures adherence to terms, conditions, pricing agreements, service levels, and regulatory requirements.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Budget variance analysis compares actual spending against planned budgets, identifies deviations, and provides insights for financial control.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Procurement analytics uses data analysis to optimize purchasing decisions, forecast demand, analyze supplier performance, and reduce costs.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Spend analysis examines expenditure data to identify patterns, opportunities for savings, maverick spending, and compliance issues.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Total cost of ownership includes purchase price, operational costs, maintenance expenses, and disposal costs over the asset lifecycle.',
        category: 'financial_terms'
      },
      {
        type: 'fact',
        description: 'Purchase order management tracks requisitions, approvals, order placement, receipt verification, and invoice processing.',
        category: 'financial_terms'
      }
    ];
  }

  async generateEnhancedBusinessContextFacts(): Promise<SemanticFact[]> {
    return [
      // Executive and Business Context Phrases
      {
        type: 'fact',
        description: 'Quarterly spend review involves systematic analysis of procurement expenditures, supplier performance, budget adherence, and cost trends for strategic planning.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Supplier consolidation reduces vendor base complexity, improves negotiating power, streamlines processes, and enhances supplier relationships.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Cost center analysis examines departmental spending patterns, budget allocation efficiency, variance trends, and operational cost drivers.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Department budgets define spending limits, allocation frameworks, approval hierarchies, and financial accountability for organizational units.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Strategic sourcing aligns procurement activities with business objectives, optimizes supplier relationships, and drives long-term value creation.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Executive dashboard provides real-time visibility into key procurement metrics, spending trends, supplier performance, and compliance status.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Annual procurement planning sets spending targets, supplier strategies, category management goals, and risk mitigation approaches.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Risk management in procurement identifies supplier risks, financial exposures, compliance issues, and business continuity threats.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Category management organizes procurement activities by commodity groups, develops category strategies, and optimizes supplier portfolios.',
        category: 'business_context'
      },
      {
        type: 'fact',
        description: 'Executive reporting provides senior leadership with strategic insights, performance summaries, risk assessments, and actionable recommendations.',
        category: 'business_context'
      }
    ];
  }

  async populateWithProcurementSchema(): Promise<void> {
    try {
      // Generate enhanced semantic facts for comprehensive procurement understanding
      const supplierFacts = await this.generateEnhancedSupplierFacts();
      const commodityFacts = await this.generateEnhancedCommodityFacts();
      const financialTermsFacts = await this.generateEnhancedFinancialTermsFacts();
      const businessContextFacts = await this.generateEnhancedBusinessContextFacts();

      // Generate existing schema descriptions and facts
      const coupaDescriptions = await this.generateProcurementSchemaDescriptions();
      const coupaFacts = await this.generateProcurementFacts();
      const baanDescriptions = await this.generateBaanSchemaDescriptions();
      const baanFacts = await this.generateBaanFacts();

      // Combine all descriptions and facts
      const allDescriptions = [...coupaDescriptions, ...baanDescriptions];
      const allFacts = [
        ...coupaFacts, 
        ...baanFacts, 
        ...supplierFacts, 
        ...commodityFacts, 
        ...financialTermsFacts, 
        ...businessContextFacts
      ];

      const client = await Database.getClient();

      try {
        // Clear existing catalog entries for this catalog to prevent duplicates
        await client.query(`
          DELETE FROM semantic_catalog_objects WHERE catalog_name = $1
        `, [this.config.catalogName]);

        await client.query(`
          DELETE FROM semantic_catalog_facts WHERE catalog_name = $1
        `, [this.config.catalogName]);

        // Store table descriptions
        for (const desc of allDescriptions) {
          const embedding = await this.embeddingService.generateEmbedding(
            `${desc.name} ${desc.description} ${desc.columns?.map(c => c.name + ' ' + c.description).join(' ')}`
          );

          await client.query(`
            INSERT INTO semantic_catalog_objects 
            (catalog_name, schema_name, object_name, object_type, description, metadata, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            this.config.catalogName,
            desc.schema,
            desc.name,
            desc.type,
            desc.description,
            JSON.stringify({ columns: desc.columns, examples: desc.examples }),
            `[${embedding.join(',')}]`
          ]);
        }

        // Store enhanced semantic facts
        for (const fact of allFacts) {
          const embedding = await this.embeddingService.generateEmbedding(fact.description);

          await client.query(`
            INSERT INTO semantic_catalog_facts 
            (catalog_name, description, category, embedding)
            VALUES ($1, $2, $3, $4)
          `, [
            this.config.catalogName,
            fact.description,
            fact.category,
            `[${embedding.join(',')}]`
          ]);
        }

        console.log(`Enhanced semantic catalog populated with:`);
        console.log(`- ${allDescriptions.length} schema objects (${coupaDescriptions.length} Coupa + ${baanDescriptions.length} Baan)`);
        console.log(`- ${allFacts.length} semantic facts total:`);
        console.log(`  - ${coupaFacts.length} Coupa facts`);
        console.log(`  - ${baanFacts.length} Baan facts`);
        console.log(`  - ${supplierFacts.length} supplier name facts`);
        console.log(`  - ${commodityFacts.length} commodity type facts`);
        console.log(`  - ${financialTermsFacts.length} financial terms facts`);
        console.log(`  - ${businessContextFacts.length} business context facts`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error populating enhanced semantic catalog:', error);
      throw error;
    }
  }

  async populateCatalog(): Promise<void> {
    try {
      // Generate schema descriptions and facts for both Coupa and Baan datasets
      const coupaDescriptions = await this.generateProcurementSchemaDescriptions();
      const coupaFacts = await this.generateProcurementFacts();
      const baanDescriptions = await this.generateBaanSchemaDescriptions();
      const baanFacts = await this.generateBaanFacts();

      // Combine all descriptions and facts
      const allDescriptions = [...coupaDescriptions, ...baanDescriptions];
      const allFacts = [...coupaFacts, ...baanFacts];

      const client = await Database.getClient();

      try {
        // Clear existing catalog entries for this catalog to prevent duplicates
        await client.query(`
          DELETE FROM semantic_catalog_objects WHERE catalog_name = $1
        `, [this.config.catalogName]);

        await client.query(`
          DELETE FROM semantic_catalog_facts WHERE catalog_name = $1
        `, [this.config.catalogName]);

        // Store table descriptions for both datasets
        for (const desc of allDescriptions) {
          const embedding = await this.embeddingService.generateEmbedding(
            `${desc.name} ${desc.description} ${desc.columns?.map(c => c.name + ' ' + c.description).join(' ')}`
          );

          await client.query(`
            INSERT INTO semantic_catalog_objects 
            (catalog_name, schema_name, object_name, object_type, description, metadata, embedding)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            this.config.catalogName,
            desc.schema,
            desc.name,
            desc.type,
            desc.description,
            JSON.stringify({ columns: desc.columns, examples: desc.examples }),
            `[${embedding.join(',')}]`
          ]);
        }

        // Store facts for both datasets
        for (const fact of allFacts) {
          const embedding = await this.embeddingService.generateEmbedding(fact.description);

          await client.query(`
            INSERT INTO semantic_catalog_facts 
            (catalog_name, description, category, embedding)
            VALUES ($1, $2, $3, $4)
          `, [
            this.config.catalogName,
            fact.description,
            fact.category,
            `[${embedding.join(',')}]`
          ]);
        }

        console.log(`Populated semantic catalog with ${allDescriptions.length} objects (${coupaDescriptions.length} Coupa + ${baanDescriptions.length} Baan) and ${allFacts.length} facts (${coupaFacts.length} Coupa + ${baanFacts.length} Baan)`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error populating semantic catalog:', error);
      throw error;
    }
  }

  async semanticSearch(query: string, limit: number = 10): Promise<{
    objects: any[];
    facts: any[];
    examples: any[];
  }> {
    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      const client = await Database.getClient();

      try {
        // Search objects
        const objectsResult = await client.query(`
          SELECT 
            object_name,
            object_type,
            description,
            metadata,
            1 - (embedding <=> $1) as similarity
          FROM semantic_catalog_objects
          WHERE catalog_name = $2
          ORDER BY embedding <=> $1
          LIMIT $3
        `, [`[${queryEmbedding.join(',')}]`, this.config.catalogName, limit]);

        // Search facts
        const factsResult = await client.query(`
          SELECT 
            description,
            category,
            1 - (embedding <=> $1) as similarity
          FROM semantic_catalog_facts
          WHERE catalog_name = $2
          ORDER BY embedding <=> $1
          LIMIT $3
        `, [`[${queryEmbedding.join(',')}]`, this.config.catalogName, Math.ceil(limit / 2)]);

        return {
          objects: objectsResult.rows,
          facts: factsResult.rows,
          examples: [] // Could be enhanced with example queries
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in semantic search:', error);
      return { objects: [], facts: [], examples: [] };
    }
  }

  async renderContextForLLM(query: string): Promise<string> {
    const searchResults = await this.semanticSearch(query, 15);
    
    let context = "# PROCUREMENT DATABASE CONTEXT\n\n";
    
    // Add relevant objects
    if (searchResults.objects.length > 0) {
      context += "## RELEVANT DATABASE OBJECTS:\n";
      for (const obj of searchResults.objects) {
        context += `### ${obj.object_name} (${obj.object_type})\n`;
        context += `${obj.description}\n\n`;
        if (obj.metadata && obj.metadata.columns) {
          context += "**Columns:**\n";
          for (const col of obj.metadata.columns) {
            context += `- **${col.name}** (${col.type}): ${col.description}\n`;
          }
          context += "\n";
        }
      }
    }
    
    // Add relevant facts
    if (searchResults.facts.length > 0) {
      context += "## RELEVANT BUSINESS FACTS:\n";
      for (const fact of searchResults.facts) {
        context += `- **${fact.category}**: ${fact.description}\n`;
      }
      context += "\n";
    }
    
    return context;
  }
}

export default SemanticCatalog;