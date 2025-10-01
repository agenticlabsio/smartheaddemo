import { NextRequest, NextResponse } from 'next/server'
import { unifiedStorage } from '@/lib/storage/unified-storage'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chats = await unifiedStorage.getAllChats(userId)
    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Failed to get chats:', error)
    return NextResponse.json({ error: 'Failed to load chats' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, messages } = await request.json()
    
    if (!chatId || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const savedChat = await unifiedStorage.saveChat(chatId, messages, userId)
    return NextResponse.json({ chat: savedChat })
  } catch (error) {
    console.error('Failed to save chat:', error)
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId } = await request.json()
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 })
    }

    const success = await unifiedStorage.deleteChat(chatId, userId)
    return NextResponse.json({ success })
  } catch (error) {
    console.error('Failed to delete chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}