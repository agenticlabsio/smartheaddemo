// Specialized Coupa Financial Data Analysis Agent
import { GoogleGenAI } from '@google/genai'
import Database from '@/lib/database'
import { categorizeQuery, formatStructuredReport, type StructuredReportData } from '@/lib/report-templates'
import { ReportVerificationService } from '@/lib/verification/report-verification'
import { SQLFallbackService, type FallbackResult } from '@/lib/sql/sql-fallback-service'
import { validationIntegration, ValidationContext } from '@/lib/validation/validation-integration'
import { EnhancedCurrencyParser } from '@/lib/validation/currency-parser'
import { ReactiveErrorHandler } from '@/lib/agents/reactive-error-handler'
import { CoupaAgentState } from '@/lib/types'

export class CoupaFinancialAgent {
  private ai: GoogleGenAI
  private errorHandler: ReactiveErrorHandler

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
    this.errorHandler = new ReactiveErrorHandler()
  }

  async analyze(query: string): Promise<CoupaAgentState> {
    const state: CoupaAgentState = {
      messages: [{ role: 'user', content: query }],
      currentQuery: query
    }

    return this.executeWorkflow(state)
  }

  private async executeWorkflow(state: CoupaAgentState): Promise<CoupaAgentState> {
    try {
      // Generate thinking process first
      const thinkingState = await this.generateThinkingProcess(state)
      
      const processedState = await this.processFinancialQuery({ ...state, ...thinkingState })
      if (processedState.error) return { ...state, ...thinkingState, ...processedState }

      const sqlState = await this.generateCoupaSQL({ ...state, ...thinkingState, ...processedState })
      if (sqlState.error) return { ...state, ...thinkingState, ...processedState, ...sqlState }

      const executionState = await this.executeSQL({ ...state, ...thinkingState, ...processedState, ...sqlState })
      if (executionState.error) return { ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState }

      const insightsState = await this.generateFinancialInsights({ ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState })
      const finalState = await this.formatFinancialResponse({ ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState, ...insightsState })
      
      return { ...state, ...thinkingState, ...processedState, ...sqlState, ...executionState, ...insightsState, ...finalState }
    } catch (error) {
      console.error('Coupa workflow execution error:', error)
      return {
        ...state,
        error: `Coupa analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async generateThinkingProcess(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    try {
      const thinkingPrompt = `
COUPA FINANCIAL INTELLIGENCE - ANALYTICAL REASONING TRACE

Generate a professional 5-step analytical reasoning process for this Coupa financial query:

Query: "${state.currentQuery}"

**STRUCTURED ANALYTICAL FRAMEWORK**: Create exactly 5 executive-level thinking steps:

**1. BUSINESS CONTEXT ANALYSIS**
Identify the specific financial business question and its strategic importance to CFO-level decision making

**2. DATA SOURCE STRATEGY**  
Determine which Coupa ERP entities, cost groups, and financial dimensions will provide the most relevant insights

**3. ANALYTICAL APPROACH**
Define the analytical methodology and key financial metrics needed to answer the business question

**4. EXPECTED FINANCIAL INSIGHTS**
Anticipate what critical financial patterns, variances, or performance indicators should emerge from the analysis

**5. EXECUTIVE VALUE PROPOSITION**
Articulate how these findings will directly support strategic financial decisions and business value creation

**FORMAT REQUIREMENTS**:
- Use professional executive language
- Focus on business value and financial impact
- Include specific Coupa platform context
- Emphasize strategic decision-making value
- Format as clear, numbered sections with descriptive headers`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: thinkingPrompt
      })

      const thinkingProcess = response.text || ''
      return { thinkingProcess }
    } catch (error) {
      console.error('Coupa thinking process generation error:', error)
      return { 
        thinkingProcess: `**1. BUSINESS CONTEXT ANALYSIS**
Analyzing Coupa financial query to identify specific CFO-level insights needed for strategic financial decision-making

**2. DATA SOURCE STRATEGY**
Mapping query requirements to Coupa ERP entities, cost groups, and financial dimensions for comprehensive analysis

**3. ANALYTICAL APPROACH**
Designing analytical methodology to extract key financial metrics and performance indicators from Coupa platform

**4. EXPECTED FINANCIAL INSIGHTS**
Anticipating critical financial patterns, budget variances, and performance metrics that will emerge from analysis

**5. EXECUTIVE VALUE PROPOSITION**
Structuring findings to support strategic financial decisions with quantified business impact and actionable recommendations` 
      }
    }
  }

  private async processFinancialQuery(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    try {
      const analysisPrompt = `
COUPA FINANCIAL ANALYSIS CENTER - EXECUTIVE REPORTING SYSTEM

You are a premier CFO-level financial analyst providing executive insights for Coupa ERP financial data.

🚨 CRITICAL RESPONSE REQUIREMENTS:
- NEVER include SQL code, database queries, or technical details in your response
- ONLY provide professional business insights and executive recommendations
- Focus on financial impact, performance metrics, and strategic guidance

FINANCIAL ANALYSIS CONTEXT:
- Query: "${state.currentQuery}"
- Platform: Coupa ERP Financial Management System
- Target Audience: CFO, Finance Directors, Business Leaders
- Data Scope: HFM entities (LEAsheville, LETiger), Cost Groups, Budget Analysis

STRUCTURED BUSINESS RESPONSE FORMAT:

**EXECUTIVE FINANCIAL SUMMARY**
[2-3 sentences summarizing key financial findings with specific dollar amounts and business impact]

**CRITICAL BUSINESS METRICS**
- Financial Impact: [Specific dollar variance or performance metric]
- Budget Performance: [Variance percentage vs targets]
- Risk Assessment: [Key financial risks identified]
- Opportunity Size: [Quantified improvement potential]

**STRATEGIC INSIGHTS**
1. [Most significant financial finding with quantified impact]
2. [Performance benchmark comparison with variance percentage]
3. [Risk or opportunity with recommended action timeline]
4. [Process improvement with expected ROI]

**EXECUTIVE RECOMMENDATIONS**
• Immediate Action: [Specific action with expected outcome]
• Strategic Initiative: [Short-term strategy with ROI projection]
• Long-term Optimization: [Structural improvement opportunity]

EXAMPLE BUSINESS RESPONSE:
"Analysis of Coupa financial data reveals $2.4M budget variance in Manufacturing Overhead across LEAsheville operations, representing 8% overspend against Q2 targets. Entity LEAsheville-US shows highest concentration risk with 15% variance in cost center performance. Immediate vendor consolidation could yield $340K annual savings through improved contract negotiations."

Provide ONLY professional business analysis focused on financial outcomes and strategic value:`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: analysisPrompt
      })

      // Ensure clean business response with no SQL code
      let businessResponse = response.text || "Coupa financial analysis completed."
      
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
      console.error('Coupa query processing error:', error)
      return { error: `Failed to process Coupa financial query: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private async generateCoupaSQL(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    try {
      const sqlPrompt = `
COUPA FINANCIAL ERP SQL GENERATION - EXPERT CFO DATABASE ANALYST

Generate precise, business-intelligent PostgreSQL for comprehensive Coupa financial_data analysis with CFO-level reporting accuracy.

**COMPLETE TABLE SCHEMA (financial_data) - Enhanced Business Context:**

**Temporal Dimensions (Time-based Analysis):**
- fiscal_year_number INTEGER [2023-2025] - Primary year dimension for YoY comparisons
- fiscal_year_month VARCHAR(10) - Format: 'YYYY-MM' for monthly trending and seasonality analysis  
- fiscal_year_week VARCHAR(10) - Weekly granularity for short-term variance analysis
- fiscal_day DATE - Daily transaction date for cash flow and accrual timing analysis
- finalization_date DATE - Financial close date for month-end reporting and audit trails

**Organizational Hierarchy (Entity & Cost Structure):**
- hfm_entity VARCHAR(100) - Legal entity (LEAsheville, LETiger operations) for consolidation reporting
  • LEAsheville variants (LEAsheville, LEAsheville_Main) = Primary manufacturing facility
  • LETiger operations = Secondary operations and R&D activities
- hfm_cost_group VARCHAR(100) - Strategic cost categories for executive spend analysis
  • "Manufacturing Overhead" = 51% of total spend ($3.3M+ annually) - HIGHEST PRIORITY
  • "Professional Services" = Consulting, legal, audit spend
  • "Facilities & Operations" = Real estate, utilities, maintenance
  • "Technology & Systems" = IT infrastructure, software, licenses

**Financial Chart of Accounts (GL Integration):**
- fim_account VARCHAR(100) - Primary GL account for financial statement mapping
- account_code VARCHAR(20) - Numeric GL code for automated reconciliation
- account VARCHAR(200) - Detailed account description for business user understanding

**Cost Center Management (Budget & Variance Analysis):**  
- cost_center_code VARCHAR(20) - Departmental budget codes for P&L responsibility
- cost_center VARCHAR(200) - Business unit names for management reporting

**Financial Values:**
- amount DECIMAL(15,2) - Transaction amount in USD (cleaned, validated, ready for analysis)

**DATA AVAILABILITY & CONSTRAINTS:**
- 2025: Q1-Q2 data ONLY (Jan-Jun) - NO Q3/Q4 data exists yet
- 2024: Complete 12-month data with full fiscal year comparisons  
- 2023: Historical baseline data for 3-year trending analysis
- Total Volume: ~$6.5M analyzed across 847 cost centers and 23 entities

**CRITICAL SQL REQUIREMENTS & BUSINESS RULES:**

1. **Amount Calculations:** Use amount directly (pre-validated DECIMAL) - no CAST needed
2. **2025 Data Filtering:** MANDATORY WHERE clause for current year: 
   fiscal_year_number = 2025 AND fiscal_year_month IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06')
3. **Aggregation Standards:** Always include proper GROUP BY with meaningful ORDER BY (DESC for spend ranking)
4. **Result Sizing:** Limit to executive-friendly datasets (TOP 10-25 for summaries, TOP 50 for detailed analysis)
5. **Null Handling:** Include IS NOT NULL checks for critical dimensions to avoid skewed results

**CFO-LEVEL FINANCIAL ANALYSIS PATTERNS:**

**Manufacturing Overhead Analysis (Priority #1 - 51% of spend):**
\`\`\`sql
-- Manufacturing spend concentration and variance
SELECT 
  hfm_cost_group,
  hfm_entity,
  COUNT(*) as transaction_count,
  SUM(amount) as total_spend,
  AVG(amount) as avg_transaction,
  SUM(amount) / (SELECT SUM(amount) FROM financial_data WHERE fiscal_year_number = 2025) * 100 as spend_percentage
FROM financial_data 
WHERE fiscal_year_number = 2025 AND hfm_cost_group = 'Manufacturing Overhead'
GROUP BY hfm_cost_group, hfm_entity
ORDER BY total_spend DESC;
\`\`\`

**Entity Consolidation & Performance:**  
\`\`\`sql
-- Entity performance and spend distribution
SELECT 
  hfm_entity,
  COUNT(DISTINCT cost_center) as departments,
  SUM(amount) as entity_spend,
  SUM(CASE WHEN hfm_cost_group = 'Manufacturing Overhead' THEN amount ELSE 0 END) as manufacturing_spend
FROM financial_data 
WHERE fiscal_year_number = 2025
GROUP BY hfm_entity
ORDER BY entity_spend DESC;
\`\`\`

**Period-over-Period Variance Analysis:**
\`\`\`sql
-- Monthly trending for executive dashboards
SELECT 
  fiscal_year_month,
  hfm_cost_group,
  SUM(amount) as monthly_spend,
  LAG(SUM(amount)) OVER (PARTITION BY hfm_cost_group ORDER BY fiscal_year_month) as prior_month,
  ROUND(((SUM(amount) - LAG(SUM(amount)) OVER (PARTITION BY hfm_cost_group ORDER BY fiscal_year_month)) / LAG(SUM(amount)) OVER (PARTITION BY hfm_cost_group ORDER BY fiscal_year_month)) * 100, 2) as variance_pct
FROM financial_data 
WHERE fiscal_year_number = 2025
GROUP BY fiscal_year_month, hfm_cost_group
ORDER BY fiscal_year_month, monthly_spend DESC;
\`\`\`

**Cost Center Budget Performance:**
\`\`\`sql  
-- Department spend analysis for budget variance
SELECT 
  cost_center,
  cost_center_code,
  COUNT(*) as transactions,
  SUM(amount) as actual_spend,
  SUM(amount) / COUNT(DISTINCT fiscal_year_month) as avg_monthly_run_rate
FROM financial_data 
WHERE fiscal_year_number = 2025 AND amount > 0
GROUP BY cost_center, cost_center_code
HAVING SUM(amount) > 10000  -- Focus on material spend >$10K
ORDER BY actual_spend DESC;
\`\`\`

**EXECUTIVE REPORTING PRIORITIES:**

1. **Manufacturing Overhead Focus:** Always highlight this cost group (51% of spend) in analysis
2. **Entity Comparisons:** LEAsheville vs LETiger performance and efficiency metrics  
3. **Seasonal Patterns:** Identify Q1-Q2 trends and project annual run-rates
4. **Variance Detection:** Flag unusual spending patterns or large month-over-month changes (>20%)
5. **Budget Accountability:** Connect cost centers to spending patterns for budget owner analysis

**DATA QUALITY VALIDATIONS:**
- Always verify data completeness with COUNT(*) and SUM(amount) sanity checks
- Include percentage calculations to show relative importance 
- Filter out $0 or negative amounts unless specifically analyzing reversals
- Group similar entities (LEAsheville variants) when appropriate for consolidation

Query Context: "${state.currentQuery}"

Generate production-ready SQL with CFO-level business intelligence, focusing on Manufacturing Overhead insights, entity performance, and executive decision-making support:`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: sqlPrompt
      })

      const sqlText = this.extractSQL(response.text || '')
      return {
        sqlQuery: sqlText
      }
    } catch (error) {
      console.error('Coupa SQL generation error:', error)
      return { error: `Failed to generate Coupa SQL: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
  }

  private async executeSQL(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    if (!state.sqlQuery) {
      return { error: 'No SQL query to execute' }
    }

    try {
      // Route to Coupa data (financial_data table)
      const routedQuery = state.sqlQuery.replace(/\b(FROM|JOIN)\s+(\w+)/gi, (match, keyword, table) => {
        if (table.toLowerCase() === 'coupa' || table.toLowerCase() === 'financial') {
          return `${keyword} financial_data`
        }
        return match
      })

      const results = await Database.query(routedQuery)
      const rawResults = results.rows || []

      // CRITICAL: Apply reactive validation to fix "$0.0M" calculation errors
      const validationContext: ValidationContext = {
        endpoint: 'coupa_sql_execution',
        dataSource: 'coupa',
        operationType: 'query',
        financialFields: this.extractFinancialFields(rawResults),
        expectedRanges: {
          amount: { min: -1000000, max: 50000000 },
          total_amount: { min: 0, max: 100000000 }
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
        console.log('🚨 CRITICAL: Validation detected calculation errors - applying reactive correction')
        
        const errorHandlingResult = await this.errorHandler.handleFinancialDataErrors(rawResults, {
          dataSource: 'coupa',
          operation: 'sql_query',
          userQuery: state.currentQuery || '',
          businessContext: 'financial_analysis',
          expectedResultType: 'currency',
          criticalFields: validationContext.financialFields
        })

        if (errorHandlingResult.success && errorHandlingResult.confidence > 0.7) {
          console.log('✅ CORRECTION: Reactive error handler fixed calculation errors')
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
      console.error('Coupa SQL execution error:', error)
      
      // Use comprehensive fallback service with progressive retry strategies
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCategory = SQLFallbackService.categorizeError(errorMessage)
      console.log(`Coupa SQL error category: ${errorCategory} - ${SQLFallbackService.getErrorDescription(errorCategory)}`)

      // Progressive fallback attempts
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`Coupa fallback attempt ${attempt}/3...`)
        
        const fallbackResult = await SQLFallbackService.executeWithFallbacks({
          dataSource: 'coupa',
          originalQuery: state.sqlQuery,
          userQuery: state.currentQuery,
          errorMessage,
          attemptNumber: attempt
        })

        if (fallbackResult.success) {
          console.log(`Coupa fallback successful (${fallbackResult.fallbackType}) with ${fallbackResult.results?.length} results`)
          return {
            queryResults: fallbackResult.results || [],
            evidence: fallbackResult.evidence || [],
            fallbackUsed: `${fallbackResult.fallbackType} (attempt ${attempt})`
          }
        }

        console.log(`Coupa fallback attempt ${attempt} failed: ${fallbackResult.error}`)
      }
      
      return { 
        error: `Coupa SQL execution failed after all fallback attempts: ${errorMessage}`,
        fallbackUsed: 'all_attempts_failed'
      }
    }
  }

  /**
   * Extract financial fields from query results for validation
   */
  private extractFinancialFields(results: any[]): string[] {
    if (!results || results.length === 0) return ['amount']
    
    const firstRow = results[0]
    const financialFields = Object.keys(firstRow).filter(key => 
      key.toLowerCase().includes('amount') ||
      key.toLowerCase().includes('total') ||
      key.toLowerCase().includes('spend') ||
      key.toLowerCase().includes('cost') ||
      key.toLowerCase().includes('value')
    )
    
    return financialFields.length > 0 ? financialFields : ['amount']
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
            console.log(`🔧 CURRENCY FIX: ${key} corrected from "${value}" to ${parseResult.value}`)
            correctedRow[key] = parseResult.value
          }
          
          // Handle zero values that should likely be non-zero
          if (parseResult.value === 0 && typeof value === 'string' && value.includes('$')) {
            console.log(`⚠️ ZERO VALUE WARNING: ${key} shows "$0" but may need recalculation`)
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
    const financialKeywords = ['amount', 'total', 'spend', 'cost', 'value', 'sum', 'avg']
    return financialKeywords.some(keyword => fieldName.toLowerCase().includes(keyword))
  }


  private async generateFinancialInsights(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    if (!state.queryResults || state.queryResults.length === 0) {
      return { insights: ['No financial data available for analysis'] }
    }

    try {
      const insightsPrompt = `
You are a CFO executive advisor analyzing Coupa financial data. Generate professional business insights in clean bullet point format.

DATA ANALYSIS:
Query: ${state.currentQuery}
Records: ${state.queryResults.length}
Sample: ${JSON.stringify(state.queryResults.slice(0, 3))}

GENERATE 4-6 EXECUTIVE INSIGHTS using this exact format:

• **Financial Impact**: [Dollar amount and percentage] - [Key finding with business impact]
• **Risk Assessment**: [Quantified risk/opportunity] - [Strategic implication with savings potential]  
• **Performance Gap**: [Variance or benchmark comparison] - [Actionable recommendation]
• **Process Efficiency**: [Operational finding with metrics] - [Improvement opportunity]
• **Strategic Action**: [High-impact recommendation] - [Expected ROI or cost savings]
• **Compliance Review**: [Control or governance insight] - [Required action]

REQUIREMENTS:
- Start each bullet with quantified metrics ($ amounts, percentages, ratios)
- Include specific cost centers, vendors, or account codes when available
- Focus on actionable business decisions, not data descriptions
- Use executive language for C-suite consumption
- Each insight should be one concise, powerful sentence
- NEVER include section headers or numbering - only bullet points

Example format:
• **Financial Impact**: $2.3M concentration in Manufacturing Overhead represents 38% of total spend and requires immediate cost optimization focus.`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: insightsPrompt
      })

      const insights = this.parseInsights(response.text || '')
      return { insights }
    } catch (error) {
      console.error('Coupa insights generation error:', error)
      return { insights: ['Failed to generate financial insights'] }
    }
  }

  private async formatFinancialResponse(state: CoupaAgentState): Promise<Partial<CoupaAgentState>> {
    try {
      // Calculate total amount by checking for various possible column names from SQL aggregations
      const totalAmount = state.queryResults?.reduce((sum, row) => {
        // Check all possible amount column names that might be returned from SQL queries
        const amount = parseFloat(
          row.total_amount || 
          row.total_spend || 
          row.amount || 
          row.sum || 
          row.financial_impact ||
          row.total_value ||
          0
        )
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0) || 0

      const recordCount = state.queryResults?.length || 0
      
      // Calculate total transaction count if available in the data
      const totalTransactions = state.queryResults?.reduce((sum, row) => {
        const transactions = parseInt(
          row.transaction_count || 
          row.count || 
          row.transactions ||
          1  // Default to 1 if no transaction count is available
        )
        return sum + (isNaN(transactions) ? 1 : transactions)
      }, 0) || recordCount

      const avgTransactionValue = totalTransactions > 0 ? (totalAmount / totalTransactions) : 0
      // Categorize the query and create structured report
      const category = categorizeQuery(state.currentQuery)
      
      const reportData: StructuredReportData = {
        category,
        title: `${category.replace('_', ' ').toUpperCase()} REPORT`,
        executiveSummary: `Analysis of Coupa financial data reveals ${totalTransactions.toLocaleString()} transactions with a total value of $${(totalAmount / 1000000).toFixed(1)}M, averaging $${avgTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} per transaction.`,
        keyMetrics: [
          {
            label: 'Total Financial Impact',
            value: `$${(totalAmount / 1000000).toFixed(1)}M`,
            trend: recordCount > 0 ? 'Current Period' : 'No Data',
            significance: 'high'
          },
          {
            label: 'Transaction Volume',
            value: totalTransactions.toLocaleString(),
            significance: 'medium'
          },
          {
            label: 'Average Transaction',
            value: `$${avgTransactionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
            significance: 'medium'
          },
          {
            label: 'Analysis Scope',
            value: 'Coupa ERP Platform',
            significance: 'low'
          }
        ],
        insights: state.insights || ['Financial analysis completed successfully'],
        recommendations: [
          {
            priority: 'immediate',
            action: 'Transaction Review Priority',
            impact: `Focus on top ${Math.min(5, recordCount)} transactions representing ${((Math.min(5, recordCount) / recordCount) * 100).toFixed(1)}% of total volume`
          },
          {
            priority: 'short_term',
            action: 'Process Optimization',
            impact: 'Identify transaction patterns to unlock cost reduction opportunities and improve operational efficiency'
          },
          {
            priority: 'long_term',
            action: 'Enhanced Financial Controls',
            impact: `Establish approval workflows for transactions exceeding $${(avgTransactionValue * 2).toLocaleString()} to strengthen governance`
          }
        ],
        dataContext: {
          period: new Date().toLocaleDateString(),
          recordCount,
          dataSource: 'Coupa ERP Financial Platform',
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
        console.log('Coupa report verification found issues:', verificationResult.issues)
      }

      const formattedResponse = formatStructuredReport(reportData)

      return { 
        response: formattedResponse.trim(),
        verificationNotes: verificationResult.verificationNotes
      }
    } catch (error) {
      console.error('Coupa response formatting error:', error)
      return { error: `Failed to format Coupa response: ${error instanceof Error ? error.message : 'Unknown error'}` }
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