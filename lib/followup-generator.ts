// Intelligent follow-up query generation based on conversation context
export interface FollowUpContext {
  currentQuery: string
  responseContent: string
  queryType?: string
  confidence?: number
  recordCount?: number
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    queryType?: string
  }>
}

export class FollowUpGenerator {
  
  // Generate contextual follow-up queries - exactly 3 highly relevant suggestions
  generateFollowUps(context: FollowUpContext): string[] {
    const candidateFollowUps: Array<{query: string, score: number, category: string}> = []
    
    // Generate candidates from different categories
    const analyticalFollowUps = this.generateAnalyticalFollowUps(context)
    const explorationFollowUps = this.generateExplorationFollowUps(context)
    const comparativeFollowUps = this.generateComparativeFollowUps(context)
    const trendFollowUps = this.generateTrendFollowUps(context)
    
    // Score and categorize all candidates
    analyticalFollowUps.forEach(query => {
      candidateFollowUps.push({
        query,
        score: this.scoreFollowUpRelevance(query, context, 'analytical'),
        category: 'analytical'
      })
    })
    
    explorationFollowUps.forEach(query => {
      candidateFollowUps.push({
        query,
        score: this.scoreFollowUpRelevance(query, context, 'exploration'),
        category: 'exploration'
      })
    })
    
    comparativeFollowUps.forEach(query => {
      candidateFollowUps.push({
        query,
        score: this.scoreFollowUpRelevance(query, context, 'comparative'),
        category: 'comparative'
      })
    })
    
    trendFollowUps.forEach(query => {
      candidateFollowUps.push({
        query,
        score: this.scoreFollowUpRelevance(query, context, 'trend'),
        category: 'trend'
      })
    })
    
    // Remove duplicates
    const uniqueCandidates = this.removeDuplicates(candidateFollowUps)
    
    // Select top 3 with intelligent ranking ensuring diversity
    return this.selectTop3WithDiversity(uniqueCandidates, context)
  }
  
  private generateAnalyticalFollowUps(context: FollowUpContext): string[] {
    const followUps: string[] = []
    const { currentQuery, responseContent, queryType, recordCount } = context
    
    // Enhanced financial transaction analysis based on real procurement insights
    
    // Advanced variance and risk analysis
    if (this.containsKeywords(currentQuery, ['variance', 'volatility', 'risk', 'cost center'])) {
      followUps.push('Identify cost centers showing seasonal patterns vs random volatility for budget planning')
      followUps.push('Analyze vendor concentration risks and single-source dependencies')
      followUps.push('Review cost category consolidation opportunities across entities')
    }
    
    // Strategic spending and cost optimization
    if (this.containsKeywords(currentQuery, ['spend', 'cost', 'amount', 'total', 'budget'])) {
      followUps.push('Analyze spending acceleration patterns and underlying business drivers')
      followUps.push('Identify entities with consistent overpayment patterns for cost optimization')
      followUps.push('Review quarterly spending trends and forecast future budget requirements')
    }
    
    // Entity performance and operational efficiency
    if (this.containsKeywords(currentQuery, ['entity', 'entities', 'asheville', 'tiger', 'group', 'efficiency'])) {
      followUps.push('Compare procurement efficiency metrics across high-performing entities')
      followUps.push('Analyze predictable vs volatile spending patterns for forecasting accuracy')
      followUps.push('Identify best practices from top-performing entities for standardization')
    }
    
    // Financial process optimization
    if (this.containsKeywords(currentQuery, ['account', 'vendor', 'consolidation', 'professional fees', 'process'])) {
      followUps.push('Map accounts serving multiple entities for consolidation opportunities')
      followUps.push('Evaluate vendor portfolio optimization potential by cost category')
      followUps.push('Analyze payment terms and invoice processing efficiency by vendor')
    }
    
    // Time-series and predictive financial analysis
    if (this.containsKeywords(currentQuery, ['quarter', 'Q1', 'Q2', 'Q3', 'Q4', 'year', 'month', 'fiscal', 'forecast', 'trend'])) {
      followUps.push('Identify seasonal spending patterns for improved budget allocation')
      followUps.push('Analyze business events causing spending inflection points')
      followUps.push('Generate predictive spending forecasts based on historical patterns')
    }
    
    // Compliance and financial control analysis
    if (this.containsKeywords(currentQuery, ['fraud', 'outlier', 'violation', 'compliance', 'transaction', 'audit'])) {
      followUps.push('Detect transaction anomalies and potential compliance violations')
      followUps.push('Review approval workflow adherence and control effectiveness')
      followUps.push('Analyze payment pattern irregularities for fraud prevention')
    }
    
    // Transaction volume and complexity analysis
    if (recordCount && recordCount > 1000) {
      followUps.push('Summarize key financial insights from large transaction dataset')
      followUps.push('Identify high-impact transactions requiring management attention')
      followUps.push('Generate automated alerts for unusual spending patterns')
    } else if (recordCount && recordCount > 0) {
      followUps.push('Perform detailed financial analysis of selected transactions')
      followUps.push('Compare these transactions with historical benchmarks')
    }
    
    // Response content-driven analysis
    if (this.containsKeywords(responseContent, ['increase', 'decrease', 'high', 'low', 'significant'])) {
      followUps.push('Investigate root causes of identified financial variances')
      followUps.push('Develop action plan to address significant spending changes')
      followUps.push('Set up monitoring for continued financial performance tracking')
    }
    
    return followUps
  }
  
