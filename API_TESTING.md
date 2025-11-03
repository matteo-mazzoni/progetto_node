# EventHub API Testing Guide

This file contains example requests to test the EventHub API.
You can use **Thunder Client** (VS Code extension), **Postman**, or **curl**.

## Base URL
```
http://localhost:3000
```

---

## 1. AUTHENTICATION

### Register a new user
**POST** `/api/auth/register`

**Body (JSON):**
```json
{
  "name": "Mario Rossi",
  "email": "mario.rossi@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Mario Rossi",
    "email": "mario.rossi@example.com",
    "role": "user",
    "isVerified": false
  }
}
```

---

### Login
**POST** `/api/auth/login`

**Body (JSON):**
```json
{
  "email": "mario.rossi@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

> **IMPORTANT**: Copy the `token` from the response. You'll need it for protected endpoints!

---

### Get current user info
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Mario Rossi",
    "email": "mario.rossi@example.com",
    "role": "user",
    "isBlocked": false,
    "isVerified": false,
    "createdAt": "2025-11-03T..."
  }
}
```

---

## 2. EVENTS

### Get all public events
**GET** `/api/events`

**Query Parameters (optional):**
- `category` - Filter by category (music, sports, technology, art, food, education, business, other)
- `location` - Filter by location (partial match)
- `dateFrom` - Filter events from this date (ISO format)
- `dateTo` - Filter events until this date
- `search` - Text search in title/description
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Example:**
```
GET /api/events?category=music&page=1&limit=5
```

**Expected Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 23,
  "totalPages": 5,
  "currentPage": 1,
  "data": [ ... ]
}
```

---

### Create a new event
**POST** `/api/events`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Rock Concert 2025",
  "description": "Amazing rock concert with local bands",
  "date": "2025-12-15T20:00:00.000Z",
  "location": "Milan, Italy",
  "category": "music",
  "capacity": 500
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Rock Concert 2025",
    "description": "Amazing rock concert with local bands",
    "date": "2025-12-15T20:00:00.000Z",
    "location": "Milan, Italy",
    "category": "music",
    "capacity": 500,
    "status": "approved",
    "isPublic": true,
    "participants": [],
    "creator": "..."
  }
}
```

---

### Upload event with image
**POST** `/api/events`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `title`: "Tech Conference 2025"
- `description`: "Annual tech conference"
- `date`: "2025-12-20T09:00:00.000Z"
- `location`: "Rome, Italy"
- `category`: "technology"
- `capacity`: 200
- `image`: [Select image file]

---

### Get single event
**GET** `/api/events/:eventId`

**Example:**
```
GET /api/events/673728f4a1b2c3d4e5f67890
```

---

### Register for an event
**POST** `/api/events/:eventId/register`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Example:**
```
POST /api/events/673728f4a1b2c3d4e5f67890/register
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "event": "673728f4a1b2c3d4e5f67890",
    "user": "...",
    "status": "registered",
    "registeredAt": "2025-11-03T..."
  }
}
```

---

### Unregister from an event
**POST** `/api/events/:eventId/unregister`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Get my created events
**GET** `/api/events/my/created`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Get events I'm registered for
**GET** `/api/events/my/registered`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### Update an event
**PUT** `/api/events/:eventId`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Updated Event Title",
  "capacity": 600
}
```

---

### Delete an event
**DELETE** `/api/events/:eventId`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 3. CHAT

### Get messages for an event
**GET** `/api/chat/:eventId`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "...",
      "event": "...",
      "user": {
        "_id": "...",
        "name": "Mario Rossi",
        "avatar": null
      },
      "content": "Hello everyone!",
      "type": "text",
      "createdAt": "2025-11-03T..."
    }
  ]
}
```

---

### Send a message
**POST** `/api/chat/:eventId`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "content": "Looking forward to this event!"
}
```

---

## 4. ADMIN ENDPOINTS

> **Note**: These endpoints require an admin account. 
> Create an admin user by manually updating a user in MongoDB Compass:
> Set `role: "admin"` for a user document.

### Get all users
**GET** `/api/admin/users`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

---

### Block/Unblock a user
**PUT** `/api/admin/users/:userId/block`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Expected Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "User blocked successfully"
}
```

---

### Get all events (including pending)
**GET** `/api/admin/events`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, cancelled)

---

### Approve/Reject event
**PUT** `/api/admin/events/:eventId/status`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "status": "approved"
}
```
OR
```json
{
  "status": "rejected"
}
```

---

### Get all reports
**GET** `/api/admin/reports`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
```

---

### Create a report (any user)
**POST** `/api/admin/reports`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "event": "673728f4a1b2c3d4e5f67890",
  "reason": "inappropriate",
  "description": "This event contains offensive content"
}
```

**Reason options:**
- `inappropriate`
- `spam`
- `misleading`
- `offensive`
- `other`

---

### Update report status (admin)
**PUT** `/api/admin/reports/:reportId`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN_HERE
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "status": "resolved",
  "reviewNotes": "Event has been reviewed and removed"
}
```

---

## 5. TESTING WORKFLOW

### Step-by-step test:

1. **Register a user**
   - POST `/api/auth/register`
   - Save the token

2. **Create an event**
   - POST `/api/events` with your token
   - Save the event ID

3. **Register another user**
   - POST `/api/auth/register` with different email
   - Save the second token

4. **Second user registers for the event**
   - POST `/api/events/:eventId/register` with second token

5. **Send a chat message**
   - POST `/api/chat/:eventId` with second token

6. **First user checks chat**
   - GET `/api/chat/:eventId` with first token

7. **Check registered events**
   - GET `/api/events/my/registered` with second token

8. **Create admin user** (in MongoDB Compass)
   - Find your first user
   - Change `role` from "user" to "admin"

9. **Test admin endpoints**
   - GET `/api/admin/users` with admin token
   - GET `/api/admin/events` with admin token

---

## Tips

- Use **Thunder Client** VS Code extension for easy testing
- Keep your tokens in variables in Thunder Client
- Check MongoDB Compass to see data being created
- The server auto-reloads when you make code changes (nodemon)
- Check server logs in terminal for debugging

---

## Common Errors

### 401 Unauthorized
- Missing or invalid token
- Token expired (default: 7 days)

### 403 Forbidden
- User doesn't have permission (not admin)
- User account is blocked

### 404 Not Found
- Invalid ID
- Resource doesn't exist

### 400 Bad Request
- Missing required fields
- Validation errors
- Already registered for event
- Event is full
