import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for Web APIs
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any

// Mock Request and Response for Next.js
global.Request = class Request {} as any
global.Response = class Response {} as any
global.Headers = class Headers {} as any

// Mock environment variables for tests
process.env.POSTGRES_HOST = 'test-host'
process.env.POSTGRES_PORT = '5432'
process.env.POSTGRES_DB = 'test-db'
process.env.POSTGRES_USER = 'test-user'
process.env.POSTGRES_PASSWORD = 'test-password'
process.env.BOT_TOKEN = 'test-bot-token'

// Mock the database pool
jest.mock('./lib/db', () => ({
  pool: {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  },
}))

// Mock Telegram bot
jest.mock('node-telegram-bot-api', () => {
  return jest.fn().mockImplementation(() => ({
    sendMessage: jest.fn(),
    deleteMessage: jest.fn(),
  }))
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
