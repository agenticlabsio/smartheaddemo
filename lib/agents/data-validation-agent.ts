// Reactive Data Validation Agent for Financial Accuracy
// Implements agentic patterns to validate financial calculations and detect errors

import { GoogleGenAI } from '@google/genai'
import Database from '@/lib/database'

export interface ValidationResult {
  isValid: boolean
  confidence: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedValue?: number
  originalValue: number
  suggestedAction: string
}

export interface ValidationError {
  type: 'calculation' | 'format' | 'range' | 'logic' | 'currency'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  field: string
  details: string
}

export interface ValidationWarning {
  type: 'suspicious' | 'unusual' | 'incomplete'
  message: string
  recommendation: string
}

export interface FinancialDataPoint {
  value: number | string
  field: string
  context: {
    dataSource: 'coupa' | 'baan'
    aggregationType?: 'sum' | 'avg' | 'count' | 'max' | 'min'
    recordCount?: number
    calculationMethod?: string
  }
}

export class DataValidationAgent {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
  }

  /**
   * Validates financial data points reactively using agentic patterns
   */
  async validateFinancialData(dataPoints: FinancialDataPoint[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    for (const dataPoint of dataPoints) {
      const validation = await this.validateSingleDataPoint(dataPoint)
      results.push(validation)
    }

    return results
  }

  /**
   * Validates SQL query results against expected financial ranges
   */
  async validateSQLResults(sqlQuery: string, results: any[], expectedContext: any): Promise<ValidationResult> {
    try {
      const validation = await this.performReactiveValidation(sqlQuery, results, expectedContext)
      return validation
    } catch (error) {
      return this.createErrorValidation(error, 'SQL validation failed')
    }
  }

  /**
   * Validates currency parsing and format consistency
   */
  async validateCurrencyFormat(value: string | number, originalFormat?: string): Promise<ValidationResult> {
    const parsedValue = this.parseCurrencyValue(value)
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Check for parsing errors
    if (isNaN(parsedValue) || parsedValue < 0) {
      errors.push({
        type: 'currency',
        severity: 'critical',
        message: 'Currency value could not be parsed or is negative',
        field: 'amount',
        details: `Original: ${value}, Parsed: ${parsedValue}`
      })
    }

    // Check for suspicious zero values
    if (parsedValue === 0 && originalFormat && originalFormat.includes('$')) {
      warnings.push({
        type: 'suspicious',
        message: 'Currency format suggests non-zero value but parsed as zero',
        recommendation: 'Verify original data format and parsing logic'
      })
    }

    return {
      isValid: errors.length === 0,
      confidence: this.calculateConfidence(errors, warnings),
      errors,
      warnings,
      correctedValue: parsedValue,
      originalValue: typeof value === 'number' ? value : 0,
      suggestedAction: errors.length > 0 ? 'Fix currency parsing' : 'Continue processing'
    }
  }

  /**
   * Validates aggregation calculations for accuracy
   */
  async validateAggregation(
    aggregationType: 'sum' | 'avg' | 'count' | 'max' | 'min',
    values: number[],
    result: number,
    context: any
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Calculate expected result
    const expectedResult = this.calculateExpectedAggregation(aggregationType, values)
    const tolerance = Math.abs(expectedResult * 0.01) // 1% tolerance

    // Validate result accuracy
    if (Math.abs(result - expectedResult) > tolerance) {
      errors.push({
        type: 'calculation',
        severity: 'critical',
        message: `${aggregationType.toUpperCase()} calculation mismatch`,
        field: 'aggregation_result',
        details: `Expected: ${expectedResult}, Got: ${result}, Difference: ${Math.abs(result - expectedResult)}`
      })
    }

    // Check for suspicious zero results
    if (result === 0 && values.length > 0 && values.some(v => v !== 0)) {
      errors.push({
        type: 'calculation',
        severity: 'high',
        message: 'Aggregation result is zero despite non-zero input values',
        field: 'aggregation_result',
        details: `Input values: [${values.slice(0, 5).join(', ')}${values.length > 5 ? '...' : ''}]`
      })
    }

    return {
      isValid: errors.length === 0,
      confidence: this.calculateConfidence(errors, warnings),
      errors,
      warnings,
      correctedValue: expectedResult,
      originalValue: result,
      suggestedAction: errors.length > 0 ? 'Recalculate aggregation' : 'Result validated'
    }
  }

  /**
   * Reactive validation using AI to detect anomalies
   */
  private async performReactiveValidation(
    sqlQuery: string, 
    results: any[], 
    expectedContext: any
  ): Promise<ValidationResult> {
    try {
      const prompt = this.buildValidationPrompt(sqlQuery, results, expectedContext)
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      })

      return this.parseAIValidationResponse(response.text || '', results)
    } catch (error) {
      return this.createErrorValidation(error, 'AI validation failed')
    }
  }

  private buildValidationPrompt(sqlQuery: string, results: any[], expectedContext: any): string {
    const sampleResults = results.slice(0, 10)
    const totalCount = results.length

    return `
FINANCIAL DATA VALIDATION AGENT - ANOMALY DETECTION

You are a specialized financial data validation AI agent. Analyze this SQL query result for accuracy and detect potential issues.

SQL QUERY: ${sqlQuery}

RESULTS SUMMARY:
- Total Records: ${totalCount}
- Sample Data: ${JSON.stringify(sampleResults, null, 2)}

EXPECTED CONTEXT: ${JSON.stringify(expectedContext, null, 2)}

VALIDATION CHECKLIST:
1. DATA INTEGRITY: Are the financial amounts reasonable and properly formatted?
2. CALCULATION ACCURACY: Do aggregated values (SUM, AVG) make logical sense?
3. RANGE VALIDATION: Are values within expected business ranges?
4. ZERO VALUE DETECTION: Are there suspicious zero or null values?
5. CURRENCY FORMAT: Are financial amounts properly parsed and displayed?

RESPONSE FORMAT:
VALIDATION_STATUS: [PASS/WARNING/FAIL]
CONFIDENCE_SCORE: [0.0-1.0]
CRITICAL_ISSUES:
- [Issue type]: [Description] | IMPACT: [Business impact]
WARNINGS:
- [Warning type]: [Description] | RECOMMENDATION: [Action]
CORRECTIVE_ACTIONS:
- [Priority]: [Specific action to take]

Focus on detecting "$0.0M" calculation errors and suspicious financial values.
Provide specific, actionable recommendations for fixing data accuracy issues.
`
  }

  private parseAIValidationResponse(responseText: string, results: any[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    // Parse validation status
    const statusMatch = responseText.match(/VALIDATION_STATUS:\s*(PASS|WARNING|FAIL)/i)
    const isValid = statusMatch ? statusMatch[1].toUpperCase() === 'PASS' : false

    // Parse confidence score
    const confidenceMatch = responseText.match(/CONFIDENCE_SCORE:\s*([\d.]+)/i)
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5

    // Parse critical issues
    const issuesSection = responseText.match(/CRITICAL_ISSUES:([\s\S]*?)(?=WARNINGS:|CORRECTIVE_ACTIONS:|$)/i)
    if (issuesSection) {
      const issueLines = issuesSection[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.substring(1).trim())

      issueLines.forEach(line => {
        const [issue, impact] = line.split('| IMPACT:')
        if (issue && impact) {
          errors.push({
            type: 'logic',
            severity: 'critical',
            message: issue.trim(),
            field: 'data_integrity',
            details: impact.trim()
          })
        }
      })
    }

    // Parse warnings
    const warningsSection = responseText.match(/WARNINGS:([\s\S]*?)(?=CORRECTIVE_ACTIONS:|$)/i)
    if (warningsSection) {
      const warningLines = warningsSection[1].split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.substring(1).trim())

      warningLines.forEach(line => {
        const [warning, recommendation] = line.split('| RECOMMENDATION:')
        if (warning && recommendation) {
          warnings.push({
            type: 'unusual',
            message: warning.trim(),
            recommendation: recommendation.trim()
          })
        }
      })
    }

    return {
      isValid,
      confidence,
      errors,
      warnings,
      originalValue: results.length,
      suggestedAction: errors.length > 0 ? 'Review data quality' : 'Data validated successfully'
    }
  }

  private async validateSingleDataPoint(dataPoint: FinancialDataPoint): Promise<ValidationResult> {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    const numericValue = this.parseCurrencyValue(dataPoint.value)

    // Range validation based on data source
    const expectedRange = this.getExpectedRange(dataPoint.context.dataSource, dataPoint.field)
    if (numericValue < expectedRange.min || numericValue > expectedRange.max) {
      errors.push({
        type: 'range',
        severity: 'high',
        message: `Value outside expected range for ${dataPoint.field}`,
        field: dataPoint.field,
        details: `Value: ${numericValue}, Expected: ${expectedRange.min}-${expectedRange.max}`
      })
    }

    // Zero value detection for financial fields
    if (numericValue === 0 && this.isFinancialField(dataPoint.field)) {
      warnings.push({
        type: 'suspicious',
        message: `Zero value detected for financial field ${dataPoint.field}`,
        recommendation: 'Verify data source and calculation logic'
      })
    }

    return {
      isValid: errors.length === 0,
      confidence: this.calculateConfidence(errors, warnings),
      errors,
      warnings,
      correctedValue: numericValue,
      originalValue: numericValue,
      suggestedAction: errors.length > 0 ? 'Investigate data source' : 'Value is valid'
    }
  }

  private parseCurrencyValue(value: string | number): number {
    if (typeof value === 'number') return value

    // Enhanced currency parsing to handle various formats
    const cleanValue = value.toString()
      .replace(/[$,\s()]/g, '') // Remove $, commas, spaces, parentheses
      .replace(/[^\d.-]/g, '') // Keep only digits, decimal, and minus

    const parsed = parseFloat(cleanValue) || 0

    // Handle negative values in parentheses format
    if (value.toString().includes('(') && value.toString().includes(')')) {
      return -Math.abs(parsed)
    }

    return parsed
  }

  private calculateExpectedAggregation(type: string, values: number[]): number {
    switch (type) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
      case 'count':
        return values.length
      case 'max':
        return Math.max(...values)
      case 'min':
        return Math.min(...values)
      default:
        return 0
    }
  }

  private getExpectedRange(dataSource: string, field: string): { min: number; max: number } {
    // Define realistic ranges based on data source and field type
    const ranges = {
      coupa: {
        amount: { min: -1000000, max: 50000000 }, // -$1M to $50M
        total_amount: { min: 0, max: 100000000 }, // $0 to $100M
        avg_amount: { min: 0, max: 1000000 }, // $0 to $1M
      },
      baan: {
        reporting_total: { min: -500000, max: 10000000 }, // -$500K to $10M
        total_amount: { min: 0, max: 50000000 }, // $0 to $50M
        avg_amount: { min: 0, max: 500000 }, // $0 to $500K
      }
    }

    return ranges[dataSource as keyof typeof ranges]?.[field as keyof any] || { min: -Infinity, max: Infinity }
  }

  private isFinancialField(field: string): boolean {
    const financialFields = ['amount', 'total_amount', 'avg_amount', 'reporting_total', 'spend', 'cost']
    return financialFields.some(f => field.toLowerCase().includes(f))
  }

  private calculateConfidence(errors: ValidationError[], warnings: ValidationWarning[]): number {
    if (errors.length === 0 && warnings.length === 0) return 0.95
    if (errors.length === 0 && warnings.length <= 2) return 0.85
    if (errors.some(e => e.severity === 'critical')) return 0.3
    if (errors.some(e => e.severity === 'high')) return 0.5
    return 0.7
  }

  private createErrorValidation(error: any, context: string): ValidationResult {
    return {
      isValid: false,
      confidence: 0.1,
      errors: [{
        type: 'logic',
        severity: 'critical',
        message: `${context}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: 'validation_system',
        details: 'Validation system encountered an error'
      }],
      warnings: [],
      originalValue: 0,
      suggestedAction: 'Check validation system and retry'
    }
  }

  /**
   * Batch validation for multiple financial calculations
   */
  async validateBatch(calculations: Array<{
    type: 'aggregation' | 'currency' | 'range'
    data: any
    context: any
  }>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    for (const calc of calculations) {
      switch (calc.type) {
        case 'aggregation':
          const aggResult = await this.validateAggregation(
            calc.data.type,
            calc.data.values,
            calc.data.result,
            calc.context
          )
          results.push(aggResult)
          break
        case 'currency':
          const currencyResult = await this.validateCurrencyFormat(
            calc.data.value,
            calc.data.originalFormat
          )
          results.push(currencyResult)
          break
        case 'range':
          const dataPoint: FinancialDataPoint = {
            value: calc.data.value,
            field: calc.data.field,
            context: calc.context
          }
          const rangeResult = await this.validateSingleDataPoint(dataPoint)
          results.push(rangeResult)
          break
      }
    }

    return results
  }
}