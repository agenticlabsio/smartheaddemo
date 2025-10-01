// Intelligent Query Classification System for Coupa/Baan Data Sources
import { GoogleGenAI } from '@google/genai'
import { DataSourceType, ClassificationResult } from '@/lib/types'

export type DataSourceClassification = DataSourceType

export class QueryClassifier {
  private ai: GoogleGenAI

  constructor() {
    this.ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "" 
    })
  }

  async classifyQuery(query: string): Promise<ClassificationResult> {
    try {
      const classificationPrompt = `
SMART HEAD QUERY CLASSIFICATION - MULTI-DATASET ANALYTICS EXPERT

Analyze this procurement analytics query and determine the optimal data source routing for Smarthead platform.

AVAILABLE DATA SOURCES:

**COUPA (Financial ERP Data)** - financial_data table:
- HFM Entities, Cost Groups, Cost Centers, GL Accounts
- Fiscal year/month/week analysis, finalization dates
- Financial amounts, budget variance, entity performance
- Keywords: entity, cost group, cost center, account, fiscal, budget, variance, financial, GL, FIM, HFM, amount, finalization
- Use Cases: CFO analytics, budget analysis, financial controls, entity performance, cost center variance

**BAAN (Procurement ERP Data)** - baanspending table:
- Suppliers, Commodities, Invoices, Purchase Orders
- Procurement spending, supplier performance, commodity analysis
- Invoice processing, PO ship-to locations, chart of accounts
- Keywords: supplier, commodity, invoice, procurement, purchase order, PO, spending, sourcing, vendor, contract
- Use Cases: Supplier analysis, procurement optimization, commodity management, sourcing strategy

**COMBINED** - Both datasets for comprehensive analysis:
- Cross-system reconciliation and integrated reporting
- Total spend analysis across financial and procurement systems
- Strategic enterprise-wide analytics requiring both datasets
- Use Cases: Enterprise dashboards, cross-system validation, comprehensive spend analysis

CLASSIFICATION RULES:

1. **COUPA Indicators** (Financial Focus):
   - Entity performance, cost group analysis, cost center variance
   - Fiscal year trends, budget vs actual, financial controls
   - GL account reconciliation, HFM reporting
   - CFO-level financial analytics

2. **BAAN Indicators** (Procurement Focus):
   - Supplier performance, commodity optimization
   - Procurement spending, sourcing strategy
   - Invoice processing, vendor management
   - Purchase order analysis, contract management

3. **COMBINED Indicators** (Enterprise Analysis):
   - Total spend across systems, enterprise dashboards
   - Cross-system validation, integrated reporting
   - Strategic insights requiring both financial and procurement data
   - Comprehensive analytics spanning both domains

4. **Analysis Type Classification**:
   - Financial: Budget, variance, entity performance, fiscal analysis
   - Procurement: Supplier, commodity, sourcing, vendor management
   - Strategic: Executive dashboards, enterprise insights, optimization
   - Operational: Process efficiency, transaction analysis, controls

QUERY TO CLASSIFY: "${query}"

RESPONSE FORMAT (JSON):
{
  "dataSource": "coupa|baan|combined",
  "confidence": 85-100,
  "reasoning": "Brief explanation for classification decision",
  "keyTerms": ["term1", "term2", "term3"],
  "analysisType": "financial|procurement|strategic|operational"
}

Analyze the query and provide classification with high confidence. Focus on key domain indicators and business context.`

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: classificationPrompt
      })

      const result = this.parseClassificationResponse(response.text || '')
      
      // Apply fallback logic if parsing fails
      if (!result.dataSource) {
        return this.fallbackClassification(query)
      }

      return result
    } catch (error) {
      console.error('Query classification error:', error)
      return this.fallbackClassification(query)
    }
  }

  private parseClassificationResponse(text: string): ClassificationResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          dataSource: parsed.dataSource || 'coupa',
          confidence: parsed.confidence || 75,
          reasoning: parsed.reasoning || 'Auto-classified based on content analysis',
          keyTerms: parsed.keyTerms || [],
          analysisType: parsed.analysisType || 'operational'
        }
      }

      // Fallback parsing if JSON structure is not clear
      return this.extractClassificationFromText(text)
    } catch (error) {
      console.error('Classification parsing error:', error)
      return this.fallbackClassification('')
    }
  }

  private extractClassificationFromText(text: string): ClassificationResult {
    const lowerText = text.toLowerCase()
    
    // Look for explicit data source mentions
    let dataSource: DataSourceClassification = 'coupa'
    let confidence = 70
    let reasoning = 'Text-based classification'
    let analysisType: 'financial' | 'procurement' | 'strategic' | 'operational' = 'operational'

    if (lowerText.includes('baan') || lowerText.includes('procurement')) {
      dataSource = 'baan'
      analysisType = 'procurement'
    } else if (lowerText.includes('combined') || lowerText.includes('both')) {
      dataSource = 'combined'
      analysisType = 'strategic'
    } else if (lowerText.includes('coupa') || lowerText.includes('financial')) {
      dataSource = 'coupa'
      analysisType = 'financial'
    }

    return {
      dataSource,
      confidence,
      reasoning,
      keyTerms: this.extractKeyTerms(text),
      analysisType
    }
  }

  private extractKeyTerms(text: string): string[] {
    const termsList = [
      'entity', 'cost group', 'cost center', 'account', 'fiscal', 'budget', 'variance', 'financial', 'HFM', 'FIM',
      'supplier', 'commodity', 'invoice', 'procurement', 'purchase order', 'vendor', 'sourcing', 'contract'
    ]
    
    const lowerText = text.toLowerCase()
    const foundTerms: string[] = []
    
    termsList.forEach(term => {
      if (lowerText.includes(term.toLowerCase())) {
        foundTerms.push(term)
      }
    })
    
    return foundTerms.slice(0, 5) // Limit to top 5 terms
  }

  private fallbackClassification(query: string): ClassificationResult {
    const lowerQuery = query.toLowerCase()
    
    // Rule-based fallback classification
    const baanKeywords = ['supplier', 'vendor', 'procurement', 'commodity', 'purchase', 'invoice', 'sourcing', 'contract']
    const coupaKeywords = ['entity', 'cost center', 'cost group', 'account', 'fiscal', 'budget', 'financial', 'variance']
    
    const baanScore = baanKeywords.filter(keyword => lowerQuery.includes(keyword)).length
    const coupaScore = coupaKeywords.filter(keyword => lowerQuery.includes(keyword)).length
    
    if (baanScore > coupaScore) {
      return {
        dataSource: 'baan',
        confidence: Math.min(60 + baanScore * 10, 95),
        reasoning: 'Procurement-focused keywords detected',
        keyTerms: baanKeywords.filter(keyword => lowerQuery.includes(keyword)),
        analysisType: 'procurement'
      }
    } else if (coupaScore > 0) {
      return {
        dataSource: 'coupa',
        confidence: Math.min(60 + coupaScore * 10, 95),
        reasoning: 'Financial-focused keywords detected',
        keyTerms: coupaKeywords.filter(keyword => lowerQuery.includes(keyword)),
        analysisType: 'financial'
      }
    } else {
      // Default to coupa for general queries
      return {
        dataSource: 'coupa',
        confidence: 50,
        reasoning: 'Default classification - no specific domain keywords detected',
        keyTerms: [],
        analysisType: 'operational'
      }
    }
  }

  // Quick classification for known query patterns
  async quickClassify(query: string): Promise<DataSourceClassification> {
    const lowerQuery = query.toLowerCase()
    
    // Fast pattern matching for common cases
    if (lowerQuery.includes('supplier') || lowerQuery.includes('vendor') || lowerQuery.includes('procurement')) {
      return 'baan'
    }
    
    if (lowerQuery.includes('entity') || lowerQuery.includes('cost center') || lowerQuery.includes('budget')) {
      return 'coupa'
    }
    
    if (lowerQuery.includes('total spend') || lowerQuery.includes('enterprise') || lowerQuery.includes('overall')) {
      return 'combined'
    }
    
    // Default to coupa for ambiguous queries
    return 'coupa'
  }
}