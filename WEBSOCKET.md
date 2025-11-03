# WebSocket Documentation - EventHub

## Overview

EventHub uses WebSocket for real-time features:
- **Live chat** for each event
- **Real-time notifications** for event registrations
- **Typing indicators**
- **User presence** (join/leave notifications)
- **Admin notifications** for new reports

## Connection

Connect to: `ws://localhost:3000` (or your server URL)

## Authentication

Before using any WebSocket features, you must authenticate with a JWT token.

**Send:**
```json
{
  "type": "auth",
  "payload": {
    "token": "your_jwt_token_here"
  }
}
```

**Receive (success):**
```json
{
  "type": "auth_success",
  "payload": {
    "userId": "user_id",
    "name": "User Name"
  }
}
```

**Receive (error):**
```json
{
  "type": "error",
  "payload": {
    "message": "Authentication failed"
  }
}
```

---

## Events

### Join Event Chat

Join a chat room for a specific event (must be registered participant or creator).

**Send:**
```json
{
  "type": "join_event",
  "payload": {
    "eventId": "event_id_here"
  }
}
```

**Receive (success):**
```json
{
  "type": "joined_event",
  "payload": {
    "eventId": "event_id",
    "messages": [
      {
        "_id": "message_id",
        "user": {
          "_id": "user_id",
          "name": "User Name",
          "avatar": null
        },
        "content": "Hello!",
        "type": "text",
        "createdAt": "2025-11-03T..."
      }
    ]
  }
}
```

**Broadcast to other participants:**
```json
{
  "type": "user_joined",
  "payload": {
    "userId": "user_id",
    "userName": "User Name",
    "eventId": "event_id"
  }
}
```

---

### Leave Event Chat

Leave a chat room.

**Send:**
```json
{
  "type": "leave_event",
  "payload": {
    "eventId": "event_id_here"
  }
}
```

**Receive:**
```json
{
  "type": "left_event",
  "payload": {
    "eventId": "event_id"
  }
}
```

**Broadcast to other participants:**
```json
{
  "type": "user_left",
  "payload": {
    "userId": "user_id",
    "userName": "User Name",
    "eventId": "event_id"
  }
}
```

---

### Send Chat Message

Send a message in an event chat (must be joined first).

**Send:**
```json
{
  "type": "chat_message",
  "payload": {
    "eventId": "event_id_here",
    "content": "Your message here"
  }
}
```

**Broadcast to all participants (including sender):**
```json
{
  "type": "new_message",
  "payload": {
    "eventId": "event_id",
    "message": {
      "_id": "message_id",
      "event": "event_id",
      "user": {
        "_id": "user_id",
        "name": "User Name",
        "avatar": null
      },
      "content": "Your message here",
      "type": "text",
      "createdAt": "2025-11-03T..."
    }
  }
}
```

---

### Typing Indicator

Show when user is typing.

**Send:**
```json
{
  "type": "typing",
  "payload": {
    "eventId": "event_id_here",
    "isTyping": true
  }
}
```

**Broadcast to other participants:**
```json
{
  "type": "user_typing",
  "payload": {
    "eventId": "event_id",
    "userId": "user_id",
    "userName": "User Name",
    "isTyping": true
  }
}
```

---

## Notifications

### Event Registration Notification

Sent to event creator and participants when someone registers for an event.

**Receive:**
```json
{
  "type": "notification",
  "payload": {
    "type": "event_registration",
    "eventId": "event_id",
    "eventTitle": "Event Title",
    "userName": "New User Name",
    "userId": "user_id",
    "timestamp": "2025-11-03T..."
  }
}
```

---

### New Report Notification

Sent to all admins when a user reports an event.

**Receive (admin only):**
```json
{
  "type": "notification",
  "payload": {
    "type": "new_report",
    "reportId": "report_id",
    "eventId": "event_id",
    "eventTitle": "Event Title",
    "reporterName": "Reporter Name",
    "reason": "inappropriate",
    "timestamp": "2025-11-03T..."
  }
}
```

---

## Error Handling

All errors are sent in this format:

```json
{
  "type": "error",
  "payload": {
    "message": "Error description"
  }
}
```

**Common errors:**
- `"Token required"` - No token provided in auth
- `"Authentication failed"` - Invalid or expired token
- `"User is blocked"` - User account is blocked
- `"Not authenticated"` - Trying to use features before auth
- `"Event not found"` - Invalid event ID
- `"Not registered for this event"` - User not participant or creator
- `"Not in this event room"` - Trying to send message without joining
- `"Invalid message format"` - Malformed JSON

---

## Client Implementation Example (JavaScript)

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected');
  
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth',
    payload: {
      token: 'your_jwt_token'
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'auth_success':
      console.log('Authenticated as:', data.payload.name);
      
      // Join an event
      ws.send(JSON.stringify({
        type: 'join_event',
        payload: {
          eventId: 'event_id_here'
        }
      }));
      break;
      
    case 'joined_event':
      console.log('Joined event, messages:', data.payload.messages);
      break;
      
    case 'new_message':
      console.log('New message:', data.payload.message);
      displayMessage(data.payload.message);
      break;
      
    case 'user_joined':
      console.log('User joined:', data.payload.userName);
      break;
      
    case 'notification':
      console.log('Notification:', data.payload);
      showNotification(data.payload);
      break;
      
    case 'error':
      console.error('Error:', data.payload.message);
      break;
  }
};

// Send a chat message
function sendMessage(content) {
  ws.send(JSON.stringify({
    type: 'chat_message',
    payload: {
      eventId: 'current_event_id',
      content: content
    }
  }));
}

// Show typing indicator
function sendTyping(isTyping) {
  ws.send(JSON.stringify({
    type: 'typing',
    payload: {
      eventId: 'current_event_id',
      isTyping: isTyping
    }
  }));
}
```

---

## Testing

### Using the Test Client

1. Start the server: `npm run dev`
2. Open browser: `http://localhost:3000/public/websocket-test.html`
3. Get a JWT token:
   - Use Thunder Client or Postman
   - POST to `/api/auth/login` or `/api/auth/register`
   - Copy the token from response
4. In the test client:
   - Paste the JWT token
   - Click "Connect"
   - Enter an event ID (create one first via API)
   - Click "Join Event"
   - Start chatting!

### Testing with Multiple Users

1. Open the test client in two browser windows
2. Register/login two different users (get two tokens)
3. Create an event with user 1
4. Register user 2 for the event (via API)
5. Both users join the event chat
6. Test real-time messaging and typing indicators

---

## Best Practices

1. **Always authenticate first** before sending any other messages
2. **Handle reconnection** - WebSocket can disconnect, implement reconnection logic
3. **Clean up on disconnect** - Leave rooms properly
4. **Handle errors gracefully** - Show user-friendly error messages
5. **Throttle typing indicators** - Don't send on every keystroke
6. **Limit message length** - Frontend validation before sending
7. **Show connection status** - Let users know if they're connected

---

## Security Notes

- JWT tokens are validated on every connection
- Users can only join events they're registered for
- Blocked users cannot connect
- All messages are validated before broadcasting
- Event permissions are checked server-side

---

## Performance

- Messages are limited to last 50 when joining (configurable)
- Typing indicators are not stored in database
- System messages for join/leave are stored
- WebSocket connections are cleaned up automatically on disconnect
