// Validation Integration Layer
// Integrates all validation components with existing agents and API endpoints

import { DataValidationAgent, ValidationResult } from '../agents/data-validation-agent'
import { ReactiveErrorHandler, ErrorHandlingResult } from '../agents/reactive-error-handler'
import { EnhancedCurrencyParser, CurrencyParseResult } from './currency-parser'
import { AggregationValidator, AggregationValidationResult } from './aggregation-validator'
import { ConfidenceScoringSystem, ConfidenceScore, ErrorDetectionResult } from './confidence-scoring'
import { validationMiddleware, ValidationContext, APIValidationResult } from '../middleware/validation-middleware'

export interface IntegratedValidationResult {
  isValid: boolean
  confidence: number
  originalData: any
  validatedData: any
  validationResults: ValidationResult[]
  errorHandlingResult?: ErrorHandlingResult
  confidenceScore: ConfidenceScore
  apiValidationResult: APIValidationResult
  corrections: ValidationCorrection[]
  recommendations: string[]
  performanceMetrics: ValidationPerformanceMetrics
}

export interface ValidationCorrection {
  field: string
  originalValue: any
  correctedValue: any
  correctionType: 'currency_parse' | 'aggregation_fix' | 'range_adjustment' | 'format_fix'
  confidence: number
  automaticallyApplied: boolean
  reason: string
}

export interface ValidationPerformanceMetrics {
  totalValidationTime: number
  componentsExecuted: string[]
  errorsDetected: number
  correctionsApplied: number
  confidenceCalculationTime: number
  errorHandlingTime: number
  overallAccuracy: number
}

export class ValidationIntegrationService {
  private validationAgent: DataValidationAgent
  private errorHandler: ReactiveErrorHandler

  constructor() {
    this.validationAgent = new DataValidationAgent()
    this.errorHandler = new ReactiveErrorHandler()
  }

