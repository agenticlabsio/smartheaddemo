import { del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const { url, chatId } = await request.json()

    if (!url && !chatId) {
      return NextResponse.json({ error: "No URL or chat ID provided" }, { status: 400 })
    }

    let deleteUrl = url
    if (chatId && !url) {
      // Construct URL from chat ID if only ID provided
      deleteUrl = `https://blob.vercel-storage.com/chats/${chatId}.json`
    }

    // Delete from Vercel Blob
    await del(deleteUrl)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete chat error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
