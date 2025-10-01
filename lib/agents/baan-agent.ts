// Specialized Baan Procurement Data Analysis Agent
import { GoogleGenAI } from '@google/genai'
import Database from '@/lib/database'
import { categorizeQuery, formatStructuredReport, type StructuredReportData } from '@/lib/report-templates'
import { ReportVerificationService } from '@/lib/verification/report-verification'
import { SQLFallbackService, type FallbackResult } from '@/lib/sql/sql-fallback-service'
import { validationIntegration, ValidationContext } from '@/lib/validation/validation-integration'
import { EnhancedCurrencyParser } from '@/lib/validation/currency-parser'
import { ReactiveErrorHandler } from '@/lib/agents/reactive-error-handler'
import { BaanAgentState } from '@/lib/types'

export class BaanProcurementAgent {
  private ai: GoogleGenAI
  private errorHandler: ReactiveErrorHandler

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
    this.errorHandler = new ReactiveErrorHandler()
  }

  async analyze(query: string): Promise<BaanAgentState> {
    const state: BaanAgentState = {
      messages: [{ role: 'user', content: query }],
      currentQuery: query
    }

    return this.executeWorkflow(state)
  }

  private async executeWorkflow(state: BaanAgentState): Promise<BaanAgentState> {
    try {
      // Generate thinking process first
      const thinkingState = await this.generateThinkingProcess(state)
      
      const processedState = await this.processProcurementQuery({ ...state, ...thinkingState })
      if (processedState.error) return { ...state, ...thinkingState, ...processedState }

      const sqlState = await this.generateBaanSQL({ ...state, ...thinkingState, ...processedState })
      if (sqlState.error) return { ...state, ...thinkingState, ...processedState, ...sqlState }

      const executionState = await this.executeSQL({ ...state, ...thinkingState, ...processedState, ...sqlState })
      if (executionState.error) return { ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState }

      const insightsState = await this.generateProcurementInsights({ ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState })
      const finalState = await this.formatProcurementResponse({ ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState, ...insightsState })
      
      return { ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState, ...insightsState, ...finalState }
    } catch (error) {
      console.error('Baan workflow execution error:', error)
      return {
        ...state,
        error: `Baan analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async generateThinkingProcess(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    try {
      const thinkingPrompt = `
BAAN PROCUREMENT INTELLIGENCE - ANALYTICAL REASONING TRACE

Generate a professional 5-step analytical reasoning process for this Baan procurement query:

Query: "${state.currentQuery}"

**STRUCTURED ANALYTICAL FRAMEWORK**: Create exactly 5 executive-level thinking steps:

**1. BUSINESS CONTEXT ANALYSIS**
Identify the specific procurement business question and its strategic importance to CPO-level decision making

**2. DATA SOURCE STRATEGY**
Determine which Baan ERP supplier data, commodity categories, and procurement dimensions will provide the most relevant insights

**3. ANALYTICAL APPROACH**
Define the analytical methodology and key procurement metrics needed to answer the business question

**4. EXPECTED PROCUREMENT INSIGHTS**
Anticipate what critical supplier patterns, spend optimization opportunities, or performance indicators should emerge from the analysis

**5. EXECUTIVE VALUE PROPOSITION**
Articulate how these findings will directly support strategic procurement decisions and business value creation

**FORMAT REQUIREMENTS**:
- Use professional executive language
- Focus on business value and procurement impact
- Include specific Baan platform context
- Emphasize strategic sourcing decision-making value
- Format as clear, numbered sections with descriptive headers`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: thinkingPrompt
      })

      const thinkingProcess = response.text || ''
      return { thinkingProcess }
    } catch (error) {
      console.error('Baan thinking process generation error:', error)
      return { 
        thinkingProcess: `**1. BUSINESS CONTEXT ANALYSIS**
Analyzing Baan procurement query to identify specific CPO-level insights needed for strategic sourcing decision-making

**2. DATA SOURCE STRATEGY**
Mapping query requirements to Baan ERP supplier data, commodity categories, and procurement dimensions for comprehensive analysis

**3. ANALYTICAL APPROACH**
Designing analytical methodology to extract key procurement metrics and supplier performance indicators from Baan platform

**4. EXPECTED PROCUREMENT INSIGHTS**
Anticipating critical supplier patterns, spend optimization opportunities, and performance metrics that will emerge from analysis

**5. EXECUTIVE VALUE PROPOSITION**
Structuring findings to support strategic procurement decisions with quantified business impact and actionable sourcing recommendations` 
      }
    }
  }

  private async processProcurementQuery(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    try {
      const analysisPrompt = `
BAAN PROCUREMENT INTELLIGENCE CENTER - EXECUTIVE REPORTING SYSTEM

You are an elite procurement intelligence analyst providing executive insights for Baan ERP procurement optimization.

🚨 CRITICAL RESPONSE REQUIREMENTS:
- NEVER include SQL code, database queries, or technical details in your response
- ONLY provide professional business insights and executive procurement recommendations
- Focus on strategic sourcing, supplier optimization, and procurement value creation
- ONLY analyze data that exists in our Baan procurement database

PROCUREMENT ANALYSIS CONTEXT:
- Query: ${state.currentQuery}
- Platform: Baan ERP Procurement Management System
- Target Audience: CPO, Procurement Directors, Strategic Sourcing Leaders
- Data Scope: 392 suppliers, 14,768 transactions, $37.8M spend, Asheville operations focus

STRUCTURED BUSINESS RESPONSE FORMAT:

**EXECUTIVE PROCUREMENT SUMMARY**
[2-3 sentences summarizing key procurement findings with specific spend amounts and strategic impact]

**CRITICAL PROCUREMENT METRICS**
- Total Spend Impact: [Specific dollar amount or percentage]
- Supplier Performance: [Key supplier metrics and concentration risk]
- Cost Optimization: [Savings opportunities identified]
- Process Efficiency: [Procurement cycle improvements]

**STRATEGIC PROCUREMENT INSIGHTS**
1. [Most significant procurement finding with quantified impact]
2. [Supplier performance benchmark with specific metrics]
3. [Category optimization opportunity with savings potential]
4. [Process improvement with expected efficiency gains]

**EXECUTIVE RECOMMENDATIONS**
• Immediate Action: [Specific procurement action with expected outcome]
• Strategic Initiative: [Sourcing strategy with ROI projection]
• Long-term Optimization: [Supplier relationship improvement opportunity]

DATA INSUFFICIENCY PROTOCOL:
If insufficient data exists, state: "⚠️ INSUFFICIENT DATA: The requested analysis requires [specific missing data] which is not available in our current Baan procurement dataset."

EXAMPLE BUSINESS RESPONSE:
"Analysis of Baan procurement data reveals $37.8M total spend across 392 suppliers with 23% concentration in top 5 suppliers, indicating balanced supplier diversification. Manufacturing category shows 18% cost reduction opportunity through contract consolidation. Asheville operations demonstrate 95% on-time delivery performance with potential for 2-day cycle time improvement."

Provide ONLY professional business analysis focused on procurement outcomes and strategic value:`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisPrompt
      })

      // Ensure clean business response with no SQL code
      let businessResponse = response.text || "Baan procurement analysis completed."
      
      // Remove any potential SQL code blocks if they somehow appear
      businessResponse = businessResponse.replace(/```sql[\s\S]*?```/gi, '')
                                      .replace(/```[\s\S]*?```/gi, '')
                                      .replace(/SELECT[\s\S]*?;/gi, '')
                                      .replace(/FROM\s+\w+/gi, '')
                                      .replace(/WHERE[\s\S]*?GROUP/gi, 'GROUP')
                                      .trim()

      return {
        response: businessResponse
      }
    } catch (error) {
      console.error('Baan query processing error:', error)
      return { error: `Failed to process Baan procurement query: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private async generateBaanSQL(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    try {
      const sqlPrompt = `
BAAN ERP PROCUREMENT SQL GENERATION - EXPERT CPO DATABASE ANALYST

Generate strategic, business-intelligent PostgreSQL for comprehensive Baan baanspending analysis with CPO-level procurement reporting excellence.

🏗️ **COMPLETE TABLE SCHEMA (baanspending) - Enhanced Procurement Business Context:**

**Temporal Procurement Dimensions (Spend Timing & Seasonality):**
- invoice_created_date DATE - Invoice processing date for cash flow and payment cycle analysis
- year INTEGER [2023-2025] - Primary year dimension for YoY procurement performance comparisons
- month INTEGER [1-12] - Monthly granularity for seasonal procurement pattern analysis
- quarter VARCHAR(5) ['Q1'-'Q4'] - Quarterly aggregation for strategic sourcing planning
- quarter_year VARCHAR(10) ['2024-Q1'] - Combined period identifier for trend analysis

**Procurement Category Management (Strategic Sourcing):**
- commodity VARCHAR(200) - Strategic commodity categories for spend consolidation
  • High-Value Categories: Manufacturing Materials, Technology, Professional Services
  • Recurring Categories: Maintenance & Repair, Office Supplies, Facilities
  • Strategic Categories: Raw Materials, Specialized Equipment, R&D Materials
- description TEXT - Detailed line item descriptions for granular spend analysis

**Supplier Relationship Management (Vendor Performance & Risk):**
- supplier VARCHAR(300) - Vendor names for supplier performance and concentration analysis  
  • Critical Suppliers: >$100K annual spend requiring strategic management
  • Preferred Suppliers: Negotiated contract terms and volume commitments
  • Tail Spend Suppliers: <$10K annual spend candidates for consolidation
  • Risk Assessment: Geographic concentration, single-source dependencies

**Financial Procurement Values:**
- reporting_total DECIMAL(15,2) - Invoice amount in USD (validated, ready for spend analysis)
- accounting_currency VARCHAR(10) - Currency code for multi-currency operations
- chart_of_accounts VARCHAR(50) - GL account mapping for procurement category alignment

**Operational Procurement Dimensions:**
- po_ship_to_city VARCHAR(100) - Delivery location for logistics and regional spend analysis
  • "Asheville" = Primary manufacturing facility (majority of spend)
  • Regional locations = Branch operations and remote facilities
- invoice_number VARCHAR(100) - Unique invoice identifier for duplicate detection and audit trails

**PROCUREMENT DATA LANDSCAPE & INTELLIGENCE:**
- 2025: Q1-Q2 data ONLY (Jan-Jun) - Strategic sourcing focus period
- 2024: Complete 12-month procurement cycle for baseline comparisons
- 2023: Historical benchmark data for multi-year supplier performance trends
- **Total Procurement Volume:** 392 active suppliers, 14,768 transactions, $37.8M total addressable spend
- **Supplier Concentration:** Top 20 suppliers likely represent 80% of spend (Pareto analysis)
- **Average Transaction:** ~$2,560 per invoice ($37.8M ÷ 14,768 transactions)

**CRITICAL SQL REQUIREMENTS & PROCUREMENT BEST PRACTICES:**

1. **Spend Calculations:** Use reporting_total directly (pre-validated DECIMAL) - optimized for financial accuracy
2. **2025 Data Filtering:** MANDATORY constraint for current analysis:
   year = 2025 AND month IN (1,2,3,4,5,6)
3. **Supplier Grouping:** Always include proper GROUP BY with business-relevant ORDER BY (DESC by spend)
4. **Executive Result Sets:** Limit to strategic insights (TOP 10-20 for supplier analysis, TOP 50 for commodity deep-dive)
5. **Data Quality Assurance:** Include IS NOT NULL checks and spend thresholds (>$1,000) to focus on material transactions

**CPO-LEVEL PROCUREMENT ANALYSIS PATTERNS:**

**Supplier Spend Concentration & Risk Analysis:**
\`\`\`sql
-- Top supplier dependency and spend concentration
SELECT 
  supplier,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT invoice_number) as unique_invoices,
  SUM(reporting_total) as total_spend,
  AVG(reporting_total) as avg_transaction_size,
  SUM(reporting_total) / (SELECT SUM(reporting_total) FROM baanspending WHERE year = 2025) * 100 as spend_concentration_pct,
  COUNT(DISTINCT commodity) as categories_sourced
FROM baanspending 
WHERE year = 2025 AND reporting_total > 0
GROUP BY supplier
HAVING SUM(reporting_total) > 5000  -- Focus on suppliers >$5K for strategic relevance
ORDER BY total_spend DESC;
\`\`\`

**Strategic Commodity Category Performance:**
\`\`\`sql
-- Commodity spend distribution and sourcing efficiency
SELECT 
  commodity,
  COUNT(DISTINCT supplier) as supplier_count,
  SUM(reporting_total) as category_spend,
  AVG(reporting_total) as avg_transaction_value,
  MIN(reporting_total) as min_transaction,
  MAX(reporting_total) as max_transaction,
  SUM(reporting_total) / (SELECT SUM(reporting_total) FROM baanspending WHERE year = 2025) * 100 as category_percentage
FROM baanspending 
WHERE year = 2025 AND commodity IS NOT NULL
GROUP BY commodity
ORDER BY category_spend DESC;
\`\`\`

**Procurement Seasonality & Cash Flow Analysis:**
\`\`\`sql
-- Monthly spend patterns for budget forecasting
SELECT 
  month,
  quarter,
  COUNT(*) as transactions,
  COUNT(DISTINCT supplier) as active_suppliers,
  SUM(reporting_total) as monthly_spend,
  AVG(reporting_total) as avg_transaction,
  SUM(reporting_total) / LAG(SUM(reporting_total)) OVER (ORDER BY month) - 1 as month_over_month_change
FROM baanspending 
WHERE year = 2025
GROUP BY month, quarter
ORDER BY month;
\`\`\`

**Location-Based Procurement Efficiency:**
\`\`\`sql
-- Regional procurement spend and supplier distribution
SELECT 
  po_ship_to_city,
  COUNT(DISTINCT supplier) as suppliers_used,
  SUM(reporting_total) as location_spend,
  COUNT(*) as transaction_volume,
  SUM(reporting_total) / COUNT(*) as avg_cost_per_transaction
FROM baanspending 
WHERE year = 2025 AND po_ship_to_city IS NOT NULL
GROUP BY po_ship_to_city
ORDER BY location_spend DESC;
\`\`\`

**Invoice Processing & Duplicate Detection:**
\`\`\`sql
-- Payment processing efficiency and audit controls
SELECT 
  supplier,
  COUNT(DISTINCT invoice_number) as unique_invoices,
  COUNT(*) as total_line_items,
  SUM(reporting_total) as total_invoiced,
  COUNT(*) / COUNT(DISTINCT invoice_number) as avg_lines_per_invoice,
  MAX(invoice_created_date) as latest_invoice,
  MIN(invoice_created_date) as earliest_invoice
FROM baanspending 
WHERE year = 2025
GROUP BY supplier
HAVING COUNT(DISTINCT invoice_number) > 5  -- Focus on suppliers with regular activity
ORDER BY total_invoiced DESC;
\`\`\`

🎯 **STRATEGIC PROCUREMENT REPORTING PRIORITIES:**

1. **Supplier Concentration Risk:** Identify suppliers representing >10% of total spend (single-source dependencies)
2. **Category Optimization:** Analyze commodity spend for consolidation and negotiation opportunities  
3. **Seasonal Procurement Planning:** Q1-Q2 run-rate projections for annual budget planning
4. **Geographic Spend Efficiency:** Asheville vs other locations for supply chain optimization
5. **Tail Spend Management:** Identify suppliers <$10K for potential consolidation or elimination

🚨 **PROCUREMENT DATA QUALITY & VALIDATION:**
- Always verify supplier name consistency (address variations in supplier naming)
- Include percentage calculations to show strategic importance and concentration
- Filter out $0 invoices unless specifically analyzing reversals or credits
- Focus on material spend thresholds (>$1,000) for strategic relevance
- Validate date ranges to ensure data completeness and avoid skewed seasonal analysis

🔍 **CRITICAL BUSINESS INTELLIGENCE FOCUS:**
- **80/20 Rule Application:** Identify top 20% suppliers driving 80% of spend
- **Supply Chain Risk:** Flag single-source suppliers in critical categories
- **Cost Avoidance Opportunities:** Identify fragmented spend suitable for consolidation
- **Payment Terms Optimization:** Analyze invoice timing for cash flow management
- **Compliance Monitoring:** Ensure spending aligns with procurement policies and contract terms

Query Context: "${state.currentQuery}"

Generate production-ready SQL with CPO-level procurement intelligence, focusing on supplier relationship management, category optimization, and strategic sourcing decision support:`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: sqlPrompt
      })

      const sqlText = this.extractSQL(response.text || '')
      return {
        sqlQuery: sqlText
      }
    } catch (error) {
      console.error('Baan SQL generation error:', error)
      return { error: `Failed to generate Baan SQL: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private async executeSQL(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    if (!state.sqlQuery) {
      return { error: 'No SQL query to execute' }
    }

    try {
      // Route to Baan data (baanspending table)
      const routedQuery = state.sqlQuery.replace(/\b(FROM|JOIN)\s+(\w+)/gi, (match, keyword, table) => {
        if (table.toLowerCase() === 'baan' || table.toLowerCase() === 'procurement') {
          return `${keyword} baanspending`
        }
        return match
      })

      const results = await Database.query(routedQuery)
      const rawResults = results.rows || []

      // CRITICAL: Apply reactive validation to fix "$0.0M" calculation errors
      const validationContext: ValidationContext = {
        endpoint: 'baan_sql_execution',
        dataSource: 'baan',
        operationType: 'query',
        financialFields: this.extractFinancialFields(rawResults),
        expectedRanges: {
          reporting_total: { min: -500000, max: 10000000 },
          total_amount: { min: 0, max: 50000000 }
        }
      }

      // Validate and correct the SQL results
      const validationResult = await validationIntegration.validateFinancialApiResponse(
        rawResults,
        validationContext,
        routedQuery
      )

      // Apply reactive error handling for critical calculation errors
      if (!validationResult.isValid || validationResult.confidence < 0.8) {
        console.log('🚨 CRITICAL: Baan validation detected calculation errors - applying reactive correction')
        
        const errorHandlingResult = await this.errorHandler.handleFinancialDataErrors(rawResults, {
          dataSource: 'baan',
          operation: 'sql_query',
          userQuery: state.currentQuery || '',
          businessContext: 'procurement_analysis',
          expectedResultType: 'currency',
          criticalFields: validationContext.financialFields
        })

        if (errorHandlingResult.success && errorHandlingResult.confidence > 0.7) {
          console.log('✅ CORRECTION: Baan reactive error handler fixed calculation errors')
          return {
            queryResults: errorHandlingResult.correctedData,
            evidence: Array.isArray(errorHandlingResult.correctedData) 
              ? errorHandlingResult.correctedData.slice(0, 10)
              : [errorHandlingResult.correctedData],
            validationApplied: true,
            validationConfidence: validationResult.confidence,
            correctionsApplied: errorHandlingResult.corrections.length,
            validationWarnings: validationResult.apiValidationResult.warnings.length > 0 
              ? validationResult.apiValidationResult.warnings.map(w => w.message) 
              : []
          }
        }
      }

      // Use corrected data if validation was successful
      const finalResults = validationResult.isValid && validationResult.confidence > 0.8
        ? validationResult.validatedData
        : rawResults

      // Additional currency parsing validation for critical financial fields
      const parsedResults = this.applyCurrencyValidation(finalResults)

      return {
        queryResults: parsedResults,
        evidence: parsedResults.slice(0, 10),
        validationApplied: true,
        validationConfidence: validationResult.confidence,
        correctionsApplied: validationResult.corrections.length,
        validationWarnings: validationResult.apiValidationResult.warnings.length > 0 
          ? validationResult.apiValidationResult.warnings.map(w => w.message) 
          : []
      }
    } catch (error) {
      console.error('Baan SQL execution error:', error)
      
      // Use comprehensive fallback service with progressive retry strategies
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCategory = SQLFallbackService.categorizeError(errorMessage)
      console.log(`Baan SQL error category: ${errorCategory} - ${SQLFallbackService.getErrorDescription(errorCategory)}`)

      // Progressive fallback attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Baan fallback attempt ${attempt}/3...`)
        
        const fallbackResult = await SQLFallbackService.executeWithFallbacks({
          dataSource: 'baan',
          originalQuery: state.sqlQuery,
          userQuery: state.currentQuery,
          errorMessage,
          attemptNumber: attempt
        })

        if (fallbackResult.success) {
          console.log(`Baan fallback successful (${fallbackResult.fallbackType}) with ${fallbackResult.results?.length} results`)
          return {
            queryResults: fallbackResult.results || [],
            evidence: fallbackResult.evidence || [],
            fallbackUsed: `${fallbackResult.fallbackType} (attempt ${attempt})`
          }
        }

        console.log(`Baan fallback attempt ${attempt} failed: ${fallbackResult.error}`)
      }
      
      return { 
        error: `Baan SQL execution failed after all fallback attempts: ${errorMessage}`,
        fallbackUsed: 'all_attempts_failed'
      }
    }
  }

  /**
   * Extract financial fields from query results for validation
   */
  private extractFinancialFields(results: any[]): string[] {
    if (!results || results.length === 0) return ['reporting_total']
    
    const firstRow = results[0]
    const financialFields = Object.keys(firstRow).filter(key => 
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('spend') ||
      key.toLowerCase().includes('cost') ||
      key.toLowerCase().includes('value') ||
      key.toLowerCase().includes('reporting')
    )
    
    return financialFields.length > 0 ? financialFields : ['reporting_total']
  }

  /**
   * Apply currency validation and parsing to fix calculation errors
   */
  private applyCurrencyValidation(results: any[]): any[] {
    if (!results || results.length === 0) return results

    return results.map(row => {
      const correctedRow = { ...row }
      
      // Check each field for currency-related issues
      for (const [key, value] of Object.entries(row)) {
        if (this.isFinancialField(key) && value != null) {
          const parseResult = EnhancedCurrencyParser.parse(value)
          
          // Fix critical "$0.0M" calculation errors
          if (parseResult.isValid && parseResult.value !== value) {
            console.log(`🔧 BAAN CURRENCY FIX: ${key} corrected from "${value}" to ${parseResult.value}`)
            correctedRow[key] = parseResult.value
          }
          
          // Handle zero values that should likely be non-zero
          if (parseResult.value === 0 && typeof value === 'string' && value.includes('$')) {
            console.log(`⚠️ BAAN ZERO VALUE WARNING: ${key} shows "$0" but may need recalculation`)
          }
        }
      }
      
      return correctedRow
    })
  }

  /**
   * Check if a field is financial/currency related
   */
  private isFinancialField(fieldName: string): boolean {
    const financialKeywords = ['reporting_total', 'total', 'spend', 'cost', 'value', 'sum', 'avg', 'amount']
    return financialKeywords.some(keyword => fieldName.toLowerCase().includes(keyword))
  }

  private async generateProcurementInsights(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    if (!state.queryResults || state.queryResults.length === 0) {
      return { insights: ['No procurement data available for analysis'] }
    }

    try {
      const insightsPrompt = `
You are a procurement executive advisor analyzing Baan ERP data. Generate professional business insights in clean bullet point format.

DATA ANALYSIS:
Query: ${state.currentQuery}
Records: ${state.queryResults.length}
Sample: ${JSON.stringify(state.queryResults.slice(0, 3))}

GENERATE 4-6 EXECUTIVE INSIGHTS using this exact format:

• **Spend Analysis**: [Dollar amount and percentage] - [Key finding with procurement impact]
• **Supplier Risk**: [Concentration or dependency metric] - [Risk mitigation action needed]
• **Cost Opportunity**: [Savings potential with percentage] - [Strategic sourcing recommendation]
• **Process Efficiency**: [Cycle time or approval finding] - [Operational improvement needed]
• **Strategic Sourcing**: [Category or supplier insight] - [Competitive advantage opportunity]
• **Compliance Review**: [Policy or contract finding] - [Required governance action]

REQUIREMENTS:
- Start each bullet with quantified metrics ($ amounts, percentages, transaction counts)
- Include specific supplier names, categories, or purchase codes when available
- Focus on actionable procurement decisions, not data descriptions
- Use executive language for C-suite consumption
- Each insight should be one concise, powerful sentence
- NEVER include section headers or numbering - only bullet points

Example format:
• **Spend Analysis**: $4.2M concentrated across 12 suppliers represents 67% of total procurement and creates supplier dependency risk requiring diversification strategy.`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: insightsPrompt
      })

      const insights = this.parseInsights(response.text || '')
      return { insights }
    } catch (error) {
      console.error('Baan insights generation error:', error)
      return { insights: ['Failed to generate procurement insights'] }
    }
  }

  private async formatProcurementResponse(state: BaanAgentState): Promise<Partial<BaanAgentState>> {
    try {
      const totalAmount = state.queryResults?.reduce((sum, row) => {
        const amount = parseFloat(row.reporting_total || row.total_amount || 0)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0) || 0

      const recordCount = state.queryResults?.length || 0
      const uniqueSuppliers = new Set(state.queryResults?.map(row => row.supplier).filter(Boolean)).size || 0
      const avgSpendPerSupplier = uniqueSuppliers > 0 ? (totalAmount / uniqueSuppliers) : 0
      
      // Categorize the query and create structured report
      const category = categorizeQuery(state.currentQuery)
      
      const reportData: StructuredReportData = {
        category,
        title: `${category.replace('_', ' ').toUpperCase()} REPORT`,
        executiveSummary: `Analysis of Baan procurement data reveals ${recordCount.toLocaleString()} transactions across ${uniqueSuppliers.toLocaleString()} suppliers, representing $${(totalAmount / 1000000).toFixed(1)}M in total procurement spend.`,
        keyMetrics: [
          {
            label: 'Total Spend',
            value: `$${(totalAmount / 1000000).toFixed(1)}M`,
            trend: recordCount > 0 ? 'Current Period' : 'No Data',
            significance: 'high'
          },
          {
            label: 'Active Suppliers',
            value: uniqueSuppliers.toLocaleString(),
            significance: 'medium'
          },
          {
            label: 'Transaction Volume',
            value: recordCount.toLocaleString(),
            significance: 'medium'
          },
          {
            label: 'Average Supplier Spend',
            value: `$${(avgSpendPerSupplier / 1000).toFixed(0)}K`,
            significance: 'low'
          }
        ],
        insights: state.insights || ['Procurement analysis completed successfully'],
        recommendations: [
          {
            priority: 'immediate',
            action: 'Supplier Consolidation Strategy',
            impact: `Target top ${Math.min(10, Math.ceil(uniqueSuppliers * 0.2))} suppliers representing ${uniqueSuppliers > 0 ? ((Math.min(10, Math.ceil(uniqueSuppliers * 0.2)) / uniqueSuppliers) * 100).toFixed(1) : '0'}% of supplier base`
          },
          {
            priority: 'short_term',
            action: 'Contract Optimization',
            impact: `Negotiate volume discounts for suppliers exceeding $${(avgSpendPerSupplier * 1.5).toLocaleString()} in annual spend`
          },
          {
            priority: 'long_term',
            action: 'Risk Management Framework',
            impact: `Address spend concentration with current average of $${(avgSpendPerSupplier / 1000).toFixed(0)}K per supplier`
          }
        ],
        dataContext: {
          period: new Date().toLocaleDateString(),
          recordCount,
          dataSource: 'Baan ERP Procurement Platform',
          limitations: recordCount === 0 ? ['No data available for the specified criteria'] : undefined
        }
      }

      // Add verification layer to validate report quality and accuracy
      const verificationService = new ReportVerificationService()
      const verificationResult = await verificationService.verifyReport(
        reportData,
        state.currentQuery,
        state.queryResults || []
      )

      // Log verification results for monitoring (could be removed in production)
      if (verificationResult.issues.length > 0) {
        console.log('Baan report verification found issues:', verificationResult.issues)
      }

      const formattedResponse = formatStructuredReport(reportData)
      return { 
        response: formattedResponse,
        verificationNotes: verificationResult.verificationNotes
      }
    } catch (error) {
      console.error('Baan response formatting error:', error)
      return { error: `Failed to format Baan response: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private extractSQL(text: string): string {
    const sqlMatch = text.match(/```sql\n?([\s\S]*?)\n?```/) || text.match(/```\n?(SELECT[\s\S]*?)\n?```/)
    if (sqlMatch) {
      return sqlMatch[1].trim()
    }
    
    // Look for SELECT statements
    const selectMatch = text.match(/(SELECT[\s\S]*?;?)$/im)
    if (selectMatch) {
      return selectMatch[1].trim()
    }
    
    return text.trim()
  }

  private parseInsights(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim())
    const insights: string[] = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.match(/^[•\-\*\d\.]/)) {
        insights.push(trimmed.replace(/^[•\-\*\d\.\s]+/, ''))
      }
    }
    
    return insights.length > 0 ? insights : [text.trim()]
  }
}