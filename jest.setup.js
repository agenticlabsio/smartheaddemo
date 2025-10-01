const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.GOOGLE_API_KEY = 'test-google-key'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock Next.js modules that require specific environment
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options = {}) => ({
    url,
    method: options.method || 'GET',
    headers: new Map(Object.entries(options.headers || {})),
    body: options.body,
    json: async () => {
      if (!options.body) return {}
      try {
        return JSON.parse(options.body)
      } catch (error) {
        throw new SyntaxError('Unexpected token')
      }
    },
  })),
  NextResponse: {
    json: (data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
      headers: new Map(Object.entries(options.headers || {})),
    }),
  },
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock console.error to reduce noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})