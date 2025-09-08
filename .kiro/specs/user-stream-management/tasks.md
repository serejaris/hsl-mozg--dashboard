# Implementation Plan

- [x] 1. Create StreamChangeDialog component
  - Create new component file with dialog interface
  - Implement stream dropdown with available options
  - Add form validation and loading states
  - Handle API calls for stream updates
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [x] 2. Add stream change functionality to user list
  - Add "Change Stream" button to user table actions column
  - Implement dialog state management (open/close)
  - Handle success callback to refresh user list
  - _Requirements: 1.1, 1.2, 3.1, 3.2_

- [x] 3. Implement stream update logic
  - Create function to find user's most recent active booking
  - Use existing booking update API to change course_stream
  - Add proper error handling for edge cases
  - _Requirements: 1.3, 4.1, 4.2, 4.3_

- [x] 4. Add user feedback and error handling
  - Display success message after stream change
  - Show appropriate error messages for validation failures
  - Handle cases where user has no active bookings
  - _Requirements: 1.4, 3.3, 4.4, 4.5_

- [x] 5. Test the complete workflow
  - Verify stream change button appears in user list
  - Test dialog functionality with different stream selections
  - Confirm database updates and UI refresh work correctly
  - Test error scenarios and edge cases
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_