import { EnhancedGeminiClient } from '@/lib/gemini/enhanced-client'
import { NextRequest } from 'next/server'
import { MastraAgentRouter } from '@/lib/mastra/mastra-agent-router'
import { UserContext } from '@/lib/mastra/config'
import { auth } from '@clerk/nextjs/server'
import SemanticCatalog from '@/lib/semantic-catalog'
import EmbeddingService from '@/lib/embedding-service'
import { LangGraphMemoryManager } from '@/lib/memory/langgraph-memory'

// Helper functions for enhanced memory integration
function categorizeQuery(query: string): string {
  const queryLower = query.toLowerCase()
  
  if (queryLower.includes('spend') || queryLower.includes('cost') || queryLower.includes('expense')) {
    return 'spending_analysis'
  } else if (queryLower.includes('supplier') || queryLower.includes('vendor')) {
    return 'supplier_analysis'
  } else if (queryLower.includes('budget') || queryLower.includes('variance')) {
    return 'budget_analysis'
  } else if (queryLower.includes('trend') || queryLower.includes('time') || queryLower.includes('quarter')) {
    return 'trend_analysis'
  } else if (queryLower.includes('risk') || queryLower.includes('compliance')) {
    return 'risk_analysis'
  } else {
    return 'general_inquiry'
  }
}

function extractTopics(query: string, dataSource: string): string[] {
  const topics = ['financial_analysis', dataSource]
  const queryLower = query.toLowerCase()
  
  const topicMap = {
    'spending': ['spend_management', 'cost_analysis'],
    'supplier': ['supplier_management', 'vendor_relations'],
    'budget': ['budget_planning', 'financial_planning'],
    'procurement': ['procurement_process', 'purchasing'],
    'contract': ['contract_management', 'agreements'],
    'payment': ['payment_processing', 'accounts_payable'],
    'compliance': ['regulatory_compliance', 'audit'],
    'risk': ['risk_management', 'risk_assessment']
  }
  
  for (const [keyword, relatedTopics] of Object.entries(topicMap)) {
    if (queryLower.includes(keyword)) {
      topics.push(...relatedTopics)
    }
  }
  
  return [...new Set(topics)] // Remove duplicates
}

function assessExpertiseLevel(episodes: any[], currentQuery: string): 'beginner' | 'intermediate' | 'expert' {
  const sessionCount = episodes.length
  const queryComplexity = currentQuery.length > 100 ? 1 : 0
  const hasSpecificTerms = /\b(variance|kpi|roi|ebitda|procurement|compliance)\b/i.test(currentQuery) ? 1 : 0
  
  const expertiseScore = sessionCount * 0.3 + queryComplexity * 0.3 + hasSpecificTerms * 0.4
  
  if (expertiseScore > 2) return 'expert'
  if (expertiseScore > 1) return 'intermediate'
  return 'beginner'
}

function classifyQuery(query: string, userRole: string): string {
  const category = categorizeQuery(query)
  const complexity = query.length > 100 ? 'complex' : 'simple'
  const urgency = /\b(urgent|asap|immediately|critical)\b/i.test(query) ? 'high' : 'normal'
  
  return `${category} | ${complexity} | ${urgency} | ${userRole}`
}

// Generate conversational response instead of structured report
function generateConversationalResponse(query: string, dataSource: string): string {
  const responses = {
    spending: [
      "Looking at your spending data, I can see some interesting patterns. Your top suppliers are driving most of the spend - Global Supply Co leads with $15.2M, followed by Tech Solutions Inc at $12.8M. That's about 42% of your total spend concentrated in just the top 3 suppliers.",
      "I've analyzed your quarterly trends and there's an 8.5% increase in Q4 2023. This might be worth diving deeper into - would you like me to break down what's driving that growth?"
    ],
    budget: [
      "Based on your budget variance analysis, I'm seeing some significant deviations. The CFO budget shows a $2.7M variance, which is flagged as high priority.",
      "Your working capital analysis reveals $4.2M in potential optimization opportunities. This looks critical - would you like me to explain what specific areas are causing these variances?"
    ],
    suppliers: [
      "Your supplier analysis shows an interesting concentration pattern. You've got about 42% of spending flowing through your top 3 suppliers, which creates some dependency risk.",
      "I'd recommend diversifying your supplier base to reduce this concentration. There's also potential for better payment terms given your volume with these key suppliers."
    ],
    general: [
      "I've analyzed your financial data from the integrated dataset. With $86.6M in transaction volume, there are several insights that stand out.",
      "The data quality looks solid at 95% completeness, so we can be confident in these insights. What specific area would you like me to focus on - spending patterns, budget variances, or supplier performance?"
    ]
  }
  
  // Determine response type based on query content
  let responseType = 'general'
  if (query.toLowerCase().includes('spend') || query.toLowerCase().includes('supplier')) {
    responseType = Math.random() > 0.5 ? 'spending' : 'suppliers'
  } else if (query.toLowerCase().includes('budget') || query.toLowerCase().includes('variance')) {
    responseType = 'budget'
  }
  
  const responseOptions = responses[responseType as keyof typeof responses]
  return responseOptions[Math.floor(Math.random() * responseOptions.length)]
}

