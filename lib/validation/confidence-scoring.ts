// Confidence Scoring and Error Detection System
// Implements reactive confidence scoring for financial data validation

export interface ConfidenceScore {
  overall: number
  components: {
    dataQuality: number
    calculationAccuracy: number
    formatConsistency: number
    businessLogic: number
    rangeValidation: number
  }
  factors: ConfidenceFactor[]
  recommendation: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ConfidenceFactor {
  type: 'positive' | 'negative'
  category: 'data' | 'calculation' | 'format' | 'business' | 'range'
  impact: number // -1.0 to 1.0
  description: string
  weight: number // 0.0 to 1.0
}

export interface ErrorDetectionResult {
  errorsDetected: DetectedError[]
  errorPatterns: ErrorPattern[]
  riskAssessment: RiskAssessment
  recommendedActions: string[]
  preventiveMeasures: string[]
}

export interface DetectedError {
  type: 'calculation' | 'format' | 'logic' | 'data_quality' | 'business_rule'
  severity: 'critical' | 'high' | 'medium' | 'low'
  confidence: number
  description: string
  location: string
  impact: string
  suggestedFix: string
}

export interface ErrorPattern {
  pattern: string
  frequency: number
  impact: 'critical' | 'high' | 'medium' | 'low'
  description: string
  preventionStrategy: string
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical'
  specificRisks: SpecificRisk[]
  mitigationPriority: string[]
  businessImpact: string
}

export interface SpecificRisk {
  category: 'financial' | 'operational' | 'compliance' | 'reputation'
  description: string
  probability: number // 0.0 to 1.0
  impact: number // 0.0 to 1.0
  riskScore: number // probability * impact
}

export class ConfidenceScoringSystem {

  /**
   * Calculate comprehensive confidence score for financial data
   */
  static calculateConfidenceScore(
    validationResults: any[],
    context: {
      dataSource: 'coupa' | 'baan'
      recordCount: number
      calculationType: string
      businessContext: string
    }
  ): ConfidenceScore {
    const score: ConfidenceScore = {
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
    }

    // Calculate component scores
    score.components.dataQuality = this.calculateDataQualityScore(validationResults, context)
    score.components.calculationAccuracy = this.calculateCalculationAccuracyScore(validationResults)
    score.components.formatConsistency = this.calculateFormatConsistencyScore(validationResults)
    score.components.businessLogic = this.calculateBusinessLogicScore(validationResults, context)
    score.components.rangeValidation = this.calculateRangeValidationScore(validationResults, context)

    // Extract confidence factors
    score.factors = this.extractConfidenceFactors(validationResults, context)

    // Calculate weighted overall score
    score.overall = this.calculateWeightedScore(score.components, score.factors)

    // Determine risk level and recommendation
    score.riskLevel = this.determineRiskLevel(score.overall, score.factors)
    score.recommendation = this.generateRecommendation(score)

    return score
  }

  /**
   * Detect and analyze errors in financial data
   */
  static detectErrors(
    data: any[],
    validationResults: any[],
    context: any
  ): ErrorDetectionResult {
    const result: ErrorDetectionResult = {
      errorsDetected: [],
      errorPatterns: [],
      riskAssessment: {
        overallRisk: 'low',
        specificRisks: [],
        mitigationPriority: [],
        businessImpact: ''
      },
      recommendedActions: [],
      preventiveMeasures: []
    }

    // Detect specific errors
    result.errorsDetected = this.detectSpecificErrors(data, validationResults, context)

    // Identify error patterns
    result.errorPatterns = this.identifyErrorPatterns(result.errorsDetected)

    // Assess risks
    result.riskAssessment = this.assessRisks(result.errorsDetected, result.errorPatterns, context)

    // Generate recommendations
    result.recommendedActions = this.generateErrorRecommendations(result.errorsDetected)
    result.preventiveMeasures = this.generatePreventiveMeasures(result.errorPatterns)

    return result
  }

