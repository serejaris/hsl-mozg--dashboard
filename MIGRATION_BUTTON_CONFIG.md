# Database Migration: Add Button Configuration Support

## Overview

This migration adds support for custom button configurations (inline keyboards) in Telegram messages.

## What's New

- **Custom Buttons**: Users can now add custom buttons with text and either URL links or callback data (payload)
- **Button Rows**: Organize buttons in multiple rows for better layout
- **Persistent Storage**: Button configurations are saved in the database for audit and history tracking

## Required Database Migration

Before using this feature, you **MUST** run the following SQL command on your Railway PostgreSQL database:

```sql
ALTER TABLE message_history
ADD COLUMN IF NOT EXISTS button_config JSONB DEFAULT NULL;
```

## How to Run the Migration

### Option 1: Using Railway CLI

```bash
railway connect postgresql
```

Then paste the SQL command above.

### Option 2: Using Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your PostgreSQL service
3. Open the "Query" tab
4. Paste the SQL command and execute

### Option 3: Using the migration script (requires local database access)

```bash
node scripts/add-button-config-column.js
```

**Note**: This option requires that your `.env.local` file has valid database credentials.

## Button Configuration Format

The `button_config` column stores button data in JSONB format:

```json
[
  {
    "text": "Visit Website",
    "url": "https://example.com",
    "row": 0
  },
  {
    "text": "Action Button",
    "callback_data": "action_name",
    "row": 1
  }
]
```

### Button Fields

- `text` (required): The text displayed on the button
- `url` (optional): URL to open when button is clicked
- `callback_data` (optional): Payload sent to bot when button is clicked
- `row` (optional): Row number for button layout (default: 0)

**Note**: Each button must have either `url` OR `callback_data`, not both.

## Usage

After running the migration:

1. Navigate to `/messages/send` in the dashboard
2. Compose your message as usual
3. Scroll down to the "Кнопки (опционально)" section
4. Add buttons by:
   - Entering button text
   - Choosing button type (URL or Callback)
   - Entering the URL or callback data
   - Optionally setting the row number
5. Click "Добавить кнопку" to add the button
6. Send your message with the configured buttons

## Technical Details

### Updated Files

- `lib/queries.ts`: Added `ButtonConfig` interface and updated `createMessageHistory` function
- `app/api/messages/send/route.ts`: Updated to save button configuration
- `app/messages/send/page.tsx`: Added UI for button configuration

### TypeScript Interface

```typescript
interface ButtonConfig {
  text: string;
  url?: string;
  callback_data?: string;
  row?: number;
}
```

## Testing

To test the button functionality:

1. Ensure the migration has been run
2. Start the development server: `npm run dev`
3. Navigate to `/messages/send`
4. Select a test recipient
5. Enter a message
6. Add a button with either URL or callback data
7. Send the message
8. Check the Telegram client to verify the button appears correctly

## Rollback

If you need to remove the column:

```sql
ALTER TABLE message_history DROP COLUMN IF EXISTS button_config;
```

**Warning**: This will delete all stored button configurations permanently.
