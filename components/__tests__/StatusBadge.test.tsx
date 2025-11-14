import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

// Mock constants
jest.mock('@/lib/constants', () => ({
  getBookingStatusMeta: jest.fn((status) => {
    const statusMap: any = {
      2: { label: 'Подтверждено', variant: 'default', className: 'bg-green-100' },
      1: { label: 'В ожидании', variant: 'secondary', className: 'bg-yellow-100' },
      '-1': { label: 'Отменено', variant: 'destructive' },
      null: { label: 'Неизвестно', variant: 'outline' },
    }
    return statusMap[String(status)] || { label: 'Неизвестно', variant: 'outline' }
  }),
}))

describe('StatusBadge', () => {
  it('should render confirmed status', () => {
    render(<StatusBadge status={2} />)
    expect(screen.getByText('Подтверждено')).toBeInTheDocument()
  })

  it('should render pending status', () => {
    render(<StatusBadge status={1} />)
    expect(screen.getByText('В ожидании')).toBeInTheDocument()
  })

  it('should render cancelled status', () => {
    render(<StatusBadge status={-1} />)
    expect(screen.getByText('Отменено')).toBeInTheDocument()
  })

  it('should render unknown status for null', () => {
    render(<StatusBadge status={null} />)
    expect(screen.getByText('Неизвестно')).toBeInTheDocument()
  })

  it('should render fallback when status is undefined', () => {
    render(
      <StatusBadge status={undefined as any} fallback={<span>Fallback Text</span>} />
    )

    expect(screen.getByText('Fallback Text')).toBeInTheDocument()
  })

  it('should not render fallback when status is provided', () => {
    render(
      <StatusBadge status={2} fallback={<span>Fallback Text</span>} />
    )

    expect(screen.queryByText('Fallback Text')).not.toBeInTheDocument()
    expect(screen.getByText('Подтверждено')).toBeInTheDocument()
  })
})