  /**
   * Comprehensive validation for financial API responses
   * Integrates all validation components for complete data accuracy checking
   */
  async validateFinancialApiResponse(
    data: any,
    context: ValidationContext,
    sqlQuery?: string
  ): Promise<IntegratedValidationResult> {
    const startTime = Date.now()
    const performanceMetrics: ValidationPerformanceMetrics = {
      totalValidationTime: 0,
      componentsExecuted: [],
      errorsDetected: 0,
      correctionsApplied: 0,
      confidenceCalculationTime: 0,
      errorHandlingTime: 0,
      overallAccuracy: 0
    }

    const result: IntegratedValidationResult = {
      isValid: true,
      confidence: 0,
      originalData: data,
      validatedData: data,
      validationResults: [],
      confidenceScore: {
        overall: 0,
        components: {
          dataQuality: 0,
          calculationAccuracy: 0,
          formatConsistency: 0,
          businessLogic: 0,
          rangeValidation: 0
        },
        factors: [],
        recommendation: '',
        riskLevel: 'low'
      },
      apiValidationResult: {
        isValid: true,
        confidence: 0,
        originalData: data,
        validatedData: data,
        corrections: [],
        warnings: [],
        errors: [],
        validationMetrics: {
          validationDuration: 0,
          fieldsValidated: 0,
          correctionsApplied: 0,
          warningsGenerated: 0,
          errorsFound: 0,
          overallAccuracy: 0
        }
      },
      corrections: [],
      recommendations: [],
      performanceMetrics
    }

    try {
      // Step 1: API-level validation using middleware
      performanceMetrics.componentsExecuted.push('api_validation')
      if (sqlQuery) {
        result.apiValidationResult = await validationMiddleware.validateSQLQueryResults(
          sqlQuery, 
          Array.isArray(data) ? data : [data], 
          context
        )
      } else {
        result.apiValidationResult = await validationMiddleware.validateAPIResponse(
          {} as any, // request object
          data,
          context
        )
      }

      // Step 2: Detailed financial data validation
      performanceMetrics.componentsExecuted.push('data_validation')
      result.validationResults = await this.performDetailedValidation(data, context)

      // Step 3: Error detection and handling
      const errorHandlingStart = Date.now()
      performanceMetrics.componentsExecuted.push('error_handling')
      result.errorHandlingResult = await this.errorHandler.handleFinancialDataErrors(data, {
        dataSource: context.dataSource,
        operation: this.mapContextToOperation(context),
        userQuery: context.endpoint,
        businessContext: 'financial_analysis',
        expectedResultType: 'currency',
        criticalFields: context.financialFields
      })
      performanceMetrics.errorHandlingTime = Date.now() - errorHandlingStart

      // Step 4: Confidence scoring
      const confidenceStart = Date.now()
      performanceMetrics.componentsExecuted.push('confidence_scoring')
      result.confidenceScore = ConfidenceScoringSystem.calculateConfidenceScore(
        result.validationResults,
        {
          dataSource: context.dataSource,
          recordCount: Array.isArray(data) ? data.length : 1,
          calculationType: this.inferCalculationType(context),
          businessContext: context.endpoint
        }
      )
      performanceMetrics.confidenceCalculationTime = Date.now() - confidenceStart

      // Step 5: Aggregate results and apply corrections
      result.corrections = this.aggregateCorrections(result)
      result.validatedData = this.applyIntegratedCorrections(data, result.corrections)

      // Step 6: Calculate final validation status
      result.isValid = this.calculateFinalValidationStatus(result)
      result.confidence = this.calculateFinalConfidence(result)

      // Step 7: Generate recommendations
      result.recommendations = this.generateIntegratedRecommendations(result)

      // Step 8: Calculate performance metrics
      performanceMetrics.totalValidationTime = Date.now() - startTime
      performanceMetrics.errorsDetected = this.countTotalErrors(result)
      performanceMetrics.correctionsApplied = result.corrections.length
      performanceMetrics.overallAccuracy = this.calculateOverallAccuracy(result)
      result.performanceMetrics = performanceMetrics

      return result

    } catch (error) {
      console.error('Integrated validation failed:', error)
      result.isValid = false
      result.confidence = 0.1
      result.recommendations.push('Validation system error - manual review required')
      result.performanceMetrics.totalValidationTime = Date.now() - startTime
      return result
    }
  }

  /**
   * Validate specific aggregation calculations with full integration
   */
  async validateAggregationWithIntegration(
    sqlQuery: string,
    results: any[],
    context: ValidationContext
  ): Promise<IntegratedValidationResult> {
    // Extract aggregation information from SQL
    const aggregationContext = this.extractAggregationContext(sqlQuery, context)
    
    return this.validateFinancialApiResponse(results, context, sqlQuery)
  }

  /**
   * Validate currency values with enhanced integration
   */
  async validateCurrencyWithIntegration(
    currencyValues: Array<{ field: string; value: any }>,
    context: ValidationContext
  ): Promise<IntegratedValidationResult> {
    const validationData = currencyValues.reduce((obj, curr) => {
      obj[curr.field] = curr.value
      return obj
    }, {} as any)

    return this.validateFinancialApiResponse(validationData, context)
  }

  /**
   * Perform detailed validation of financial data
   */
  private async performDetailedValidation(
    data: any,
    context: ValidationContext
  ): Promise<ValidationResult[]> {
    const validationResults: ValidationResult[] = []

    // Validate each critical financial field
    for (const field of context.financialFields) {
      const fieldValues = this.extractFieldValues(data, field)
      
      for (const value of fieldValues) {
        const dataPoint = {
          value,
          field,
          context: {
            dataSource: context.dataSource,
            aggregationType: this.inferAggregationType(field)
          }
        }

        const validation = await this.validationAgent.validateFinancialData([dataPoint])
        validationResults.push(...validation)
      }
    }

    return validationResults
  }