  private generateExplorationFollowUps(context: FollowUpContext): string[] {
    const followUps: string[] = []
    const { currentQuery, responseContent, recordCount } = context
    
    // Financial data exploration based on transaction volume
    if (recordCount && recordCount > 0) {
      if (recordCount > 1000) {
        followUps.push('Identify top spending patterns and anomalies in this large dataset')
        followUps.push('Extract key financial insights for executive dashboard')
      } else if (recordCount > 100) {
        followUps.push('Analyze detailed spending patterns and vendor relationships')
        followUps.push('Review transaction clusters for optimization opportunities')
      } else {
        followUps.push('Perform detailed financial analysis of these specific transactions')
        followUps.push('Compare these results with broader organizational benchmarks')
      }
    }
    
    // Content-driven financial exploration
    if (this.containsKeywords(responseContent, ['increase', 'decrease', 'trend', 'pattern', 'variance'])) {
      followUps.push('Analyze underlying business drivers causing these financial changes')
      followUps.push('Identify potential risks and opportunities from current trends')
      followUps.push('Develop predictive models based on observed patterns')
    }
    
    // Query-specific exploration paths
    if (this.containsKeywords(currentQuery, ['supplier', 'vendor'])) {
      followUps.push('Evaluate vendor performance metrics and contract compliance')
      followUps.push('Analyze supplier risk exposure and diversification opportunities')
    }
    
    if (this.containsKeywords(currentQuery, ['entity', 'business unit'])) {
      followUps.push('Compare cross-entity performance and identify best practices')
      followUps.push('Analyze entity-specific spending patterns and optimization potential')
    }
    
    return followUps
  }
  
  private generateComparativeFollowUps(context: FollowUpContext): string[] {
    const followUps: string[] = []
    const { currentQuery, conversationHistory, recordCount } = context
    
    // Smart comparative analysis based on conversation context
    const previousTopics = this.extractTopicsFromHistory(conversationHistory)
    
    // Entity-based comparisons
    if (previousTopics.includes('entity') && !this.containsKeywords(currentQuery, ['compare', 'vs', 'across'])) {
      followUps.push('Compare financial performance metrics across business entities')
      followUps.push('Benchmark entity spending efficiency and identify leaders')
    }
    
    // Category and cost group analysis
    if (previousTopics.includes('cost_group') && !this.containsKeywords(currentQuery, ['cost group', 'category'])) {
      followUps.push('Analyze spending distribution across cost categories')
      followUps.push('Compare cost group performance against budgeted amounts')
    }
    
    // Time-based comparisons
    if (previousTopics.includes('quarter') || previousTopics.includes('spending')) {
      followUps.push('Compare current period performance with historical trends')
      followUps.push('Analyze year-over-year spending growth by category')
    }
    
    // Volume-based intelligent comparisons
    if (recordCount && recordCount > 50) {
      followUps.push('Segment analysis: compare top vs bottom performers')
      followUps.push('Benchmark against industry standards and best practices')
    }
    
    // Generic but valuable comparisons
    if (!previousTopics.length || followUps.length === 0) {
      followUps.push('Compare with industry benchmarks and peer organizations')
      followUps.push('Analyze performance against budgeted targets')
    }
    
    return followUps
  }
  
