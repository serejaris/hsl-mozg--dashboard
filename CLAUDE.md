# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting checks

## Architecture Overview

This is a Next.js 15 TypeScript dashboard for HashSlash School Telegram bot analytics. The application provides monitoring of user interactions, course bookings, and payments through a PostgreSQL database hosted on Railway.

### Key Architecture Components

**Database Layer (`lib/`)**
- `db.ts` - PostgreSQL connection pool with SSL configuration and required environment variable validation
- `queries.ts` - Centralized SQL queries with TypeScript interfaces for all data operations

**API Routes (`app/api/`)**
- `/stats` - Overall dashboard metrics (users, bookings, payments, free lessons)
- `/courses` - Course-specific statistics with booking states
- `/course-streams` - Detailed course stream statistics (3rd_stream, 4th_stream, 5th_stream)
- `/events` - User event analytics and top interactions
- `/bookings` - Recent booking data with user details and stream information
- `/free-lessons` - Free lesson registrations with email and notification status
- `/user-growth` - User growth data over time with optional days parameter
- `/user-activity` - User activity analysis with lead scoring for free lesson registrations
- `/test-db` - Database connection health check

**Pages Structure**
- `/` - Main dashboard with key metrics and manual refresh button
- `/workshops` - Course analytics renamed to "Курсы" with stream breakdown and consolidated statistics
- `/analytics` - 30-day activity charts and event analysis
- `/content` - Course content viewer with copy functionality
- `/free-lessons` - Free lesson registrations management

**Components (`components/`)**
- `MetricCard.tsx` - Reusable metric display component
- `Navigation.tsx` - Main navigation component
- `BookingsTable.tsx` - Displays recent bookings with filtering
- `FreeLessonsTable.tsx` - Free lesson registrations table
- `UserGrowthChart.tsx` - Charts for user growth visualization
- `EventsChart.tsx` - Event analytics visualization
- `HotLeads.tsx` - Lead scoring and hot lead identification
- `UnifiedLessonBreakdown.tsx` - Unified lesson analytics breakdown
- Various chart components using Recharts library

**Database Schema Context**
The app connects to tables: 
- `bookings` (confirmed: -1=cancelled, 1=pending, 2=confirmed, includes course_stream field)
- `events` (user interactions and bot events)
- `free_lesson_registrations` (registered_at, notification_sent, lesson_type, email, lesson_date fields)
- `referral_coupons` (discount codes and usage tracking)

**Current Course Configuration**
Only displays course_id = 1 "Вайб кодинг" (EXTRA course removed). Course streams: 3rd_stream="3-й поток", 4th_stream="4-й поток", 5th_stream="5-й поток".

**Environment Requirements**
Requires `.env.local` with Railway PostgreSQL credentials. All environment variables are required - the app will throw an error if POSTGRES_HOST or POSTGRES_PASSWORD are missing.

**Tech Stack**
- Next.js 15 with App Router and Turbopack
- React 19 with React DOM 19
- TypeScript for type safety
- Tailwind CSS v4 for styling
- Recharts for data visualization
- PostgreSQL with pg driver and @types/pg
- Lucide React for icons
- date-fns for date manipulation

## Important Implementation Notes

**Manual Refresh Strategy**
All pages use manual refresh buttons instead of auto-refresh (setInterval) to prevent database overload on Railway. Always implement manual refresh with loading states.

**Stream Tracking**
The application tracks course streams (3rd_stream, 4th_stream, 5th_stream) and displays them throughout the UI. When working with bookings or course data, always include stream information.

**Lead Scoring System**
The user activity API implements lead scoring based on event frequency and active days:
- Hot: 20+ events, 5+ active days
- Warm: 10+ events, 3+ active days  
- Cool: 5+ events
- Cold: Less than 5 events

**Data Query Patterns**
- All queries use connection pooling with proper client release
- Complex analytics queries use CTEs (Common Table Expressions) for readability
- Date-based queries use PostgreSQL's generate_series for complete date ranges
- Union queries combine data from multiple tables (bookings, events, free_lesson_registrations)

**Security**
- Database credentials are secured and not hardcoded
- .env.local is excluded from git
- All sensitive information removed from README.md

**Railway MCP Integration**
Use Railway MCP tools when you need to:
- Investigate actual database schema
- Check production data structure
- Debug database connection issues