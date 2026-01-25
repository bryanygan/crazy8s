# Reconnection Regression Test Checklist

## Pre-Test Setup
- [ ] Backend server running with reconnection support
- [ ] Frontend development server running
- [ ] Database configured and accessible
- [ ] Browser developer tools open
- [ ] Multiple browser tabs/windows available for testing

## Core Reconnection Scenarios

### 1. Basic Guest User Reconnection
**Test Steps:**
- [ ] Join game as guest user
- [ ] Play several turns to establish game state
- [ ] Verify session data in localStorage
- [ ] Close browser tab completely
- [ ] Reopen application at same URL
- [ ] Observe reconnection flow

**Expected Results:**
- [ ] Reconnection modal appears with progress indicator
- [ ] "Reconnecting to previous game..." toast notification
- [ ] Connection status shows "Reconnecting..."
- [ ] Game state fully restored (cards, turn, score)
- [ ] "Reconnected successfully!" toast notification
- [ ] Connection status shows "Connected (Restored)"
- [ ] All UI elements properly restored

### 2. Basic Authenticated User Reconnection
**Test Steps:**
- [ ] Login with valid credentials
- [ ] Join game as authenticated user
- [ ] Play several turns
- [ ] Verify session data includes auth info
- [ ] Close browser tab completely
- [ ] Reopen application at same URL
- [ ] Observe reconnection flow

**Expected Results:**
- [ ] Reconnection modal appears
- [ ] Authenticates with stored token
- [ ] User profile information preserved
- [ ] Game state fully restored
- [ ] Connection status shows authenticated state

### 3. Game Ended During Absence
**Test Steps:**
- [ ] Join active game
- [ ] Close browser before game ends
- [ ] Wait for game to finish (simulate on backend)
- [ ] Reopen application

**Expected Results:**
- [ ] Reconnection modal appears
- [ ] Error message: "Game has already ended"
- [ ] Session data cleared from localStorage
- [ ] Redirected to main menu
- [ ] Appropriate error toast displayed

### 4. Session Expired (24+ hours)
**Test Steps:**
- [ ] Join game
- [ ] Modify session timestamp in localStorage (25+ hours ago)
- [ ] Reopen application

**Expected Results:**
- [ ] Reconnection modal appears briefly
- [ ] Error message: "Your session has expired"
- [ ] Session data cleared
- [ ] Redirected to main menu
- [ ] Appropriate notification shown

### 5. Game Not Found
**Test Steps:**
- [ ] Join game
- [ ] Simulate game deletion on backend
- [ ] Reopen application

**Expected Results:**
- [ ] Reconnection modal appears
- [ ] Error message: "Game not found or has expired"
- [ ] Session data cleared
- [ ] Redirected to main menu
- [ ] Appropriate error handling

## Connection Status Indicator Tests

### 6. Connection Status Display
**Test Steps:**
- [ ] Join game and observe connection indicator
- [ ] Simulate network disconnection
- [ ] Observe status changes during reconnection
- [ ] Restore network connection

**Expected Results:**
- [ ] Shows "Connected" when socket connected
- [ ] Shows "Connected (Restored)" after reconnection
- [ ] Shows "Disconnected" when socket disconnected
- [ ] Shows "Reconnecting..." during reconnection attempts
- [ ] Proper color coding (Green/Red/Yellow)

### 7. Manual Reconnection Button
**Test Steps:**
- [ ] Join game
- [ ] Simulate network disconnection
- [ ] Click "Reconnect" button in status indicator

**Expected Results:**
- [ ] Button appears when disconnected
- [ ] Clicking triggers page reload
- [ ] Automatic reconnection attempts on reload

## Error Handling Tests

### 8. Network Timeout
**Test Steps:**
- [ ] Join game
- [ ] Enable slow network throttling in DevTools
- [ ] Close and reopen application
- [ ] Observe timeout behavior

**Expected Results:**
- [ ] Reconnection modal shows progress
- [ ] Times out after configured period (10 seconds)
- [ ] Error message: "Connection timed out"
- [ ] Retry option available

### 9. Server Error During Reconnection
**Test Steps:**
- [ ] Join game
- [ ] Simulate server error (500, 404, etc.)
- [ ] Reopen application

**Expected Results:**
- [ ] Appropriate error message for error type
- [ ] Retry option for retryable errors
- [ ] Menu option for permanent errors
- [ ] Session cleared for permanent errors

## Authentication-Specific Tests

### 10. Token Expiration During Reconnection
**Test Steps:**
- [ ] Login with valid credentials
- [ ] Join game
- [ ] Simulate token expiration
- [ ] Reopen application

**Expected Results:**
- [ ] Attempts reconnection with expired token
- [ ] Falls back to guest reconnection
- [ ] Game state still restored
- [ ] User shown as guest in UI

### 11. Invalid/Corrupted Token
**Test Steps:**
- [ ] Login with valid credentials
- [ ] Join game
- [ ] Corrupt token in localStorage
- [ ] Reopen application

**Expected Results:**
- [ ] Attempts reconnection with invalid token
- [ ] Falls back to guest reconnection
- [ ] Game state restored
- [ ] Proper error handling

## UI/UX Tests

### 12. Reconnection Modal Behavior
**Test Steps:**
- [ ] Trigger reconnection modal
- [ ] Test modal interactions
- [ ] Verify modal states

**Expected Results:**
- [ ] Modal blocks interaction with background
- [ ] Progress bar animates during connection
- [ ] Success state shows briefly before closing
- [ ] Error state shows retry/cancel options
- [ ] Modal is responsive on mobile

