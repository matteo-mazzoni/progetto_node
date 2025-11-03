const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Event = require('../models/Event');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> { ws, eventRooms: Set }
    
    this.wss.on('connection', (ws, req) => this.handleConnection(ws, req));
    
    console.log('WebSocket server initialized');
  }

  async handleConnection(ws, req) {
    console.log('New WebSocket connection attempt');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await this.handleMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  async handleMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'auth':
        await this.handleAuth(ws, payload);
        break;

      case 'join_event':
        await this.handleJoinEvent(ws, payload);
        break;

      case 'leave_event':
        await this.handleLeaveEvent(ws, payload);
        break;

      case 'chat_message':
        await this.handleChatMessage(ws, payload);
        break;

      case 'typing':
        await this.handleTyping(ws, payload);
        break;

      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  async handleAuth(ws, payload) {
    try {
      const { token } = payload;

      if (!token) {
        return this.sendError(ws, 'Token required');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return this.sendError(ws, 'User not found');
      }

      if (user.isBlocked) {
        return this.sendError(ws, 'User is blocked');
      }

      // Store user connection
      ws.userId = user._id.toString();
      ws.userName = user.name;
      ws.eventRooms = new Set();

      this.clients.set(ws.userId, ws);

      // Send success response
      this.send(ws, {
        type: 'auth_success',
        payload: {
          userId: user._id,
          name: user.name
        }
      });

      console.log(`User ${user.name} authenticated via WebSocket`);
    } catch (error) {
      console.error('Auth error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  async handleJoinEvent(ws, payload) {
    try {
      const { eventId } = payload;

      if (!ws.userId) {
        return this.sendError(ws, 'Not authenticated');
      }

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return this.sendError(ws, 'Event not found');
      }

      // Check if user is participant or creator
      const isParticipant = event.participants.some(
        p => p.toString() === ws.userId
      );
      const isCreator = event.creator.toString() === ws.userId;

      if (!isParticipant && !isCreator) {
        return this.sendError(ws, 'Not registered for this event');
      }

      // Add to event room
      ws.eventRooms.add(eventId);

      // Notify others in the room
      this.broadcastToEvent(eventId, {
        type: 'user_joined',
        payload: {
          userId: ws.userId,
          userName: ws.userName,
          eventId
        }
      }, ws.userId);

      // Send success and recent messages
      const messages = await Message.find({ event: eventId })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      this.send(ws, {
        type: 'joined_event',
        payload: {
          eventId,
          messages: messages.toReversed()
        }
      });

      console.log(`User ${ws.userName} joined event ${eventId}`);
    } catch (error) {
      console.error('Join event error:', error);
      this.sendError(ws, 'Failed to join event');
    }
  }

  async handleLeaveEvent(ws, payload) {
    try {
      const { eventId } = payload;

      if (!ws.userId) {
        return this.sendError(ws, 'Not authenticated');
      }

      ws.eventRooms.delete(eventId);

      // Notify others
      this.broadcastToEvent(eventId, {
        type: 'user_left',
        payload: {
          userId: ws.userId,
          userName: ws.userName,
          eventId
        }
      }, ws.userId);

      this.send(ws, {
        type: 'left_event',
        payload: { eventId }
      });

      console.log(`User ${ws.userName} left event ${eventId}`);
    } catch (error) {
      console.error('Leave event error:', error);
      this.sendError(ws, 'Failed to leave event');
    }
  }

  async handleChatMessage(ws, payload) {
    try {
      const { eventId, content } = payload;

      if (!ws.userId) {
        return this.sendError(ws, 'Not authenticated');
      }

      if (!ws.eventRooms.has(eventId)) {
        return this.sendError(ws, 'Not in this event room');
      }

      // Save message to database
      const message = await Message.create({
        event: eventId,
        user: ws.userId,
        content,
        type: 'text'
      });

      const populatedMessage = await Message.findById(message._id)
        .populate('user', 'name avatar');

      // Broadcast to all users in the event room
      this.broadcastToEvent(eventId, {
        type: 'new_message',
        payload: {
          eventId,
          message: populatedMessage
        }
      });

      console.log(`Message sent in event ${eventId} by ${ws.userName}`);
    } catch (error) {
      console.error('Chat message error:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  async handleTyping(ws, payload) {
    try {
      const { eventId, isTyping } = payload;

      if (!ws.userId || !ws.eventRooms.has(eventId)) {
        return;
      }

      // Broadcast typing status (don't send to self)
      this.broadcastToEvent(eventId, {
        type: 'user_typing',
        payload: {
          eventId,
          userId: ws.userId,
          userName: ws.userName,
          isTyping
        }
      }, ws.userId);
    } catch (error) {
      console.error('Typing error:', error);
    }
  }

  handleDisconnect(ws) {
    if (ws.userId) {
      console.log(`User ${ws.userName} disconnected`);
      
      // Notify all rooms this user was in
      if (ws.eventRooms) {
        ws.eventRooms.forEach(eventId => {
          this.broadcastToEvent(eventId, {
            type: 'user_left',
            payload: {
              userId: ws.userId,
              userName: ws.userName,
              eventId
            }
          }, ws.userId);
        });
      }

      this.clients.delete(ws.userId);
    }
  }

  // Send notification to specific user
  notifyUser(userId, notification) {
    const client = this.clients.get(userId.toString());
    if (client && client.readyState === WebSocket.OPEN) {
      this.send(client, {
        type: 'notification',
        payload: notification
      });
    }
  }

  // Broadcast to all users in an event room
  broadcastToEvent(eventId, message, excludeUserId = null) {
    this.clients.forEach((client, userId) => {
      if (
        client.readyState === WebSocket.OPEN &&
        client.eventRooms?.has(eventId) &&
        userId !== excludeUserId
      ) {
        this.send(client, message);
      }
    });
  }

  // Broadcast to all connected users
  broadcastToAll(message, excludeUserId = null) {
    this.clients.forEach((client, userId) => {
      if (
        client.readyState === WebSocket.OPEN &&
        userId !== excludeUserId
      ) {
        this.send(client, message);
      }
    });
  }

  // Send message to specific WebSocket client
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Send error message
  sendError(ws, message) {
    this.send(ws, {
      type: 'error',
      payload: { message }
    });
  }

  // Notify event creator and participants of new registration
  notifyEventRegistration(eventId, event, newUser) {
    const notification = {
      type: 'event_registration',
      eventId,
      eventTitle: event.title,
      userName: newUser.name,
      userId: newUser._id,
      timestamp: new Date()
    };

    // Notify event creator
    this.notifyUser(event.creator, notification);

    // Notify all participants in the event room
    this.broadcastToEvent(eventId, {
      type: 'notification',
      payload: notification
    });
  }

  // Notify admins of new report
  notifyAdminsOfReport(report, event, reporter) {
    const notification = {
      type: 'new_report',
      reportId: report._id,
      eventId: event._id,
      eventTitle: event.title,
      reporterName: reporter.name,
      reason: report.reason,
      timestamp: new Date()
    };

    // Find all admin users and notify them
    User.find({ role: 'admin' }).then(admins => {
      admins.forEach(admin => {
        this.notifyUser(admin._id, notification);
      });
    });
  }
}

module.exports = WebSocketServer;