  /**
   * Calculate data quality score
   */
  private static calculateDataQualityScore(
    validationResults: any[],
    context: any
  ): number {
    let score = 0.9 // Start with high baseline

    const totalResults = validationResults.length
    if (totalResults === 0) return 0.5

    // Count quality issues
    let nullValues = 0
    let parseErrors = 0
    let formatIssues = 0

    for (const result of validationResults) {
      if (result.errors) {
        parseErrors += result.errors.filter((e: any) => e.type === 'format' || e.type === 'currency').length
        formatIssues += result.errors.filter((e: any) => e.type === 'format').length
      }
      if (result.originalValue === null || result.originalValue === undefined) {
        nullValues++
      }
    }

    // Apply penalties
    score -= (nullValues / totalResults) * 0.3 // Penalty for null values
    score -= (parseErrors / totalResults) * 0.4 // Penalty for parsing errors
    score -= (formatIssues / totalResults) * 0.2 // Penalty for format issues

    // Bonus for data source reliability
    if (context.dataSource === 'coupa') score += 0.05 // Coupa typically more reliable
    if (context.recordCount > 1000) score += 0.05 // Large datasets often more reliable

    return Math.max(0.1, Math.min(0.99, score))
  }

  /**
   * Calculate calculation accuracy score
   */
  private static calculateCalculationAccuracyScore(validationResults: any[]): number {
    let score = 0.95 // Start high for calculations

    let calculationErrors = 0
    let totalCalculations = 0

    for (const result of validationResults) {
      if (result.calculatedValue !== undefined) {
        totalCalculations++
        if (result.errors?.some((e: any) => e.type === 'calculation')) {
          calculationErrors++
        }
      }
    }

    if (totalCalculations === 0) return 0.8 // Neutral if no calculations

    // Apply penalties
    const errorRate = calculationErrors / totalCalculations
    score -= errorRate * 0.5 // Strong penalty for calculation errors

    return Math.max(0.1, Math.min(0.99, score))
  }

  /**
   * Calculate format consistency score
   */
  private static calculateFormatConsistencyScore(validationResults: any[]): number {
    let score = 0.9

    let formatErrors = 0
    let totalFormatChecks = 0

    for (const result of validationResults) {
      if (result.originalValue !== undefined) {
        totalFormatChecks++
        if (result.errors?.some((e: any) => e.type === 'format' || e.type === 'currency')) {
          formatErrors++
        }
      }
    }

    if (totalFormatChecks === 0) return 0.8

    const errorRate = formatErrors / totalFormatChecks
    score -= errorRate * 0.4

    return Math.max(0.1, Math.min(0.99, score))
  }

  /**
   * Calculate business logic score
   */
  private static calculateBusinessLogicScore(validationResults: any[], context: any): number {
    let score = 0.85

    let logicErrors = 0
    let businessRuleViolations = 0

    for (const result of validationResults) {
      if (result.errors) {
        logicErrors += result.errors.filter((e: any) => e.type === 'logic').length
        businessRuleViolations += result.errors.filter((e: any) => e.type === 'business_rule').length
      }
    }

    // Apply penalties
    score -= logicErrors * 0.1
    score -= businessRuleViolations * 0.15

    // Context-specific adjustments
    if (context.businessContext === 'executive_summary') {
      score += 0.05 // Higher standards for executive summaries
    }

    return Math.max(0.1, Math.min(0.99, score))
  }

  /**
   * Calculate range validation score
   */
  private static calculateRangeValidationScore(validationResults: any[], context: any): number {
    let score = 0.9

    let rangeViolations = 0
    let totalRangeChecks = 0

    for (const result of validationResults) {
      if (result.errors) {
        const rangeErrors = result.errors.filter((e: any) => e.type === 'range')
        rangeViolations += rangeErrors.length
        totalRangeChecks++
      }
    }

    if (totalRangeChecks === 0) return 0.85

    const violationRate = rangeViolations / totalRangeChecks
    score -= violationRate * 0.3

    return Math.max(0.1, Math.min(0.99, score))
  }

  /**
   * Extract confidence factors from validation results
   */
  private static extractConfidenceFactors(
    validationResults: any[],
    context: any
  ): ConfidenceFactor[] {
    const factors: ConfidenceFactor[] = []

    // Positive factors
    if (context.recordCount > 100) {
      factors.push({
        type: 'positive',
        category: 'data',
        impact: 0.1,
        description: 'Large sample size increases confidence',
        weight: 0.8
      })
    }

    if (context.dataSource === 'coupa') {
      factors.push({
        type: 'positive',
        category: 'data',
        impact: 0.05,
        description: 'Coupa data source is generally reliable',
        weight: 0.6
      })
    }

    // Negative factors
    const errorCount = validationResults.reduce((count, result) => 
      count + (result.errors?.length || 0), 0)

    if (errorCount > 0) {
      factors.push({
        type: 'negative',
        category: 'calculation',
        impact: -Math.min(0.5, errorCount * 0.1),
        description: `${errorCount} validation errors detected`,
        weight: 0.9
      })
    }

    const zeroResults = validationResults.filter(result => 
      result.originalValue === 0 || result.calculatedValue === 0).length

    if (zeroResults > 0) {
      factors.push({
        type: 'negative',
        category: 'business',
        impact: -Math.min(0.3, zeroResults * 0.05),
        description: `${zeroResults} zero values detected in financial calculations`,
        weight: 0.8
      })
    }

    return factors
  }

