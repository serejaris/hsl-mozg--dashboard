# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run linting checks

## Architecture Overview

This is a Next.js 15 TypeScript dashboard for HashSlash School Telegram bot analytics. The application provides monitoring of user interactions, course bookings, and payments through a PostgreSQL database hosted on Railway.

**Important**: This project does NOT use Supabase. It uses Railway-hosted PostgreSQL with standard `pg` driver connection (`lib/db.ts`). Supabase MCP tools are available for debugging but the application itself connects directly to Railway PostgreSQL.

### Key Architecture Components

**Database Layer (`lib/`)**
- `db.ts` - PostgreSQL connection pool with SSL configuration and required environment variable validation
- `queries.ts` - Centralized SQL queries with TypeScript interfaces for all data operations including messaging
- `userCache.ts` - Singleton service for cached user search with indexed lookups and TTL management
- `messageScheduler.ts` - Background service for processing scheduled Telegram messages with cron-based timing
- `init.ts` - Application initialization module that auto-starts background services on server startup

**API Routes (`app/api/`)**
- `/stats` - Overall dashboard metrics (users, bookings, payments, free lessons)
- `/courses` - Course-specific statistics with booking states
- `/course-streams` - Detailed course stream statistics (3rd_stream, 4th_stream, 5th_stream)
- `/events` - User event analytics and top interactions
- `/bookings` - Recent booking data with user details and stream information
- `/free-lessons` - Free lesson registrations with email and notification status
- `/user-growth` - User growth data over time with optional days parameter
- `/user-activity` - User activity analysis with lead scoring for free lesson registrations
- `/messages/send` - Telegram message broadcasting with validation and Telegram message ID capture
- `/messages/history` - Message history with delivery tracking and recipient details
- `/messages/[id]/recipients` - Individual message recipient status and delivery details
- `/messages/delete` - DELETE endpoint for removing sent Telegram messages using stored message IDs
- `/users/search` - Cached user search with instant results and deduplication
- `/users/by-stream` - Stream-based user lookup for group messaging functionality
- `/db-migrate` - Database migration endpoint for schema changes
- `/db-schema` - Database schema inspection and table structure analysis
- `/test-messages` - Message system testing and function validation
- `/test-db` - Database connection health check

**Pages Structure**
- `/` - Main dashboard with key metrics and manual refresh button
- `/workshops` - Course analytics renamed to "Курсы" with stream breakdown and consolidated statistics
- `/analytics` - 30-day activity charts and event analysis
- `/content` - Course content viewer with copy functionality
- `/free-lessons` - Free lesson registrations management
- `/messages/send` - Telegram message broadcasting interface with tabbed design (Individual/Group), user search, message composition, and security features
- `/messages/history` - Message history viewer with delivery tracking and recipient details

**Components (`components/`)**
- `MetricCard.tsx` - Reusable metric display component
- `Navigation.tsx` - Main navigation component with Messages menu item
- `MessagesNavigation.tsx` - Sub-navigation for messaging features (Send/History)
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
- `message_history` (message broadcasting history with delivery statistics and scheduled_at support)
- `message_recipients` (individual recipient tracking with delivery_status and telegram_message_id for deletion)

**Current Course Configuration**
Only displays course_id = 1 "Вайб кодинг" (EXTRA course removed). Course streams: 3rd_stream="3-й поток", 4th_stream="4-й поток", 5th_stream="5-й поток".

**Environment Requirements**
Requires `.env.local` with Railway PostgreSQL credentials and Telegram bot configuration:
- PostgreSQL: POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- Telegram: BOT_TOKEN (for message broadcasting)
All database environment variables are required - the app will throw an error if missing.

**Tech Stack**
- Next.js 15.4.7 with App Router and Turbopack
- React 19.1.0 with React DOM 19.1.0
- TypeScript 5.x for type safety
- Tailwind CSS v4 for styling
- Recharts 3.1.2 for data visualization
- PostgreSQL with pg 8.16.3 driver and @types/pg 8.15.5
- Telegram Bot API with node-telegram-bot-api 0.66.0 and @types/node-telegram-bot-api 0.64.10
- Node-cron 3.0.3 for scheduled message processing
- Lucide React 0.540.0 for icons
- date-fns 4.1.0 for date manipulation

## Important Implementation Notes

**Application Initialization**
- **Auto-start Services**: Background services (message scheduler) start automatically via `lib/init.ts`
- **Import Strategy**: `init.ts` is imported in critical API routes (`/api/stats`) to ensure early initialization
- **Singleton Protection**: Services use singleton pattern with initialization attempt tracking
- **Development Mode**: Next.js hot reloading may trigger multiple initialization attempts (tracked)

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
- User deduplication using DISTINCT ON (user_id) to prevent duplicate message sending
- Cached search with UserCacheService singleton for instant user lookup performance

