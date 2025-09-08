# Project Structure

## Root Directory Organization
```
├── app/                    # Next.js App Router pages and API routes
├── components/             # Reusable React components
├── lib/                    # Utility functions and database logic
├── docs/                   # Project documentation
├── public/                 # Static assets
└── .kiro/                  # Kiro AI assistant configuration
```

## App Directory (Next.js App Router)
```
app/
├── api/                    # API route handlers
│   ├── bookings/          # Course booking endpoints
│   ├── courses/           # Course statistics
│   ├── events/            # User event tracking
│   ├── messages/          # Telegram messaging system
│   ├── stats/             # Dashboard statistics
│   └── users/             # User management
├── analytics/             # Analytics dashboard page
├── content/               # Content management page
├── free-lessons/          # Free lesson tracking page
├── messages/              # Message management pages
├── users/                 # User management page
├── workshops/             # Course management page
├── globals.css            # Global styles
├── layout.tsx             # Root layout component
└── page.tsx               # Homepage dashboard
```

## Components Organization
```
components/
├── ui/                    # Base UI components (shadcn/ui style)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ...
├── Navigation.tsx         # Main navigation component
├── MetricCard.tsx         # Dashboard metric display
├── *Chart.tsx             # Various chart components
├── *Table.tsx             # Data table components
└── UserDetailsDialog.tsx  # User management modals
```

## Library Structure
```
lib/
├── db.ts                  # PostgreSQL connection pool
├── queries.ts             # All database queries and interfaces
├── userCache.ts           # User data caching logic
└── utils.ts               # Utility functions (cn, etc.)
```

## API Route Patterns
- **GET /api/stats** - Dashboard overview statistics
- **GET /api/courses** - Course-specific data
- **GET /api/users/list** - Paginated user listings
- **POST /api/messages/send** - Send Telegram messages
- **GET /api/events** - User activity events

## File Naming Conventions
- **Pages**: `page.tsx` (App Router convention)
- **API Routes**: `route.ts` (App Router convention)
- **Components**: PascalCase (e.g., `UserDetailsDialog.tsx`)
- **Utilities**: camelCase (e.g., `userCache.ts`)
- **Types/Interfaces**: Defined in `lib/queries.ts` with descriptive names

## Database Schema Access
- All database interactions go through `lib/queries.ts`
- Raw SQL queries with proper TypeScript interfaces
- Connection pooling handled in `lib/db.ts`
- No ORM - direct PostgreSQL queries for performance

## Component Architecture
- **Server Components** by default for data fetching
- **Client Components** (`'use client'`) only when needed for interactivity
- **Radix UI** for accessible base components
- **Tailwind CSS** for styling with `cn()` utility for conditional classes

## Environment Configuration
- `.env.local` for database credentials
- TypeScript configuration in `tsconfig.json`
- Next.js configuration in `next.config.ts`
- ESLint rules in `.eslintrc.json`