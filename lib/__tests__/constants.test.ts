import { describe, it, expect } from '@jest/globals'
import {
  COURSE_NAMES,
  STREAM_NAMES,
  getCourseName,
  getStreamName,
  getBookingStatusMeta,
  getBookingStatusLabel,
} from '../constants'

describe('constants', () => {
  describe('COURSE_NAMES', () => {
    it('should have correct course name for course 1', () => {
      expect(COURSE_NAMES[1]).toBe('Вайб кодинг')
    })
  })

  describe('STREAM_NAMES', () => {
    it('should have correct stream names', () => {
      expect(STREAM_NAMES['3rd_stream']).toBe('3-й поток')
      expect(STREAM_NAMES['4th_stream']).toBe('4-й поток')
      expect(STREAM_NAMES['5th_stream']).toBe('5-й поток')
    })
  })

  describe('getCourseName', () => {
    it('should return course name for known course', () => {
      expect(getCourseName(1)).toBe('Вайб кодинг')
    })

    it('should return fallback for unknown course', () => {
      expect(getCourseName(999)).toBe('Course 999')
    })
  })

  describe('getStreamName', () => {
    it('should return stream name for known stream', () => {
      expect(getStreamName('3rd_stream')).toBe('3-й поток')
      expect(getStreamName('4th_stream')).toBe('4-й поток')
      expect(getStreamName('5th_stream')).toBe('5-й поток')
    })

    it('should return original stream for unknown stream', () => {
      expect(getStreamName('unknown_stream')).toBe('unknown_stream')
    })

    it('should handle null and undefined', () => {
      expect(getStreamName(null)).toBe('')
      expect(getStreamName(undefined)).toBe('')
    })
  })

  describe('getBookingStatusMeta', () => {
    it('should return correct meta for confirmed status', () => {
      const meta = getBookingStatusMeta(2)
      expect(meta.label).toBe('Подтверждено')
      expect(meta.variant).toBe('default')
      expect(meta.className).toContain('green')
    })

    it('should return correct meta for pending status', () => {
      const meta = getBookingStatusMeta(1)
      expect(meta.label).toBe('В ожидании')
      expect(meta.variant).toBe('secondary')
      expect(meta.className).toContain('yellow')
    })

    it('should return correct meta for cancelled status', () => {
      const meta = getBookingStatusMeta(-1)
      expect(meta.label).toBe('Отменено')
      expect(meta.variant).toBe('destructive')
    })

    it('should return default meta for unknown status', () => {
      const meta = getBookingStatusMeta(0)
      expect(meta.label).toBe('Неизвестно')
      expect(meta.variant).toBe('outline')
    })

    it('should return default meta for null status', () => {
      const meta = getBookingStatusMeta(null)
      expect(meta.label).toBe('Неизвестно')
      expect(meta.variant).toBe('outline')
    })
  })

  describe('getBookingStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getBookingStatusLabel(2)).toBe('Подтверждено')
      expect(getBookingStatusLabel(1)).toBe('В ожидании')
      expect(getBookingStatusLabel(-1)).toBe('Отменено')
      expect(getBookingStatusLabel(null)).toBe('Неизвестно')
    })
  })
})
