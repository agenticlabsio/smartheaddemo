import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Temporary: Return empty chats until Convex is fully configured
    const chats: any[] = []

    return NextResponse.json({ chats })
  } catch (error) {
    console.error("Error loading chats:", error)
    return NextResponse.json({ error: "Failed to load chats" }, { status: 500 })
  }
}
