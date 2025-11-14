import { describe, it, expect, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import StreamBadge from '../StreamBadge'

// Mock constants
jest.mock('@/lib/constants', () => ({
  getStreamName: jest.fn((stream) => {
    const streamMap: any = {
      '3rd_stream': '3-й поток',
      '4th_stream': '4-й поток',
      '5th_stream': '5-й поток',
    }
    return streamMap[stream] || stream || ''
  }),
}))

describe('StreamBadge', () => {
  it('should render stream name for valid stream', () => {
    render(<StreamBadge stream="3rd_stream" />)
    expect(screen.getByText('3-й поток')).toBeInTheDocument()
  })

  it('should render 4th stream', () => {
    render(<StreamBadge stream="4th_stream" />)
    expect(screen.getByText('4-й поток')).toBeInTheDocument()
  })

  it('should render 5th stream', () => {
    render(<StreamBadge stream="5th_stream" />)
    expect(screen.getByText('5-й поток')).toBeInTheDocument()
  })

  it('should render em dash for null stream', () => {
    render(<StreamBadge stream={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should render em dash for undefined stream', () => {
    render(<StreamBadge stream={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should render em dash for empty string', () => {
    render(<StreamBadge stream="" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
