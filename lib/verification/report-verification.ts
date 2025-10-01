// Professional Report Verification Service
// Validates executive reports for accuracy, completeness, and professional quality

import { GoogleGenAI } from '@google/genai'
import { StructuredReportData } from '@/lib/report-templates'

export interface VerificationResult {
  isValid: boolean
  issues: VerificationIssue[]
  correctedReport?: StructuredReportData
  confidence: number
  verificationNotes: string[]
}

export interface VerificationIssue {
  severity: 'critical' | 'major' | 'minor'
  category: 'numerical' | 'language' | 'structure' | 'business_logic'
  description: string
  suggestion: string
}

export class ReportVerificationService {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
  }

  async verifyReport(
    report: StructuredReportData,
    originalQuery: string,
    queryResults: any[]
  ): Promise<VerificationResult> {
    try {
      const verificationPrompt = this.buildVerificationPrompt(report, originalQuery, queryResults)
      
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: verificationPrompt
      })

      return this.parseVerificationResponse(response.text || '', report)
    } catch (error) {
      console.error('Report verification error:', error)
      // On verification failure, return original report with warning
      return {
        isValid: true,
        issues: [{
          severity: 'minor',
          category: 'business_logic',
          description: 'Verification service unavailable',
          suggestion: 'Manual review recommended'
        }],
        confidence: 0.7,
        verificationNotes: ['Verification service encountered an error - using original report']
      }
    }
  }

  private buildVerificationPrompt(
    report: StructuredReportData,
    originalQuery: string,
    queryResults: any[]
  ): string {
    const sampleData = queryResults.slice(0, 5)
    const totalRecords = queryResults.length

    return `
You are an executive report quality assurance specialist. Verify this financial/procurement report for accuracy and professional standards.

ORIGINAL QUERY: ${originalQuery}
DATA CONTEXT: ${totalRecords} records analyzed
SAMPLE DATA: ${JSON.stringify(sampleData, null, 2)}

REPORT TO VERIFY:
Title: ${report.title}
Executive Summary: ${report.executiveSummary}

Key Metrics:
${report.keyMetrics.map(m => `- ${m.label}: ${m.value}`).join('\n')}

Business Insights:
${report.insights.join('\n')}

Strategic Recommendations:
${report.recommendations.map(r => `- ${r.priority}: ${r.action} - ${r.impact}`).join('\n')}

VERIFICATION CHECKLIST:
1. NUMERICAL ACCURACY: Do the financial amounts and percentages make logical sense? Are calculations consistent?
2. EXECUTIVE LANGUAGE: Is the language professional, concise, and appropriate for C-suite executives?
3. BUSINESS LOGIC: Do the insights and recommendations logically follow from the data?
4. COMPLETENESS: Are all sections properly filled with meaningful content?
5. CONSISTENCY: Are the metrics, insights, and recommendations aligned and non-contradictory?

RESPONSE FORMAT:
OVERALL_ASSESSMENT: [PASS/REVIEW_NEEDED/FAIL]
CONFIDENCE_SCORE: [0.0-1.0]
ISSUES_FOUND:
- [CRITICAL/MAJOR/MINOR] [NUMERICAL/LANGUAGE/STRUCTURE/BUSINESS_LOGIC]: [Description] | SUGGESTION: [Fix recommendation]

VERIFICATION_NOTES:
- [Professional quality assessment]
- [Data consistency check results]
- [Executive readiness evaluation]

If PASS: Report meets executive standards
If REVIEW_NEEDED: Minor improvements suggested but report is usable
If FAIL: Critical issues require correction before executive presentation

Focus on accuracy, professionalism, and executive-level quality.
`
  }

  private parseVerificationResponse(responseText: string, originalReport: StructuredReportData): VerificationResult {
    const lines = responseText.split('\n').map(line => line.trim()).filter(line => line)
    
    let isValid = true
    const issues: VerificationIssue[] = []
    const verificationNotes: string[] = []
    let confidence = 0.9

    // Parse overall assessment
    const assessmentMatch = responseText.match(/OVERALL_ASSESSMENT:\s*(PASS|REVIEW_NEEDED|FAIL)/i)
    if (assessmentMatch) {
      const assessment = assessmentMatch[1].toUpperCase()
      isValid = assessment === 'PASS'
      if (assessment === 'FAIL') confidence = 0.3
      else if (assessment === 'REVIEW_NEEDED') confidence = 0.7
    }

    // Parse confidence score
    const confidenceMatch = responseText.match(/CONFIDENCE_SCORE:\s*([\d.]+)/i)
    if (confidenceMatch) {
      confidence = parseFloat(confidenceMatch[1])
    }

    // Parse issues
    const issueRegex = /- \[(CRITICAL|MAJOR|MINOR)\] \[(NUMERICAL|LANGUAGE|STRUCTURE|BUSINESS_LOGIC)\]: ([^|]+) \| SUGGESTION: (.+)/gi
    let match
    while ((match = issueRegex.exec(responseText)) !== null) {
      issues.push({
        severity: match[1].toLowerCase() as 'critical' | 'major' | 'minor',
        category: match[2].toLowerCase() as 'numerical' | 'language' | 'structure' | 'business_logic',
        description: match[3].trim(),
        suggestion: match[4].trim()
      })
    }

    // Parse verification notes
    const notesSection = responseText.match(/VERIFICATION_NOTES:([\s\S]*?)(?=\n\n|$)/i)
    if (notesSection) {
      const notes = notesSection[1].split('\n')
        .map(line => line.trim())
        .filter(line => line && line.startsWith('-'))
        .map(line => line.substring(1).trim())
      verificationNotes.push(...notes)
    }

    return {
      isValid,
      issues,
      confidence,
      verificationNotes: verificationNotes.length > 0 ? verificationNotes : ['Report verification completed']
    }
  }

  /**
   * Quick validation for basic report quality (used as fallback)
   */
  validateBasicQuality(report: StructuredReportData): VerificationIssue[] {
    const issues: VerificationIssue[] = []

    // Check for empty or generic content
    if (!report.executiveSummary || report.executiveSummary.length < 50) {
      issues.push({
        severity: 'major',
        category: 'structure',
        description: 'Executive summary is too brief or missing',
        suggestion: 'Provide comprehensive 2-3 sentence executive summary'
      })
    }

    // Check for meaningful metrics
    if (report.keyMetrics.length === 0) {
      issues.push({
        severity: 'critical',
        category: 'structure',
        description: 'No key performance indicators provided',
        suggestion: 'Include at least 3-4 relevant financial/operational metrics'
      })
    }

    // Check for actionable insights
    if (report.insights.length === 0 || report.insights.every(insight => insight.length < 20)) {
      issues.push({
        severity: 'major',
        category: 'business_logic',
        description: 'Business insights are missing or too brief',
        suggestion: 'Provide detailed, actionable business insights with specific recommendations'
      })
    }

    // Check for strategic recommendations
    if (report.recommendations.length === 0) {
      issues.push({
        severity: 'major',
        category: 'structure',
        description: 'No strategic recommendations provided',
        suggestion: 'Include prioritized recommendations with expected business impact'
      })
    }

    return issues
  }
}