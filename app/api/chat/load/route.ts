import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { blobs } = await list({
      prefix: "chats/",
    })

    // Sort by creation time (newest first)
    const chatFiles = blobs
      .filter((blob) => blob.pathname.endsWith(".json"))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .map((blob) => ({
        id: blob.pathname.split("/").pop()?.replace(".json", "") || "unknown",
        url: blob.url,
        uploadedAt: blob.uploadedAt,
        size: blob.size,
        filename: blob.pathname.split("/").pop() || "unknown",
      }))

    return NextResponse.json({ chats: chatFiles })
  } catch (error) {
    console.error("Error loading chats:", error)
    return NextResponse.json({ error: "Failed to load chats" }, { status: 500 })
  }
}