  /**
   * Calculate weighted overall score
   */
  private static calculateWeightedScore(
    components: ConfidenceScore['components'],
    factors: ConfidenceFactor[]
  ): number {
    // Component weights
    const weights = {
      dataQuality: 0.25,
      calculationAccuracy: 0.3,
      formatConsistency: 0.15,
      businessLogic: 0.2,
      rangeValidation: 0.1
    }

    // Calculate base score
    let baseScore = 0
    baseScore += components.dataQuality * weights.dataQuality
    baseScore += components.calculationAccuracy * weights.calculationAccuracy
    baseScore += components.formatConsistency * weights.formatConsistency
    baseScore += components.businessLogic * weights.businessLogic
    baseScore += components.rangeValidation * weights.rangeValidation

    // Apply factor adjustments
    for (const factor of factors) {
      baseScore += factor.impact * factor.weight
    }

    return Math.max(0.1, Math.min(0.99, baseScore))
  }

  /**
   * Determine risk level based on confidence score
   */
  private static determineRiskLevel(
    score: number,
    factors: ConfidenceFactor[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Check for critical factors first
    const criticalFactors = factors.filter(f => 
      f.type === 'negative' && Math.abs(f.impact) > 0.3)

    if (criticalFactors.length > 0) return 'critical'

    if (score < 0.4) return 'critical'
    if (score < 0.6) return 'high'
    if (score < 0.8) return 'medium'
    return 'low'
  }

  /**
   * Generate recommendation based on confidence score
   */
  private static generateRecommendation(score: ConfidenceScore): string {
    switch (score.riskLevel) {
      case 'critical':
        return 'CRITICAL: Do not use this data for decision-making. Immediate investigation required.'
      case 'high':
        return 'HIGH RISK: Verify calculations manually before use. Multiple validation errors detected.'
      case 'medium':
        return 'MEDIUM RISK: Review flagged items. Consider additional validation before final use.'
      case 'low':
        return 'LOW RISK: Data appears reliable. Normal monitoring recommended.'
      default:
        return 'Review recommended.'
    }
  }

  /**
   * Detect specific errors in data
   */
  private static detectSpecificErrors(
    data: any[],
    validationResults: any[],
    context: any
  ): DetectedError[] {
    const errors: DetectedError[] = []

    // Pattern 1: Zero value in aggregation results
    const zeroResults = validationResults.filter(result => 
      result.originalValue === 0 && result.calculatedValue !== 0)

    for (const result of zeroResults) {
      errors.push({
        type: 'calculation',
        severity: 'critical',
        confidence: 0.9,
        description: 'Aggregation result is zero but calculated value is non-zero',
        location: 'SQL aggregation function',
        impact: 'Incorrect financial reporting showing $0.0M instead of actual amounts',
        suggestedFix: 'Review SQL query and currency parsing logic'
      })
    }

    // Pattern 2: Currency parsing failures
    const parseFailures = validationResults.filter(result =>
      result.errors?.some((e: any) => e.type === 'currency'))

    for (const result of parseFailures) {
      errors.push({
        type: 'format',
        severity: 'high',
        confidence: 0.85,
        description: 'Currency value could not be parsed correctly',
        location: 'Data import/parsing layer',
        impact: 'Financial amounts may be incorrectly calculated or displayed',
        suggestedFix: 'Enhance currency parsing to handle all input formats'
      })
    }

    return errors
  }

  /**
   * Identify error patterns
   */
  private static identifyErrorPatterns(errors: DetectedError[]): ErrorPattern[] {
    const patterns: ErrorPattern[] = []

    // Group errors by type
    const errorGroups = errors.reduce((groups, error) => {
      if (!groups[error.type]) groups[error.type] = []
      groups[error.type].push(error)
      return groups
    }, {} as Record<string, DetectedError[]>)

    for (const [type, typeErrors] of Object.entries(errorGroups)) {
      if (typeErrors.length > 1) {
        patterns.push({
          pattern: `Recurring ${type} errors`,
          frequency: typeErrors.length,
          impact: this.determinePatternImpact(typeErrors),
          description: `Multiple ${type} errors detected across the dataset`,
          preventionStrategy: this.getPreventionStrategy(type)
        })
      }
    }

    return patterns
  }

  /**
   * Assess risks based on detected errors
   */
  private static assessRisks(
    errors: DetectedError[],
    patterns: ErrorPattern[],
    context: any
  ): RiskAssessment {
    const assessment: RiskAssessment = {
      overallRisk: 'low',
      specificRisks: [],
      mitigationPriority: [],
      businessImpact: ''
    }

    // Calculate specific risks
    const criticalErrors = errors.filter(e => e.severity === 'critical')
    const highErrors = errors.filter(e => e.severity === 'high')

    if (criticalErrors.length > 0) {
      assessment.specificRisks.push({
        category: 'financial',
        description: 'Critical calculation errors could lead to incorrect financial reporting',
        probability: 0.9,
        impact: 0.9,
        riskScore: 0.81
      })
    }

    if (patterns.some(p => p.impact === 'critical')) {
      assessment.specificRisks.push({
        category: 'operational',
        description: 'Systematic errors indicate underlying process issues',
        probability: 0.8,
        impact: 0.7,
        riskScore: 0.56
      })
    }

    // Determine overall risk
    const maxRiskScore = Math.max(...assessment.specificRisks.map(r => r.riskScore), 0)
    
    if (maxRiskScore > 0.7) assessment.overallRisk = 'critical'
    else if (maxRiskScore > 0.5) assessment.overallRisk = 'high'
    else if (maxRiskScore > 0.3) assessment.overallRisk = 'medium'

    // Set business impact
    assessment.businessImpact = this.determineBusinessImpact(assessment.overallRisk, context)

    // Set mitigation priorities
    assessment.mitigationPriority = this.setMitigationPriorities(errors, patterns)

    return assessment
  }

  /**
   * Generate error-specific recommendations
   */
  private static generateErrorRecommendations(errors: DetectedError[]): string[] {
    const recommendations: string[] = []

    if (errors.some(e => e.type === 'calculation')) {
      recommendations.push('Implement enhanced SQL query validation before execution')
      recommendations.push('Add real-time calculation verification against expected ranges')
    }

    if (errors.some(e => e.type === 'format')) {
      recommendations.push('Upgrade currency parsing logic to handle all input formats')
      recommendations.push('Add format validation at data import stage')
    }

    return recommendations
  }

  /**
   * Generate preventive measures
   */
  private static generatePreventiveMeasures(patterns: ErrorPattern[]): string[] {
    const measures: string[] = []

    if (patterns.length > 0) {
      measures.push('Implement automated validation checkpoints in data processing pipeline')
      measures.push('Add monitoring alerts for recurring error patterns')
      measures.push('Establish data quality metrics and thresholds')
    }

    return measures
  }

  private static determinePatternImpact(errors: DetectedError[]): 'critical' | 'high' | 'medium' | 'low' {
    const criticalCount = errors.filter(e => e.severity === 'critical').length
    const highCount = errors.filter(e => e.severity === 'high').length

    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'high'
    if (errors.length > 3) return 'medium'
    return 'low'
  }

  private static getPreventionStrategy(errorType: string): string {
    const strategies = {
      calculation: 'Implement validation checkpoints before presenting results',
      format: 'Enhance data parsing and validation at import stage',
      logic: 'Add business rule validation to calculation workflows',
      data_quality: 'Implement data quality monitoring and cleansing processes'
    }
    return strategies[errorType as keyof typeof strategies] || 'Review and improve validation processes'
  }

  private static determineBusinessImpact(riskLevel: string, context: any): string {
    const impacts = {
      critical: 'Potential for significant financial misreporting and executive decision-making errors',
      high: 'Risk of incorrect financial analysis affecting business decisions',
      medium: 'Data quality issues may impact analytical accuracy',
      low: 'Minimal impact on business operations'
    }
    return impacts[riskLevel as keyof typeof impacts] || 'Impact assessment needed'
  }

  private static setMitigationPriorities(errors: DetectedError[], patterns: ErrorPattern[]): string[] {
    const priorities: string[] = []

    if (errors.some(e => e.severity === 'critical')) {
      priorities.push('Immediate: Fix critical calculation errors')
    }

    if (patterns.some(p => p.impact === 'critical')) {
      priorities.push('High: Address systematic error patterns')
    }

    if (errors.some(e => e.type === 'format')) {
      priorities.push('Medium: Improve data format handling')
    }

    return priorities
  }
}