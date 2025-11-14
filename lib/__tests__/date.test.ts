import { describe, it, expect } from '@jest/globals'
import { formatDate, formatDateTime } from '../date'

describe('date', () => {
  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = formatDate(date)
      // Check that it returns a formatted date string
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(5)
      expect(formatted).not.toBe('—')
    })

    it('should format ISO string correctly', () => {
      const formatted = formatDate('2024-01-15T12:00:00Z')
      expect(formatted).toMatch(/\d{1,2}\s/)
      expect(formatted).not.toBe('—')
    })

    it('should format timestamp correctly', () => {
      const timestamp = new Date('2024-01-15').getTime()
      const formatted = formatDate(timestamp)
      expect(formatted).toMatch(/\d{1,2}\s/)
      expect(formatted).not.toBe('—')
    })

    it('should return em dash for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('—')
    })

    it('should return em dash for NaN', () => {
      expect(formatDate(NaN)).toBe('—')
    })
  })

  describe('formatDateTime', () => {
    it('should format Date object with time', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      const formatted = formatDateTime(date)
      expect(formatted).toMatch(/\d{1,2}/)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
      expect(formatted).not.toBe('—')
    })

    it('should format ISO string with time', () => {
      const formatted = formatDateTime('2024-01-15T12:00:00Z')
      expect(formatted).toMatch(/\d{1,2}/)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
      expect(formatted).not.toBe('—')
    })

    it('should format timestamp with time', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').getTime()
      const formatted = formatDateTime(timestamp)
      expect(formatted).toMatch(/\d{1,2}/)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
      expect(formatted).not.toBe('—')
    })

    it('should return em dash for invalid date', () => {
      expect(formatDateTime('invalid-date')).toBe('—')
    })

    it('should return em dash for NaN', () => {
      expect(formatDateTime(NaN)).toBe('—')
    })
  })
})
