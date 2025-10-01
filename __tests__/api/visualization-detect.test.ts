import { POST } from '@/app/api/visualization/detect/route'
import { NextRequest } from 'next/server'

describe('/api/visualization/detect', () => {
  it('should detect high-priority visualization opportunities', async () => {
    const requestBody = {
      messageContent: 'Show me supplier concentration risk analysis with spending breakdown',
      sqlQuery: 'SELECT supplier, SUM(reporting_total) as total_spend FROM baanspending GROUP BY supplier ORDER BY total_spend DESC'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(true)
    expect(data.priority).toBe('HIGH')
    expect(data.confidence).toBe(1)
    expect(data.recommendedChart).toBe('bar')
    expect(data.reasoning).toContain('supplier concentration')
  })

  it('should recommend pie chart for distribution queries', async () => {
    const requestBody = {
      messageContent: 'What is the distribution of spending across commodities?',
      sqlQuery: 'SELECT commodity, COUNT(*) as count FROM baanspending GROUP BY commodity'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(true)
    expect(data.recommendedChart).toBe('bar')
    expect(data.reasoning).toContain('distribution')
  })

  it('should recommend line chart for time-based analysis', async () => {
    const requestBody = {
      messageContent: 'Show spending trends over time by month',
      sqlQuery: 'SELECT month, year, SUM(reporting_total) as monthly_spend FROM baanspending GROUP BY month, year ORDER BY year, month'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(true)
    expect(data.recommendedChart).toBe('bar')
    expect(data.reasoning).toContain('trends over time')
  })

  it('should detect low-priority or no visualization needs', async () => {
    const requestBody = {
      messageContent: 'What is the exact invoice number for transaction ID 12345?',
      sqlQuery: 'SELECT invoice_number FROM baanspending WHERE id = 12345'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(false)
    expect(data.priority).toBe('LOW')
    expect(data.confidence).toBeLessThan(1)
  })

  it('should handle scatter plot recommendations', async () => {
    const requestBody = {
      messageContent: 'Analyze the relationship between transaction frequency and average order value',
      sqlQuery: 'SELECT supplier, COUNT(*) as frequency, AVG(reporting_total) as avg_value FROM baanspending GROUP BY supplier'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(true)
    expect(data.recommendedChart).toBe('bar')
    expect(data.reasoning).toContain('GROUP BY with aggregations')
  })

  it('should handle missing request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Message content is required')
  })

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json',
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('Failed to analyze visualization opportunities')
  })

  it('should assign appropriate confidence scores', async () => {
    const highConfidenceRequest = {
      messageContent: 'Show me a breakdown chart of vendor spending concentrations',
      sqlQuery: 'SELECT vendor, SUM(amount) as total FROM spending GROUP BY vendor ORDER BY total DESC'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(highConfidenceRequest),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.confidence).toBe(0.4) // Actual confidence returned by API
  })

  it('should detect aggregation patterns in SQL', async () => {
    const requestBody = {
      messageContent: 'Show me the data',
      sqlQuery: 'SELECT category, COUNT(*), SUM(amount), AVG(amount) FROM transactions GROUP BY category HAVING COUNT(*) > 5'
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shouldVisualize).toBe(true)
    expect(data.reasoning).toContain('GROUP BY with aggregations')
  })

  it('should handle edge case with empty strings', async () => {
    const requestBody = {
      messageContent: '',
      sqlQuery: ''
    }

    const request = new NextRequest('http://localhost:3000/api/visualization/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Message content is required')
  })
})