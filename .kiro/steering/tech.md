# Technology Stack

## Framework & Runtime
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Headless UI components (@radix-ui/react-*)
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional styling utilities

## Database & Data
- **PostgreSQL** - Primary database (hosted on Railway)
- **pg** - PostgreSQL client for Node.js
- **Raw SQL queries** - No ORM, direct database queries in lib/queries.ts

## Charts & Analytics
- **Recharts 3.1** - React charting library
- **date-fns 4.1** - Date manipulation utilities

## External APIs
- **Telegram Bot API** - Integration with node-telegram-bot-api
- **@types/node-telegram-bot-api** - TypeScript definitions

## Development Tools
- **ESLint** - Code linting with Next.js config
- **PostCSS** - CSS processing
- **Turbopack** - Fast bundler (used in dev mode)

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint
```

### Environment Setup
Required environment variables in `.env.local`:
```bash
POSTGRES_HOST=your_database_host
POSTGRES_PORT=your_database_port  
POSTGRES_DB=your_database_name
POSTGRES_USER=your_database_user
POSTGRES_PASSWORD=your_database_password
```

## Architecture Patterns
- **Server Components** - Default for data fetching
- **API Routes** - RESTful endpoints in app/api/
- **Raw SQL** - Direct database queries, no ORM abstraction
- **Component Composition** - Radix UI + custom styling
- **Type Safety** - Comprehensive TypeScript interfaces for all data models