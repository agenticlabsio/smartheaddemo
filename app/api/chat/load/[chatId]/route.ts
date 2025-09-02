import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const { chatId } = params

    if (!chatId) {
      return NextResponse.json({ error: "No chat ID provided" }, { status: 400 })
    }

    // Construct the blob URL pattern for this chat ID
    const response = await fetch(`https://blob.vercel-storage.com/chats/${chatId}.json`, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const chatData = await response.json()

    return NextResponse.json({
      success: true,
      chat: chatData,
    })
  } catch (error) {
    console.error("Error loading specific chat:", error)
    return NextResponse.json({ error: "Failed to load chat" }, { status: 500 })
  }
}
