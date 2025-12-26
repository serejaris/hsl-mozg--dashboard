# Analytics Features

<cite>
**Referenced Files in This Document**   
- [page.tsx](file://app/analytics/page.tsx)
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx)
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx)
- [EventsChart.tsx](file://components/EventsChart.tsx)
- [PieDistributionChart.tsx](file://components/PieDistributionChart.tsx)
- [route.ts](file://app/api/events/route.ts)
- [route.ts](file://app/api/user-growth/route.ts)
- [queries.ts](file://lib/queries.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Analytics Visualizations](#core-analytics-visualizations)
3. [Data Fetching and API Integration](#data-fetching-and-api-integration)
4. [Data Models and Backend Queries](#data-models-and-backend-queries)
5. [Tiered Data Loading Strategy](#tiered-data-loading-strategy)
6. [Interpreting Analytics for Business Decisions](#interpreting-analytics-for-business-decisions)
7. [Customization and Extension](#customization-and-extension)
8. [Component Relationships](#component-relationships)

## Introduction
The analytics features in hsl-dashboard provide comprehensive data-driven insights into user engagement, course performance, and platform growth. The system enables stakeholders to monitor key metrics through interactive visualizations that track user growth, registration trends, and event analytics. These insights help identify patterns in user behavior, measure marketing effectiveness, and inform strategic decisions for platform improvement and expansion.

## Core Analytics Visualizations

### User Growth Charts
The User Growth Chart visualizes both total platform users and daily new user acquisitions over a specified period. This line chart displays two key metrics: the cumulative total of users (in primary color) and the number of new users added each day (in green). The visualization helps identify growth patterns, seasonal trends, and the impact of marketing campaigns on user acquisition.

```mermaid
graph TD
A[UserGrowthChart] --> B[LineChart]
B --> C[XAxis: Date]
B --> D[YAxis: User Count]
B --> E[Line: Total Users]
B --> F[Line: New Users Daily]
B --> G[Tooltip: Detailed Daily Metrics]
```

**Diagram sources**
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L15-L86)

**Section sources**
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L1-L86)

### Registration Trends
The Registration Trend Chart tracks free lesson registrations over a 30-day period, providing insights into user interest and engagement with introductory content. This line chart helps identify peak registration periods, assess the effectiveness of promotional activities, and forecast future demand for courses. The component includes skeleton loading states to enhance perceived performance during data retrieval.

```mermaid
graph TD
H[RegistrationTrendChart] --> I[LineChart]
I --> J[XAxis: Date Range]
I --> K[YAxis: Registration Count]
I --> L[Line: Daily Registrations]
I --> M[Skeleton: Loading State]
I --> N[ResponsiveContainer: Dynamic Sizing]
```

**Diagram sources**
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L15-L98)

**Section sources**
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L1-L98)

### Event Analytics
The Events Chart component provides a comprehensive view of platform activity through two complementary visualizations: a line chart showing daily metrics (new users, bookings, and events) and a horizontal bar chart displaying the most frequent user actions. This dual visualization enables analysis of both quantitative activity trends and qualitative user behavior patterns.

```mermaid
graph TD
O[EventsChart] --> P[Daily Activity LineChart]
P --> Q[Line: New Users]
P --> R[Line: Bookings]
P --> S[Line: Events]
O --> T[Top Events BarChart]
T --> U[Bar: Event Type Frequency]
T --> V[YAxis: Event Type]
T --> W[XAxis: Count]
```

**Diagram sources**
- [EventsChart.tsx](file://components/EventsChart.tsx#L15-L125)

**Section sources**
- [EventsChart.tsx](file://components/EventsChart.tsx#L1-L125)

### Distribution Analysis
The Pie Distribution Chart visualizes proportional data across categories, currently used to show the distribution of different event types. This component leverages Recharts with custom styling to create accessible, responsive pie charts that help identify the relative importance of various user actions and platform interactions.

```mermaid
graph TD
X[PieDistributionChart] --> Y[PieChart]
Y --> Z[Cell: Segment with Color]
Y --> AA[Tooltip: Interactive Details]
Y --> AB[Legend: Category Labels]
X --> AC[ChartContainer: Responsive Wrapper]
```

**Diagram sources**
- [PieDistributionChart.tsx](file://components/PieDistributionChart.tsx#L15-L82)

**Section sources**
- [PieDistributionChart.tsx](file://components/PieDistributionChart.tsx#L1-L82)

## Data Fetching and API Integration

### API Endpoint Architecture
The analytics system retrieves data from dedicated API endpoints using the Next.js App Router framework. The primary endpoints include `/api/events` for event analytics and `/api/user-growth` for user growth metrics. These endpoints support query parameters to customize data retrieval, such as specifying time ranges and result limits.

```mermaid
sequenceDiagram
participant Browser
participant AnalyticsPage
participant EventsAPI
participant UserGrowthAPI
participant Database
Browser->>AnalyticsPage : Navigate to /analytics
AnalyticsPage->>EventsAPI : GET /api/events?type=daily&days=30
AnalyticsPage->>EventsAPI : GET /api/events
EventsAPI->>Database : Query daily statistics
EventsAPI->>Database : Query top events
Database-->>EventsAPI : Return result sets
EventsAPI-->>AnalyticsPage : JSON response
AnalyticsPage->>UserGrowthAPI : GET /api/user-growth?days=30
UserGrowthAPI->>Database : Query user growth data
Database-->>UserGrowthAPI : Return growth metrics
UserGrowthAPI-->>AnalyticsPage : JSON response
AnalyticsPage->>Browser : Render visualizations
```

**Diagram sources**
- [page.tsx](file://app/analytics/page.tsx#L23-L201)
- [route.ts](file://app/api/events/route.ts#L1-L27)
- [route.ts](file://app/api/user-growth/route.ts#L1-L17)

**Section sources**
- [page.tsx](file://app/analytics/page.tsx#L1-L201)
- [route.ts](file://app/api/events/route.ts#L1-L27)
- [route.ts](file://app/api/user-growth/route.ts#L1-L17)

### Client-Side Data Retrieval
The AnalyticsPage component implements a data fetching strategy using React's useEffect hook to retrieve analytics data when the component mounts. The implementation uses Promise.all to parallelize requests to multiple endpoints, reducing overall loading time. Error handling is implemented to provide user feedback in case of data retrieval failures.

```mermaid
flowchart TD
A[AnalyticsPage Mount] --> B[fetchData Execution]
B --> C[Promise.all]
C --> D[fetch /api/events?type=daily&days=30]
C --> E[fetch /api/events]
D --> F[Process Daily Stats]
E --> G[Process Top Events]
F --> H[Set dailyStats State]
G --> I[Set topEvents State]
H --> J[Calculate Totals]
I --> J
J --> K[Render Visualizations]
C --> L[Error Handling]
L --> M[Set Error State]
M --> N[Display Error Message]
```

**Diagram sources**
- [page.tsx](file://app/analytics/page.tsx#L23-L201)

**Section sources**
- [page.tsx](file://app/analytics/page.tsx#L1-L201)

## Data Models and Backend Queries

### Analytics Data Structures
The system defines several TypeScript interfaces to structure analytics data consistently across the application. These interfaces ensure type safety and provide clear documentation of the data shape expected by visualization components.

```mermaid
classDiagram
class DailyStats {
+date : string
+newUsers : number
+bookings : number
+events : number
}
class EventStats {
+eventType : string
+count : number
}
class UserGrowthData {
+date : string
+totalUsers : number
+newUsers : number
}
class FreeLessonRegistration {
+registered_at : string
}
DailyStats <|-- EventsChart
EventStats <|-- EventsChart
EventStats <|-- PieDistributionChart
UserGrowthData <|-- UserGrowthChart
FreeLessonRegistration <|-- RegistrationTrendChart
```

**Diagram sources**
- [page.tsx](file://app/analytics/page.tsx#L15-L21)
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L1-L13)
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L1-L13)
- [EventsChart.tsx](file://components/EventsChart.tsx#L1-L13)

**Section sources**
- [page.tsx](file://app/analytics/page.tsx#L1-L201)
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L1-L86)
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L1-L98)
- [EventsChart.tsx](file://components/EventsChart.tsx#L1-L125)

### Database Query Implementation
The analytics queries are implemented in the lib/queries.ts file using PostgreSQL with Common Table Expressions (CTEs) to create comprehensive data sets. The queries join data from multiple sources (bookings, events, free lesson registrations) to provide a holistic view of platform activity.

```mermaid
flowchart TD
A[getDailyStats] --> B[Generate Date Series]
B --> C[Query Daily Bookings]
C --> D[Count Bookings and New Users]
D --> E[Query Daily Events]
E --> F[Count Events]
F --> G[Left Join with Date Series]
G --> H[Return Complete Daily Stats]
I[getTopEvents] --> J[SELECT event_type and COUNT]
J --> K[GROUP BY event_type]
K --> L[ORDER BY count DESC]
L --> M[LIMIT results]
M --> N[Return Top Event Types]
O[getUserGrowthData] --> P[Generate Date Series]
P --> Q[Union User First Appearances]
Q --> R[Find First Date per User]
R --> S[Count Daily New Users]
S --> T[Calculate Running Total]
T --> U[Add Historical Users]
U --> V[Return Daily Growth Metrics]
```

**Diagram sources**
- [queries.ts](file://lib/queries.ts#L221-L292)
- [queries.ts](file://lib/queries.ts#L474-L539)

**Section sources**
- [queries.ts](file://lib/queries.ts#L1-L1431)

## Tiered Data Loading Strategy
The analytics dashboard implements a tiered data loading strategy to prioritize critical metrics and enhance user experience. The system first loads summary metrics and basic visualizations, then progressively enhances the page with more detailed analytics. This approach ensures that users see meaningful content quickly while additional data loads in the background.

The implementation uses React's useState and useEffect hooks to manage loading states and coordinate data retrieval. Skeleton components provide visual feedback during loading, maintaining perceived performance. The strategy also includes error boundaries to handle failed requests gracefully, allowing partial data display when some endpoints fail.

```mermaid
flowchart TD
A[Initial Render] --> B[Show Loading State]
B --> C[Fetch Critical Metrics]
C --> D[Parallel API Requests]
D --> E[Process Daily Stats]
D --> F[Process Top Events]
E --> G[Render Summary Cards]
F --> H[Render Event Visualizations]
G --> I[Display Core Analytics]
H --> I
I --> J[Load Secondary Data]
J --> K[Enhance Visualizations]
K --> L[Complete Dashboard]
```

**Section sources**
- [page.tsx](file://app/analytics/page.tsx#L23-L201)

## Interpreting Analytics for Business Decisions
The analytics data can inform several key business decisions. User growth trends help evaluate the effectiveness of marketing campaigns and identify optimal times for promotional activities. Registration trends for free lessons indicate interest levels in specific course topics and can guide content development priorities.

Event analytics reveal the most common user actions, highlighting popular features and potential usability issues. For example, a high volume of "button_click" events for a particular feature suggests strong user engagement, while low conversion rates from registration to booking may indicate friction in the user journey.

The comparative metrics (average daily users, bookings, and events) provide benchmarks for performance evaluation. Significant deviations from historical averages can trigger investigations into underlying causes, whether positive (successful marketing campaign) or negative (technical issue).

## Customization and Extension
The analytics system is designed to be extensible, allowing for the addition of new metrics and visualizations. To add a new metric, developers should:

1. Create a new database query function in lib/queries.ts
2. Implement a corresponding API route in app/api/
3. Develop a visualization component using Recharts
4. Integrate the component into the analytics page

Customization options include adjusting time ranges, adding filters for specific user segments, and modifying visualization styles. The component architecture supports theme consistency through shared UI components and CSS variables.

For performance optimization, consider implementing data caching strategies and pagination for large data sets. The current implementation could be enhanced with real-time updates using WebSockets for time-sensitive analytics.

## Component Relationships
The analytics components are organized in a modular architecture with clear dependencies. The top-level AnalyticsPage orchestrates data retrieval and coordinates the rendering of specialized visualization components. Each visualization component is responsible for a specific type of data presentation and accepts standardized data props.

```mermaid
graph TD
A[AnalyticsPage] --> B[EventsChart]
A --> C[UserGrowthChart]
A --> D[RegistrationTrendChart]
A --> E[PieDistributionChart]
B --> F[Recharts LineChart]
B --> G[Recharts BarChart]
C --> F
D --> F
E --> H[Recharts PieChart]
A --> I[UI Components]
B --> I
C --> I
D --> I
E --> I
I --> J[Card]
I --> K[Button]
I --> L[Table]
style A fill:#4c88d8,stroke:#333
style B fill:#7bc043,stroke:#333
style C fill:#7bc043,stroke:#333
style D fill:#7bc043,stroke:#333
style E fill:#7bc043,stroke:#333
style I fill:#f0c33c,stroke:#333
```

**Diagram sources**
- [page.tsx](file://app/analytics/page.tsx#L1-L201)
- [EventsChart.tsx](file://components/EventsChart.tsx#L1-L125)
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L1-L86)
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L1-L98)
- [PieDistributionChart.tsx](file://components/PieDistributionChart.tsx#L1-L82)

**Section sources**
- [page.tsx](file://app/analytics/page.tsx#L1-L201)
- [EventsChart.tsx](file://components/EventsChart.tsx#L1-L125)
- [UserGrowthChart.tsx](file://components/UserGrowthChart.tsx#L1-L86)
- [RegistrationTrendChart.tsx](file://components/RegistrationTrendChart.tsx#L1-L98)
- [PieDistributionChart.tsx](file://components/PieDistributionChart.tsx#L1-L82)