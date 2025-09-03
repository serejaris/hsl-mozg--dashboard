# HSL Dashboard - Product Requirements Document (PRD)

## 1. Product Overview

**Product Name**: HSL Dashboard (HashSlash School Dashboard)  
**Purpose**: Analytics and management dashboard for HashSlash School Telegram bot

### Product Description
HSL Dashboard is a Next.js-based web application that provides analytics and management tools for HashSlash School's Telegram bot.

## 2. Core Modules & Features

### 2.1 Dashboard/Funnel (`/`)

#### Features:
- **Metrics Display**
  - Total users
  - Active bookings 
  - Confirmed payments
  - Free lesson registrations

- **Lesson Statistics**
  - Registration counts by lesson type
  - Attendance conversion rates (registered → joined)
  - Date-wise breakdown
  - Conversion percentages

- **Hot Leads**
  - Lead classification (Hot, Warm, Cool, Cold)
  - Event-based scoring
  - Activity day tracking

- **Recent Activity**
  - Latest bookings with user details
  - Stream information
  - Booking status

### 2.2 Course Management (`/workshops`)

#### Features:
- **Stream Analytics**
  - 3rd Stream, 4th Stream, 5th Stream performance
  - Booking status distribution (Confirmed, Pending, Cancelled)

- **Course Metrics**
  - Total enrollments per course
  - Booking status tracking

### 3.3 Free Lessons Management (`/free-lessons`)
**Primary Function**: Free lesson registration and conversion tracking

#### Key Features:
- **Registration Management**
  - Complete registration database
  - Email collection and validation
  - Registration date tracking
  - Notification status monitoring

- **Advanced Conversion Analytics**
  - Registration → Attendance conversion tracking
  - Lesson type performance comparison
  - Date-wise attendance breakdown
  - Conversion rate percentages by lesson type

- **Registration Trends**
  - Historical registration patterns
  - Seasonal trend analysis
  - Growth rate calculations

- **User Engagement Tracking**
  - Email engagement status
  - Notification delivery confirmation
  - User journey mapping

#### Business Impact:
- Measures effectiveness of free lesson marketing
- Identifies highest-converting lesson formats
- Optimizes free-to-paid conversion funnel

### 3.4 Advanced Analytics (`/analytics`)
**Primary Function**: Detailed data analysis and reporting

#### Key Features:
- **30-Day Performance Dashboard**
  - Daily user acquisition metrics
  - Booking trend analysis
  - Event activity tracking

- **User Growth Analytics**
  - New user acquisition charts
  - Growth rate calculations
  - User retention metrics

- **Event-Based Analytics**
  - Top user events tracking
  - Event frequency analysis
  - User behavior pattern identification

- **Interactive Data Visualization**
  - Recharts-powered interactive graphs
  - Customizable date ranges
  - Export capabilities

#### Business Impact:
- Provides deep insights into user behavior
- Enables long-term strategic planning
- Supports marketing campaign optimization

### 3.5 Telegram Messaging System (`/messages`)
**Primary Function**: Mass communication and marketing automation

#### Core Components:

#### 3.5.1 Message Composition (`/messages/send`)
- **Dual Messaging Modes**
  - Individual messaging with manual user selection
  - Group messaging by course stream (3rd, 4th, 5th streams)

- **Advanced User Selection**
  - Real-time user search with instant results
  - Stream-based automatic user loading
  - User deduplication prevention
  - Recipient validation system

- **Message Composition Tools**
  - HTML formatting support
  - 4096 character limit enforcement
  - Message preview capabilities
  - Template system integration

- **Security & Safety Features**
  - TEST_MODE for safe development testing
  - Confirmation dialogs with recipient details
  - User validation against database
  - Comprehensive audit logging

#### 3.5.2 Message History (`/messages/history`)
- **Delivery Tracking System**
  - Real-time delivery status monitoring
  - Individual recipient status tracking
  - Failed delivery analysis
  - Delivery success rate calculations

- **Message Analytics**
  - Open rate tracking (where available)
  - Response rate monitoring
  - Campaign effectiveness metrics
  - Historical performance comparison

#### Technical Implementation:
- **Batch Processing**: Rate-limited sending (10 messages/batch)
- **Error Handling**: Comprehensive Telegram API error management
- **Database Integration**: Complete message history and recipient tracking
- **Security Compliance**: User consent validation and audit trails

#### Business Impact:
- Enables targeted marketing campaigns
- Provides measurable ROI on messaging
- Ensures compliance with communication regulations
- Reduces manual communication overhead

### 3.6 Content Management (`/content`)
**Primary Function**: Course content organization and access

#### Key Features:
- **Content Library**
  - Structured content organization
  - Easy content retrieval
  - Copy-to-clipboard functionality

- **Content Analytics**
  - Usage tracking
  - Popular content identification
  - Access pattern analysis

#### Business Impact:
- Streamlines content distribution
- Tracks content effectiveness
- Reduces content management overhead

### 3.7 User Management System
**Primary Function**: Advanced user search and management

#### Key Features:
- **Cached User Search**
  - Instant search results (5-minute TTL cache)
  - Indexed search by username and first name
  - Stream-based user filtering
  - Deduplication algorithms

- **User Segmentation**
  - Course stream assignment
  - Activity-based segmentation
  - Custom user groups
  - Behavioral targeting

- **User Validation System**
  - Database existence verification
  - Telegram ID validation
  - Active user status checking
  - Permission level management

#### Business Impact:
- Enables precise user targeting
- Improves marketing campaign effectiveness
- Reduces user management complexity