  private generateTrendFollowUps(context: FollowUpContext): string[] {
    const followUps: string[] = []
    const { currentQuery, responseContent, recordCount } = context
    
    // Temporal analysis for financial trends
    if (!this.containsKeywords(currentQuery, ['trend', 'over time', 'timeline', 'historical'])) {
      followUps.push('Analyze spending trends and seasonal patterns over time')
      followUps.push('Generate predictive forecast for next quarter budget planning')
      followUps.push('Identify cyclical patterns and business drivers')
    }
    
    // Action-oriented insights based on findings
    if (this.containsKeywords(responseContent, ['high', 'low', 'variance', 'deviation', 'outlier'])) {
      followUps.push('Develop action plan to address identified financial variances')
      followUps.push('Prioritize areas requiring immediate management intervention')
      followUps.push('Create monitoring alerts for ongoing variance tracking')
    }
    
    // Forward-looking strategic analysis
    if (recordCount && recordCount > 100) {
      followUps.push('Model future spending scenarios based on current trends')
      followUps.push('Identify emerging financial risks and opportunities')
    }
    
    // Improvement and optimization focus
    if (this.containsKeywords(responseContent, ['opportunity', 'savings', 'efficiency', 'optimization'])) {
      followUps.push('Quantify potential cost savings and efficiency improvements')
      followUps.push('Develop implementation roadmap for identified opportunities')
    }
    
    return followUps
  }
  
  private extractTopicsFromHistory(history: Array<{role: string, content: string, queryType?: string}>): string[] {
    const topics: string[] = []
    
    for (const item of history) {
      if (item.role === 'user') {
        if (this.containsKeywords(item.content, ['entity', 'entities'])) topics.push('entity')
        if (this.containsKeywords(item.content, ['cost group', 'category'])) topics.push('cost_group')
        if (this.containsKeywords(item.content, ['quarter', 'Q1', 'Q2'])) topics.push('quarter')
        if (this.containsKeywords(item.content, ['spend', 'cost', 'amount'])) topics.push('spending')
      }
    }
    
    return [...new Set(topics)]
  }
  
  private containsKeywords(text: string, keywords: string[]): boolean {
    const lowerText = text.toLowerCase()
    return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }

  // Enhanced scoring system for followup relevance
  private scoreFollowUpRelevance(query: string, context: FollowUpContext, category: string): number {
    let score = 50 // Base score
    
    // Query type relevance boost
    if (context.queryType === 'analytical' && category === 'analytical') score += 20
    if (context.queryType === 'summary' && category === 'exploration') score += 15
    if (context.queryType === 'specific' && category === 'comparative') score += 15
    
    // Content relevance analysis
    const queryWords = query.toLowerCase().split(' ')
    const currentQueryWords = context.currentQuery.toLowerCase().split(' ')
    const responseWords = context.responseContent.toLowerCase().split(' ')
    
    // Boost for semantic overlap with current query
    const queryOverlap = this.calculateWordOverlap(queryWords, currentQueryWords)
    score += queryOverlap * 10
    
    // Boost for terms mentioned in response
    const responseOverlap = this.calculateWordOverlap(queryWords, responseWords)
    score += responseOverlap * 5
    
    // Business impact scoring
    if (this.isHighBusinessImpact(query)) score += 25
    if (this.isActionOriented(query)) score += 20
    if (this.leadsToDrillDown(query, context)) score += 15
    
    // Confidence penalty for low-confidence responses
    if (context.confidence && context.confidence < 70) {
      if (category === 'analytical') score -= 10 // Prefer simpler queries for low confidence
    }
    
    // Record count considerations
    if (context.recordCount) {
      if (context.recordCount > 1000 && this.isSummarizationQuery(query)) score += 10
      if (context.recordCount < 10 && this.isDetailQuery(query)) score -= 15
    }
    
    // Conversation progression boost
    if (this.supportsUserJourney(query, context)) score += 15
    
    // Penalize if similar queries were asked recently
    if (this.wasRecentlyAsked(query, context)) score -= 20
    
    return Math.max(0, Math.min(100, score))
  }
  
  // Remove duplicate queries based on semantic similarity
  private removeDuplicates(candidates: Array<{query: string, score: number, category: string}>): Array<{query: string, score: number, category: string}> {
    const unique: Array<{query: string, score: number, category: string}> = []
    
    for (const candidate of candidates) {
      const isDuplicate = unique.some(existing => 
        this.areSemanticallyDuplicate(candidate.query, existing.query)
      )
      
      if (!isDuplicate) {
        unique.push(candidate)
      } else {
        // If duplicate, keep the higher scoring one
        const existingIndex = unique.findIndex(existing => 
          this.areSemanticallyDuplicate(candidate.query, existing.query)
        )
        if (candidate.score > unique[existingIndex].score) {
          unique[existingIndex] = candidate
        }
      }
    }
    
    return unique
  }
  
