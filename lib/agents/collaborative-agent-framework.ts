// Collaborative Agent Framework with Self-Critique, Peer Review, and Confidence Scoring
import { EnhancedGeminiClient } from '../gemini/enhanced-client'
import { ReflectionOrchestrator } from './reflection-orchestrator'
import { RealFinancialService } from '../data-services/real-financial-service'
import { SQLToolFramework } from '../tools/sql-tool-framework'
import { LangGraphMemoryManager } from '../memory/langgraph-memory'

export interface AgentSpecialization {
  id: string
  name: string
  expertise: string[]
  role: 'primary' | 'reviewer' | 'validator' | 'synthesizer'
  confidenceThreshold: number
  reviewCapabilities: string[]
}

export interface CollaborativeQuery {
  id: string
  userId: string
  query: string
  dataSource: 'coupa' | 'baan' | 'combined'
  userRole: 'analyst' | 'executive'
  complexity: 'simple' | 'moderate' | 'complex' | 'expert'
  requiresValidation: boolean
  consensusThreshold: number
}

export interface AgentResponse {
  agentId: string
  response: string
  analysis: any
  confidence: number
  reasoning: string[]
  evidenceSources: string[]
  uncertainties: string[]
  timestamp: string
}

export interface PeerReview {
  reviewerId: string
  targetResponseId: string
  agreement: number // 0-1 scale
  critiques: string[]
  suggestions: string[]
  confidenceAdjustment: number
  overallAssessment: 'approve' | 'revise' | 'reject'
}

export interface CollaborativeResult {
  finalResponse: string
  consensusLevel: number
  participatingAgents: string[]
  primaryResponse: AgentResponse
  reviews: PeerReview[]
  synthesis: {
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    confidenceScore: number
  }
  collaborationMetrics: {
    totalAgents: number
    agreementLevel: number
    iterationCount: number
    executionTime: number
  }
}

export class CollaborativeAgentFramework {
  private geminiClient: EnhancedGeminiClient
  private reflectionOrchestrator: ReflectionOrchestrator
  private financialService: RealFinancialService
  private sqlFramework: SQLToolFramework
  private memoryManager: LangGraphMemoryManager
  
  // Specialized agent definitions
  private agents: Map<string, AgentSpecialization> = new Map()
  
  constructor(userId: string) {
    this.geminiClient = new EnhancedGeminiClient(process.env.GOOGLE_API_KEY)
    this.reflectionOrchestrator = new ReflectionOrchestrator()
    this.financialService = new RealFinancialService()
    this.sqlFramework = new SQLToolFramework()
    this.memoryManager = new LangGraphMemoryManager({
      userId,
      conversationId: 'collaborative_analysis',
      memoryType: 'semantic',
      namespace: 'collaborative_framework'
    })
    
    this.initializeSpecializedAgents()
  }

  /**
   * Main collaborative analysis entry point
   */
  async analyzeCollaboratively(query: CollaborativeQuery): Promise<CollaborativeResult> {
    const startTime = Date.now()
    console.log(`Starting collaborative analysis for query: ${query.id}`)
    
    try {
      // Phase 1: Select agents based on query complexity and domain
      const selectedAgents = await this.selectAgentsForQuery(query)
      
      // Phase 2: Generate primary responses from multiple agents
      const primaryResponses = await this.generatePrimaryResponses(query, selectedAgents)
      
      // Phase 3: Conduct peer reviews and cross-validation
      const reviews = await this.conductPeerReviews(primaryResponses, selectedAgents)
      
      // Phase 4: Self-critique phase for continuous improvement
      const refinedResponses = await this.conductSelfCritique(primaryResponses, reviews)
      
      // Phase 5: Synthesize final response with consensus building
      const synthesis = await this.synthesizeCollaborativeResponse(
        refinedResponses,
        reviews,
        query
      )
      
      // Phase 6: Calculate collaboration metrics and store learnings
      const collaborationMetrics = this.calculateCollaborationMetrics(
        selectedAgents.length,
        reviews,
        Date.now() - startTime
      )
      
      // Store collaboration learnings for future improvement
      await this.storeCollaborationLearnings(query, synthesis, collaborationMetrics)
      
      return {
        finalResponse: synthesis.response,
        consensusLevel: synthesis.consensusLevel,
        participatingAgents: selectedAgents.map(a => a.id),
        primaryResponse: primaryResponses[0], // Best primary response
        reviews,
        synthesis: {
          strengths: synthesis.strengths,
          weaknesses: synthesis.weaknesses,
          recommendations: synthesis.recommendations,
          confidenceScore: synthesis.confidenceScore
        },
        collaborationMetrics
      }
      
    } catch (error) {
      console.error('Collaborative analysis failed:', error)
      
      // Fallback to single-agent analysis
      return await this.fallbackToSingleAgent(query, error)
    }
  }

