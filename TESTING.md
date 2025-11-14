# Testing Guide

This project uses Jest and React Testing Library for comprehensive test coverage.

## Test Infrastructure

- **Test Framework**: Jest 30.2.0
- **React Testing**: React Testing Library 16.3.0
- **DOM Assertions**: @testing-library/jest-dom
- **Environment**: jsdom for React component tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Structure

Tests are organized following Next.js conventions:

```
project/
├── lib/
│   ├── __tests__/
│   │   ├── utils.test.ts
│   │   ├── constants.test.ts
│   │   └── date.test.ts
├── components/
│   ├── __tests__/
│   │   ├── MetricCard.test.tsx
│   │   ├── StatusBadge.test.tsx
│   │   └── StreamBadge.test.tsx
└── __mocks__/
    └── @/components/ui/
        ├── badge.tsx
        └── card.tsx
```

## Current Test Coverage

| Module | Coverage |
|--------|----------|
| `lib/utils.ts` | 100% |
| `lib/constants.ts` | 100% |
| `lib/date.ts` | 100% |
| `components/MetricCard.tsx` | 100% |
| `components/StatusBadge.tsx` | 92% |
| `components/StreamBadge.tsx` | 100% |

**Total**: 52 passing tests across 6 test suites

## Writing Tests

### Unit Tests (lib/)

Example from `lib/__tests__/utils.test.ts`:

```typescript
import { describe, it, expect } from '@jest/globals'
import { cn } from '../utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })
  })
})
```

### Component Tests

Example from `components/__tests__/MetricCard.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import MetricCard from '../MetricCard'

describe('MetricCard', () => {
  it('should render title and value', () => {
    render(<MetricCard title="Total Users" value={100} icon={Users} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
})
```

## Test Configuration

### jest.config.ts

Key configurations:
- **Environment**: jsdom for browser-like environment
- **Setup**: `jest.setup.ts` for global mocks and polyfills
- **Module Mapper**: Resolves `@/` imports and mocks UI components
- **Coverage**: Minimum 2% threshold (baseline for expansion)

### jest.setup.ts

Global setup includes:
- Environment variable mocks
- Web API polyfills (TextEncoder, TextDecoder)
- Database connection mocks
- Telegram Bot API mocks

## Mocking Strategy

### UI Components

UI components from `@/components/ui/*` are mocked to simplify testing:

```typescript
// __mocks__/@/components/ui/badge.tsx
export const Badge = ({ children, variant, className }) => (
  <span data-testid="badge" data-variant={variant} className={className}>
    {children}
  </span>
)
```

### External Dependencies

- **Database**: `pool` connections are mocked in `jest.setup.ts`
- **Telegram Bot**: `node-telegram-bot-api` is mocked globally
- **Environment Variables**: Set in `jest.setup.ts` for all tests

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what components do, not how they do it
2. **Use Testing Library Queries**: Prefer `getByRole`, `getByText` over `getByTestId`
3. **Mock External Dependencies**: Keep tests isolated and fast
4. **Descriptive Test Names**: Use "should [expected behavior]" pattern
5. **Arrange-Act-Assert**: Structure tests clearly

## Continuous Improvement

To expand test coverage:

1. Add tests for API routes in `app/api/__tests__/`
2. Cover complex components (dialogs, forms, tables)
3. Add integration tests for critical user flows
4. Increase coverage thresholds gradually

## Troubleshooting

### Common Issues

**Issue**: `Request is not defined`
**Solution**: Web API polyfills are in `jest.setup.ts`. Ensure it's loaded.

**Issue**: Mock not working
**Solution**: Check module path mapping in `jest.config.ts` and mock file location.

**Issue**: Test timeout
**Solution**: Increase timeout in `jest.config.ts` or specific test with `jest.setTimeout()`

## CI/CD Integration

The `test:ci` script is optimized for CI environments:
- Uses `--ci` flag for non-interactive mode
- Generates coverage reports
- Limits workers to prevent memory issues

```bash
npm run test:ci
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
