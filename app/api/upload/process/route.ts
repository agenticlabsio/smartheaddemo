// Enhanced File Processing API with Multimodal Analysis
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ObjectStorageService } from '@/server/objectStorage'
import { EnhancedGeminiClient } from '@/lib/gemini/enhanced-client'
import { SmartHeadCacheService } from '@/lib/cache/redis-service'
import pdfParse from 'pdf-parse'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import * as csv from 'csv-parser'
import { Readable } from 'stream'

interface FileProcessingRequest {
  fileId: string
  processingType?: 'chart_analysis' | 'csv_integration' | 'document_extraction' | 'pdf_extraction' | 'excel_processing' | 'word_processing' | 'auto'
  analysisPrompt?: string
  includeInChatContext?: boolean
}

interface FileMetadata {
  fileId: string
  userId: string
  fileType: string
  uploadContext: {
    userId: string
    conversationId?: string
    messageId?: string
    purpose: string
  }
  metadata: {
    filename?: string
    size?: number
    contentType?: string
    [key: string]: any
  }
  status: string
  createdAt: string
  processingStarted?: string
  processingResult?: any
  error?: string
  failedAt?: string
  processedAt?: string
}

interface SchemaField {
  type: 'string' | 'number' | 'date'
  nullable: boolean
}

interface Schema {
  [key: string]: SchemaField
}

interface ChartAnalysis {
  chartType: string
  extractedData: any[]
  insights: string[]
  suggestedQueries: string[]
  thinking?: string
  chatContext?: {
    relevantFinancialInfo: string[]
    suggestedFollowUps: string[]
    contextSummary: string
    keyMetrics?: string[]
    dataPatterns?: string[]
  }
}

interface CSVProcessingResult {
  schema: Schema
  sampleData: any[]
  totalRows: number
  insights: string[]
  suggestedIntegration: any
  actionableInsights?: string[]
  chatContext?: {
    relevantFinancialInfo: string[]
    suggestedFollowUps: string[]
    contextSummary: string
    keyMetrics?: string[]
    dataPatterns?: string[]
  }
}

interface DocumentAnalysis {
  extractedText: string
  entities: any[]
  summary: string
  actionableInsights: string[]
  relatedQueries: string[]
  fileType: 'pdf' | 'word' | 'text' | 'image'
  metadata?: {
    pageCount?: number
    wordCount?: number
    extractionQuality?: number
  }
  chatContext?: {
    relevantFinancialInfo: string[]
    suggestedFollowUps: string[]
    contextSummary: string
  }
}

interface ExcelProcessingResult {
  sheets: ExcelSheet[]
  totalRows: number
  insights: string[]
  suggestedIntegration: any
  actionableInsights?: string[]
  chatContext?: {
    keyMetrics: string[]
    dataPatterns: string[]
    contextSummary: string
    relevantFinancialInfo?: string[]
    suggestedFollowUps?: string[]
  }
}

interface ExcelSheet {
  name: string
  headers: string[]
  sampleData: any[]
  rowCount: number
  schema: Schema
}

export class FileProcessingService {
  private geminiClient: EnhancedGeminiClient
  private cache: SmartHeadCacheService
  private objectStorage: ObjectStorageService

  constructor() {
    this.geminiClient = EnhancedGeminiClient.getInstance()
    this.cache = SmartHeadCacheService.getInstance()
    this.objectStorage = new ObjectStorageService()
  }