## 4. Technical Architecture

### 4.1 Core Technology Stack
- **Frontend**: Next.js 15.4.7 with App Router, React 19.1.0
- **Styling**: Tailwind CSS v4 with responsive design
- **Database**: PostgreSQL with connection pooling
- **Deployment**: Railway hosting platform
- **APIs**: RESTful API architecture with TypeScript
- **Real-time Features**: Server-side rendering with manual refresh strategy

### 4.2 Database Schema
- **Core Tables**: users, bookings, events, free_lesson_registrations
- **Messaging Tables**: message_history, message_recipients
- **Analytics Tables**: Event tracking with JSON metadata
- **Referral System**: referral_coupons table

### 4.3 Security Features
- **Environment Variable Validation**: Required .env.local configuration
- **Database Security**: SSL connections, parameterized queries
- **API Security**: Request validation, rate limiting
- **User Privacy**: Secure user data handling, audit logs

### 4.4 Performance Optimizations
- **Connection Pooling**: PostgreSQL connection pool management
- **Caching Strategy**: UserCacheService with 5-minute TTL
- **Manual Refresh**: Prevents database overload with manual refresh buttons
- **Batch Processing**: Rate-limited operations for external APIs

## 5. User Roles & Permissions

### 5.1 Administrator
- Full access to all modules
- User management capabilities
- System configuration access
- Database migration permissions

### 5.2 Marketing Manager
- Access to messaging system
- Analytics and reporting
- Lead management
- Campaign performance tracking

### 5.3 Course Manager
- Course performance analytics
- Student registration management
- Content management access
- Free lesson administration

## 6. Key Performance Indicators (KPIs)

### 6.1 Business Metrics
- **User Acquisition**: Daily/monthly new user registration
- **Conversion Rates**: Free lesson → Paid course conversion
- **Revenue Metrics**: Course booking values and payment confirmation rates
- **Engagement Metrics**: Event frequency and user activity scores

### 6.2 Operational Metrics
- **System Performance**: API response times, database query performance
- **Message Delivery**: Telegram message success rates
- **User Experience**: Dashboard load times, search response times
- **Data Quality**: Cache hit rates, data validation success rates

### 6.3 Lead Scoring Algorithm
```
Hot Lead: 20+ events AND 5+ active days
Warm Lead: 10+ events AND 3+ active days  
Cool Lead: 5+ events
Cold Lead: <5 events
```

## 7. API Endpoints

### 7.1 Core Data APIs
- `GET /api/stats` - Dashboard statistics
- `GET /api/courses` - Course performance data
- `GET /api/course-streams` - Stream-specific analytics
- `GET /api/events` - User event analytics
- `GET /api/free-lessons` - Free lesson registrations
- `GET /api/free-lessons-conversion` - Conversion analytics

### 7.2 User Management APIs
- `GET /api/users/search` - User search functionality
- `GET /api/users/by-stream` - Stream-based user lookup
- `GET /api/user-activity` - User activity and lead scoring
- `GET /api/user-growth` - User growth analytics

### 7.3 Messaging APIs
- `POST /api/messages/send` - Send Telegram messages
- `GET /api/messages/history` - Message history retrieval
- `GET /api/messages/[id]/recipients` - Recipient status tracking

### 7.4 Utility APIs
- `GET /api/bookings` - Recent bookings data
- `POST /api/db-migrate` - Database migrations
- `GET /api/db-schema` - Schema inspection
- `GET /api/debug-events` - Development debugging

## 8. Data Model Relationships

### 8.1 Core Entities
```
Users (user_id, username, first_name, course_stream)
  ↓ 1:N
Events (event_type, details, created_at)
  ↓ 1:N
Bookings (course_id, confirmed, course_stream)
  ↓ 1:N
Free_Lesson_Registrations (lesson_type, lesson_date, email)
```

### 8.2 Messaging System
```
Message_History (message_text, total_recipients)
  ↓ 1:N
Message_Recipients (user_id, delivery_status)
```

### 8.3 Analytics Aggregations
- Daily statistics with CTE queries
- User growth calculations with running totals
- Conversion rate calculations with FULL OUTER JOINs
- Event analytics with JSON metadata extraction

## 9. Business Rules & Logic

### 9.1 Booking Status Rules
- `-1`: Cancelled booking
- `1`: Pending confirmation
- `2`: Confirmed booking

### 9.2 Conversion Calculation
```sql
Conversion Rate = (Attendances / Registrations) * 100
WHERE attendances = COUNT(events.lesson_link_clicked)
AND registrations = COUNT(free_lesson_registrations)
```

### 9.3 User Deduplication
- Messaging system prevents duplicate sends via `DISTINCT ON (user_id)`
- Search results deduplicated by user_id
- Stream-based selection automatically handles duplicates

### 9.4 Cache Management
- UserCacheService: 5-minute TTL with automatic refresh
- Indexed search for performance optimization
- Stream-specific caching for group messaging

## 10. Security & Compliance

### 10.1 Data Protection
- Secure handling of Telegram user data
- Email address encryption in transit
- User consent tracking for messaging
- Audit logging for all user interactions

### 10.2 API Security
- Environment variable validation
- SQL injection prevention through parameterized queries
- Rate limiting on external API calls
- TEST_MODE for development safety

### 10.3 Operational Security
- Database SSL connections required
- Secure credential management via Railway
- Regular security audits through advisor system
- Backup and recovery procedures

---

**Document Version**: 1.0  
**Last Updated**: January 2025