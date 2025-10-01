// Reactive Error Handler for Financial Data Validation
// Implements agentic patterns for detecting and correcting calculation errors

import { DataValidationAgent, ValidationResult } from './data-validation-agent'
import { EnhancedCurrencyParser, CurrencyParseResult } from '../validation/currency-parser'
import { AggregationValidator, AggregationValidationResult } from '../validation/aggregation-validator'
import { ConfidenceScoringSystem, ErrorDetectionResult } from '../validation/confidence-scoring'

export interface ErrorHandlingResult {
  success: boolean
  originalData: any
  correctedData: any
  errorsDetected: DetectedFinancialError[]
  corrections: DataCorrection[]
  fallbacksApplied: FallbackMechanism[]
  confidence: number
  recommendedActions: string[]
}

export interface DetectedFinancialError {
  type: 'zero_calculation' | 'currency_parse' | 'aggregation_mismatch' | 'range_violation' | 'business_logic'
  severity: 'critical' | 'high' | 'medium' | 'low'
  field: string
  originalValue: any
  expectedValue?: any
  context: string
  impact: string
  autoCorrectible: boolean
}

export interface DataCorrection {
  field: string
  operation: 'replace' | 'recalculate' | 'format' | 'validate'
  originalValue: any
  correctedValue: any
  method: string
  confidence: number
  reasoning: string
}

export interface FallbackMechanism {
  trigger: string
  mechanism: 'recalculate' | 'alternative_source' | 'default_value' | 'manual_override'
  applied: boolean
  result: any
  confidence: number
  notes: string
}

export interface ReactiveValidationContext {
  dataSource: 'coupa' | 'baan'
  operation: 'sql_query' | 'aggregation' | 'calculation' | 'display'
  userQuery: string
  businessContext: string
  expectedResultType: 'currency' | 'percentage' | 'count' | 'ratio'
  criticalFields: string[]
}

export class ReactiveErrorHandler {
  private validationAgent: DataValidationAgent
  private fallbackMechanisms: Map<string, FallbackMechanism[]>

  constructor() {
    this.validationAgent = new DataValidationAgent()
    this.fallbackMechanisms = new Map()
    this.initializeFallbackMechanisms()
  }

  /**
   * Main reactive error handling method - detects and corrects errors in real-time
   */
  async handleFinancialDataErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<ErrorHandlingResult> {
    const result: ErrorHandlingResult = {
      success: false,
      originalData: data,
      correctedData: data,
      errorsDetected: [],
      corrections: [],
      fallbacksApplied: [],
      confidence: 0,
      recommendedActions: []
    }

    try {
      // Phase 1: Error Detection
      const detectionResult = await this.detectFinancialErrors(data, context)
      result.errorsDetected = detectionResult.errors

      // Phase 2: Apply Corrections
      if (result.errorsDetected.length > 0) {
        const correctionResult = await this.applyCorrections(data, result.errorsDetected, context)
        result.correctedData = correctionResult.correctedData
        result.corrections = correctionResult.corrections
      }

      // Phase 3: Apply Fallback Mechanisms
      const fallbackResult = await this.applyFallbackMechanisms(result.correctedData, result.errorsDetected, context)
      result.correctedData = fallbackResult.data
      result.fallbacksApplied = fallbackResult.fallbacks

      // Phase 4: Final Validation
      const finalValidation = await this.performFinalValidation(result.correctedData, context)
      result.confidence = finalValidation.confidence
      result.success = finalValidation.isValid

      // Phase 5: Generate Recommendations
      result.recommendedActions = this.generateRecommendations(result)

      return result

    } catch (error) {
      console.error('Reactive error handling failed:', error)
      result.errorsDetected.push({
        type: 'business_logic',
        severity: 'critical',
        field: 'error_handler',
        originalValue: data,
        context: 'Error handling system failure',
        impact: 'Cannot validate or correct financial data',
        autoCorrectible: false
      })
      return result
    }
  }

