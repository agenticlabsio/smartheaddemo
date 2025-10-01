// Enhanced Currency Parser with Validation
// Fixes critical "$0.0M" calculation errors by improving currency parsing accuracy

export interface CurrencyParseResult {
  value: number
  isValid: boolean
  originalFormat: string
  parsedFormat: string
  confidence: number
  errors: string[]
  warnings: string[]
}

export interface AggregationValidation {
  isValid: boolean
  expectedValue: number
  actualValue: number
  discrepancy: number
  confidence: number
  errors: string[]
}

export class EnhancedCurrencyParser {
  
  /**
   * Enhanced currency parser that handles various formats and validates results
   */
  static parse(value: string | number): CurrencyParseResult {
    const result: CurrencyParseResult = {
      value: 0,
      isValid: false,
      originalFormat: String(value),
      parsedFormat: '',
      confidence: 0,
      errors: [],
      warnings: []
    }

    try {
      // Handle already numeric values
      if (typeof value === 'number') {
        if (isFinite(value)) {
          result.value = value
          result.isValid = true
          result.parsedFormat = value.toString()
          result.confidence = 0.99
          return result
        } else {
          result.errors.push('Numeric value is not finite')
          return result
        }
      }

      const stringValue = String(value).trim()
      
      // Handle empty or null values
      if (!stringValue || stringValue === 'null' || stringValue === 'undefined') {
        result.warnings.push('Empty or null value treated as zero')
        result.value = 0
        result.isValid = true
        result.confidence = 0.8
        return result
      }

      // Detect and handle negative values in parentheses: ($1,234.56)
      const isParenthesesNegative = /^\s*\(\s*\$?[\d,.]+ *\)\s*$/.test(stringValue)
      
      // Clean the string - preserve minus sign, digits, and decimal point
      let cleanValue = stringValue
        .replace(/[$€£¥₹₽¢]/g, '') // Remove currency symbols
        .replace(/[,\s]/g, '') // Remove commas and spaces
        .replace(/[()]/g, '') // Remove parentheses
        .trim()

      // Handle percentage signs
      const isPercentage = cleanValue.includes('%')
      if (isPercentage) {
        cleanValue = cleanValue.replace(/%/g, '')
        result.warnings.push('Percentage value detected')
      }

      // Validate numeric format
      if (!/^-?[\d.]+$/.test(cleanValue)) {
        result.errors.push(`Invalid numeric format after cleaning: "${cleanValue}"`)
        return result
      }

      // Parse the numeric value
      const parsed = parseFloat(cleanValue)
      
      if (isNaN(parsed)) {
        result.errors.push('Failed to parse as number')
        return result
      }

      // Apply negative sign for parentheses format
      result.value = isParenthesesNegative ? -Math.abs(parsed) : parsed
      
      // Apply percentage conversion
      if (isPercentage) {
        result.value = result.value / 100
      }

      result.isValid = true
      result.parsedFormat = result.value.toString()
      result.confidence = this.calculateParsingConfidence(stringValue, result.value)

      // Add warnings for suspicious values
      if (result.value === 0 && stringValue.includes('$')) {
        result.warnings.push('Currency symbol detected but value is zero')
      }

      if (Math.abs(result.value) > 1000000000) {
        result.warnings.push('Very large value detected - verify accuracy')
      }

    } catch (error) {
      result.errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Batch parse multiple currency values
   */
  static parseBatch(values: (string | number)[]): CurrencyParseResult[] {
    return values.map(value => this.parse(value))
  }

  /**
   * Format number as currency with proper validation
   */
  static formatAsCurrency(value: number, options: {
    currency?: 'USD' | 'EUR' | 'GBP'
    format?: 'short' | 'full'
    decimals?: number
  } = {}): string {
    const { currency = 'USD', format = 'short', decimals = 2 } = options

    if (!isFinite(value)) {
      return '$0.00'
    }

    if (format === 'short') {
      if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`
      } else if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`
      }
    }

    // Use Intl.NumberFormat for proper currency formatting
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value)
    } catch (error) {
      // Fallback formatting
      return `$${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
  }

  /**
   * Validate aggregation calculations
   */
  static validateAggregation(
    type: 'sum' | 'avg' | 'count' | 'max' | 'min',
    inputValues: (string | number)[],
    resultValue: string | number
  ): AggregationValidation {
    const validation: AggregationValidation = {
      isValid: false,
      expectedValue: 0,
      actualValue: 0,
      discrepancy: 0,
      confidence: 0,
      errors: []
    }

    try {
      // Parse all input values
      const parsedInputs = inputValues.map(val => {
        const parseResult = this.parse(val)
        if (!parseResult.isValid) {
          validation.errors.push(`Failed to parse input value: ${val}`)
        }
        return parseResult.value
      }).filter(val => isFinite(val))

      // Parse result value
      const resultParseResult = this.parse(resultValue)
      if (!resultParseResult.isValid) {
        validation.errors.push(`Failed to parse result value: ${resultValue}`)
        return validation
      }

      validation.actualValue = resultParseResult.value

      // Calculate expected value based on aggregation type
      switch (type) {
        case 'sum':
          validation.expectedValue = parsedInputs.reduce((sum, val) => sum + val, 0)
          break
        case 'avg':
          validation.expectedValue = parsedInputs.length > 0 
            ? parsedInputs.reduce((sum, val) => sum + val, 0) / parsedInputs.length 
            : 0
          break
        case 'count':
          validation.expectedValue = parsedInputs.length
          break
        case 'max':
          validation.expectedValue = parsedInputs.length > 0 ? Math.max(...parsedInputs) : 0
          break
        case 'min':
          validation.expectedValue = parsedInputs.length > 0 ? Math.min(...parsedInputs) : 0
          break
        default:
          validation.errors.push(`Unsupported aggregation type: ${type}`)
          return validation
      }

      // Calculate discrepancy
      validation.discrepancy = Math.abs(validation.actualValue - validation.expectedValue)
      
      // Determine tolerance based on value magnitude
      const tolerance = Math.max(0.01, Math.abs(validation.expectedValue) * 0.001) // 0.1% or minimum $0.01
      
      validation.isValid = validation.discrepancy <= tolerance
      validation.confidence = validation.isValid ? 0.95 : 0.3

      // Add specific error messages
      if (!validation.isValid) {
        validation.errors.push(
          `${type.toUpperCase()} calculation mismatch: expected ${this.formatAsCurrency(validation.expectedValue)}, ` +
          `got ${this.formatAsCurrency(validation.actualValue)}, ` +
          `discrepancy: ${this.formatAsCurrency(validation.discrepancy)}`
        )
      }

      // Check for suspicious zero results
      if (validation.actualValue === 0 && validation.expectedValue !== 0) {
        validation.errors.push('Result is zero but expected non-zero value based on inputs')
      }

    } catch (error) {
      validation.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return validation
  }

  /**
   * Detect and fix common currency parsing issues
   */
  static detectAndFixCommonIssues(value: string | number): {
    originalValue: string | number
    fixedValue: number
    issuesFound: string[]
    fixesApplied: string[]
  } {
    const result = {
      originalValue: value,
      fixedValue: 0,
      issuesFound: [] as string[],
      fixesApplied: [] as string[]
    }

    if (typeof value === 'number') {
      result.fixedValue = value
      return result
    }

    let stringValue = String(value)

    // Issue 1: Multiple currency symbols
    if ((stringValue.match(/\$/g) || []).length > 1) {
      result.issuesFound.push('Multiple dollar signs detected')
      stringValue = stringValue.replace(/\$+/g, '$')
      result.fixesApplied.push('Removed duplicate dollar signs')
    }

    // Issue 2: Mixed separators (both comma and period in wrong positions)
    if (stringValue.includes(',') && stringValue.includes('.')) {
      const commaIndex = stringValue.lastIndexOf(',')
      const periodIndex = stringValue.lastIndexOf('.')
      
      if (commaIndex > periodIndex) {
        // European format: 1.234,56 -> 1234.56
        result.issuesFound.push('European number format detected')
        stringValue = stringValue.replace(/\./g, '').replace(',', '.')
        result.fixesApplied.push('Converted European format to US format')
      }
    }

    // Issue 3: Scientific notation
    if (stringValue.toLowerCase().includes('e')) {
      result.issuesFound.push('Scientific notation detected')
      const parsed = parseFloat(stringValue)
      if (isFinite(parsed)) {
        stringValue = parsed.toString()
        result.fixesApplied.push('Converted scientific notation to decimal')
      }
    }

    // Issue 4: Extra whitespace and hidden characters
    const cleanedValue = stringValue.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
    if (cleanedValue !== stringValue) {
      result.issuesFound.push('Hidden characters or extra whitespace detected')
      stringValue = cleanedValue
      result.fixesApplied.push('Removed hidden characters and extra whitespace')
    }

    // Parse the fixed value
    const parseResult = this.parse(stringValue)
    result.fixedValue = parseResult.value

    return result
  }

  /**
   * Calculate confidence score for parsing result
   */
  private static calculateParsingConfidence(original: string, parsed: number): number {
    let confidence = 0.9

    // Reduce confidence for complex formats
    if (original.includes('(') || original.includes(')')) confidence -= 0.1
    if (original.includes('%')) confidence -= 0.05
    if ((original.match(/[,$]/g) || []).length > 2) confidence -= 0.1
    if (original.includes('e') || original.includes('E')) confidence -= 0.1

    // Increase confidence for simple formats
    if (/^\d+\.?\d*$/.test(original)) confidence = 0.99
    if (/^\$\d+\.?\d*$/.test(original)) confidence = 0.98

    // Check for consistency
    if (parsed === 0 && !original.includes('0')) confidence = 0.2

    return Math.max(0.1, Math.min(0.99, confidence))
  }

  /**
   * Validate currency ranges for specific data sources
   */
  static validateRange(value: number, context: {
    dataSource: 'coupa' | 'baan'
    field: string
    aggregationType?: string
  }): {
    isValid: boolean
    isWithinRange: boolean
    isReasonable: boolean
    warnings: string[]
  } {
    const result = {
      isValid: true,
      isWithinRange: true,
      isReasonable: true,
      warnings: [] as string[]
    }

    // Define reasonable ranges based on data source
    const ranges = {
      coupa: {
        amount: { min: -1000000, max: 100000000, reasonable: { min: 0, max: 10000000 } },
        total_amount: { min: 0, max: 500000000, reasonable: { min: 1000, max: 50000000 } }
      },
      baan: {
        reporting_total: { min: -500000, max: 50000000, reasonable: { min: 10, max: 5000000 } },
        total_amount: { min: 0, max: 100000000, reasonable: { min: 100, max: 20000000 } }
      }
    }

    const fieldRanges = ranges[context.dataSource]?.[context.field as keyof typeof ranges[typeof context.dataSource]]

    if (fieldRanges) {
      // Check absolute limits
      if (value < fieldRanges.min || value > fieldRanges.max) {
        result.isValid = false
        result.isWithinRange = false
        result.warnings.push(`Value ${value} is outside valid range [${fieldRanges.min}, ${fieldRanges.max}]`)
      }

      // Check reasonable limits
      if (value < fieldRanges.reasonable.min || value > fieldRanges.reasonable.max) {
        result.isReasonable = false
        result.warnings.push(`Value ${value} is outside reasonable range [${fieldRanges.reasonable.min}, ${fieldRanges.reasonable.max}]`)
      }
    }

    // Special checks for aggregated values
    if (context.aggregationType === 'sum' && value === 0) {
      result.warnings.push('Sum aggregation resulted in zero - verify data quality')
    }

    if (context.aggregationType === 'avg' && value < 0.01) {
      result.warnings.push('Average is very small - check for data scaling issues')
    }

    return result
  }
}