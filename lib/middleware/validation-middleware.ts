// Validation Middleware for Financial API Endpoints
// Implements reactive agentic validation patterns for real-time data accuracy

import { NextRequest, NextResponse } from 'next/server'
import { DataValidationAgent, ValidationResult } from '../agents/data-validation-agent'
import { EnhancedCurrencyParser } from '../validation/currency-parser'
import { AggregationValidator } from '../validation/aggregation-validator'

export interface ValidationMiddlewareConfig {
  enableValidation: boolean
  strictMode: boolean
  confidenceThreshold: number
  logValidationResults: boolean
  autoCorrect: boolean
}

export interface ValidationContext {
  endpoint: string
  dataSource: 'coupa' | 'baan' | 'combined'
  operationType: 'query' | 'aggregation' | 'calculation'
  financialFields: string[]
  expectedRanges?: Record<string, { min: number; max: number }>
}

export interface APIValidationResult {
  isValid: boolean
  confidence: number
  originalData: any
  validatedData: any
  corrections: ValidationCorrection[]
  warnings: ValidationWarning[]
  errors: ValidationError[]
  validationMetrics: ValidationMetrics
}

export interface ValidationCorrection {
  field: string
  originalValue: any
  correctedValue: any
  reason: string
  confidence: number
}

export interface ValidationWarning {
  field: string
  type: 'suspicious_value' | 'range_boundary' | 'format_issue' | 'data_quality'
  message: string
  recommendation: string
}

export interface ValidationError {
  field: string
  type: 'critical_error' | 'calculation_error' | 'format_error' | 'range_violation'
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface ValidationMetrics {
  validationDuration: number
  fieldsValidated: number
  correctionsApplied: number
  warningsGenerated: number
  errorsFound: number
  overallAccuracy: number
}

export class ValidationMiddleware {
  private validationAgent: DataValidationAgent
  private config: ValidationMiddlewareConfig

  constructor(config: Partial<ValidationMiddlewareConfig> = {}) {
    this.validationAgent = new DataValidationAgent()
    this.config = {
      enableValidation: true,
      strictMode: false,
      confidenceThreshold: 0.8,
      logValidationResults: true,
      autoCorrect: true,
      ...config
    }
  }

  /**
   * Main validation middleware for API endpoints
   */
  async validateAPIResponse(
    request: NextRequest,
    response: any,
    context: ValidationContext
  ): Promise<APIValidationResult> {
    const startTime = Date.now()

    if (!this.config.enableValidation) {
      return this.createPassthroughResult(response, startTime)
    }

    try {
      const validationResult = await this.performValidation(response, context)
      
      if (this.config.logValidationResults) {
        this.logValidationResults(context.endpoint, validationResult)
      }

      return validationResult
    } catch (error) {
      console.error('Validation middleware error:', error)
      return this.createErrorResult(response, error, startTime)
    }
  }

  /**
   * Validate SQL query results before returning to client
   */
  async validateSQLQueryResults(
    sqlQuery: string,
    results: any[],
    context: ValidationContext
  ): Promise<APIValidationResult> {
    const startTime = Date.now()

    const validationResult: APIValidationResult = {
      isValid: true,
      confidence: 0.9,
      originalData: results,
      validatedData: results,
      corrections: [],
      warnings: [],
      errors: [],
      validationMetrics: {
        validationDuration: 0,
        fieldsValidated: 0,
        correctionsApplied: 0,
        warningsGenerated: 0,
        errorsFound: 0,
        overallAccuracy: 1.0
      }
    }

    try {
      // Validate aggregation results
      const aggregationValidations = await this.validateAggregations(sqlQuery, results, context)
      
      // Validate individual data points
      const dataPointValidations = await this.validateDataPoints(results, context)
      
      // Validate currency formats
      const currencyValidations = await this.validateCurrencyFields(results, context)

      // Combine all validation results
      this.combineValidationResults(validationResult, [
        ...aggregationValidations,
        ...dataPointValidations,
        ...currencyValidations
      ])

      // Apply corrections if enabled
      if (this.config.autoCorrect && validationResult.corrections.length > 0) {
        validationResult.validatedData = this.applyCorrections(
          validationResult.originalData,
          validationResult.corrections
        )
      }

      // Calculate final metrics
      validationResult.validationMetrics.validationDuration = Date.now() - startTime
      validationResult.validationMetrics.overallAccuracy = this.calculateOverallAccuracy(validationResult)

      return validationResult
    } catch (error) {
      return this.createErrorResult(results, error, startTime)
    }
  }