  /**
   * Detect specific financial calculation errors
   */
  private async detectFinancialErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<{ errors: DetectedFinancialError[] }> {
    const errors: DetectedFinancialError[] = []

    // Error Pattern 1: Zero calculations that should have values
    const zeroErrors = await this.detectZeroCalculationErrors(data, context)
    errors.push(...zeroErrors)

    // Error Pattern 2: Currency parsing failures
    const currencyErrors = await this.detectCurrencyParsingErrors(data, context)
    errors.push(...currencyErrors)

    // Error Pattern 3: Aggregation mismatches
    const aggregationErrors = await this.detectAggregationErrors(data, context)
    errors.push(...aggregationErrors)

    // Error Pattern 4: Range violations
    const rangeErrors = await this.detectRangeViolations(data, context)
    errors.push(...rangeErrors)

    // Error Pattern 5: Business logic violations
    const businessLogicErrors = await this.detectBusinessLogicErrors(data, context)
    errors.push(...businessLogicErrors)

    return { errors }
  }

  /**
   * Detect zero calculation errors (e.g., "$0.0M" when should be "$4.06M")
   */
  private async detectZeroCalculationErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<DetectedFinancialError[]> {
    const errors: DetectedFinancialError[] = []

    // Check for zero values in financial aggregations
    if (Array.isArray(data)) {
      for (const row of data) {
        for (const field of context.criticalFields) {
          const value = row[field]
          
          if (this.isZeroFinancialValue(value) && this.shouldNotBeZero(field, context)) {
            errors.push({
              type: 'zero_calculation',
              severity: 'critical',
              field,
              originalValue: value,
              context: `${context.operation} operation in ${context.dataSource}`,
              impact: 'Executive summary showing $0.0M instead of actual amounts',
              autoCorrectible: true
            })
          }
        }
      }
    } else if (typeof data === 'object') {
      // Single object validation
      for (const field of context.criticalFields) {
        const value = data[field]
        
        if (this.isZeroFinancialValue(value) && this.shouldNotBeZero(field, context)) {
          errors.push({
            type: 'zero_calculation',
            severity: 'critical',
            field,
            originalValue: value,
            context: `Single value calculation in ${context.dataSource}`,
            impact: 'Financial calculation showing zero instead of actual amount',
            autoCorrectible: true
          })
        }
      }
    }

    return errors
  }

  /**
   * Detect currency parsing errors
   */
  private async detectCurrencyParsingErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<DetectedFinancialError[]> {
    const errors: DetectedFinancialError[] = []

    const financialFields = context.criticalFields.filter(field => 
      field.toLowerCase().includes('amount') || 
      field.toLowerCase().includes('total') ||
      field.toLowerCase().includes('spend')
    )

    const checkValue = (value: any, field: string) => {
      const parseResult = EnhancedCurrencyParser.parse(value)
      
      if (!parseResult.isValid) {
        errors.push({
          type: 'currency_parse',
          severity: 'high',
          field,
          originalValue: value,
          context: `Currency parsing in ${context.dataSource}`,
          impact: 'Financial amounts may be incorrectly calculated',
          autoCorrectible: true
        })
      } else if (parseResult.warnings.length > 0) {
        errors.push({
          type: 'currency_parse',
          severity: 'medium',
          field,
          originalValue: value,
          context: `Currency format warning in ${context.dataSource}`,
          impact: 'Potential formatting inconsistency',
          autoCorrectible: true
        })
      }
    }

    if (Array.isArray(data)) {
      for (const row of data) {
        for (const field of financialFields) {
          if (row[field] != null) {
            checkValue(row[field], field)
          }
        }
      }
    } else if (typeof data === 'object') {
      for (const field of financialFields) {
        if (data[field] != null) {
          checkValue(data[field], field)
        }
      }
    }

    return errors
  }

