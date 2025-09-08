# Design Document

## Overview

Simple MVP feature to allow course administrators to change user streams directly from the user list. The feature will add a "Change Stream" button to each user row that opens a simple dialog for stream selection.

## Architecture

### System Integration
- **Frontend**: Add stream change functionality to existing user list
- **Backend**: Use existing booking update API endpoint
- **Database**: Update `course_stream` field in existing `bookings` table
- **UI**: Simple dialog with dropdown selection

### Data Flow
1. Administrator clicks "Change Stream" button on user row
2. Dialog opens showing current stream and dropdown for new stream
3. Administrator selects new stream and clicks save
4. API updates the user's most recent booking stream
5. User list refreshes to show new stream
6. Success message displayed

## Components and Interfaces

### 1. Enhanced User List (app/users/page.tsx)

**Changes**:
- Add "Change Stream" button to actions column
- Add state for stream change dialog
- Handle dialog open/close and refresh after changes

### 2. StreamChangeDialog Component (new)

**Location**: `components/StreamChangeDialog.tsx`

**Simple Interface**:
```typescript
interface StreamChangeDialogProps {
  userId: number;
  currentStream: string | null;
  userName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Features**:
- Show current stream
- Dropdown with available streams (3rd, 4th, 5th)
- Save/Cancel buttons
- Loading state during save
- Error handling

### 3. API Usage

**Use Existing Endpoint**: `PATCH /api/users/[id]/bookings`

**Strategy**: Update the most recent active booking's `course_stream` field

## Data Models

### Stream Options
```typescript
const STREAMS = {
  '3rd_stream': '3-й поток',
  '4th_stream': '4-й поток', 
  '5th_stream': '5-й поток'
};
```

### Update Logic
- Find user's most recent booking where `confirmed != -1`
- Update that booking's `course_stream` field
- If no active bookings, show error message

## Error Handling

### Simple Validation
1. User must have at least one active booking
2. New stream must be different from current stream
3. Stream must be one of the valid options

### Error Messages
- "У пользователя нет активных бронирований"
- "Ошибка при обновлении потока"
- "Выберите другой поток"

## Testing Strategy

### Manual Testing
- [ ] Change stream button appears on user list
- [ ] Dialog opens with correct current stream
- [ ] Stream selection works
- [ ] Save updates database and refreshes list
- [ ] Error handling works for edge cases
- [ ] Cancel closes dialog without changes