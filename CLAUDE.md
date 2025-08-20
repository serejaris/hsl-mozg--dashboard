# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting checks

## Architecture Overview

This is a Next.js 14 TypeScript dashboard for HashSlash School Telegram bot analytics. The application provides monitoring of user interactions, course bookings, and payments through a PostgreSQL database hosted on Railway.

### Key Architecture Components

**Database Layer (`lib/`)**
- `db.ts` - PostgreSQL connection pool with SSL configuration and required environment variable validation
- `queries.ts` - Centralized SQL queries with TypeScript interfaces for all data operations

**API Routes (`app/api/`)**
- `/stats` - Overall dashboard metrics (users, bookings, payments, free lessons)
- `/courses` - Course-specific statistics with booking states
- `/course-streams` - Detailed course stream statistics (3rd_stream, 4th_stream)
- `/events` - User event analytics and top interactions
- `/bookings` - Recent booking data with user details and stream information
- `/free-lessons` - Free lesson registrations with email and notification status
- `/test-db` - Database connection health check

**Pages Structure**
- `/` - Main dashboard with key metrics and manual refresh button
- `/workshops` - Course analytics renamed to "Курсы" with stream breakdown and consolidated statistics
- `/analytics` - 30-day activity charts and event analysis
- `/content` - Course content viewer with copy functionality
- `/free-lessons` - Free lesson registrations management

**Database Schema Context**
The app connects to tables: 
- `bookings` (confirmed: -1=cancelled, 1=pending, 2=confirmed, includes course_stream field)
- `events` (user interactions and bot events)
- `free_lesson_registrations` (registered_at, notification_sent, lesson_type, email fields)
- `referral_coupons` (discount codes and usage tracking)

**Current Course Configuration**
Only displays course_id = 1 "Вайб кодинг" (EXTRA course removed). Course streams: 3rd_stream="3-й поток", 4th_stream="4-й поток".

**Environment Requirements**
Requires `.env.local` with Railway PostgreSQL credentials. All environment variables are required - the app will throw an error if POSTGRES_HOST or POSTGRES_PASSWORD are missing.

**Tech Stack**
- Next.js 14 with App Router and Turbopack
- TypeScript for type safety
- Tailwind CSS v4 for styling
- Recharts for data visualization
- PostgreSQL with pg driver
- Lucide React for icons

## Important Implementation Notes

**Manual Refresh Strategy**
All pages use manual refresh buttons instead of auto-refresh (setInterval) to prevent database overload on Railway. Always implement manual refresh with loading states.

**Stream Tracking**
The application tracks course streams (3rd_stream, 4th_stream) and displays them throughout the UI. When working with bookings or course data, always include stream information.

**Security**
- Database credentials are secured and not hardcoded
- .env.local is excluded from git
- All sensitive information removed from README.md

**Railway MCP Integration**
Use Railway MCP tools when you need to:
- Investigate actual database schema
- Check production data structure
- Debug database connection issues