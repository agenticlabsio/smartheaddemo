// Aggregation Validation Service
// Validates SQL aggregation results and detects calculation errors

import { EnhancedCurrencyParser } from './currency-parser'

export interface AggregationContext {
  sqlQuery: string
  aggregationType: 'sum' | 'avg' | 'count' | 'max' | 'min'
  dataSource: 'coupa' | 'baan'
  expectedRecordCount?: number
  fieldName: string
}

export interface AggregationValidationResult {
  isValid: boolean
  confidence: number
  calculatedValue: number
  reportedValue: number
  discrepancy: number
  discrepancyPercentage: number
  errors: AggregationError[]
  warnings: AggregationWarning[]
  correctedValue?: number
  suggestedActions: string[]
}

export interface AggregationError {
  type: 'calculation_mismatch' | 'null_result' | 'zero_result' | 'range_violation' | 'logic_error'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  details: string
}

export interface AggregationWarning {
  type: 'suspicious_value' | 'data_quality' | 'performance' | 'range_boundary'
  message: string
  recommendation: string
}

export class AggregationValidator {

  /**
   * Validate SQL aggregation results against expected values
   */
  static async validateAggregationResult(
    context: AggregationContext,
    reportedResult: number,
    rawData: any[]
  ): Promise<AggregationValidationResult> {
    
    const validation: AggregationValidationResult = {
      isValid: false,
      confidence: 0,
      calculatedValue: 0,
      reportedValue: reportedResult,
      discrepancy: 0,
      discrepancyPercentage: 0,
      errors: [],
      warnings: [],
      suggestedActions: []
    }

    try {
      // Calculate expected value from raw data
      validation.calculatedValue = this.calculateExpectedValue(context, rawData)
      validation.discrepancy = Math.abs(validation.calculatedValue - validation.reportedValue)
      
      if (validation.calculatedValue !== 0) {
        validation.discrepancyPercentage = (validation.discrepancy / Math.abs(validation.calculatedValue)) * 100
      }

      // Perform validation checks
      this.validateCalculationAccuracy(validation, context)
      this.validateValueRange(validation, context)
      this.validateDataQuality(validation, context, rawData)
      this.validateBusinessLogic(validation, context)

      // Calculate overall confidence
      validation.confidence = this.calculateConfidence(validation)
      validation.isValid = validation.errors.length === 0

      // Generate corrected value if needed
      if (!validation.isValid && validation.errors.some(e => e.type === 'calculation_mismatch')) {
        validation.correctedValue = validation.calculatedValue
      }

      // Generate suggested actions
      validation.suggestedActions = this.generateSuggestedActions(validation, context)

    } catch (error) {
      validation.errors.push({
        type: 'logic_error',
        severity: 'critical',
        message: 'Validation process failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return validation
  }

  /**
   * Calculate expected aggregation value from raw data
   */
  private static calculateExpectedValue(context: AggregationContext, rawData: any[]): number {
    if (!rawData || rawData.length === 0) {
      return 0
    }

    // Extract values from the field
    const fieldValues = rawData.map(row => {
      const value = row[context.fieldName]
      const parseResult = EnhancedCurrencyParser.parse(value)
      return parseResult.isValid ? parseResult.value : 0
    }).filter(val => isFinite(val))

    switch (context.aggregationType) {
      case 'sum':
        return fieldValues.reduce((sum, val) => sum + val, 0)
      
      case 'avg':
        return fieldValues.length > 0 
          ? fieldValues.reduce((sum, val) => sum + val, 0) / fieldValues.length 
          : 0
      
      case 'count':
        return fieldValues.length
      
      case 'max':
        return fieldValues.length > 0 ? Math.max(...fieldValues) : 0
      
      case 'min':
        return fieldValues.length > 0 ? Math.min(...fieldValues) : 0
      
      default:
        return 0
    }
  }

  /**
   * Validate calculation accuracy
   */
  private static validateCalculationAccuracy(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): void {
    // Define tolerance based on aggregation type and data source
    const tolerance = this.getCalculationTolerance(context)
    
    if (validation.discrepancy > tolerance) {
      validation.errors.push({
        type: 'calculation_mismatch',
        severity: 'critical',
        message: `${context.aggregationType.toUpperCase()} calculation mismatch exceeds tolerance`,
        details: `Expected: ${EnhancedCurrencyParser.formatAsCurrency(validation.calculatedValue)}, ` +
                `Got: ${EnhancedCurrencyParser.formatAsCurrency(validation.reportedValue)}, ` +
                `Discrepancy: ${EnhancedCurrencyParser.formatAsCurrency(validation.discrepancy)} ` +
                `(${validation.discrepancyPercentage.toFixed(2)}%)`
      })
    }

    // Check for null/undefined results
    if (!isFinite(validation.reportedValue)) {
      validation.errors.push({
        type: 'null_result',
        severity: 'critical',
        message: 'Aggregation result is null or undefined',
        details: 'SQL query returned non-numeric result'
      })
    }

    // Check for suspicious zero results
    if (validation.reportedValue === 0 && validation.calculatedValue !== 0) {
      validation.errors.push({
        type: 'zero_result',
        severity: 'high',
        message: 'Aggregation result is zero but expected non-zero value',
        details: `Expected ${context.aggregationType} to be ${EnhancedCurrencyParser.formatAsCurrency(validation.calculatedValue)}`
      })
    }
  }

  /**
   * Validate value is within reasonable range
   */
  private static validateValueRange(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): void {
    const rangeValidation = EnhancedCurrencyParser.validateRange(validation.reportedValue, {
      dataSource: context.dataSource,
      field: context.fieldName,
      aggregationType: context.aggregationType
    })

    if (!rangeValidation.isWithinRange) {
      validation.errors.push({
        type: 'range_violation',
        severity: 'high',
        message: 'Value outside valid range',
        details: rangeValidation.warnings.join('; ')
      })
    }

    if (!rangeValidation.isReasonable) {
      validation.warnings.push({
        type: 'range_boundary',
        message: 'Value is within valid range but may be unreasonable',
        recommendation: 'Verify data source and business context'
      })
    }
  }

  /**
   * Validate data quality indicators
   */
  private static validateDataQuality(
    validation: AggregationValidationResult,
    context: AggregationContext,
    rawData: any[]
  ): void {
    // Check record count consistency
    if (context.expectedRecordCount && rawData.length !== context.expectedRecordCount) {
      validation.warnings.push({
        type: 'data_quality',
        message: `Record count mismatch: expected ${context.expectedRecordCount}, got ${rawData.length}`,
        recommendation: 'Verify SQL query filters and data completeness'
      })
    }

    // Check for high percentage of null/zero values
    const nullOrZeroCount = rawData.filter(row => {
      const value = row[context.fieldName]
      const parseResult = EnhancedCurrencyParser.parse(value)
      return !parseResult.isValid || parseResult.value === 0
    }).length

    const nullPercentage = (nullOrZeroCount / rawData.length) * 100

    if (nullPercentage > 50) {
      validation.warnings.push({
        type: 'data_quality',
        message: `High percentage of null/zero values: ${nullPercentage.toFixed(1)}%`,
        recommendation: 'Check data source quality and field mappings'
      })
    }

    // Check for data consistency
    if (context.aggregationType === 'sum' && rawData.length > 0 && validation.calculatedValue === 0) {
      validation.warnings.push({
        type: 'suspicious_value',
        message: 'Sum aggregation is zero despite having records',
        recommendation: 'Verify currency parsing and data formatting'
      })
    }
  }

  /**
   * Validate business logic consistency
   */
  private static validateBusinessLogic(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): void {
    // Business-specific validation rules
    switch (context.dataSource) {
      case 'coupa':
        this.validateCoupaBusinessRules(validation, context)
        break
      case 'baan':
        this.validateBaanBusinessRules(validation, context)
        break
    }
  }

  /**
   * Coupa-specific business validation
   */
  private static validateCoupaBusinessRules(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): void {
    // Coupa amounts should generally be positive for spend analysis
    if (context.fieldName === 'amount' && validation.reportedValue < 0) {
      validation.warnings.push({
        type: 'suspicious_value',
        message: 'Negative amount in Coupa financial data',
        recommendation: 'Verify if negative values represent credits/adjustments'
      })
    }

    // Manufacturing overhead should be substantial if present
    if (context.sqlQuery.toLowerCase().includes('manufacturing overhead') && 
        validation.reportedValue > 0 && validation.reportedValue < 1000) {
      validation.warnings.push({
        type: 'suspicious_value',
        message: 'Unusually low manufacturing overhead amount',
        recommendation: 'Verify calculation includes all relevant cost centers'
      })
    }
  }

  /**
   * Baan-specific business validation
   */
  private static validateBaanBusinessRules(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): void {
    // Baan reporting totals should align with procurement patterns
    if (context.fieldName === 'reporting_total' && context.aggregationType === 'avg' && 
        validation.reportedValue > 100000) {
      validation.warnings.push({
        type: 'suspicious_value',
        message: 'Unusually high average procurement transaction',
        recommendation: 'Check for data outliers or large capital purchases'
      })
    }

    // Supplier spend concentration checks
    if (context.sqlQuery.toLowerCase().includes('supplier') && 
        context.aggregationType === 'sum' && validation.reportedValue > 5000000) {
      validation.warnings.push({
        type: 'range_boundary',
        message: 'High supplier concentration detected',
        recommendation: 'Consider supply chain risk assessment'
      })
    }
  }

  /**
   * Calculate tolerance for calculation accuracy
   */
  private static getCalculationTolerance(context: AggregationContext): number {
    const baseTolerances = {
      sum: 0.01, // $0.01
      avg: 0.005, // $0.005
      count: 0, // Exact match required
      max: 0.01, // $0.01
      min: 0.01 // $0.01
    }

    let tolerance = baseTolerances[context.aggregationType]

    // Adjust tolerance based on data source characteristics
    if (context.dataSource === 'baan') {
      tolerance *= 2 // Baan data may have more rounding
    }

    return tolerance
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(validation: AggregationValidationResult): number {
    let confidence = 0.9

    // Reduce confidence for errors
    validation.errors.forEach(error => {
      switch (error.severity) {
        case 'critical': confidence -= 0.4; break
        case 'high': confidence -= 0.2; break
        case 'medium': confidence -= 0.1; break
        case 'low': confidence -= 0.05; break
      }
    })

    // Reduce confidence for warnings
    confidence -= validation.warnings.length * 0.05

    // Reduce confidence for high discrepancy
    if (validation.discrepancyPercentage > 10) {
      confidence -= 0.2
    } else if (validation.discrepancyPercentage > 5) {
      confidence -= 0.1
    }

    return Math.max(0.1, Math.min(0.99, confidence))
  }

  /**
   * Generate suggested actions based on validation results
   */
  private static generateSuggestedActions(
    validation: AggregationValidationResult,
    context: AggregationContext
  ): string[] {
    const actions: string[] = []

    if (validation.errors.some(e => e.type === 'calculation_mismatch')) {
      actions.push('Re-execute SQL query and verify aggregation logic')
      actions.push('Check for data type casting issues in SQL query')
    }

    if (validation.errors.some(e => e.type === 'zero_result')) {
      actions.push('Verify currency parsing in data import process')
      actions.push('Check SQL WHERE clauses for overly restrictive filters')
    }

    if (validation.errors.some(e => e.type === 'null_result')) {
      actions.push('Add NULL handling to SQL aggregation functions')
      actions.push('Verify database connection and query execution')
    }

    if (validation.warnings.some(w => w.type === 'data_quality')) {
      actions.push('Review data source quality and completeness')
      actions.push('Implement data cleansing procedures')
    }

    if (validation.discrepancyPercentage > 5) {
      actions.push('Investigate calculation methodology differences')
      actions.push('Consider using COALESCE or ISNULL in SQL for NULL handling')
    }

    return actions
  }

  /**
   * Batch validate multiple aggregations
   */
  static async validateBatch(
    validations: Array<{
      context: AggregationContext
      reportedResult: number
      rawData: any[]
    }>
  ): Promise<AggregationValidationResult[]> {
    const results: AggregationValidationResult[] = []

    for (const { context, reportedResult, rawData } of validations) {
      const result = await this.validateAggregationResult(context, reportedResult, rawData)
      results.push(result)
    }

    return results
  }
}