  /**
   * Validate aggregation calculations
   */
  private async validateAggregations(
    sqlQuery: string,
    results: any[],
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = []

    // Extract aggregation information from SQL query
    const aggregationInfo = this.extractAggregationInfo(sqlQuery)

    for (const agg of aggregationInfo) {
      if (results.length > 0 && results[0][agg.field]) {
        const aggContext = {
          sqlQuery,
          aggregationType: agg.type,
          dataSource: context.dataSource,
          fieldName: agg.field
        }

        const validation = await AggregationValidator.validateAggregationResult(
          aggContext,
          results[0][agg.field],
          results
        )

        // Convert to ValidationResult format
        validations.push({
          isValid: validation.isValid,
          confidence: validation.confidence,
          errors: validation.errors.map(e => ({
            type: 'calculation',
            severity: e.severity,
            message: e.message,
            field: agg.field,
            details: e.details
          })),
          warnings: validation.warnings.map(w => ({
            type: 'suspicious',
            message: w.message,
            recommendation: w.recommendation
          })),
          originalValue: validation.reportedValue,
          correctedValue: validation.correctedValue,
          suggestedAction: validation.suggestedActions.join('; ')
        })
      }
    }

    return validations
  }

  /**
   * Validate individual data points
   */
  private async validateDataPoints(
    results: any[],
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = []

    for (const field of context.financialFields) {
      const fieldValues = results.map(row => row[field]).filter(val => val != null)
      
      if (fieldValues.length > 0) {
        const dataPoints = fieldValues.map(value => ({
          value,
          field,
          context: {
            dataSource: context.dataSource,
            aggregationType: undefined
          }
        }))

        const fieldValidations = await this.validationAgent.validateFinancialData(dataPoints)
        validations.push(...fieldValidations)
      }
    }

    return validations
  }

  /**
   * Validate currency field formats
   */
  private async validateCurrencyFields(
    results: any[],
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const validations: ValidationResult[] = []

    for (const field of context.financialFields) {
      for (const row of results.slice(0, 10)) { // Validate first 10 rows
        if (row[field] != null) {
          const currencyValidation = await this.validationAgent.validateCurrencyFormat(row[field])
          validations.push(currencyValidation)
        }
      }
    }

    return validations
  }

  /**
   * Extract aggregation information from SQL query
   */
  private extractAggregationInfo(sqlQuery: string): Array<{ type: any, field: string }> {
    const aggregations: Array<{ type: any, field: string }> = []
    const query = sqlQuery.toLowerCase()

    // Match aggregation patterns
    const patterns = [
      { regex: /sum\s*\(\s*(\w+)\s*\)\s*as\s*(\w+)/g, type: 'sum' },
      { regex: /avg\s*\(\s*(\w+)\s*\)\s*as\s*(\w+)/g, type: 'avg' },
      { regex: /count\s*\(\s*[*\w]*\s*\)\s*as\s*(\w+)/g, type: 'count' },
      { regex: /max\s*\(\s*(\w+)\s*\)\s*as\s*(\w+)/g, type: 'max' },
      { regex: /min\s*\(\s*(\w+)\s*\)\s*as\s*(\w+)/g, type: 'min' }
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.regex.exec(query)) !== null) {
        aggregations.push({
          type: pattern.type,
          field: pattern.type === 'count' ? match[1] : match[2]
        })
      }
    }

