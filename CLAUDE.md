# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting checks

## Architecture Overview

This is a Next.js 14 TypeScript dashboard for HashSlash School Telegram bot analytics. The application provides real-time monitoring of user interactions, course bookings, and payments through a PostgreSQL database hosted on Railway.

### Key Architecture Components

**Database Layer (`lib/`)**
- `db.ts` - PostgreSQL connection pool with SSL configuration
- `queries.ts` - Centralized SQL queries with TypeScript interfaces for all data operations

**API Routes (`app/api/`)**
- `/stats` - Overall dashboard metrics (users, bookings, payments)
- `/courses` - Course-specific statistics with booking states
- `/events` - User event analytics and top interactions
- `/bookings` - Recent booking data with user details
- `/test-db` - Database connection health check

**Pages Structure**
- `/` - Main dashboard with key metrics and manual refresh button
- `/workshops` - Detailed course statistics and booking management
- `/analytics` - 30-day activity charts and event analysis
- `/content` - Course content viewer with copy functionality

**Database Schema Context**
The app connects to tables: `bookings` (confirmed: -1=cancelled, 1=pending, 2=confirmed), `events`, `free_lesson_registrations`, and `referral_coupons`. Course IDs map to: 1="Вайб кодинг", 2="Вайб кодинг EXTRA".

**Environment Requirements**
Requires `.env.local` with Railway PostgreSQL credentials (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD).

**Tech Stack**
- Next.js 14 with App Router and Turbopack
- TypeScript for type safety
- Tailwind CSS v4 for styling
- Recharts for data visualization
- PostgreSQL with pg driver
- Lucide React for icons