import { NextResponse } from "next/server"
import { unifiedStorage } from '@/lib/storage/unified-storage'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, message } = body

    // Handle both message formats for compatibility
    let latestMessage = ""
    if (messages && Array.isArray(messages) && messages.length > 0) {
      latestMessage = messages[messages.length - 1]?.content || ""
    } else if (message) {
      latestMessage = message
    }

    if (!latestMessage) {
      throw new Error("No message content provided")
    }

    // Check if client wants streaming
    const acceptHeader = req.headers.get('accept')
    const isStreaming = acceptHeader === 'text/event-stream'

    // Forward to the LiveAgent endpoint with internal call header and streaming support
    const baseUrl = process.env.REPLIT_DOMAINS || process.env.REPL_SLUG || 'http://localhost:5000'
    const agentUrl = baseUrl.startsWith('http') ? `${baseUrl}/api/agent` : `https://${baseUrl}/api/agent`
    const agentResponse = await fetch(agentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-call': 'true',
        'Accept': isStreaming ? 'text/event-stream' : 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: latestMessage }],
        dataSource: body.type || 'auto', // Use provided type or auto-detect
        stream: isStreaming
      })
    })

    if (!agentResponse.ok) {
      throw new Error(`Agent API failed: ${agentResponse.status}`)
    }

    // Handle streaming response
    if (isStreaming) {
      // Return the streaming response directly
      return new Response(agentResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      })
    }

    const agentData = await agentResponse.json()

    // Generate a unique message ID for storage
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store the SQL query and response data for evidence retrieval
    if (agentData.sqlQuery) {
      // Note: messageStorage functionality moved to unifiedStorage
      // Store message data with unified storage (using anonymous user for internal API)
      try {
        await unifiedStorage.storeMessageData(messageId, 'anonymous', {
          sqlQuery: agentData.sqlQuery,
          responseData: agentData.metadata
        })
      } catch (error) {
        console.warn('Failed to store message data:', error)
        // Continue processing even if storage fails
      }
    }

    return NextResponse.json({
      messageId: messageId,
      message: agentData.content || agentData.message || "Analysis completed",
      content: agentData.content || agentData.message || "Analysis completed",
      reasoning: agentData.reasoning || null,
      timestamp: new Date().toISOString(),
      source: "liveagent",
      metadata: {
        executionTime: agentData.metadata?.processingTime,
        confidence: agentData.metadata?.confidence || agentData.confidence,
        agentUsed: agentData.metadata?.dataSource || agentData.agentUsed,
        queryType: agentData.classification?.analysisType,
        model: agentData.metadata?.model
      },
      evidence: agentData.evidence,
      contextualInsights: agentData.contextualInsights || [],
      followUpSuggestions: agentData.followUpSuggestions || [],
      insights: agentData.insights
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}