    return aggregations
  }

  /**
   * Combine multiple validation results
   */
  private combineValidationResults(
    result: APIValidationResult,
    validations: ValidationResult[]
  ): void {
    let totalConfidence = 0
    let validValidations = 0

    for (const validation of validations) {
      result.validationMetrics.fieldsValidated++

      if (!validation.isValid) {
        result.isValid = false
        result.errors.push(...validation.errors.map(e => ({
          field: e.field,
          type: 'critical_error',
          message: e.message,
          severity: e.severity
        })))
        result.validationMetrics.errorsFound += validation.errors.length
      }

      if (validation.warnings) {
        result.warnings.push(...validation.warnings.map(w => ({
          field: 'general',
          type: 'suspicious_value',
          message: w.message,
          recommendation: w.recommendation
        })))
        result.validationMetrics.warningsGenerated += validation.warnings.length
      }

      if (validation.correctedValue !== undefined && 
          validation.correctedValue !== validation.originalValue) {
        result.corrections.push({
          field: 'aggregation_result',
          originalValue: validation.originalValue,
          correctedValue: validation.correctedValue,
          reason: validation.suggestedAction,
          confidence: validation.confidence
        })
        result.validationMetrics.correctionsApplied++
      }

      if (validation.confidence > 0) {
        totalConfidence += validation.confidence
        validValidations++
      }
    }

    if (validValidations > 0) {
      result.confidence = totalConfidence / validValidations
    }

    // Apply strict mode rules
    if (this.config.strictMode && result.confidence < this.config.confidenceThreshold) {
      result.isValid = false
    }
  }

  /**
   * Apply corrections to data
   */
  private applyCorrections(originalData: any, corrections: ValidationCorrection[]): any {
    const correctedData = JSON.parse(JSON.stringify(originalData))

    for (const correction of corrections) {
      if (Array.isArray(correctedData)) {
        // For array data, apply to first row if it exists
        if (correctedData.length > 0 && correctedData[0][correction.field] !== undefined) {
          correctedData[0][correction.field] = correction.correctedValue
        }
      } else if (typeof correctedData === 'object') {
        // For object data
        if (correctedData[correction.field] !== undefined) {
          correctedData[correction.field] = correction.correctedValue
        }
      }
    }

    return correctedData
  }

  /**
   * Calculate overall accuracy score
   */
  private calculateOverallAccuracy(result: APIValidationResult): number {
    const totalChecks = result.validationMetrics.fieldsValidated
    const issues = result.validationMetrics.errorsFound + result.validationMetrics.warningsGenerated

    if (totalChecks === 0) return 1.0

    const accuracy = Math.max(0, (totalChecks - issues) / totalChecks)
    return Number(accuracy.toFixed(3))
  }

  /**
   * Create passthrough result when validation is disabled
   */
  private createPassthroughResult(data: any, startTime: number): APIValidationResult {
    return {
      isValid: true,
      confidence: 1.0,
      originalData: data,
      validatedData: data,
      corrections: [],
      warnings: [],
      errors: [],
      validationMetrics: {
        validationDuration: Date.now() - startTime,
        fieldsValidated: 0,
        correctionsApplied: 0,
        warningsGenerated: 0,
        errorsFound: 0,
        overallAccuracy: 1.0
      }
    }
  }

  /**
   * Create error result when validation fails
   */
  private createErrorResult(data: any, error: any, startTime: number): APIValidationResult {
    return {
      isValid: false,
      confidence: 0.1,
      originalData: data,
      validatedData: data,
      corrections: [],
      warnings: [],
      errors: [{
        field: 'validation_system',
        type: 'critical_error',
        message: `Validation system error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical'
      }],
      validationMetrics: {
        validationDuration: Date.now() - startTime,
        fieldsValidated: 0,
        correctionsApplied: 0,
        warningsGenerated: 0,
        errorsFound: 1,
        overallAccuracy: 0.0
      }
    }
  }

  /**
   * Log validation results for monitoring
   */
  private logValidationResults(endpoint: string, result: APIValidationResult): void {
    const logData = {
      timestamp: new Date().toISOString(),
      endpoint,
      isValid: result.isValid,
      confidence: result.confidence,
      metrics: result.validationMetrics,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
      correctionsCount: result.corrections.length
    }

    console.log('[Validation Middleware]', JSON.stringify(logData, null, 2))

    // Log critical errors
    if (result.errors.some(e => e.severity === 'critical')) {
      console.error('[Critical Validation Error]', {
        endpoint,
        errors: result.errors.filter(e => e.severity === 'critical')
      })
    }
  }

  /**
   * Configure validation settings
   */
  updateConfig(newConfig: Partial<ValidationMiddlewareConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): ValidationMiddlewareConfig {
    return { ...this.config }
  }
}

// Singleton instance for application-wide use
export const validationMiddleware = new ValidationMiddleware({
  enableValidation: true,
  strictMode: false,
  confidenceThreshold: 0.8,
  logValidationResults: true,
  autoCorrect: true
})

// Helper function for easy integration with API routes
export async function validateFinancialAPIResponse(
  request: NextRequest,
  response: any,
  context: ValidationContext
): Promise<APIValidationResult> {
  return validationMiddleware.validateAPIResponse(request, response, context)
}

// Helper function for SQL result validation
export async function validateSQLResults(
  sqlQuery: string,
  results: any[],
  context: ValidationContext
): Promise<APIValidationResult> {
  return validationMiddleware.validateSQLQueryResults(sqlQuery, results, context)
}