  // New method to fetch actual file content from object storage
  private async getFileContent(fileId: string, expectedMimeType?: string): Promise<Buffer> {
    try {
      const objectPath = `/objects/uploads/${fileId}`
      const file = await this.objectStorage.getObjectEntityFile(objectPath)
      
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        const stream = file.createReadStream()
        
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        
        stream.on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Error fetching file content:', error)
      throw new Error(`Failed to fetch file content: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Enhanced PDF processing
  async processPDFUpload(fileId: string): Promise<DocumentAnalysis> {
    try {
      const fileBuffer = await this.getFileContent(fileId, 'application/pdf')
      const pdfData = await pdfParse(fileBuffer)
      
      const analysis = await this.geminiClient.generateWithThinking({
        prompt: `Analyze this PDF document for procurement/financial insights:
        
Document Content:
        ${pdfData.text.substring(0, 8000)}
        
Please:
        1. Extract key financial/procurement entities (suppliers, contracts, amounts, dates)
        2. Identify important financial metrics and KPIs
        3. Summarize main findings and business implications
        4. Generate actionable insights for procurement teams
        5. Suggest follow-up analysis queries for Smart Head platform
        6. Assess data quality and reliability`,
        systemPrompt: 'You are an expert financial analyst specializing in procurement document analysis.',
        enableThinking: true
      })

      const entities = this.extractEntities(analysis.response_text)
      const chatContext = this.generateChatContext(analysis.response_text, 'pdf')
      
      return {
        extractedText: pdfData.text,
        entities,
        summary: this.extractSummary(analysis.response_text),
        actionableInsights: this.extractInsights(analysis.response_text),
        relatedQueries: this.extractQueries(analysis.response_text),
        fileType: 'pdf',
        metadata: {
          pageCount: pdfData.numpages,
          wordCount: pdfData.text.split(' ').length,
          extractionQuality: this.assessExtractionQuality(pdfData.text)
        },
        chatContext
      }
    } catch (error) {
      console.error('PDF processing error:', error)
      throw error
    }
  }

  // Enhanced Excel processing
  async processExcelUpload(fileId: string): Promise<ExcelProcessingResult> {
    try {
      const fileBuffer = await this.getFileContent(fileId)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      
      const sheets: ExcelSheet[] = []
      let totalRows = 0
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[]
          const dataRows = jsonData.slice(1, 21) as any[][] // Sample first 20 rows
          const rowObjects = dataRows.map((row: any[]) => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index] || ''
            })
            return obj
          })
          
          const schema = this.detectCSVSchema(headers, rowObjects)
          
          sheets.push({
            name: sheetName,
            headers,
            sampleData: rowObjects,
            rowCount: jsonData.length - 1,
            schema
          })
          
          totalRows += jsonData.length - 1
        }
      }
      
      // Analyze with Gemini
      const analysis = await this.geminiClient.generateWithThinking({
        prompt: `Analyze this Excel file for procurement/financial insights:
        
Sheets: ${sheets.map(s => s.name).join(', ')}
        Sample Data: ${JSON.stringify(sheets.map(s => ({ name: s.name, headers: s.headers, sample: s.sampleData.slice(0, 3) })), null, 2)}
        
Please:
        1. Identify key financial metrics and dimensions
        2. Assess data quality and completeness
        3. Suggest integration strategies with existing Smart Head data
        4. Recommend analysis opportunities and visualizations
        5. Flag any data quality issues or anomalies
        6. Generate insights for procurement decision-making`,
        systemPrompt: 'You are an expert data analyst specializing in financial and procurement data analysis.',
        enableThinking: true
      })
      
      const chatContext = this.generateChatContext(analysis.response_text, 'excel')
      
      return {
        sheets,
        totalRows,
        insights: this.extractInsights(analysis.response_text),
        suggestedIntegration: this.extractIntegrationSuggestions(analysis.response_text),
        chatContext
      }
    } catch (error) {
      console.error('Excel processing error:', error)
      throw error
    }
  }

  // Enhanced Word document processing
  async processWordUpload(fileId: string): Promise<DocumentAnalysis> {
    try {
      const fileBuffer = await this.getFileContent(fileId)
      const result = await mammoth.extractRawText({ buffer: fileBuffer })
      
      const analysis = await this.geminiClient.generateWithThinking({
        prompt: `Analyze this Word document for procurement/financial insights:
        
Document Content:
        ${result.value.substring(0, 8000)}
        
Please:
        1. Extract key entities (suppliers, contracts, amounts, dates)
        2. Identify financial/procurement information
        3. Summarize main points and findings
        4. Generate actionable insights for procurement teams
        5. Suggest related analysis queries for Smart Head platform
        6. Assess document structure and information quality`,
        systemPrompt: 'You are an expert procurement analyst specializing in document analysis.',
        enableThinking: true
      })
      
      const entities = this.extractEntities(analysis.response_text)
      const chatContext = this.generateChatContext(analysis.response_text, 'word')
      
      return {
        extractedText: result.value,
        entities,
        summary: this.extractSummary(analysis.response_text),
        actionableInsights: this.extractInsights(analysis.response_text),
        relatedQueries: this.extractQueries(analysis.response_text),
        fileType: 'word',
        metadata: {
          wordCount: result.value.split(' ').length,
          extractionQuality: this.assessExtractionQuality(result.value)
        },
        chatContext
      }
    } catch (error) {
      console.error('Word processing error:', error)
      throw error
    }
  }

  async analyzeChartUpload(fileId: string, fileInfo: any): Promise<ChartAnalysis> {
    try {
      // Use Gemini 2.5 Flash multimodal capabilities
      const analysis = await this.geminiClient.processUploadedFile(fileInfo, `
        Analyze this chart/visualization for procurement analytics:
        1. Identify the chart type and data structure
        2. Extract key data points, trends, and patterns
        3. Generate business insights relevant to procurement
        4. Suggest follow-up analysis queries for Smart Head platform
        5. Recommend integration with existing financial/procurement data
      `)

      return {
        chartType: this.extractChartType(analysis.response_text),
        extractedData: this.extractDataPoints(analysis.response_text),
        insights: this.extractInsights(analysis.response_text),
        suggestedQueries: this.extractQueries(analysis.response_text),
        thinking: analysis.thinking_text
      }
    } catch (error) {
      console.error('Chart analysis error:', error)
      throw error
    }
  }

  // Enhanced CSV processing
  async processCSVUpload(fileId: string): Promise<CSVProcessingResult> {
    try {
      const fileBuffer = await this.getFileContent(fileId, 'text/csv')
      const csvText = fileBuffer.toString('utf-8')
      
      // Parse CSV data more robustly
      const lines = csvText.split('\n').filter(line => line.trim())
      const headers = this.parseCSVLine(lines[0])
      const rows = lines.slice(1, 101).map(line => { // Process up to 100 rows for analysis
        const values = this.parseCSVLine(line)
        const row: any = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      }).filter(row => Object.values(row).some(v => v !== ''))

      // Auto-detect schema
      const schema = this.detectCSVSchema(headers, rows)
      
      // Generate enhanced insights with Gemini
      const analysis = await this.geminiClient.generateWithThinking({
        prompt: `Analyze this CSV data for procurement/financial analysis:
        
Headers: ${headers.join(', ')}
        Schema: ${JSON.stringify(schema, null, 2)}
        Sample Data (first 5 rows): ${JSON.stringify(rows.slice(0, 5), null, 2)}
        Total Rows: ${lines.length - 1}
        
Please:
        1. Assess data quality and completeness
        2. Identify key financial metrics and dimensions
        3. Detect patterns, trends, and anomalies
        4. Suggest integration strategies with existing Smart Head data
        5. Recommend analysis opportunities and dashboard visualizations
        6. Flag any data quality issues or potential problems
        7. Provide actionable insights for procurement teams`,
        systemPrompt: 'You are an expert data analyst specializing in financial and procurement CSV data analysis.',
        enableThinking: true
      })

      return {
        schema,
        sampleData: rows.slice(0, 20), // Return first 20 rows for preview
        totalRows: lines.length - 1,
        insights: this.extractInsights(analysis.response_text),
        suggestedIntegration: this.extractIntegrationSuggestions(analysis.response_text)
      }
    } catch (error) {
      console.error('CSV processing error:', error)
      throw error
    }
  }
  
  // Helper method for robust CSV parsing
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result.map(val => val.replace(/^"(.*)"$/, '$1')) // Remove surrounding quotes
  }

  // Enhanced text document processing
  async analyzeDocumentUpload(fileId: string): Promise<DocumentAnalysis> {
    try {
      const fileBuffer = await this.getFileContent(fileId, 'text/plain')
      const documentText = fileBuffer.toString('utf-8')
      
      const analysis = await this.geminiClient.generateWithThinking({
        prompt: `Analyze this text document for procurement/financial insights:
        
Document Content:
        ${documentText.substring(0, 8000)}
        
Please:
        1. Extract key entities (suppliers, contracts, amounts, dates)
        2. Identify important financial or procurement information
        3. Summarize main points and findings
        4. Generate actionable insights for procurement teams
        5. Suggest related analysis queries for Smart Head platform
        6. Assess document structure and information quality`,
        systemPrompt: 'You are an expert procurement analyst specializing in document analysis.',
        enableThinking: true
      })
      
      const entities = this.extractEntities(analysis.response_text)
      const chatContext = this.generateChatContext(analysis.response_text, 'text')

      return {
        extractedText: documentText,
        entities,
        summary: this.extractSummary(analysis.response_text),
        actionableInsights: this.extractInsights(analysis.response_text),
        relatedQueries: this.extractQueries(analysis.response_text),
        fileType: 'text',
        metadata: {
          wordCount: documentText.split(' ').length,
          extractionQuality: this.assessExtractionQuality(documentText)
        },
        chatContext
      }
    } catch (error) {
      console.error('Document analysis error:', error)
      throw error
    }
  }
  
  // New helper methods
  private generateChatContext(analysisText: string, fileType: string): any {
    const relevantInfo = this.extractInsights(analysisText)
    const followUps = this.extractQueries(analysisText)
    
    return {
      relevantFinancialInfo: relevantInfo,
      suggestedFollowUps: followUps,
      contextSummary: `${fileType.toUpperCase()} file analyzed with ${relevantInfo.length} key insights identified`,
      keyMetrics: this.extractMetrics(analysisText),
      dataPatterns: this.extractPatterns(analysisText)
    }
  }
  
  private extractMetrics(text: string): string[] {
    const metrics = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.includes('$') || line.includes('%') || line.includes('metric')) {
        metrics.push(line.trim())
      }
    }
    
    return metrics.slice(0, 5)
  }
  
  private extractPatterns(text: string): string[] {
    const patterns = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.toLowerCase().includes('pattern') || line.toLowerCase().includes('trend')) {
        patterns.push(line.trim())
      }
    }
    
    return patterns.slice(0, 3)
  }
  
  private assessExtractionQuality(text: string): number {
    // Simple quality assessment based on text length and structure
    if (text.length < 100) return 0.3
    if (text.length < 500) return 0.6
    if (text.length < 2000) return 0.8
    return 0.9
  }

  // Helper methods for data extraction
  private extractChartType(text: string): string {
    const types = ['bar', 'line', 'pie', 'scatter', 'area', 'column']
    for (const type of types) {
      if (text.toLowerCase().includes(type)) return type
    }
    return 'unknown'
  }

  private extractDataPoints(text: string): any[] {
    // Extract structured data from analysis text
    const dataMatch = text.match(/data points?[:\s]*(.*?)(?:\n\n|\.|$)/i)
    if (dataMatch) {
      try {
        return JSON.parse(dataMatch[1])
      } catch {
        return []
      }
    }
    return []
  }

  private extractInsights(text: string): string[] {
    const insights = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      if (line.match(/^[\d\-\*]\.?\s+/)) {
        insights.push(line.replace(/^[\d\-\*]\.?\s+/, '').trim())
      }
    }
    
    return insights.slice(0, 5) // Limit to top 5 insights
  }

  private extractQueries(text: string): string[] {
    const queries = []
    const queryMatch = text.match(/queries?[:\s]*(.*?)(?:\n\n|\.|$)/i)
    
    if (queryMatch) {
      const lines = queryMatch[1].split('\n')
      for (const line of lines) {
        if (line.trim() && line.includes('?')) {
          queries.push(line.trim())
        }
      }
    }
    
    return queries.slice(0, 3) // Limit to 3 queries
  }

  private extractSummary(text: string): string {
    const summaryMatch = text.match(/summary[:\s]*(.*?)(?:\n\n|\.|$)/i)
    return summaryMatch ? summaryMatch[1].trim() : text.substring(0, 200) + '...'
  }

  private extractEntities(text: string): any[] {
    // Simple entity extraction - in production, use more sophisticated NLP
    const entities = []
    const patterns = {
      amount: /\$[\d,]+(?:\.\d{2})?/g,
      date: /\d{1,2}\/\d{1,2}\/\d{4}/g,
      supplier: /supplier[:\s]*([^.\n]+)/gi
    }

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern)
      if (matches) {
        entities.push({ type, values: [...new Set(matches)] })
      }
    }

    return entities
  }

  private extractIntegrationSuggestions(text: string): any {
    return {
      recommendedTable: 'financial_data',
      mappingStrategy: 'column_match',
      confidence: 0.8
    }
  }

  private detectCSVSchema(headers: string[], rows: any[]): Schema {
    const schema: Schema = {}
    
    for (const header of headers) {
      const sampleValues = rows.map(row => row[header]).filter(v => v !== '')
      
      if (sampleValues.length === 0) {
        schema[header] = { type: 'string', nullable: true }
        continue
      }

      // Detect data type
      const isNumber = sampleValues.every(v => !isNaN(parseFloat(v)))
      const isDate = sampleValues.every(v => !isNaN(Date.parse(v)))
      
      if (isNumber) {
        schema[header] = { type: 'number', nullable: false }
      } else if (isDate) {
        schema[header] = { type: 'date', nullable: false }
      } else {
        schema[header] = { type: 'string', nullable: false }
      }
    }

    return schema
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
    const { fileId, processingType = 'auto', analysisPrompt } = body as FileProcessingRequest

    if (!fileId) {
      return NextResponse.json({
        success: false,
        error: 'fileId is required'
      }, { status: 400 })
    }

    const cache = SmartHeadCacheService.getInstance()
    const fileMetadata = await cache.safeGet(`upload:${fileId}`) as FileMetadata | null

    if (!fileMetadata || fileMetadata.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'File not found or access denied'
      }, { status: 404 })
    }

    const processingService = new FileProcessingService()
    let result
    let detectedType: string

    try {
      // Update cache to show processing status
      await cache.safeSet(`upload:${fileId}`, {
        ...fileMetadata,
        status: 'processing',
        processingStarted: new Date().toISOString()
      }, 3600)

      // Process file based on type and metadata
      const fileType = fileMetadata.fileType || 'auto'
      const fileName = fileMetadata.metadata?.filename || `${fileId}`
      
      // Auto-detect file type from filename if not specified
      detectedType = detectFileTypeFromName(fileName, fileType)
      
      switch (detectedType) {
        case 'pdf':
          result = await processingService.processPDFUpload(fileId)
          break
          
        case 'excel':
          result = await processingService.processExcelUpload(fileId)
          break
          
        case 'word':
          result = await processingService.processWordUpload(fileId)
          break
          
        case 'csv':
          result = await processingService.processCSVUpload(fileId)
          break
          
        case 'chart':
        case 'image':
          result = await processingService.analyzeChartUpload(fileId, {
            type: 'image',
            name: fileName,
            fileId: fileId
          })
          break
          
        case 'document':
        case 'text':
          result = await processingService.analyzeDocumentUpload(fileId)
          break
          
        default:
          return NextResponse.json({
            success: false,
            error: `Unsupported file type: ${detectedType}`
          }, { status: 400 })
      }
    } catch (processingError) {
      console.error('File processing failed:', processingError)
      
      const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error'
      
      // Update cache with error status
      await cache.safeSet(`upload:${fileId}`, {
        ...fileMetadata,
        status: 'failed',
        error: errorMessage,
        failedAt: new Date().toISOString()
      }, 3600)
      
      return NextResponse.json({
        success: false,
        error: 'File processing failed: ' + errorMessage
      }, { status: 500 })
    }

    // Update file metadata with processing results
    const updatedMetadata = {
      ...fileMetadata,
      status: 'completed',
      processedAt: new Date().toISOString(),
      processingResult: result
    }

    await cache.safeSet(`upload:${fileId}`, updatedMetadata, 86400) // 24 hour cache

    return NextResponse.json({
      success: true,
      fileId,
      processing: {
        status: 'completed',
        extractedData: result,
        insights: (() => {
          if ('insights' in result) {
            return result.insights
          } else if ('actionableInsights' in result) {
            return result.actionableInsights
          }
          return []
        })(),
        chatContext: result.chatContext || null,
        fileType: detectedType,
        processingTime: Date.now() - new Date(fileMetadata.createdAt).getTime()
      }
    })

  } catch (error) {
    console.error('File processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      success: false,
      error: 'File processing failed: ' + errorMessage
    }, { status: 500 })
  }
}

// Helper function for file type detection
function detectFileTypeFromName(fileName: string, providedType?: string): string {
  if (providedType && providedType !== 'auto') {
    return providedType
  }
  
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'pdf':
      return 'pdf'
    case 'xlsx':
    case 'xls':
      return 'excel'
    case 'docx':
    case 'doc':
      return 'word'
    case 'csv':
      return 'csv'
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return 'image'
    case 'txt':
      return 'text'
    default:
      return 'document'
  }
}