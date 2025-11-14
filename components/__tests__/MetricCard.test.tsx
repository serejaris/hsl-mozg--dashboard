import { describe, it, expect } from '@jest/globals'
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import MetricCard from '../MetricCard'

describe('MetricCard', () => {
  it('should render title and value', () => {
    render(<MetricCard title="Total Users" value={100} icon={Users} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('should render string value', () => {
    render(<MetricCard title="Status" value="Active" icon={Users} />)

    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('should render description when provided', () => {
    render(
      <MetricCard
        title="Total Users"
        value={100}
        icon={Users}
        description="Registered users"
      />
    )

    expect(screen.getByText('Registered users')).toBeInTheDocument()
  })

  it('should not render description when not provided', () => {
    render(<MetricCard title="Total Users" value={100} icon={Users} />)

    expect(screen.queryByText('Registered users')).not.toBeInTheDocument()
  })

  it('should render positive trend', () => {
    render(
      <MetricCard
        title="Total Users"
        value={100}
        icon={Users}
        trend={{ value: 12.5, isPositive: true }}
      />
    )

    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/12.5%/)).toBeInTheDocument()
    expect(screen.getByText('vs last period')).toBeInTheDocument()
  })

  it('should render negative trend', () => {
    render(
      <MetricCard
        title="Total Users"
        value={100}
        icon={Users}
        trend={{ value: -8.3, isPositive: false }}
      />
    )

    expect(screen.getByText(/↓/)).toBeInTheDocument()
    expect(screen.getByText(/8.3%/)).toBeInTheDocument()
  })

  it('should not render trend when not provided', () => {
    render(<MetricCard title="Total Users" value={100} icon={Users} />)

    expect(screen.queryByText('vs last period')).not.toBeInTheDocument()
  })

  it('should render with all props', () => {
    render(
      <MetricCard
        title="Active Users"
        value={250}
        icon={Users}
        description="Users active in last 30 days"
        trend={{ value: 15, isPositive: true }}
      />
    )

    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()
    expect(screen.getByText('Users active in last 30 days')).toBeInTheDocument()
    expect(screen.getByText(/↑/)).toBeInTheDocument()
    expect(screen.getByText(/15%/)).toBeInTheDocument()
  })

  it('should handle zero value', () => {
    render(<MetricCard title="New Users" value={0} icon={Users} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('should handle negative value', () => {
    render(<MetricCard title="Change" value={-50} icon={Users} />)

    expect(screen.getByText('-50')).toBeInTheDocument()
  })
})