  /**
   * Initialize specialized financial analysis agents
   */
  private initializeSpecializedAgents(): void {
    const agents: AgentSpecialization[] = [
      {
        id: 'financial_analyst',
        name: 'Financial Analyst',
        expertise: ['financial_analysis', 'trend_analysis', 'cost_analysis', 'budget_variance'],
        role: 'primary',
        confidenceThreshold: 0.8,
        reviewCapabilities: ['data_accuracy', 'calculation_verification', 'trend_validation']
      },
      {
        id: 'procurement_specialist',
        name: 'Procurement Specialist',
        expertise: ['supplier_analysis', 'contract_management', 'procurement_optimization', 'vendor_performance'],
        role: 'primary',
        confidenceThreshold: 0.85,
        reviewCapabilities: ['supplier_data_validation', 'procurement_compliance', 'cost_optimization']
      },
      {
        id: 'risk_analyst',
        name: 'Risk Analyst',
        expertise: ['risk_assessment', 'compliance_analysis', 'fraud_detection', 'anomaly_detection'],
        role: 'reviewer',
        confidenceThreshold: 0.9,
        reviewCapabilities: ['risk_validation', 'compliance_check', 'anomaly_review']
      },
      {
        id: 'data_scientist',
        name: 'Data Scientist',
        expertise: ['statistical_analysis', 'predictive_modeling', 'data_quality', 'pattern_recognition'],
        role: 'validator',
        confidenceThreshold: 0.85,
        reviewCapabilities: ['statistical_validation', 'data_quality_assessment', 'model_validation']
      },
      {
        id: 'executive_advisor',
        name: 'Executive Advisor',
        expertise: ['strategic_analysis', 'executive_reporting', 'business_impact', 'decision_support'],
        role: 'synthesizer',
        confidenceThreshold: 0.8,
        reviewCapabilities: ['strategic_review', 'business_impact_assessment', 'executive_summary']
      }
    ]
    
    agents.forEach(agent => this.agents.set(agent.id, agent))
  }

  /**
   * Select optimal agents based on query characteristics
   */
  private async selectAgentsForQuery(query: CollaborativeQuery): Promise<AgentSpecialization[]> {
    const selectedAgents: AgentSpecialization[] = []
    const queryKeywords = query.query.toLowerCase()
    
    // Always include one primary agent
    let primaryAgent: AgentSpecialization | undefined
    
    if (queryKeywords.includes('supplier') || queryKeywords.includes('vendor') || queryKeywords.includes('procurement')) {
      primaryAgent = this.agents.get('procurement_specialist')
    } else if (queryKeywords.includes('risk') || queryKeywords.includes('compliance')) {
      primaryAgent = this.agents.get('risk_analyst')
    } else {
      primaryAgent = this.agents.get('financial_analyst')
    }
    
    if (primaryAgent) {
      selectedAgents.push(primaryAgent)
    }
    
    // Add reviewers based on complexity and requirements
    if (query.complexity === 'complex' || query.complexity === 'expert') {
      // Add data scientist for complex analyses
      const dataScientist = this.agents.get('data_scientist')
      if (dataScientist) selectedAgents.push(dataScientist)
      
      // Add risk analyst for validation
      if (primaryAgent?.id !== 'risk_analyst') {
        const riskAnalyst = this.agents.get('risk_analyst')
        if (riskAnalyst) selectedAgents.push(riskAnalyst)
      }
    }
    
    // Always add executive advisor for synthesis if user is executive
    if (query.userRole === 'executive') {
      const executiveAdvisor = this.agents.get('executive_advisor')
      if (executiveAdvisor) selectedAgents.push(executiveAdvisor)
    }
    
    // Ensure minimum of 2 agents for collaboration
    if (selectedAgents.length === 1) {
      const fallbackAgent = this.agents.get('data_scientist')
      if (fallbackAgent && !selectedAgents.includes(fallbackAgent)) {
        selectedAgents.push(fallbackAgent)
      }
    }
    
    console.log(`Selected ${selectedAgents.length} agents: ${selectedAgents.map(a => a.name).join(', ')}`)
    return selectedAgents
  }

