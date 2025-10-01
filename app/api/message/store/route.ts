import { NextRequest, NextResponse } from 'next/server'
import { dbMessageStorage } from '@/lib/message-storage-db'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    // Get user authentication (optional for demo)
    let userId = 'demo-user'
    try {
      const authResult = await auth()
      if (authResult?.userId) {
        userId = authResult.userId
      }
    } catch (error) {
      console.warn('Authentication not available, using demo user:', error)
    }

    const { messageId, sqlQuery, responseData } = await request.json()
    
    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      )
    }

    // Store the data in database message storage with user isolation
    await dbMessageStorage.store(messageId, userId, { sqlQuery, responseData })
    
    // Clean up old messages periodically for this user
    await dbMessageStorage.cleanup(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error storing message data:', error)
    return NextResponse.json(
      { error: "Failed to store message data" },
      { status: 500 }
    )
  }
}