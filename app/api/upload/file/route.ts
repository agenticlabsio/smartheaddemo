// Enhanced File Upload API with Multimodal Analysis
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ObjectStorageService } from '@/server/objectStorage'
import { EnhancedGeminiClient } from '@/lib/gemini/enhanced-client'
import { SmartHeadCacheService } from '@/lib/cache/redis-service'

interface FileUploadRequest {
  fileType: 'chart' | 'document' | 'csv' | 'image'
  uploadContext: {
    userId: string
    conversationId?: string
    messageId?: string
    purpose: 'analysis' | 'context' | 'visualization' | 'reference'
  }
  metadata?: {
    description?: string
    tags?: string[]
    confidential?: boolean
  }
}

interface FileUploadResponse {
  success: boolean
  fileId: string
  downloadUrl: string
  publicUrl?: string
  metadata: {
    filename: string
    size: number
    contentType: string
    uploadedAt: string
    processed: boolean
  }
  processing?: {
    status: 'pending' | 'processing' | 'completed' | 'failed'
    extractedData?: any
    insights?: string[]
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    const { fileType, uploadContext, metadata } = body as FileUploadRequest

    // Validate required fields
    if (!fileType || !uploadContext.purpose) {
      return NextResponse.json({
        success: false,
        error: 'fileType and purpose are required'
      }, { status: 400 })
    }

    const objectStorage = new ObjectStorageService()
    const cache = SmartHeadCacheService.getInstance()

    // Generate upload URL
    const uploadURL = await objectStorage.getObjectEntityUploadURL()
    const fileId = uploadURL.split('/').pop()?.split('?')[0] || Date.now().toString()

    // Create file metadata
    const fileMetadata = {
      fileId,
      userId,
      fileType,
      uploadContext: {
        ...uploadContext,
        userId // Ensure userId is set
      },
      metadata: metadata || {},
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    // Cache file metadata for processing
    await cache.safeSet(`upload:${fileId}`, fileMetadata, 3600)

    return NextResponse.json({
      success: true,
      fileId,
      uploadURL,
      metadata: {
        uploadedAt: fileMetadata.createdAt,
        processed: false
      }
    })

  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process upload request'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const url = new URL(request.url)
    const fileId = url.searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'fileId parameter required'
      }, { status: 400 })
    }

    const cache = SmartHeadCacheService.getInstance()
    const fileMetadata = await cache.safeGet(`upload:${fileId}`) as { userId?: string } | null

    if (!fileMetadata || fileMetadata.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'File not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      file: fileMetadata
    })

  } catch (error) {
    console.error('File status API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get file status'
    }, { status: 500 })
  }
}