  /**
   * Detect aggregation calculation errors
   */
  private async detectAggregationErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<DetectedFinancialError[]> {
    const errors: DetectedFinancialError[] = []

    // This would require access to the original raw data for comparison
    // For now, we'll detect obvious aggregation issues
    
    if (Array.isArray(data) && data.length > 0) {
      const firstRow = data[0]
      
      // Check for suspicious aggregation results
      const aggregationFields = Object.keys(firstRow).filter(key => 
        key.includes('total_') || key.includes('sum_') || key.includes('avg_')
      )

      for (const field of aggregationFields) {
        const value = firstRow[field]
        
        if (value === 0 && context.operation === 'aggregation') {
          errors.push({
            type: 'aggregation_mismatch',
            severity: 'critical',
            field,
            originalValue: value,
            context: `Aggregation operation in ${context.dataSource}`,
            impact: 'Sum/average calculation resulted in zero unexpectedly',
            autoCorrectible: false // Would need raw data to recalculate
          })
        }
      }
    }

    return errors
  }

  /**
   * Detect range violations
   */
  private async detectRangeViolations(
    data: any,
    context: ReactiveValidationContext
  ): Promise<DetectedFinancialError[]> {
    const errors: DetectedFinancialError[] = []

    const checkRanges = (value: any, field: string) => {
      const numericValue = EnhancedCurrencyParser.parse(value).value
      
      const rangeValidation = EnhancedCurrencyParser.validateRange(numericValue, {
        dataSource: context.dataSource,
        field,
        aggregationType: this.inferAggregationType(field)
      })

      if (!rangeValidation.isWithinRange) {
        errors.push({
          type: 'range_violation',
          severity: 'high',
          field,
          originalValue: value,
          context: `Range validation in ${context.dataSource}`,
          impact: 'Value outside acceptable business range',
          autoCorrectible: false
        })
      }
    }

    if (Array.isArray(data)) {
      for (const row of data) {
        for (const field of context.criticalFields) {
          if (row[field] != null) {
            checkRanges(row[field], field)
          }
        }
      }
    } else if (typeof data === 'object') {
      for (const field of context.criticalFields) {
        if (data[field] != null) {
          checkRanges(data[field], field)
        }
      }
    }

    return errors
  }

  /**
   * Detect business logic violations
   */
  private async detectBusinessLogicErrors(
    data: any,
    context: ReactiveValidationContext
  ): Promise<DetectedFinancialError[]> {
    const errors: DetectedFinancialError[] = []

    // Business rule: Manufacturing overhead should not be zero if queried specifically
    if (context.userQuery.toLowerCase().includes('manufacturing') && 
        context.userQuery.toLowerCase().includes('overhead')) {
      
      const checkManufacturingOverhead = (value: any, field: string) => {
        const numericValue = EnhancedCurrencyParser.parse(value).value
        
        if (numericValue === 0) {
          errors.push({
            type: 'business_logic',
            severity: 'high',
            field,
            originalValue: value,
            context: 'Manufacturing overhead query',
            impact: 'Zero manufacturing overhead is unlikely in operational facility',
            autoCorrectible: false
          })
        }
      }

      if (Array.isArray(data)) {
        for (const row of data) {
          for (const field of context.criticalFields) {
            if (row[field] != null) {
              checkManufacturingOverhead(row[field], field)
            }
          }
        }
      }
    }

    // Business rule: Supplier spend analysis should show meaningful amounts
    if (context.userQuery.toLowerCase().includes('supplier') && 
        context.userQuery.toLowerCase().includes('spend')) {
      
      const totalSpend = this.calculateTotalFromData(data, context.criticalFields)
      
      if (totalSpend < 1000 && context.dataSource === 'baan') {
        errors.push({
          type: 'business_logic',
          severity: 'medium',
          field: 'total_spend',
          originalValue: totalSpend,
          context: 'Supplier spend analysis',
          impact: 'Unusually low supplier spend total may indicate data filtering issues',
          autoCorrectible: false
        })
      }
    }

    return errors
  }

  /**
   * Apply corrections to detected errors
   */
  private async applyCorrections(
    data: any,
    errors: DetectedFinancialError[],
    context: ReactiveValidationContext
  ): Promise<{ correctedData: any; corrections: DataCorrection[] }> {
    let correctedData = JSON.parse(JSON.stringify(data)) // Deep copy
    const corrections: DataCorrection[] = []

    for (const error of errors) {
      if (error.autoCorrectible) {
        const correction = await this.generateCorrection(error, correctedData, context)
        
        if (correction) {
          correctedData = this.applyCorrection(correctedData, correction)
          corrections.push(correction)
        }
      }
    }

    return { correctedData, corrections }
  }