### 13. Toast Notifications
**Test Steps:**
- [ ] Trigger various reconnection scenarios
- [ ] Observe toast notifications

**Expected Results:**
- [ ] Appropriate toast types (info, success, warning, error)
- [ ] Clear, user-friendly messages
- [ ] Toasts auto-dismiss after timeout
- [ ] Multiple toasts don't overlap

## Session Persistence Tests

### 14. Session Data Accuracy
**Test Steps:**
- [ ] Join game and play several rounds
- [ ] Check localStorage session data
- [ ] Verify data accuracy

**Expected Results:**
- [ ] Game ID correctly stored
- [ ] Player name correctly stored
- [ ] Game state accurately reflected
- [ ] Timestamp updated on changes
- [ ] User type correctly identified

### 15. Session Cleanup
**Test Steps:**
- [ ] Join game
- [ ] Leave game manually
- [ ] Check localStorage

**Expected Results:**
- [ ] Session data cleared when leaving game
- [ ] Session data cleared when game ends
- [ ] Session data cleared on permanent errors

## Multi-Tab/Window Tests

### 16. Multiple Browser Tabs
**Test Steps:**
- [ ] Open game in multiple tabs
- [ ] Join game in one tab
- [ ] Close one tab, keep others open
- [ ] Reopen closed tab

**Expected Results:**
- [ ] Reconnection works from any tab
- [ ] Session data consistent across tabs
- [ ] No conflicts between tabs

### 17. Multiple Browser Windows
**Test Steps:**
- [ ] Open game in multiple windows
- [ ] Test reconnection scenarios
- [ ] Verify behavior consistency

**Expected Results:**
- [ ] Consistent behavior across windows
- [ ] No session conflicts
- [ ] Proper state synchronization

## Mobile Testing

### 18. Mobile Safari
**Test Steps:**
- [ ] Open game on mobile Safari
- [ ] Join game and play
- [ ] Switch to another app
- [ ] Return to Safari

**Expected Results:**
- [ ] Reconnection triggers on app resume
- [ ] Game state restored
- [ ] UI remains responsive
- [ ] Touch interactions work properly

### 19. Mobile Chrome
**Test Steps:**
- [ ] Open game on mobile Chrome
- [ ] Join game and play
- [ ] Switch to another app
- [ ] Return to Chrome

**Expected Results:**
- [ ] Reconnection triggers on app resume
- [ ] Game state restored
- [ ] UI remains responsive
- [ ] Touch interactions work properly

## Performance Tests

### 20. Reconnection Performance
**Test Steps:**
- [ ] Measure reconnection time
- [ ] Test with various network conditions
- [ ] Monitor memory usage

**Expected Results:**
- [ ] Reconnection completes within 10 seconds
- [ ] No memory leaks
- [ ] Efficient resource usage

### 21. Stress Testing
**Test Steps:**
- [ ] Perform multiple rapid reconnections
- [ ] Test with large game states
- [ ] Test concurrent reconnections

**Expected Results:**
- [ ] Stable performance under load
- [ ] No crashes or freezes
- [ ] Graceful degradation

## Edge Cases

### 22. Corrupted Session Data
**Test Steps:**
- [ ] Manually corrupt session data in localStorage
- [ ] Reopen application
- [ ] Verify error handling

**Expected Results:**
- [ ] Graceful handling of corrupted data
- [ ] Session cleared automatically
- [ ] User redirected to main menu

### 23. Partial Session Data
**Test Steps:**
- [ ] Remove some fields from session data
- [ ] Test reconnection behavior

**Expected Results:**
- [ ] Handles missing fields gracefully
- [ ] Falls back to safe defaults
- [ ] Provides appropriate user feedback

### 24. Race Conditions
**Test Steps:**
- [ ] Rapidly open/close browser tabs
- [ ] Test simultaneous reconnection attempts
- [ ] Verify state consistency

**Expected Results:**
- [ ] No race conditions
- [ ] Consistent state management
- [ ] Proper cleanup

## Security Tests

### 25. Session Security
**Test Steps:**
- [ ] Inspect session data for sensitive information
- [ ] Test with various authentication states
- [ ] Verify secure token handling

**Expected Results:**
- [ ] No sensitive data in localStorage
- [ ] Secure token transmission
- [ ] Proper authentication validation

### 26. Cross-Tab Security
**Test Steps:**
- [ ] Test session sharing between tabs
- [ ] Verify authentication consistency
- [ ] Test logout behavior

**Expected Results:**
- [ ] Secure session sharing
- [ ] Consistent authentication state
- [ ] Proper logout handling

## Final Validation

### 27. Overall System Health
**Test Steps:**
- [ ] Run all automated tests
- [ ] Verify ESLint compliance
- [ ] Check console for errors/warnings
- [ ] Validate accessibility

**Expected Results:**
- [ ] All automated tests pass
- [ ] No ESLint errors/warnings
- [ ] Clean console output
- [ ] Accessible interface

### 28. User Experience
**Test Steps:**
- [ ] Test with non-technical users
- [ ] Gather feedback on reconnection flow
- [ ] Verify intuitiveness

**Expected Results:**
- [ ] Intuitive reconnection process
- [ ] Clear user feedback
- [ ] Minimal user confusion

## Sign-off

- [ ] All test cases completed
- [ ] Issues documented and addressed
- [ ] Regression testing completed
- [ ] Ready for production deployment

**Testing Notes:**
_Record any observations, issues, or recommendations here_

**Tester:** _________________ **Date:** _________________

**Reviewer:** _________________ **Date:** _________________