  // Select top 3 ensuring diversity across categories and user journey progression
  private selectTop3WithDiversity(candidates: Array<{query: string, score: number, category: string}>, context: FollowUpContext): string[] {
    if (candidates.length === 0) {
      return ['Export results for detailed analysis', 'Compare with historical trends', 'Break down by key dimensions']
    }
    
    // Sort by score first
    candidates.sort((a, b) => b.score - a.score)
    
    const selected: Array<{query: string, score: number, category: string}> = []
    const usedCategories: Set<string> = new Set()
    
    // First pass: Select highest scoring from each category
    for (const candidate of candidates) {
      if (selected.length >= 3) break
      
      if (!usedCategories.has(candidate.category)) {
        selected.push(candidate)
        usedCategories.add(candidate.category)
      }
    }
    
    // Second pass: Fill remaining slots with highest scoring regardless of category
    for (const candidate of candidates) {
      if (selected.length >= 3) break
      
      if (!selected.includes(candidate)) {
        selected.push(candidate)
      }
    }
    
    // Ensure we have exactly 3 suggestions
    while (selected.length < 3 && candidates.length > 0) {
      const remaining = candidates.filter(c => !selected.includes(c))
      if (remaining.length > 0) {
        selected.push(remaining[0])
      } else {
        break
      }
    }
    
    // If still not enough, add fallback suggestions
    if (selected.length < 3) {
      const fallbacks = this.getFallbackSuggestions(context)
      for (let i = selected.length; i < 3; i++) {
        if (fallbacks[i - selected.length]) {
          selected.push({
            query: fallbacks[i - selected.length],
            score: 30,
            category: 'fallback'
          })
        }
      }
    }
    
    return selected.slice(0, 3).map(s => s.query)
  }
  
  // Helper methods for scoring
  private calculateWordOverlap(words1: string[], words2: string[]): number {
    const set1 = new Set(words1.filter(w => w.length > 3)) // Filter short words
    const set2 = new Set(words2.filter(w => w.length > 3))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    return intersection.size / Math.max(set1.size, 1)
  }
  
  private isHighBusinessImpact(query: string): boolean {
    const highImpactTerms = [
      'risk', 'compliance', 'fraud', 'cost reduction', 'efficiency', 'optimization',
      'budget', 'forecast', 'variance', 'performance', 'savings', 'consolidation'
    ]
    return this.containsKeywords(query, highImpactTerms)
  }
  
  private isActionOriented(query: string): boolean {
    const actionTerms = [
      'identify', 'analyze', 'review', 'optimize', 'reduce', 'improve',
      'implement', 'monitor', 'track', 'measure', 'compare', 'evaluate'
    ]
    return this.containsKeywords(query, actionTerms)
  }
  
  private leadsToDrillDown(query: string, context: FollowUpContext): boolean {
    const drillDownTerms = ['breakdown', 'detail', 'specific', 'which', 'what', 'why', 'how']
    return this.containsKeywords(query, drillDownTerms) && (context.recordCount || 0) > 10
  }
  
  private isSummarizationQuery(query: string): boolean {
    const summaryTerms = ['summarize', 'overview', 'total', 'aggregate', 'insights', 'patterns']
    return this.containsKeywords(query, summaryTerms)
  }
  
  private isDetailQuery(query: string): boolean {
    const detailTerms = ['specific', 'individual', 'each', 'detailed', 'breakdown']
    return this.containsKeywords(query, detailTerms)
  }
  
  private supportsUserJourney(query: string, context: FollowUpContext): boolean {
    // Analyze conversation progression
    const recentTopics = this.extractTopicsFromHistory(context.conversationHistory)
    
    // Progressive analysis journey: overview -> details -> insights -> actions
    if (recentTopics.includes('spending') && this.containsKeywords(query, ['variance', 'pattern'])) return true
    if (recentTopics.includes('entity') && this.containsKeywords(query, ['compare', 'benchmark'])) return true
    
    return false
  }
  
  private wasRecentlyAsked(query: string, context: FollowUpContext): boolean {
    return context.conversationHistory.some(msg => 
      msg.role === 'user' && this.areSemanticallyDuplicate(query, msg.content)
    )
  }
  
  private areSemanticallyDuplicate(query1: string, query2: string): boolean {
    const words1 = query1.toLowerCase().split(' ').filter(w => w.length > 3)
    const words2 = query2.toLowerCase().split(' ').filter(w => w.length > 3)
    
    const overlap = this.calculateWordOverlap(words1, words2)
    return overlap > 0.6 // 60% word overlap threshold
  }
  
  private getFallbackSuggestions(context: FollowUpContext): string[] {
    const fallbacks = [
      'Export results for detailed analysis',
      'Compare with historical trends', 
      'Break down by key dimensions'
    ]
    
    // Context-specific fallbacks
    if (context.recordCount && context.recordCount > 100) {
      fallbacks[0] = 'Summarize key insights from this large dataset'
    }
    
    if (this.containsKeywords(context.currentQuery, ['cost', 'spend', 'budget'])) {
      fallbacks[1] = 'Analyze cost variance patterns'
    }
    
    return fallbacks
  }
}

export const followUpGenerator = new FollowUpGenerator()