import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface PDFExportData {
  title: string
  summary: string
  query: string
  sql: string
  results: any[]
  metadata: {
    executionTime: number
    confidence: number
    modelUsed: string
    timestamp: string
  }
  insights?: string
}

export class ExecutiveReportPDF {
  private doc: jsPDF
  private currentY: number = 20
  private margin: number = 20
  private pageWidth: number
  private pageHeight: number

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
  }

  public async generateReport(data: PDFExportData): Promise<void> {
    // Add executive header
    this.addExecutiveHeader(data.title, data.metadata.timestamp)
    
    // Add executive summary
    this.addSection('Executive Summary', data.summary, '#4F46E5')
    
    // Add key metrics section if results exist
    if (data.results && data.results.length > 0) {
      this.addKeyMetricsTable(data.results)
    }
    
    // Add insights if available
    if (data.insights) {
      this.addSection('Strategic Insights', data.insights, '#8B5CF6')
    }
    
    // Add technical details section
    this.addTechnicalDetails(data.query, data.sql, data.metadata)
    
    // Add footer with metadata
    this.addExecutiveFooter(data.metadata)
  }

  private addExecutiveHeader(title: string, timestamp: string): void {
    // Company header background
    this.doc.setFillColor(31, 41, 55) // gray-800
    this.doc.rect(0, 0, this.pageWidth, 35, 'F')
    
    // FinSight logo and title
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(24)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('FinSight', this.margin, 20)
    
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text('Executive Financial Analytics Report', this.margin, 28)
    
    // Timestamp
    this.doc.setFontSize(10)
    this.doc.text(`Generated: ${new Date(timestamp).toLocaleString()}`, this.pageWidth - 70, 28)
    
    // Report title
    this.currentY = 50
    this.doc.setTextColor(31, 41, 55)
    this.doc.setFontSize(18)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    
    this.currentY += 15
    this.addHorizontalLine()
  }

  private addSection(title: string, content: string, color: string): void {
    this.checkPageBreak(30)
    
    // Section header with color coding
    const rgb = this.hexToRgb(color)
    this.doc.setFillColor(rgb.r, rgb.g, rgb.b, 0.1)
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 12, 'F')
    
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin + 5, this.currentY + 3)
    
    this.currentY += 15
    
    // Content
    this.doc.setTextColor(55, 65, 81) // gray-700
    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    
    const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin - 10)
    lines.forEach((line: string) => {
      this.checkPageBreak(8)
      this.doc.text(line, this.margin + 5, this.currentY)
      this.currentY += 6
    })
    
    this.currentY += 8
  }

  private addKeyMetricsTable(results: any[]): void {
    this.checkPageBreak(40)
    
    // Table header
    this.doc.setFillColor(16, 185, 129) // green-500
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 12, 'F')
    this.doc.text('Key Financial Metrics', this.margin + 5, this.currentY + 3)
    
    this.currentY += 15
    
    if (results.length > 0) {
      const headers = Object.keys(results[0])
      const colWidth = (this.pageWidth - 2 * this.margin) / headers.length
      
      // Table headers
      this.doc.setFillColor(243, 244, 246) // gray-100
      this.doc.setTextColor(55, 65, 81)
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'bold')
      
      headers.forEach((header, index) => {
        this.doc.rect(this.margin + index * colWidth, this.currentY, colWidth, 8, 'F')
        this.doc.text(header, this.margin + index * colWidth + 2, this.currentY + 5)
      })
      
      this.currentY += 10
      
      // Table rows (limit to first 10 for PDF)
      const displayRows = results.slice(0, 10)
      this.doc.setFont('helvetica', 'normal')
      
      displayRows.forEach((row, rowIndex) => {
        this.checkPageBreak(8)
        
        if (rowIndex % 2 === 0) {
          this.doc.setFillColor(249, 250, 251) // gray-50
          this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 8, 'F')
        }
        
        headers.forEach((header, colIndex) => {
          const value = row[header]?.toString() || ''
          const truncatedValue = value.length > 15 ? value.substring(0, 12) + '...' : value
          this.doc.text(truncatedValue, this.margin + colIndex * colWidth + 2, this.currentY + 5)
        })
        
        this.currentY += 8
      })
      
      if (results.length > 10) {
        this.currentY += 5
        this.doc.setTextColor(107, 114, 128) // gray-500
        this.doc.setFontSize(9)
        this.doc.text(`... and ${results.length - 10} more records`, this.margin, this.currentY)
      }
    }
    
    this.currentY += 15
  }

  private addTechnicalDetails(query: string, sql: string, metadata: any): void {
    this.checkPageBreak(50)
    
    // Technical section header
    this.doc.setFillColor(107, 114, 128) // gray-500
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'bold')
    this.doc.rect(this.margin, this.currentY - 5, this.pageWidth - 2 * this.margin, 10, 'F')
    this.doc.text('Technical Details', this.margin + 5, this.currentY + 2)
    
    this.currentY += 15
    
    // Query
    this.doc.setTextColor(55, 65, 81)
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Original Query:', this.margin, this.currentY)
    
    this.currentY += 6
    this.doc.setFont('helvetica', 'normal')
    const queryLines = this.doc.splitTextToSize(query, this.pageWidth - 2 * this.margin)
    queryLines.forEach((line: string) => {
      this.checkPageBreak(5)
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 5
    })
    
    this.currentY += 8
    
    // SQL (truncated for PDF)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Generated SQL (excerpt):', this.margin, this.currentY)
    
    this.currentY += 6
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9)
    const truncatedSQL = sql.length > 500 ? sql.substring(0, 500) + '...' : sql
    const sqlLines = this.doc.splitTextToSize(truncatedSQL, this.pageWidth - 2 * this.margin)
    sqlLines.forEach((line: string) => {
      this.checkPageBreak(4)
      this.doc.text(line, this.margin, this.currentY)
      this.currentY += 4
    })
    
    this.currentY += 10
  }

  private addExecutiveFooter(metadata: any): void {
    // Position footer at bottom of page
    const footerY = this.pageHeight - 20
    
    this.doc.setFillColor(31, 41, 55)
    this.doc.rect(0, footerY - 5, this.pageWidth, 25, 'F')
    
    this.doc.setTextColor(255, 255, 255)
    this.doc.setFontSize(9)
    this.doc.setFont('helvetica', 'normal')
    
    this.doc.text(`Execution Time: ${metadata.executionTime}ms`, this.margin, footerY + 3)
    this.doc.text(`Confidence: ${metadata.confidence}%`, this.margin, footerY + 9)
    this.doc.text(`Model: ${metadata.modelUsed}`, this.margin, footerY + 15)
    
    this.doc.text('FinSight Executive Analytics Platform', this.pageWidth - 80, footerY + 9)
  }

  private addHorizontalLine(): void {
    this.doc.setDrawColor(229, 231, 235) // gray-200
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY)
    this.currentY += 5
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage()
      this.currentY = 20
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 0, g: 0, b: 0 }
  }

  public save(filename: string): void {
    this.doc.save(filename)
  }
}

export async function exportToPDF(data: PDFExportData): Promise<void> {
  const pdfGenerator = new ExecutiveReportPDF()
  await pdfGenerator.generateReport(data)
  
  const filename = `FinSight_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`
  pdfGenerator.save(filename)
}