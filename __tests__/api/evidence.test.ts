import { GET } from '@/app/api/message/[id]/evidence/route'
import { NextRequest } from 'next/server'

// Mock the database module
jest.mock('@/lib/database', () => ({
  Database: {
    query: jest.fn(),
  },
}))

import { Database } from '@/lib/database'

describe('/api/message/[id]/evidence', () => {
  const mockBaanData = {
    rows: [
      {
        supplier: 'PIDC CONSTRUCTION LLC_US_71211419',
        commodity: 'Construction Spend',
        transaction_count: '4',
        total_spend: '2830289.96',
        avg_transaction_size: '707572.49'
      },
      {
        supplier: 'ILENSYS TECHNOLOGIES PRIVATE LIMITED_US_70054036',
        commodity: 'Professional Services',
        transaction_count: '31',
        total_spend: '402462.00',
        avg_transaction_size: '12982.65'
      }
    ],
    fields: [
      { name: 'supplier', dataTypeID: 25 },
      { name: 'commodity', dataTypeID: 25 },
      { name: 'transaction_count', dataTypeID: 23 },
      { name: 'total_spend', dataTypeID: 1700 },
      { name: 'avg_transaction_size', dataTypeID: 1700 }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return evidence data for valid message ID', async () => {
    // Mock the database query
    ;(Database.query as jest.Mock).mockResolvedValue(mockBaanData)

    const request = new NextRequest('http://localhost:3000/api/message/test-123/evidence')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('columns')
    expect(data).toHaveProperty('rows')
    expect(data).toHaveProperty('totalRows')
    expect(data).toHaveProperty('sqlQuery')
    expect(data).toHaveProperty('chartable')
    expect(data).toHaveProperty('metadata')

    // Verify column structure
    expect(data.columns).toEqual([
      { name: 'supplier', type: 'string' },
      { name: 'commodity', type: 'string' },
      { name: 'transaction_count', type: 'number' },
      { name: 'total_spend', type: 'number' },
      { name: 'avg_transaction_size', type: 'number' }
    ])

    // Verify rows data
    expect(data.rows).toHaveLength(2)
    expect(data.rows[0].supplier).toBe('PIDC CONSTRUCTION LLC_US_71211419')
    expect(data.totalRows).toBe(2)

    // Verify metadata
    expect(data.metadata).toHaveProperty('executionTime')
    expect(data.metadata.source).toBe('baan')
    expect(data.metadata.queryType).toBe('supplier_analysis')
    expect(data.chartable).toBe(true)
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    ;(Database.query as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/message/test-123/evidence')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to fetch evidence data')
  })

  it('should return fallback data when no specific query exists', async () => {
    // Mock successful fallback query
    ;(Database.query as jest.Mock).mockResolvedValue(mockBaanData)

    const request = new NextRequest('http://localhost:3000/api/message/unknown-id/evidence')
    const context = { params: Promise.resolve({ id: 'unknown-id' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rows).toHaveLength(2)
    expect(Database.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'))
  })

  it('should detect chartable data correctly', async () => {
    // Mock data with aggregations (should be chartable)
    ;(Database.query as jest.Mock).mockResolvedValue(mockBaanData)

    const request = new NextRequest('http://localhost:3000/api/message/test-123/evidence')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(data.chartable).toBe(true)
  })

  it('should enforce row limits for large datasets', async () => {
    // Mock large dataset
    const largeDataset = {
      rows: Array(1500).fill(mockBaanData.rows[0]),
      fields: mockBaanData.fields
    }
    ;(Database.query as jest.Mock).mockResolvedValue(largeDataset)

    const request = new NextRequest('http://localhost:3000/api/message/test-123/evidence')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rows.length).toBeLessThanOrEqual(1000) // Should enforce limit
  })

  it('should handle empty result sets', async () => {
    // Mock empty result
    ;(Database.query as jest.Mock).mockResolvedValue({
      rows: [],
      fields: []
    })

    const request = new NextRequest('http://localhost:3000/api/message/test-123/evidence')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.rows).toHaveLength(0)
    expect(data.totalRows).toBe(0)
    expect(data.chartable).toBe(false)
  })
})