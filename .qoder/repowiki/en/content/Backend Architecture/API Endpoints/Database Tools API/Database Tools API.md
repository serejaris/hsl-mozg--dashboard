# Database Tools API

<cite>
**Referenced Files in This Document**   
- [db-migrate/route.ts](file://app/api/db-migrate/route.ts)
- [db-schema/route.ts](file://app/api/db-schema/route.ts)
- [test-db/route.ts](file://app/api/test-db/route.ts)
- [db.ts](file://lib/db.ts)
- [DATABASE_MIGRATION_LOG.md](file://DATABASE_MIGRATION_LOG.md)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Core Endpoints](#core-endpoints)
3. [Migration Process and Versioning](#migration-process-and-versioning)
4. [Security Considerations](#security-considerations)
5. [Error Handling and Troubleshooting](#error-handling-and-troubleshooting)
6. [Integration with Database Connection Management](#integration-with-database-connection-management)
7. [Common Issues and Solutions](#common-issues-and-solutions)

## Introduction

The Database Tools API provides a set of endpoints for managing and inspecting the application's database. These tools are designed to support database schema migrations, schema inspection, and connection testing. The system is built on PostgreSQL with a Next.js API layer, enabling secure and transactional database operations. This documentation details the three primary endpoints: `/api/db-migrate` for schema migrations, `/api/db-schema` for current schema inspection, and `/api/test-db` for connection testing.

## Core Endpoints

### /api/db-migrate (POST)

This endpoint allows for the execution of database schema migrations through SQL statements. It is designed to be used for creating, altering, or dropping database objects in a controlled manner.

**Request Method**: POST  
**Request Body**: JSON object containing:
- `sql` (string, required): The SQL statement to execute
- `description` (string, optional): A human-readable description of the migration

**Response Format**: JSON object with:
- `success` (boolean): Indicates if the operation was successful
- `message` (string): Success message with migration description
- `rowsAffected` (number): Number of rows affected by the SQL statement
- `command` (string): Type of SQL command executed (e.g., "CREATE", "INSERT")

The endpoint executes migrations within a database transaction, ensuring atomicity. If the SQL execution fails, the transaction is automatically rolled back to maintain database consistency.

**Section sources**
- [db-migrate/route.ts](file://app/api/db-migrate/route.ts#L1-L54)

### /api/db-schema (GET)

This endpoint provides comprehensive information about the current database schema, including tables, columns, constraints, and indexes.

**Request Method**: GET  
**Response Format**: JSON object with:
- `success` (boolean): Indicates if the operation was successful
- `schema` (object): Contains three arrays:
  - `tables`: Information about all tables and their columns
  - `constraints`: Details about primary keys, foreign keys, and other constraints
  - `indexes`: Information about all database indexes

The endpoint queries PostgreSQL's information_schema and pg_indexes to gather comprehensive schema metadata, providing a complete picture of the database structure.

**Section sources**
- [db-schema/route.ts](file://app/api/db-schema/route.ts#L1-L70)

### /api/test-db (GET)

This endpoint tests the connection to the database and verifies that it is responsive.

**Request Method**: GET  
**Response Format**: JSON object with:
- `success` (boolean): Indicates if the connection test was successful
- `timestamp` (string): Current database timestamp (NOW())
- `database_version` (string): PostgreSQL version information
- `message` (string): Success message

The endpoint executes a simple query (`SELECT NOW(), version()`) to verify database connectivity and retrieve basic system information.

**Section sources**
- [test-db/route.ts](file://app/api/test-db/route.ts#L1-L22)

## Migration Process and Versioning

The database migration system follows a transactional approach to ensure data integrity during schema changes. Each migration is executed within a BEGIN-COMMIT transaction block, with automatic ROLLBACK on any error. This ensures that partial migrations do not leave the database in an inconsistent state.

The versioning strategy is implicit rather than explicit - migrations are not version-numbered but are tracked through the DATABASE_MIGRATION_LOG.md file, which documents each migration with a timestamp, description, and SQL statements. This log serves as the authoritative record of all schema changes.

### Rollback Procedures

Rollback procedures are documented in the DATABASE_MIGRATION_LOG.md file and can be executed through the same `/api/db-migrate` endpoint. The recommended approach is a complete rollback using CASCADE to handle foreign key dependencies:

```sql
DROP TABLE IF EXISTS message_recipients CASCADE;
DROP TABLE IF EXISTS message_history CASCADE;
```

Alternatively, selective rollbacks can target specific components:
- Remove indexes only
- Drop specific tables while preserving others

Rollbacks are executed by sending the appropriate DROP statements to the `/api/db-migrate` endpoint, leveraging the same transactional safety as forward migrations.

**Section sources**
- [DATABASE_MIGRATION_LOG.md](file://DATABASE_MIGRATION_LOG.md#L1-L172)

## Security Considerations

The Database Tools API implements several security measures to protect against unauthorized access and potential damage:

### Environment Restrictions

Database migrations are restricted based on the environment configuration. The system checks for the presence of required environment variables (POSTGRES_HOST and POSTGRES_PASSWORD) to determine if database operations should be allowed. In production environments, these variables must be properly configured, while in development, a stub connection may be used for build-time tasks.

The system specifically checks `process.env.NODE_ENV` to determine the environment, with special handling for non-production environments. This prevents accidental schema changes in production while allowing development flexibility.

### SQL Injection Prevention

All SQL statements are executed directly from the request body, but the system relies on the principle that only trusted administrators should have access to these endpoints. The API does not parameterize the SQL statements since they are intended for DDL operations rather than data queries.

### Access Control

While not explicitly implemented in the code, these endpoints should be protected behind authentication and authorization mechanisms in a production environment. Direct access to these endpoints could allow complete control over the database schema.

**Section sources**
- [db.ts](file://lib/db.ts#L1-L52)
- [db-migrate/route.ts](file://app/api/db-migrate/route.ts#L1-L54)

## Error Handling and Troubleshooting

The Database Tools API implements comprehensive error handling to provide meaningful feedback during operations.

### Migration Errors

When a migration fails, the system:
1. Automatically rolls back the transaction
2. Logs the error with a "❌" emoji for visibility
3. Returns a 500 status code with an error message

Common error responses include:
- 400 Bad Request: Missing SQL statement in request body
- 500 Internal Server Error: Database execution error

### Schema Inspection and Connection Test Errors

Both the schema inspection and connection test endpoints follow similar error handling patterns:
- Catch any database errors
- Log the error details
- Return a 500 status code with a generic error message

This consistent approach ensures that clients receive predictable responses regardless of the specific endpoint.

**Section sources**
- [db-migrate/route.ts](file://app/api/db-migrate/route.ts#L1-L54)
- [db-schema/route.ts](file://app/api/db-schema/route.ts#L1-L70)
- [test-db/route.ts](file://app/api/test-db/route.ts#L1-L22)

## Integration with Database Connection Management

The Database Tools API integrates with the centralized database connection management system located in `lib/db.ts`. This file exports a Pool instance that manages a connection pool to the PostgreSQL database.

The connection pool is configured with the following parameters:
- Host: From POSTGRES_HOST environment variable
- Port: From POSTGRES_PORT or defaults to 5432
- Database: From POSTGRES_DB or defaults to 'railway'
- User: From POSTGRES_USER or defaults to 'postgres'
- Password: From POSTGRES_PASSWORD
- SSL: Configured with rejectUnauthorized: false

In environments where database configuration is missing, the system creates a proxy pool that throws errors on any operation, allowing the application to build and run without a database connection for certain tasks.

All three API endpoints import this pool instance and use it to establish client connections for their operations, ensuring consistent connection handling across the application.

**Section sources**
- [db.ts](file://lib/db.ts#L1-L52)
- [db-migrate/route.ts](file://app/api/db-migrate/route.ts#L1-L54)
- [db-schema/route.ts](file://app/api/db-schema/route.ts#L1-L70)
- [test-db/route.ts](file://app/api/test-db/route.ts#L1-L22)

## Common Issues and Solutions

### Migration Conflicts

Migration conflicts can occur when multiple developers attempt to modify the same database objects simultaneously. To prevent this:
1. Coordinate migrations through team communication
2. Use the DATABASE_MIGRATION_LOG.md file to document planned changes
3. Execute migrations in a sequential manner

### Database Locking

Long-running migrations can cause database locking, preventing other operations. To mitigate this:
1. Keep migrations small and focused
2. Avoid migrations during peak usage times
3. Test migrations on a copy of production data first

### Connection Issues

If the `/api/test-db` endpoint fails, check:
1. Database server availability
2. Network connectivity between application and database
3. Correctness of database connection environment variables
4. Database authentication credentials

The stub connection in `lib/db.ts` may mask configuration issues during development, so ensure proper environment variables are set before deployment.

**Section sources**
- [DATABASE_MIGRATION_LOG.md](file://DATABASE_MIGRATION_LOG.md#L1-L172)
- [db.ts](file://lib/db.ts#L1-L52)