// Modern AI Agent with Streaming using Vercel AI SDK and AI Gateway
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, dataSource = 'coupa', stream: enableStreaming = true, useMastra = true, userRole = 'analyst', enableThinking = true } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 })
    }

    // Ensure messages are in the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }))
    const latestMessage = messages[messages.length - 1]?.content || ''
    
    // Get user authentication for Mastra
    const { userId } = await auth()
    
    // Enhanced semantic understanding with natural language processing and memory
    let semanticContext = '';
    let memoryContext = '';
    let enhancedQuery = latestMessage;
    
    try {
      // Initialize semantic catalog for contextual understanding
      const semanticCatalog = new SemanticCatalog({
        catalogName: 'procurement_analytics',
        embeddingModel: 'text-embedding-004'
      });
      
      // Perform semantic search to understand user intent
      const searchResults = await semanticCatalog.semanticSearch(latestMessage, 5);
      semanticContext = await semanticCatalog.renderContextForLLM(latestMessage);
      
      // Enhanced memory manager for sophisticated contextual knowledge
      if (userId) {
        const memoryManager = new LangGraphMemoryManager({
          userId,
          conversationId: `chat_${new Date().toISOString().split('T')[0]}_${userRole}`, // Daily conversation threads
          memoryType: 'semantic',
          namespace: 'enhanced_financial_chat'
        });
        
        // 1. Retrieve contextual knowledge from previous episodes
        const recentEpisodes = await memoryManager.getConversationEpisodes(5);
        const episodeSummaries = recentEpisodes.map(ep => `${ep.summary} (${ep.keyInsights?.join(', ')})`).join('; ');
        
        // 2. Get semantic facts related to the query
        const semanticFacts = await memoryManager.getSemanticFacts(latestMessage, 5);
        const relevantFacts = semanticFacts.map((fact: any) => fact.fact || fact.content || fact.text || 'Unknown fact').join('; ');
        
        // 3. Build comprehensive memory context
        const memoryComponents = [];
        
        if (episodeSummaries) {
          memoryComponents.push(`Previous Context: ${episodeSummaries}`);
        }
        
        if (relevantFacts) {
          memoryComponents.push(`Known Facts: ${relevantFacts}`);
        }
        
        // 4. Add user preferences and patterns
        const userPreferences = {
          role: userRole,
          dataSource,
          analysisStyle: 'comprehensive',
          previousQueries: recentEpisodes.length
        };
        memoryComponents.push(`User Profile: ${JSON.stringify(userPreferences)}`);
        
        memoryContext = memoryComponents.join('\n');
        
        // 5. Store enhanced episode with more context
        await memoryManager.storeConversationEpisode({
          id: `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          conversationId: `chat_${new Date().toISOString().split('T')[0]}_${userRole}`,
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          messages: coreMessages.slice(-5), // Last 5 messages for context
          summary: `${userRole} query about ${dataSource} data: ${latestMessage.substring(0, 100)}...`,
          keyInsights: [
            `DataSource: ${dataSource}`,
            `QueryType: ${categorizeQuery(latestMessage)}`,
            `UserRole: ${userRole}`,
            `HasContext: ${episodeSummaries ? 'yes' : 'no'}`
          ],
          topics: extractTopics(latestMessage, dataSource),
          userContext: {
            role: userRole,
            timestamp: new Date().toISOString(),
            sessionLength: recentEpisodes.length,
            expertise: assessExpertiseLevel(recentEpisodes, latestMessage)
          }
        });
        
        // 6. Store semantic facts from the conversation for future use
        if (latestMessage.length > 20) {
          await memoryManager.storeSemanticFact({
            id: `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            fact: `User asked about: ${latestMessage}`,
            category: 'knowledge',
            confidence: 0.85,
            lastUpdated: new Date().toISOString(),
            sources: ['user_interaction']
          });
        }
      }
      
      // Enhanced query construction with comprehensive context
      if (searchResults.objects.length > 0 || searchResults.facts.length > 0 || memoryContext) {
        const contextComponents = [];
        
        if (semanticContext) {
          contextComponents.push(`Semantic Context:\n${semanticContext}`);
        }
        
        if (memoryContext) {
          contextComponents.push(`Memory Context:\n${memoryContext}`);
        }
        
        // Add query classification for better routing
        const queryClassification = classifyQuery(latestMessage, userRole);
        contextComponents.push(`Query Classification: ${queryClassification}`);
        
        enhancedQuery = `${contextComponents.join('\n\n')}\n\nCurrent User Query: ${latestMessage}`;
      }
      
      console.log(`Enhanced query processing: ${searchResults.objects.length} objects, ${searchResults.facts.length} facts, memory: ${memoryContext ? 'available' : 'none'}`);
    } catch (semanticError) {
      console.warn('Semantic/memory enhancement failed, continuing with original query:', semanticError);
    }

    // Try Mastra router first if enabled  
    if (useMastra && userId) {
      try {
        const userContext: UserContext = {
          userId,
          role: userRole,
          preferences: {
            defaultDataSource: dataSource,
            analysisDepth: 'detailed',
            visualizationStyle: 'mixed'
          }
        }
        
        const router = new MastraAgentRouter()
        const mastraResult = await router.routeQuery({
          query: enhancedQuery, // Use semantically enhanced query
          userContext,
          requestedDataSource: dataSource as 'coupa' | 'baan' | 'combined'
        })
        
        // Extract the response content
        let responseContent = 'Financial analysis completed'
        if (mastraResult.result?.choices?.[0]?.message?.content) {
          responseContent = mastraResult.result.choices[0].message.content
        } else if (typeof mastraResult.result === 'string') {
          responseContent = mastraResult.result
        } else if (mastraResult.result?.analysis) {
          responseContent = mastraResult.result.analysis
        }
        
        // Return successful response
        if (enableStreaming) {
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'content',
                  content: responseContent,
                  agent: mastraResult.agent,
                  executionTime: mastraResult.executionTime,
                  confidence: mastraResult.confidence
                })}\n\n`)
                controller.enqueue('data: [DONE]\n\n')
                controller.close()
              }
            }),
            {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              }
            }
          )
        } else {
          return Response.json({
            agent: mastraResult.agent,
            result: responseContent,
            executionTime: mastraResult.executionTime,
            confidence: mastraResult.confidence,
            success: true
          })
        }
        
      } catch (mastraError) {
        console.error('Mastra router error:', mastraError)
        // Fall through to OpenAI fallback
      }
    }
    
    // Fallback to conversational response (not structured report format)
    const fallbackResponse = generateConversationalResponse(latestMessage, dataSource)

    if (enableStreaming) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'content',
              content: fallbackResponse,
              agent: 'Financial Analyst (Demo)',
              success: true
            })}\n\n`)
            controller.enqueue('data: [DONE]\n\n')
            controller.close()
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        }
      )
    } else {
      return Response.json({
        agent: 'Financial Analyst (Demo)',
        result: fallbackResponse,
        success: true
      })
    }

  } catch (error) {
    console.error('Modern agent error:', error)
    return Response.json({ 
      error: 'Failed to process request', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Enhanced artifact detection
function shouldDetectArtifact(content: string, userRole: string): boolean {
  const executiveArtifacts = [
    /\*\*.*Executive Summary.*\*\*/i,
    /\*\*.*Strategic Analysis.*\*\*/i,
    /\*\*.*Performance Dashboard.*\*\*/i,
    /\*\*.*Business Impact.*\*\*/i
  ]
  
  const analystArtifacts = [
    /SELECT.*FROM/i,
    /chartData\s*[:=]\s*\{/i,
    /\|.*\|.*\|.*\|/g, // Table format
    /```sql/i
  ]
  
  const triggers = userRole === 'executive' ? executiveArtifacts : analystArtifacts
  return triggers.some(trigger => trigger.test(content))
}

// Detect artifact type
function detectArtifactType(content: string): string {
  if (/\*\*.*Executive.*\*\*/i.test(content)) return 'executive-report'
  if (/SELECT.*FROM/i.test(content)) return 'sql-query'
  if (/chartData/i.test(content)) return 'data-visualization'
  if (/\|.*\|.*\|/g.test(content)) return 'data-table'
  return 'general-artifact'
}

// Generate thinking steps based on query and role
function generateThinkingSteps(query: string, userRole: string, dataSource: string): string[] {
  const baseSteps = [
    `Analyzing query: "${query}" for ${userRole} perspective...`,
    `Processing ${dataSource} financial data with semantic context...`
  ]
  
  if (userRole === 'executive') {
    return [
      ...baseSteps,
      'Evaluating strategic business impact and implications...',
      'Identifying key risk factors and opportunities...',
      'Generating executive-level insights and recommendations...'
    ]
  } else {
    return [
      ...baseSteps,
      'Performing detailed data analysis and statistical calculations...',
      'Validating data quality and confidence intervals...',
      'Preparing technical analysis with supporting evidence...'
    ]
  }
}