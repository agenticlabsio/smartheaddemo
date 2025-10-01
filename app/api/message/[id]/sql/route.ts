import { NextRequest, NextResponse } from 'next/server'
import { unifiedStorage } from '@/lib/storage/unified-storage'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const messageId = id
    const sqlQuery = await unifiedStorage.getMessageSQLQuery(messageId, userId)

    if (!sqlQuery) {
      return NextResponse.json(
        { error: 'SQL query not found for this message' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      sqlQuery,
      messageId
    })
  } catch (error) {
    console.error('Error retrieving SQL query:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve SQL query' },
      { status: 500 }
    )
  }
}