**Telegram Messaging System**
The dashboard includes a complete Telegram bot messaging system with:
- **Tabbed Interface**: Individual messaging (manual user selection) and Group messaging (stream-based selection)
- **User search and selection** with instant cached results via UserCacheService
- **Stream-based Group Messaging**: Automatic user selection by course stream (3rd_stream, 4th_stream, 5th_stream)
- **HTML message composition** with inline keyboard support and 4096 character limit
- **Scheduled Message Delivery**: Background cron-based scheduler for delayed message sending
- **Message Deletion Capability**: Store Telegram message IDs for post-send message removal
- **User validation and deduplication** to prevent multiple messages to same person
- **Comprehensive security features** including confirmation dialogs and audit logging
- **Message history tracking** with delivery status (sent/failed/pending/deleted) and filtering
- **Batch processing** with rate limiting to respect Telegram API limits
- **Complete audit trail** for compliance and debugging

**Message Scheduling System (`messageScheduler.ts`)**
- **Background Processing**: Node-cron scheduler runs every minute checking for due messages
- **Database Integration**: Queries `message_history` with `scheduled_at` timestamp for pending deliveries  
- **Singleton Pattern**: Single scheduler instance across application lifecycle with proper initialization tracking
- **Error Handling**: Comprehensive error capture with delivery status updates and audit logging
- **Production Ready**: Direct Telegram API integration without simulation modes

### Message Sending Workflow

**1. Frontend User Interface (`/messages/send`)**
- **Tabbed Interface**: Switch between Individual and Group messaging modes
- **Individual Mode**: Manual user search and selection via UserCacheService with instant results
- **Group Mode**: Stream-based messaging with automatic user loading by course stream
- **User Search**: UserCacheService provides instant search results from indexed cache (5-minute TTL)
- **Recipient Selection**: `addUser()` function prevents duplicates using `user_id` comparison
- **Stream Selection**: `loadStreamUsers()` automatically loads all users from selected course stream
- **Message Composition**: Textarea with HTML formatting support and 4096 character limit
- **Scheduling Options**: Date/time picker for delayed message delivery with UTC timezone handling
- **Security Confirmation**: Detailed dialog showing all recipients with usernames and Telegram IDs

**2. API Request Processing (`/api/messages/send`)**
```javascript
POST /api/messages/send
{
  "recipients": [{"user_id": 12345, "username": "user", "first_name": "Name"}],
  "message": {"text": "Hello", "parse_mode": "HTML"},
  "scheduled_at": "2025-09-11T20:30:00.000Z" // Optional: ISO timestamp for scheduling
}
```

**3. Server-Side Validation**
- **Data Validation**: Recipients existence, message text length (≤4096), BOT_TOKEN presence
- **Schedule Validation**: `scheduled_at` timestamp format validation and future-time requirement
- **User Deduplication**: `validateUserIds()` handles both string and number user_id types with `parseInt()` normalization
- **Message Classification**: Automatically determines individual vs group message based on stream consistency

**4. Database Transaction Flow**
```sql
-- Create message record (with optional scheduled_at)
INSERT INTO message_history (message_text, total_recipients, scheduled_at, recipient_type, recipient_group) 
VALUES ($1, $2, $3, $4, $5);
-- Add recipients with pending status  
INSERT INTO message_recipients (message_id, user_id, username) VALUES ...;
```

**5. Message Delivery Process**

**Immediate Messages (no scheduled_at):**
- **Batch Processing**: Processes recipients in batches of 10 to respect Telegram API limits
- **Individual Sending**: `bot.sendMessage(user_id, text, options)` returns Telegram message object with `message_id`
- **ID Capture**: Stores `telegramMessage.message_id` in `message_recipients.telegram_message_id` for deletion capability
- **Error Handling**: Captures specific Telegram API errors (403=blocked, 400=invalid)
- **Status Updates**: Updates `message_recipients.delivery_status` per recipient
- **Rate Limiting**: 1-second delay between batches

**Scheduled Messages (with scheduled_at):**
- **Database Storage**: Saved with `scheduled_at` timestamp and `successful_deliveries = 0`
- **Background Processing**: MessageSchedulerService checks every minute via cron pattern `'* * * * *'`
- **Due Message Detection**: Query finds messages where `scheduled_at <= NOW() AND COALESCE(successful_deliveries, 0) = 0`
- **Recipient Loading**: Complex JOIN query fetches user details from `bookings` and `free_lesson_registrations`
- **Automated Delivery**: Same batch processing, ID capture, and error handling as immediate messages

**Message Deletion (DELETE /api/messages/delete):**
- **ID Retrieval**: Queries `message_recipients` for stored `telegram_message_id`
- **Telegram API Call**: `bot.deleteMessage(userId, telegramMessageId)` removes message from chat
- **Status Update**: Changes `delivery_status` from 'sent' to 'deleted' in database
- **Error Handling**: Handles cases like message too old (48h limit), user blocked bot, or message not found