  /**
   * Generate correction for specific error
   */
  private async generateCorrection(
    error: DetectedFinancialError,
    data: any,
    context: ReactiveValidationContext
  ): Promise<DataCorrection | null> {
    switch (error.type) {
      case 'zero_calculation':
        return this.generateZeroCalculationCorrection(error, data, context)
      
      case 'currency_parse':
        return this.generateCurrencyParseCorrection(error, data, context)
      
      default:
        return null
    }
  }

  /**
   * Generate correction for zero calculation errors
   */
  private generateZeroCalculationCorrection(
    error: DetectedFinancialError,
    data: any,
    context: ReactiveValidationContext
  ): DataCorrection | null {
    // For zero calculation errors, we would need to recalculate from source data
    // This is a placeholder for the correction logic
    
    return {
      field: error.field,
      operation: 'recalculate',
      originalValue: error.originalValue,
      correctedValue: 'NEEDS_RECALCULATION',
      method: 'Source data recalculation required',
      confidence: 0.8,
      reasoning: 'Zero value detected where non-zero expected - requires source data recalculation'
    }
  }

  /**
   * Generate correction for currency parsing errors
   */
  private generateCurrencyParseCorrection(
    error: DetectedFinancialError,
    data: any,
    context: ReactiveValidationContext
  ): DataCorrection | null {
    const parseResult = EnhancedCurrencyParser.parse(error.originalValue)
    
    if (!parseResult.isValid) {
      // Try to fix common issues
      const fixResult = EnhancedCurrencyParser.detectAndFixCommonIssues(error.originalValue)
      
      return {
        field: error.field,
        operation: 'format',
        originalValue: error.originalValue,
        correctedValue: fixResult.fixedValue,
        method: 'Enhanced currency parsing with common issue fixes',
        confidence: 0.9,
        reasoning: `Applied fixes: ${fixResult.fixesApplied.join(', ')}`
      }
    }

    return null
  }