  /**
   * Aggregate corrections from all validation components
   */
  private aggregateCorrections(result: IntegratedValidationResult): ValidationCorrection[] {
    const corrections: ValidationCorrection[] = []

    // Add corrections from API validation
    for (const apiCorrection of result.apiValidationResult.corrections) {
      corrections.push({
        field: apiCorrection.field,
        originalValue: apiCorrection.originalValue,
        correctedValue: apiCorrection.correctedValue,
        correctionType: 'format_fix',
        confidence: apiCorrection.confidence,
        automaticallyApplied: true,
        reason: apiCorrection.reason
      })
    }

    // Add corrections from error handling
    if (result.errorHandlingResult) {
      for (const errorCorrection of result.errorHandlingResult.corrections) {
        corrections.push({
          field: errorCorrection.field,
          originalValue: errorCorrection.originalValue,
          correctedValue: errorCorrection.correctedValue,
          correctionType: this.mapOperationToCorrectionType(errorCorrection.operation),
          confidence: errorCorrection.confidence,
          automaticallyApplied: true,
          reason: errorCorrection.reasoning
        })
      }
    }

    // Add corrections from validation results
    for (const validation of result.validationResults) {
      if (validation.correctedValue !== undefined && 
          validation.correctedValue !== validation.originalValue) {
        corrections.push({
          field: 'validation_result',
          originalValue: validation.originalValue,
          correctedValue: validation.correctedValue,
          correctionType: 'currency_parse',
          confidence: validation.confidence,
          automaticallyApplied: false, // Conservative approach
          reason: validation.suggestedAction
        })
      }
    }

    return corrections
  }

  /**
   * Apply integrated corrections to data
   */
  private applyIntegratedCorrections(
    originalData: any,
    corrections: ValidationCorrection[]
  ): any {
    let correctedData = JSON.parse(JSON.stringify(originalData))

    for (const correction of corrections) {
      if (correction.automaticallyApplied && correction.confidence > 0.8) {
        correctedData = this.applySingleCorrection(correctedData, correction)
      }
    }

    return correctedData
  }

  /**
   * Apply a single correction to data
   */
  private applySingleCorrection(data: any, correction: ValidationCorrection): any {
    if (Array.isArray(data)) {
      return data.map(row => {
        if (row[correction.field] === correction.originalValue) {
          return { ...row, [correction.field]: correction.correctedValue }
        }
        return row
      })
    } else if (typeof data === 'object') {
      if (data[correction.field] === correction.originalValue) {
        return { ...data, [correction.field]: correction.correctedValue }
      }
    }

    return data
  }

  /**
   * Calculate final validation status
   */
  private calculateFinalValidationStatus(result: IntegratedValidationResult): boolean {
    // Validation passes if:
    // 1. API validation passed
    // 2. No critical errors in detailed validation
    // 3. Confidence score is acceptable
    
    const apiValid = result.apiValidationResult.isValid
    const criticalErrors = result.validationResults.filter(v => 
      v.errors?.some(e => e.severity === 'critical')).length
    const confidenceAcceptable = result.confidenceScore.overall > 0.7

    return apiValid && criticalErrors === 0 && confidenceAcceptable
  }

  /**
   * Calculate final confidence score
   */
  private calculateFinalConfidence(result: IntegratedValidationResult): number {
    // Weighted average of different confidence sources
    const weights = {
      api: 0.3,
      confidence: 0.4,
      validation: 0.3
    }

    const apiConfidence = result.apiValidationResult.confidence
    const overallConfidence = result.confidenceScore.overall
    const validationConfidence = result.validationResults.length > 0 
      ? result.validationResults.reduce((sum, v) => sum + v.confidence, 0) / result.validationResults.length 
      : 0.8

    return (apiConfidence * weights.api) + 
           (overallConfidence * weights.confidence) + 
           (validationConfidence * weights.validation)
  }

