import { describe, it, expect } from 'vitest'
import { BookingStatus, getBookingStatusLabel, getBookingStatusMeta } from '../lib/constants'

describe('BookingStatus constants', () => {
  it('CREATED equals 0', () => {
    expect(BookingStatus.CREATED).toBe(0)
  })

  it('PENDING equals 1', () => {
    expect(BookingStatus.PENDING).toBe(1)
  })

  it('CONFIRMED equals 2', () => {
    expect(BookingStatus.CONFIRMED).toBe(2)
  })

  it('CANCELLED equals -1', () => {
    expect(BookingStatus.CANCELLED).toBe(-1)
  })

  it('values match bot exactly (contract test)', () => {
    expect(BookingStatus.CREATED).toBe(0)
    expect(BookingStatus.PENDING).toBe(1)
    expect(BookingStatus.CONFIRMED).toBe(2)
    expect(BookingStatus.CANCELLED).toBe(-1)
  })
})

describe('getBookingStatusLabel', () => {
  it('returns correct label for CONFIRMED', () => {
    expect(getBookingStatusLabel(BookingStatus.CONFIRMED)).toBe('Подтверждено')
  })

  it('returns correct label for PENDING', () => {
    expect(getBookingStatusLabel(BookingStatus.PENDING)).toBe('В ожидании')
  })

  it('returns correct label for CREATED', () => {
    expect(getBookingStatusLabel(BookingStatus.CREATED)).toBe('Новая заявка')
  })

  it('returns correct label for CANCELLED', () => {
    expect(getBookingStatusLabel(BookingStatus.CANCELLED)).toBe('Отменено')
  })
})

describe('getBookingStatusMeta', () => {
  it('returns green styling for CONFIRMED', () => {
    const meta = getBookingStatusMeta(BookingStatus.CONFIRMED)
    expect(meta.className).toContain('green')
  })

  it('returns yellow styling for PENDING', () => {
    const meta = getBookingStatusMeta(BookingStatus.PENDING)
    expect(meta.className).toContain('yellow')
  })

  it('returns blue styling for CREATED', () => {
    const meta = getBookingStatusMeta(BookingStatus.CREATED)
    expect(meta.className).toContain('blue')
  })

  it('returns destructive variant for CANCELLED', () => {
    const meta = getBookingStatusMeta(BookingStatus.CANCELLED)
    expect(meta.variant).toBe('destructive')
  })
})
