import { GET } from '@/app/api/message/[id]/chart/route'
import { NextRequest } from 'next/server'

// Mock the database module
jest.mock('@/lib/database', () => ({
  Database: {
    query: jest.fn(),
  },
}))

import { Database } from '@/lib/database'

describe('/api/message/[id]/chart', () => {
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
      },
      {
        supplier: 'DICKSON COMPANY_US_50051700',
        commodity: 'Professional Services',
        transaction_count: '14',
        total_spend: '333909.17',
        avg_transaction_size: '23850.66'
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

  it('should generate bar chart for supplier spending analysis', async () => {
    ;(Database.query as jest.Mock).mockResolvedValue(mockBaanData)

    const request = new NextRequest('http://localhost:3000/api/message/test-123/chart')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.type).toBe('bar')
    expect(data.title).toBe('Supplier Spending Analysis')
    
    // Verify chart data structure
    expect(data.data).toHaveLength(3)
    expect(data.data[0]).toMatchObject({
      name: expect.stringContaining('PIDC CONSTRUCTION'),
      value: 2830289.96
    })

    // Verify chart configuration
    expect(data.config).toHaveProperty('yAxis')
    expect(data.config.yAxis.label).toBe('Amount ($)')
    expect(data.config.series).toHaveLength(1)
    expect(data.config.series[0].dataKey).toBe('value')

    // Verify insights generation
    expect(data.insights).toEqual(
      expect.arrayContaining([
        expect.stringContaining('PIDC CONSTRUCTION'),
        expect.stringContaining('49.9%'),
        expect.stringContaining('Top 3'),
        expect.stringContaining('Average value')
      ])
    )
  })

  it('should generate pie chart for commodity distribution', async () => {
    const commodityData = {
      rows: [
        { commodity: 'Construction Spend', total_spend: '2830289.96' },
        { commodity: 'Professional Services', total_spend: '736371.17' },
        { commodity: 'IT Consultant Services', total_spend: '508064.00' }
      ],
      fields: [
        { name: 'commodity', dataTypeID: 25 },
        { name: 'total_spend', dataTypeID: 1700 }
      ]
    }
    ;(Database.query as jest.Mock).mockResolvedValue(commodityData)

    const request = new NextRequest('http://localhost:3000/api/message/commodity-analysis/chart')
    const context = { params: Promise.resolve({ id: 'commodity-analysis' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.type).toBe('pie')
    expect(data.title).toContain('Commodity')
    expect(data.data[0]).toMatchObject({
      name: 'Construction Spend',
      value: 2830289.96
    })
  })

  it('should handle empty data sets', async () => {
    ;(Database.query as jest.Mock).mockResolvedValue({
      rows: [],
      fields: []
    })

    const request = new NextRequest('http://localhost:3000/api/message/empty-data/chart')
    const context = { params: Promise.resolve({ id: 'empty-data' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('No data available')
  })

  it('should handle database errors gracefully', async () => {
    ;(Database.query as jest.Mock).mockRejectedValue(new Error('Connection timeout'))

    const request = new NextRequest('http://localhost:3000/api/message/test-123/chart')
    const context = { params: Promise.resolve({ id: 'test-123' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to generate chart')
  })

  it('should limit chart data to top 15 items', async () => {
    // Mock large dataset
    const largeDataset = {
      rows: Array(25).fill(null).map((_, i) => ({
        supplier: `Supplier ${i + 1}`,
        total_spend: `${1000000 - i * 10000}`
      })),
      fields: [
        { name: 'supplier', dataTypeID: 25 },
        { name: 'total_spend', dataTypeID: 1700 }
      ]
    }
    ;(Database.query as jest.Mock).mockResolvedValue(largeDataset)

    const request = new NextRequest('http://localhost:3000/api/message/large-dataset/chart')
    const context = { params: Promise.resolve({ id: 'large-dataset' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.length).toBe(15) // Should be limited to 15 items
  })

  it('should generate appropriate insights for different data patterns', async () => {
    // Mock data with clear concentration pattern
    const concentratedData = {
      rows: [
        { supplier: 'Dominant Supplier', total_spend: '5000000' },
        { supplier: 'Small Supplier 1', total_spend: '100000' },
        { supplier: 'Small Supplier 2', total_spend: '50000' }
      ],
      fields: [
        { name: 'supplier', dataTypeID: 25 },
        { name: 'total_spend', dataTypeID: 1700 }
      ]
    }
    ;(Database.query as jest.Mock).mockResolvedValue(concentratedData)

    const request = new NextRequest('http://localhost:3000/api/message/concentration-test/chart')
    const context = { params: Promise.resolve({ id: 'concentration-test' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.insights).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Dominant Supplier leads with 97.1%')
      ])
    )
  })

  it('should handle non-numeric data appropriately', async () => {
    const nonNumericData = {
      rows: [
        { status: 'Active', count: 'five' },
        { status: 'Inactive', count: 'three' }
      ],
      fields: [
        { name: 'status', dataTypeID: 25 },
        { name: 'count', dataTypeID: 25 }
      ]
    }
    ;(Database.query as jest.Mock).mockResolvedValue(nonNumericData)

    const request = new NextRequest('http://localhost:3000/api/message/non-numeric/chart')
    const context = { params: Promise.resolve({ id: 'non-numeric' }) }
    
    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('No valid numeric data')
  })
})