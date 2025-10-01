import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { ChatSaveRequestSchema, validateApiRequest, ChatMessage } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()
    
    // Validate request data using Zod schema
    const validation = validateApiRequest(ChatSaveRequestSchema, requestData)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: "Invalid request data", 
        details: validation.errors 
      }, { status: 400 })
    }

    const { messages, chatId, userId } = validation.data

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const chatData = {
      id: chatId || Date.now().toString(),
      messages,
      metadata: {
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
        userId: userId,
      },
    }

    // Save chat as JSON blob with timestamp in filename
    const filename = `chats/${chatData.id}-${Date.now()}.json`
    const blob = await put(filename, JSON.stringify(chatData), {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      chatId: chatData.id,
      url: blob.url,
      messageCount: messages.length,
    })
  } catch (error) {
    console.error("Chat save error:", error)
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 })
  }
}
