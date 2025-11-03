# EventHub Backend API

Event management platform with real-time chat and notifications built with Node.js, Express, MongoDB, and WebSocket.

## Features

- ✅ User authentication with JWT
- ✅ Role-based access control (User/Admin)
- ✅ Event creation and management
- ✅ Event registration system
- ✅ Real-time chat per event
- ✅ Email notifications
- ✅ Admin panel for moderation
- ✅ File upload for event images
- ✅ Advanced filtering and search

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket (ws)
- **Email**: Nodemailer
- **File Upload**: Multer
- **Security**: Helmet, express-rate-limit

## Installation

1. Clone the repository:
```bash
git clone https://github.com/matteo-mazzoni/progetto_node.git
cd progetto_node
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
copy .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/eventhub
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

5. Start MongoDB (make sure MongoDB is installed and running)

6. Run the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user
- `PUT /updatedetails` - Update user details
- `PUT /updatepassword` - Update password
- `POST /forgotpassword` - Request password reset
- `PUT /resetpassword/:token` - Reset password
- `GET /verify/:token` - Verify email

### Events (`/api/events`)
- `GET /` - Get all public events (with filters)
- `GET /:id` - Get single event
- `POST /` - Create event (protected)
- `PUT /:id` - Update event (protected)
- `DELETE /:id` - Delete event (protected)
- `GET /my/created` - Get user's created events (protected)
- `GET /my/registered` - Get user's registered events (protected)
- `POST /:id/register` - Register for event (protected)
- `POST /:id/unregister` - Unregister from event (protected)

### Chat (`/api/chat`)
- `GET /:eventId` - Get event messages (protected)
- `POST /:eventId` - Send message (protected)

### Admin (`/api/admin`)
- `GET /users` - Get all users (admin)
- `PUT /users/:id/block` - Block/unblock user (admin)
- `GET /events` - Get all events (admin)
- `PUT /events/:id/status` - Approve/reject event (admin)
- `DELETE /events/:id` - Delete event (admin)
- `GET /reports` - Get all reports (admin)
- `PUT /reports/:id` - Update report status (admin)
- `POST /reports` - Create report (protected)

## Project Structure

```
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── eventController.js   # Event management logic
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Global error handler
│   └── upload.js            # File upload configuration
├── models/
│   ├── User.js              # User model
│   ├── Event.js             # Event model
│   ├── Registration.js      # Registration model
│   ├── Message.js           # Chat message model
│   └── Report.js            # Report model
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── eventRoutes.js       # Event endpoints
│   ├── chatRoutes.js        # Chat endpoints
│   └── adminRoutes.js       # Admin endpoints
├── utils/
│   ├── auth.js              # JWT utilities
│   └── email.js             # Email utilities
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── server.js                # Main server file
```

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Success Responses

Successful responses follow this format:

```json
{
  "success": true,
  "data": { },
  "message": "Optional message"
}
```

## License

ISC