  /**
   * Generate integrated recommendations
   */
  private generateIntegratedRecommendations(result: IntegratedValidationResult): string[] {
    const recommendations: string[] = []

    // Recommendations from confidence scoring
    if (result.confidenceScore.recommendation) {
      recommendations.push(result.confidenceScore.recommendation)
    }

    // Recommendations from error handling
    if (result.errorHandlingResult) {
      recommendations.push(...result.errorHandlingResult.recommendedActions)
    }

    // Critical issue recommendations
    if (result.confidenceScore.riskLevel === 'critical') {
      recommendations.push('CRITICAL: Do not use for executive decisions - requires immediate investigation')
    }

    // Zero calculation specific recommendations
    const hasZeroCalculations = result.validationResults.some(v => 
      v.errors?.some(e => e.message.includes('zero')))
    
    if (hasZeroCalculations) {
      recommendations.push('Review SQL aggregation functions for null handling')
      recommendations.push('Verify currency parsing in data import process')
      recommendations.push('Check for overly restrictive WHERE clauses')
    }

    // Remove duplicates
    return [...new Set(recommendations)]
  }

  /**
   * Helper methods
   */
  private mapContextToOperation(context: ValidationContext): any {
    if (context.endpoint.includes('sql')) return 'sql_query'
    if (context.endpoint.includes('aggregation')) return 'aggregation'
    return 'calculation'
  }

  private inferCalculationType(context: ValidationContext): string {
    if (context.endpoint.includes('sum')) return 'sum'
    if (context.endpoint.includes('avg')) return 'average'
    if (context.endpoint.includes('count')) return 'count'
    return 'general'
  }

  private extractFieldValues(data: any, field: string): any[] {
    if (Array.isArray(data)) {
      return data.map(row => row[field]).filter(val => val != null)
    } else if (typeof data === 'object' && data[field] != null) {
      return [data[field]]
    }
    return []
  }

  private inferAggregationType(field: string): 'sum' | 'avg' | 'count' | undefined {
    if (field.includes('total_') || field.includes('sum_')) return 'sum'
    if (field.includes('avg_')) return 'avg'
    if (field.includes('count_')) return 'count'
    return undefined
  }

  private mapOperationToCorrectionType(operation: string): ValidationCorrection['correctionType'] {
    switch (operation) {
      case 'recalculate': return 'aggregation_fix'
      case 'format': return 'format_fix'
      case 'replace': return 'currency_parse'
      default: return 'format_fix'
    }
  }

  private extractAggregationContext(sqlQuery: string, context: ValidationContext): any {
    // Extract aggregation information from SQL query
    return {
      hasSum: sqlQuery.toLowerCase().includes('sum('),
      hasAvg: sqlQuery.toLowerCase().includes('avg('),
      hasCount: sqlQuery.toLowerCase().includes('count('),
      dataSource: context.dataSource
    }
  }

  private countTotalErrors(result: IntegratedValidationResult): number {
    let totalErrors = result.apiValidationResult.errors.length

    for (const validation of result.validationResults) {
      totalErrors += validation.errors?.length || 0
    }

    if (result.errorHandlingResult) {
      totalErrors += result.errorHandlingResult.errorsDetected.length
    }

    return totalErrors
  }

  private calculateOverallAccuracy(result: IntegratedValidationResult): number {
    const totalValidations = result.validationResults.length + 1 // +1 for API validation
    const successfulValidations = result.validationResults.filter(v => v.isValid).length + 
                                  (result.apiValidationResult.isValid ? 1 : 0)

    return totalValidations > 0 ? (successfulValidations / totalValidations) * 100 : 0
  }
}

// Singleton instance for application-wide use
export const validationIntegration = new ValidationIntegrationService()

// Helper function for easy integration with existing code
export async function validateFinancialData(
  data: any,
  context: ValidationContext,
  sqlQuery?: string
): Promise<IntegratedValidationResult> {
  return validationIntegration.validateFinancialApiResponse(data, context, sqlQuery)
}