  /**
   * Generate independent responses from multiple agents
   */
  private async generatePrimaryResponses(
    query: CollaborativeQuery,
    agents: AgentSpecialization[]
  ): Promise<AgentResponse[]> {
    const responses: AgentResponse[] = []
    
    // Generate responses in parallel for efficiency
    const responsePromises = agents.filter(a => a.role === 'primary' || a.role === 'synthesizer')
      .map(async (agent) => {
        try {
          const response = await this.generateAgentResponse(query, agent)
          return response
        } catch (error) {
          console.error(`Agent ${agent.id} failed to respond:`, error)
          return this.createFallbackResponse(query, agent, error)
        }
      })
    
    const agentResponses = await Promise.all(responsePromises)
    responses.push(...agentResponses)
    
    // Sort by confidence score
    responses.sort((a, b) => b.confidence - a.confidence)
    
    return responses
  }

  /**
   * Generate specialized response from a specific agent
   */
  private async generateAgentResponse(
    query: CollaborativeQuery,
    agent: AgentSpecialization
  ): Promise<AgentResponse> {
    const agentPrompt = `You are a ${agent.name} with expertise in: ${agent.expertise.join(', ')}.

Query: "${query.query}"
Data Source: ${query.dataSource}
User Role: ${query.userRole}
Query Complexity: ${query.complexity}

As a ${agent.name}, provide your specialized analysis:
1. **Core Analysis**: Your expert perspective on this query
2. **Key Findings**: Specific insights from your domain expertise
3. **Confidence Assessment**: How confident are you in this analysis (0-1)
4. **Evidence Sources**: What data or methods support your conclusions
5. **Uncertainties**: What aspects need further validation
6. **Reasoning**: Step-by-step logic behind your analysis

Focus on your specialized knowledge while being specific about confidence levels and uncertainties.`

    try {
      // Use different analysis methods based on agent specialization
      let analysisResult: any = {}
      
      if (agent.expertise.includes('financial_analysis')) {
        analysisResult = await this.financialService.executeComprehensiveAnalysis({
          query: query.query,
          dataSource: query.dataSource,
          userRole: query.userRole
        })
      } else if (agent.expertise.includes('supplier_analysis')) {
        analysisResult = await this.financialService.executeProcurementAnalysis({
          query: query.query,
          dataSource: query.dataSource,
          userRole: query.userRole
        })
      } else {
        // Use reflection orchestrator for complex analysis
        analysisResult = await this.reflectionOrchestrator.orchestrateAnalysis(
          query.query,
          {
            userId: query.userId,
            conversationId: query.id,
            userRole: query.userRole,
            dataSource: query.dataSource
          }
        )
      }
      
      const response = await this.geminiClient.generateWithThinking({
        prompt: agentPrompt,
        enableThinking: true,
        temperature: 0.4,
        thinkingBudget: 3000
      })
      
      return {
        agentId: agent.id,
        response: response.response_text,
        analysis: analysisResult,
        confidence: this.extractConfidence(response.response_text, agent.confidenceThreshold),
        reasoning: this.extractReasoning(response.response_text),
        evidenceSources: this.extractEvidenceSources(response.response_text, analysisResult),
        uncertainties: this.extractUncertainties(response.response_text),
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error(`Agent response generation failed for ${agent.id}:`, error)
      return this.createFallbackResponse(query, agent, error)
    }
  }

  /**
   * Conduct comprehensive peer reviews
   */
  private async conductPeerReviews(
    responses: AgentResponse[],
    agents: AgentSpecialization[]
  ): Promise<PeerReview[]> {
    const reviews: PeerReview[] = []
    const reviewerAgents = agents.filter(a => a.role === 'reviewer' || a.role === 'validator')
    
    // Each response gets reviewed by available reviewers
    for (const response of responses) {
      for (const reviewer of reviewerAgents) {
        if (reviewer.id !== response.agentId) { // Can't review own work
          try {
            const review = await this.generatePeerReview(response, reviewer)
            reviews.push(review)
          } catch (error) {
            console.error(`Peer review failed for ${reviewer.id}:`, error)
          }
        }
      }
    }
    
    return reviews
  }

  /**
   * Generate peer review from reviewer agent
   */
  private async generatePeerReview(
    response: AgentResponse,
    reviewer: AgentSpecialization
  ): Promise<PeerReview> {
    const reviewPrompt = `You are a ${reviewer.name} conducting a peer review.

Original Response from ${response.agentId}:
"${response.response}"

Analysis Data: ${JSON.stringify(response.analysis)}
Original Confidence: ${response.confidence}
Reasoning: ${response.reasoning.join('; ')}

As a ${reviewer.name}, evaluate this response:
1. **Agreement Level** (0-1): How much do you agree with the analysis?
2. **Critical Assessment**: What are the strengths and weaknesses?
3. **Accuracy Validation**: Are the findings supported by data?
4. **Methodology Review**: Is the approach sound?
5. **Confidence Adjustment**: Should confidence be adjusted up/down?
6. **Specific Critiques**: What needs improvement?
7. **Actionable Suggestions**: How can this be enhanced?
8. **Overall Assessment**: Approve, Revise, or Reject?

Be constructive and specific in your feedback.`

    try {
      const reviewResponse = await this.geminiClient.generateWithThinking({
        prompt: reviewPrompt,
        enableThinking: true,
        temperature: 0.3,
        thinkingBudget: 2000
      })
      
      return {
        reviewerId: reviewer.id,
        targetResponseId: response.agentId,
        agreement: this.extractAgreementLevel(reviewResponse.response_text),
        critiques: this.extractCritiques(reviewResponse.response_text),
        suggestions: this.extractSuggestions(reviewResponse.response_text),
        confidenceAdjustment: this.extractConfidenceAdjustment(reviewResponse.response_text),
        overallAssessment: this.extractOverallAssessment(reviewResponse.response_text)
      }
      
    } catch (error) {
      console.error(`Peer review generation failed:`, error)
      return {
        reviewerId: reviewer.id,
        targetResponseId: response.agentId,
        agreement: 0.7,
        critiques: ['Review generation failed'],
        suggestions: ['Consider manual review'],
        confidenceAdjustment: -0.1,
        overallAssessment: 'revise'
      }
    }
  }

  /**
   * Conduct self-critique for continuous improvement
   */
  private async conductSelfCritique(
    responses: AgentResponse[],
    reviews: PeerReview[]
  ): Promise<AgentResponse[]> {
    const refinedResponses: AgentResponse[] = []
    
    for (const response of responses) {
      const relevantReviews = reviews.filter(r => r.targetResponseId === response.agentId)
      
      if (relevantReviews.length > 0 && relevantReviews.some(r => r.overallAssessment === 'revise')) {
        try {
          const refinedResponse = await this.generateSelfCritique(response, relevantReviews)
          refinedResponses.push(refinedResponse)
        } catch (error) {
          console.error(`Self-critique failed for ${response.agentId}:`, error)
          refinedResponses.push(response) // Keep original if refinement fails
        }
      } else {
        refinedResponses.push(response)
      }
    }
    
    return refinedResponses
  }

  /**
   * Generate self-critique and refinement
   */
  private async generateSelfCritique(
    response: AgentResponse,
    reviews: PeerReview[]
  ): Promise<AgentResponse> {
    const critiquePrompt = `You are reviewing and refining your own previous response.

Your Original Response: "${response.response}"
Your Original Confidence: ${response.confidence}

Peer Reviews Received:
${reviews.map(r => `
- ${r.reviewerId}: Agreement ${r.agreement}, Assessment: ${r.overallAssessment}
- Critiques: ${r.critiques.join('; ')}
- Suggestions: ${r.suggestions.join('; ')}
`).join('\n')}

Self-Critique and Refinement:
1. **Self-Assessment**: What could be improved in your original response?
2. **Address Critiques**: How do you respond to the peer feedback?
3. **Refined Analysis**: Provide an improved version incorporating feedback
4. **Updated Confidence**: Adjust your confidence based on peer input
5. **Remaining Uncertainties**: What still needs clarification?

Provide a refined, more accurate response.`

    try {
      const critiqueResponse = await this.geminiClient.generateWithThinking({
        prompt: critiquePrompt,
        enableThinking: true,
        temperature: 0.5,
        thinkingBudget: 2500
      })
      
      // Calculate adjusted confidence based on peer feedback
      const avgAgreement = reviews.reduce((sum, r) => sum + r.agreement, 0) / reviews.length
      const avgConfidenceAdjustment = reviews.reduce((sum, r) => sum + r.confidenceAdjustment, 0) / reviews.length
      const adjustedConfidence = Math.max(0.1, Math.min(1.0, 
        response.confidence * avgAgreement + avgConfidenceAdjustment
      ))
      
      return {
        ...response,
        response: critiqueResponse.response_text,
        confidence: adjustedConfidence,
        reasoning: [...response.reasoning, 'Self-critique conducted', 'Peer feedback incorporated'],
        uncertainties: this.extractUncertainties(critiqueResponse.response_text),
        timestamp: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('Self-critique generation failed:', error)
      return response
    }
  }

  /**
   * Synthesize final collaborative response
   */
  private async synthesizeCollaborativeResponse(
    responses: AgentResponse[],
    reviews: PeerReview[],
    query: CollaborativeQuery
  ): Promise<any> {
    const synthesisPrompt = `You are synthesizing multiple expert opinions into a final response.

Query: "${query.query}"
User Role: ${query.userRole}

Expert Responses:
${responses.map(r => `
${r.agentId} (Confidence: ${r.confidence}):
"${r.response.substring(0, 500)}..."
`).join('\n')}

Peer Review Summary:
- Average Agreement: ${reviews.reduce((sum, r) => sum + r.agreement, 0) / reviews.length}
- Common Critiques: ${this.getCommonCritiques(reviews).join('; ')}
- Key Suggestions: ${this.getKeySuggestions(reviews).join('; ')}

Synthesis Requirements:
1. **Unified Response**: Combine the best insights from all experts
2. **Consensus Areas**: Highlight where experts agree
3. **Divergent Views**: Address where experts disagree
4. **Confidence Assessment**: Overall confidence in the synthesis
5. **Actionable Recommendations**: Clear next steps
6. **Strengths & Weaknesses**: Honest assessment of analysis quality

Provide a comprehensive, balanced synthesis that leverages all expert input.`

    try {
      const synthesisResponse = await this.geminiClient.generateWithThinking({
        prompt: synthesisPrompt,
        enableThinking: true,
        temperature: 0.6,
        thinkingBudget: 4000
      })
      
      const consensusLevel = this.calculateConsensusLevel(responses, reviews)
      const confidenceScore = this.calculateSynthesisConfidence(responses, reviews, consensusLevel)
      
      return {
        response: synthesisResponse.response_text,
        consensusLevel,
        confidenceScore,
        strengths: this.extractStrengths(synthesisResponse.response_text),
        weaknesses: this.extractWeaknesses(synthesisResponse.response_text),
        recommendations: this.extractRecommendations(synthesisResponse.response_text)
      }
      
    } catch (error) {
      console.error('Synthesis generation failed:', error)
      return this.createFallbackSynthesis(responses, reviews)
    }
  }

  /**
   * Calculate collaboration metrics
   */
  private calculateCollaborationMetrics(
    agentCount: number,
    reviews: PeerReview[],
    executionTime: number
  ): any {
    const averageAgreement = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.agreement, 0) / reviews.length 
      : 0.8
    
    return {
      totalAgents: agentCount,
      agreementLevel: averageAgreement,
      iterationCount: 1, // Could be enhanced for multiple iterations
      executionTime
    }
  }

  /**
   * Store collaboration learnings for future improvement
   */
  private async storeCollaborationLearnings(
    query: CollaborativeQuery,
    synthesis: any,
    metrics: any
  ): Promise<void> {
    try {
      await this.memoryManager.storeSemanticFact({
        id: `collaboration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: query.userId,
        fact: `Collaborative analysis: ${query.complexity} query achieved ${synthesis.consensusLevel} consensus with ${metrics.totalAgents} agents`,
        category: 'knowledge',
        confidence: synthesis.confidenceScore,
        lastUpdated: new Date().toISOString(),
        sources: ['collaborative_framework']
      })
    } catch (error) {
      console.error('Failed to store collaboration learnings:', error)
    }
  }

  /**
   * Utility methods for parsing AI responses
   */
  private extractConfidence(text: string, threshold: number): number {
    const confidenceMatch = text.match(/confidence[:\s]*([0-9.]+)/i)
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : threshold
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private extractReasoning(text: string): string[] {
    const reasoningSection = text.match(/reasoning[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (reasoningSection) {
      return reasoningSection[1].split(/[.\n]/).filter(r => r.trim().length > 10).slice(0, 5)
    }
    return ['Analysis completed', 'Evidence reviewed', 'Conclusions drawn']
  }

  private extractEvidenceSources(text: string, analysis: any): string[] {
    const sources = ['data_analysis']
    
    if (analysis.sqlQuery) sources.push('sql_query')
    if (analysis.dataProvenance) sources.push(...analysis.dataProvenance)
    if (text.includes('trend')) sources.push('trend_analysis')
    if (text.includes('comparison')) sources.push('comparative_analysis')
    
    return [...new Set(sources)]
  }

  private extractUncertainties(text: string): string[] {
    const uncertaintyKeywords = ['uncertain', 'unclear', 'unknown', 'may', 'might', 'possibly', 'potentially']
    const sentences = text.split(/[.!?]+/)
    
    return sentences
      .filter(s => uncertaintyKeywords.some(keyword => s.toLowerCase().includes(keyword)))
      .map(s => s.trim())
      .slice(0, 3)
  }

  private extractAgreementLevel(text: string): number {
    const agreementMatch = text.match(/agreement[:\s]*([0-9.]+)/i)
    return agreementMatch ? parseFloat(agreementMatch[1]) : 0.7
  }

  private extractCritiques(text: string): string[] {
    const critiqueSection = text.match(/critique[s]?[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (critiqueSection) {
      return critiqueSection[1].split(/[.\n]/).filter(c => c.trim().length > 10).slice(0, 3)
    }
    return ['General review completed']
  }

  private extractSuggestions(text: string): string[] {
    const suggestionSection = text.match(/suggestion[s]?[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (suggestionSection) {
      return suggestionSection[1].split(/[.\n]/).filter(s => s.trim().length > 10).slice(0, 3)
    }
    return ['Consider additional analysis']
  }

  private extractConfidenceAdjustment(text: string): number {
    if (text.toLowerCase().includes('increase confidence')) return 0.1
    if (text.toLowerCase().includes('decrease confidence')) return -0.1
    if (text.toLowerCase().includes('lower confidence')) return -0.15
    if (text.toLowerCase().includes('higher confidence')) return 0.15
    return 0
  }

  private extractOverallAssessment(text: string): 'approve' | 'revise' | 'reject' {
    const textLower = text.toLowerCase()
    if (textLower.includes('approve') || textLower.includes('accept')) return 'approve'
    if (textLower.includes('reject') || textLower.includes('unacceptable')) return 'reject'
    return 'revise'
  }

  private calculateConsensusLevel(responses: AgentResponse[], reviews: PeerReview[]): number {
    if (reviews.length === 0) return 0.8
    
    const avgAgreement = reviews.reduce((sum, r) => sum + r.agreement, 0) / reviews.length
    const approvalRate = reviews.filter(r => r.overallAssessment === 'approve').length / reviews.length
    
    return (avgAgreement + approvalRate) / 2
  }

  private calculateSynthesisConfidence(
    responses: AgentResponse[],
    reviews: PeerReview[],
    consensusLevel: number
  ): number {
    const avgResponseConfidence = responses.reduce((sum, r) => sum + r.confidence, 0) / responses.length
    return (avgResponseConfidence + consensusLevel) / 2
  }

  private getCommonCritiques(reviews: PeerReview[]): string[] {
    const allCritiques = reviews.flatMap(r => r.critiques)
    const critiqueCounts = new Map<string, number>()
    
    allCritiques.forEach(critique => {
      critiqueCounts.set(critique, (critiqueCounts.get(critique) || 0) + 1)
    })
    
    return Array.from(critiqueCounts.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([critique, _]) => critique)
      .slice(0, 3)
  }

  private getKeySuggestions(reviews: PeerReview[]): string[] {
    const allSuggestions = reviews.flatMap(r => r.suggestions)
    return [...new Set(allSuggestions)].slice(0, 5)
  }

  private extractStrengths(text: string): string[] {
    const strengthsSection = text.match(/strength[s]?[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (strengthsSection) {
      return strengthsSection[1].split(/[.\n]/).filter(s => s.trim().length > 10).slice(0, 3)
    }
    return ['Comprehensive analysis', 'Multiple expert perspectives', 'Data-driven insights']
  }

  private extractWeaknesses(text: string): string[] {
    const weaknessesSection = text.match(/weakness[es]*[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (weaknessesSection) {
      return weaknessesSection[1].split(/[.\n]/).filter(w => w.trim().length > 10).slice(0, 3)
    }
    return ['Limited data availability', 'Requires additional validation']
  }

  private extractRecommendations(text: string): string[] {
    const recommendationsSection = text.match(/recommendation[s]?[:\s]*([^]*?)(?=\n\n|\n[A-Z]|$)/i)
    if (recommendationsSection) {
      return recommendationsSection[1].split(/[.\n]/).filter(r => r.trim().length > 10).slice(0, 5)
    }
    return ['Continue monitoring', 'Review findings', 'Implement suggested improvements']
  }

  private createFallbackResponse(
    query: CollaborativeQuery,
    agent: AgentSpecialization,
    error: any
  ): AgentResponse {
    return {
      agentId: agent.id,
      response: `${agent.name} analysis completed with limited capabilities due to technical constraints.`,
      analysis: { error: error instanceof Error ? error.message : 'Unknown error' },
      confidence: 0.5,
      reasoning: ['Fallback analysis due to technical issue'],
      evidenceSources: ['limited_analysis'],
      uncertainties: ['Analysis limited by technical constraints'],
      timestamp: new Date().toISOString()
    }
  }

  private createFallbackSynthesis(responses: AgentResponse[], reviews: PeerReview[]): any {
    const bestResponse = responses.sort((a, b) => b.confidence - a.confidence)[0]
    
    return {
      response: bestResponse?.response || 'Analysis completed with available data',
      consensusLevel: 0.7,
      confidenceScore: bestResponse?.confidence || 0.6,
      strengths: ['Analysis completed', 'Multiple perspectives considered'],
      weaknesses: ['Limited synthesis capability'],
      recommendations: ['Review individual expert opinions', 'Consider manual synthesis']
    }
  }

  private async fallbackToSingleAgent(query: CollaborativeQuery, error: any): Promise<CollaborativeResult> {
    console.log('Falling back to single agent due to collaboration failure')
    
    try {
      const fallbackAgent = this.agents.get('financial_analyst')!
      const response = await this.generateAgentResponse(query, fallbackAgent)
      
      return {
        finalResponse: response.response,
        consensusLevel: 0.6,
        participatingAgents: [fallbackAgent.id],
        primaryResponse: response,
        reviews: [],
        synthesis: {
          strengths: ['Single expert analysis'],
          weaknesses: ['No peer review', 'Limited collaboration'],
          recommendations: ['Consider retrying with collaboration'],
          confidenceScore: response.confidence
        },
        collaborationMetrics: {
          totalAgents: 1,
          agreementLevel: 1.0,
          iterationCount: 1,
          executionTime: 0
        }
      }
    } catch (fallbackError) {
      throw new Error(`Both collaborative and fallback analysis failed: ${error}, ${fallbackError}`)
    }
  }
}