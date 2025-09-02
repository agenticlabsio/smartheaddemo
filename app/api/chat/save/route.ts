import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages, chatId, metadata } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    const chatData = {
      id: chatId || Date.now().toString(),
      messages,
      metadata: {
        timestamp: new Date().toISOString(),
        messageCount: messages.length,
        ...metadata,
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