**6. Result Processing**
- Updates `message_history.successful_deliveries` count
- Creates comprehensive audit log entry
- Returns detailed response with sent/failed counts and specific errors
- Frontend displays results and clears form on success

### Technical Implementation Details

**Message Scheduler Architecture:**
- **Singleton Pattern**: Single `MessageSchedulerService` instance with proper lifecycle management
- **Cron Integration**: Uses `node-cron` with pattern `'* * * * *'` for every-minute execution
- **Auto-initialization**: Service starts automatically via `init.ts` import in API routes
- **Instance Tracking**: Unique instance IDs and initialization attempt logging for debugging
- **Database Queries**: Complex JOINs to fetch complete recipient data from multiple tables

**UserCacheService Architecture:**
- Singleton pattern with Map-based indexing by first letter of username/first_name
- Dual cache system: general user index and stream-specific cache for group messaging
- Automatic cache refresh every 5 minutes with `getAllUsers()` deduplication
- Stream cache supports 3rd_stream, 4th_stream, and 5th_stream for efficient group messaging
- Instant search results without database queries for better UX

**Critical Bug Fixes Applied:**
- **Type Conversion Issue**: Fixed `validateUserIds()` to handle mixed string/number user_id types with `parseInt()` normalization
- **PostgreSQL DISTINCT/ORDER BY**: Fixed `getUsersByStream()` query to comply with PostgreSQL DISTINCT column requirements
- **Scheduler Column Mismatch**: Fixed `sendScheduledMessage()` with proper JOIN queries for missing table columns
- **Default Value Handling**: Updated scheduler query to use `COALESCE(successful_deliveries, 0) = 0` instead of `IS NULL`
- **Scheduler Multiple Execution**: Fixed double initialization causing 3x scheduler runs per minute
- **Message Deletion Support**: Added `telegram_message_id` column and deletion API for post-send message management

**Database Transaction Safety:**
- All messaging operations use connection pooling with proper client release
- Message history created before sending to ensure audit trail
- Recipient status updates happen per individual send attempt
- Failed sends don't block other recipients in the batch

**Error Handling Matrix:**
- **403 Forbidden**: "User blocked bot" - User has blocked the Telegram bot
- **400 Bad Request**: "Invalid user or message" - Invalid Telegram user ID or message format  
- **400 Bad Request (Deletion)**: "Message too old to delete" - Telegram 48-hour deletion limit exceeded
- **Network errors**: Captured with full error description for debugging
- **Database errors**: Transaction rollback prevents partial state

**Security Validation Chain:**
1. Frontend duplicate prevention using `user_id` comparison
2. Backend user existence validation against database
3. SQL-level deduplication with `DISTINCT ON (user_id)`
4. Confirmation dialog with complete recipient list and IDs
5. Comprehensive audit logging of all operations

**Security**
- Database credentials are secured and not hardcoded
- .env.local is excluded from git
- All sensitive information removed from README.md
- Telegram bot token secured in environment variables
- User validation ensures only valid database users receive messages
- Comprehensive logging and audit trail for all messaging operations

**Railway MCP Integration**
Use Railway MCP tools when you need to:
- Investigate actual database schema
- Check production data structure
- Debug database connection issues

## Git Workflow

**Git Worktree Management**
All git worktrees in this project MUST follow these strict rules for consistent workspace management:

1. **Worktree Location**: Always create worktrees in the `.trees/` directory
   ```bash
   # Correct - create worktree in .trees/ folder
   git worktree add .trees/feature-branch feature-branch
   git worktree add .trees/bugfix-123 -b bugfix-123
   
   # Incorrect - do not create worktrees in root or other locations
   git worktree add ../feature-branch feature-branch
   ```

2. **Post-Merge Cleanup**: After successfully merging a worktree branch, always remove the worktree
   ```bash
   # After successful merge, remove the worktree
   git worktree remove .trees/feature-branch
   
   # Or use force flag if needed
   git worktree remove --force .trees/feature-branch
   ```

3. **Complete Workflow Example**:
   ```bash
   # 1. Create new worktree in .trees/
   git worktree add .trees/new-feature -b new-feature
   
   # 2. Work in the worktree
   cd .trees/new-feature
   # ... make changes, commit ...
   
   # 3. Switch back to main branch
   cd ../../  # Return to project root
   git checkout main
   
   # 4. Merge the feature branch
   git merge new-feature
   
   # 5. Clean up - remove worktree after successful merge
   git worktree remove .trees/new-feature
   
   # 6. Delete the feature branch (optional)
   git branch -d new-feature
   ```

**Why These Rules:**
- Keeps all worktrees organized in a single `.trees/` folder
- Prevents workspace clutter and confusion
- Ensures clean project structure
- Makes worktree management predictable and scriptable
- The `.trees/` folder is already in .gitignore to prevent accidental commits