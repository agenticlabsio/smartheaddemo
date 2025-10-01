import { NextResponse } from 'next/server'
import { unifiedStorage } from '@/lib/storage/unified-storage'

export async function GET() {
  try {
    const chatId = unifiedStorage.generateChatId()
    return NextResponse.json({ chatId })
  } catch (error) {
    console.error('Failed to generate chat ID:', error)
    return NextResponse.json({ error: 'Failed to generate ID' }, { status: 500 })
  }
}