  /**
   * Apply correction to data
   */
  private applyCorrection(data: any, correction: DataCorrection): any {
    if (correction.operation === 'recalculate') {
      // Mark for recalculation - would need integration with calculation engine
      return data
    }

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
   * Apply fallback mechanisms when corrections aren't sufficient
   */
  private async applyFallbackMechanisms(
    data: any,
    errors: DetectedFinancialError[],
    context: ReactiveValidationContext
  ): Promise<{ data: any; fallbacks: FallbackMechanism[] }> {
    const fallbacks: FallbackMechanism[] = []
    let processedData = data

    // Fallback 1: Alternative calculation method for zero results
    const zeroErrors = errors.filter(e => e.type === 'zero_calculation')
    if (zeroErrors.length > 0) {
      const fallback = await this.applyAlternativeCalculationFallback(processedData, zeroErrors, context)
      if (fallback.applied) {
        processedData = fallback.result
        fallbacks.push(fallback)
      }
    }

    // Fallback 2: Default reasonable values for impossible results
    const rangeErrors = errors.filter(e => e.type === 'range_violation')
    if (rangeErrors.length > 0) {
      const fallback = await this.applyDefaultValueFallback(processedData, rangeErrors, context)
      if (fallback.applied) {
        processedData = fallback.result
        fallbacks.push(fallback)
      }
    }

    return { data: processedData, fallbacks }
  }

  /**
   * Alternative calculation fallback mechanism
   */
  private async applyAlternativeCalculationFallback(
    data: any,
    errors: DetectedFinancialError[],
    context: ReactiveValidationContext
  ): Promise<FallbackMechanism> {
    // This would integrate with the SQL fallback service
    // For now, return a placeholder mechanism
    
    return {
      trigger: 'Zero calculation result detected',
      mechanism: 'recalculate',
      applied: false, // Would be true if we successfully recalculated
      result: data,
      confidence: 0.7,
      notes: 'Would require integration with SQL fallback service for recalculation'
    }
  }

  /**
   * Default value fallback mechanism
   */
  private async applyDefaultValueFallback(
    data: any,
    errors: DetectedFinancialError[],
    context: ReactiveValidationContext
  ): Promise<FallbackMechanism> {
    return {
      trigger: 'Range violation detected',
      mechanism: 'default_value',
      applied: false, // Conservative approach - don't automatically apply default values
      result: data,
      confidence: 0.5,
      notes: 'Default values not applied automatically for financial data'
    }
  }

  /**
   * Perform final validation after corrections and fallbacks
   */
  private async performFinalValidation(
    data: any,
    context: ReactiveValidationContext
  ): Promise<{ isValid: boolean; confidence: number }> {
    // Re-run validation to check if issues were resolved
    const finalErrors = await this.detectFinancialErrors(data, context)
    
    const criticalErrors = finalErrors.errors.filter(e => e.severity === 'critical').length
    const totalErrors = finalErrors.errors.length

    const isValid = criticalErrors === 0
    const confidence = Math.max(0.1, 1.0 - (totalErrors * 0.1))

    return { isValid, confidence }
  }

  /**
   * Generate recommendations based on error handling results
   */
  private generateRecommendations(result: ErrorHandlingResult): string[] {
    const recommendations: string[] = []

    if (result.errorsDetected.some(e => e.type === 'zero_calculation')) {
      recommendations.push('Implement enhanced SQL aggregation validation')
      recommendations.push('Add currency parsing verification before calculations')
      recommendations.push('Review data source filtering to ensure completeness')
    }

    if (result.errorsDetected.some(e => e.type === 'currency_parse')) {
      recommendations.push('Upgrade currency parsing logic to handle all input formats')
      recommendations.push('Add data validation at import stage')
    }

    if (result.errorsDetected.some(e => e.type === 'aggregation_mismatch')) {
      recommendations.push('Implement real-time aggregation verification')
      recommendations.push('Add checkpoints for calculation accuracy')
    }

    if (result.confidence < 0.8) {
      recommendations.push('Manual review recommended before using for decision-making')
      recommendations.push('Consider additional data validation steps')
    }

    return recommendations
  }

  /**
   * Helper methods
   */
  private isZeroFinancialValue(value: any): boolean {
    const parsed = EnhancedCurrencyParser.parse(value)
    return parsed.isValid && parsed.value === 0
  }

  private shouldNotBeZero(field: string, context: ReactiveValidationContext): boolean {
    // Fields that typically should not be zero in business context
    const nonZeroFields = ['total_amount', 'sum_amount', 'avg_amount', 'total_spend']
    return nonZeroFields.some(nzf => field.toLowerCase().includes(nzf))
  }

  private inferAggregationType(field: string): string | undefined {
    if (field.includes('sum_') || field.includes('total_')) return 'sum'
    if (field.includes('avg_')) return 'avg'
    if (field.includes('count_')) return 'count'
    if (field.includes('max_')) return 'max'
    if (field.includes('min_')) return 'min'
    return undefined
  }

  private calculateTotalFromData(data: any, fields: string[]): number {
    if (!Array.isArray(data)) return 0
    
    let total = 0
    for (const row of data) {
      for (const field of fields) {
        if (row[field] != null) {
          const parsed = EnhancedCurrencyParser.parse(row[field])
          if (parsed.isValid) {
            total += parsed.value
          }
        }
      }
    }
    return total
  }

  private initializeFallbackMechanisms(): void {
    // Initialize predefined fallback mechanisms
    this.fallbackMechanisms.set('zero_calculation', [
      {
        trigger: 'SUM aggregation returns 0',
        mechanism: 'recalculate',
        applied: false,
        result: null,
        confidence: 0.8,
        notes: 'Recalculate using alternative SQL query'
      }
    ])

    this.fallbackMechanisms.set('currency_parse', [
      {
        trigger: 'Currency parsing fails',
        mechanism: 'alternative_source',
        applied: false,
        result: null,
        confidence: 0.7,
        notes: 'Try alternative parsing method'
      }
    ])
  }
}