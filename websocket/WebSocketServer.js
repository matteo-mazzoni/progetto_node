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
    console.log('New WebSocket connection attempt from:', req.socket.remoteAddress);

    ws.on('message', async (message) => {
      try {
        console.log('Received WebSocket message:', message.toString());
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
      console.log('WebSocket: Handling authentication...');

      if (!token) {
        console.log('WebSocket: No token provided');
        return this.sendError(ws, 'Token required');
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        console.log('WebSocket: User not found for token');
        return this.sendError(ws, 'User not found');
      }

      if (user.isBlocked) {
        console.log(`WebSocket: User ${user.name} is blocked`);
        return this.sendError(ws, 'User is blocked');
      }

      // Store user connection
      ws.userId = user._id.toString();
      ws.userName = user.name;
      ws.eventRooms = new Set();

      this.clients.set(ws.userId, ws);
      console.log(`WebSocket: User ${user.name} (${ws.userId}) authenticated successfully`);

      // Send success response
      this.send(ws, {
        type: 'auth_success',
        payload: {
          userId: user._id,
          name: user.name
        }
      });

      console.log(`WebSocket: Auth success message sent to ${user.name}`);
    } catch (error) {
      console.error('WebSocket: Auth error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  async handleJoinEvent(ws, payload) {
    try {
      const { eventId } = payload;
      console.log(`WebSocket: User ${ws.userName} (${ws.userId}) trying to join event ${eventId}`);

      if (!ws.userId) {
        console.log('WebSocket: User not authenticated for join event');
        return this.sendError(ws, 'Not authenticated');
      }

      // Check if event exists
      console.log(`WebSocket: Looking up event ${eventId}...`);
      const event = await Event.findById(eventId);
      if (!event) {
        console.log(`WebSocket: Event ${eventId} not found`);
        return this.sendError(ws, 'Event not found');
      }

      console.log(`WebSocket: Event found: ${event.title}`);
      console.log(`WebSocket: Event creator: ${event.creator}`);
      console.log(`WebSocket: Event participants:`, event.participants);
      console.log(`WebSocket: User ID: ${ws.userId}`);

      // Check if user is participant or creator
      const isParticipant = event.participants.some(
        p => p.toString() === ws.userId
      );
      const isCreator = event.creator.toString() === ws.userId;

      console.log(`WebSocket: Is participant: ${isParticipant}`);
      console.log(`WebSocket: Is creator: ${isCreator}`);

      // Allow read-only access for non-participants
      if (!isParticipant && !isCreator) {
        ws.isReadOnly = true;
        console.log(`WebSocket: User ${ws.userName} joined event ${eventId} in read-only mode`);
      } else {
        ws.isReadOnly = false;
        console.log(`WebSocket: User ${ws.userName} joined event ${eventId} with full access`);
      }

      // Add to event room
      ws.eventRooms.add(eventId);
      console.log(`WebSocket: Added user ${ws.userName} to event room ${eventId}`);
      console.log(`WebSocket: User event rooms:`, Array.from(ws.eventRooms));

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

      console.log(`WebSocket: Found ${messages.length} messages for event ${eventId}`);

      this.send(ws, {
        type: 'joined_event',
        payload: {
          eventId,
          messages: messages.toReversed(),
          isReadOnly: ws.isReadOnly
        }
      });

      console.log(`WebSocket: Join event success message sent to ${ws.userName}`);
    } catch (error) {
      console.error('WebSocket: Join event error:', error);
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
      console.log(`WebSocket: Handling chat message from ${ws.userName} for event ${eventId}`);
      console.log(`WebSocket: Message content: "${content}"`);

      if (!ws.userId) {
        console.log('WebSocket: User not authenticated');
        return this.sendError(ws, 'Not authenticated');
      }

      if (!ws.eventRooms.has(eventId)) {
        console.log(`WebSocket: User ${ws.userName} not in event room ${eventId}`);
        return this.sendError(ws, 'Not in this event room');
      }

      // Check if user is in read-only mode
      if (ws.isReadOnly) {
        console.log(`WebSocket: User ${ws.userName} is in read-only mode`);
        return this.sendError(ws, 'You must register for this event to send messages');
      }

      console.log('WebSocket: Saving message to database...');
      // Save message to database
      const message = await Message.create({
        event: eventId,
        user: ws.userId,
        content,
        type: 'text'
      });
      console.log('WebSocket: Message saved with ID:', message._id);

      const populatedMessage = await Message.findById(message._id)
        .populate('user', 'name avatar');
      console.log('WebSocket: Populated message:', populatedMessage);

      // Broadcast to all users in the event room (including sender)
      console.log('WebSocket: Broadcasting message to event room...');
      this.broadcastToEvent(eventId, {
        type: 'new_message',
        payload: {
          eventId,
          message: populatedMessage
        }
      });

      console.log(`WebSocket: Message broadcast completed for event ${eventId}`);
    } catch (error) {
      console.error('WebSocket: Chat message error:', error);
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
    console.log(`WebSocket: Broadcasting to event ${eventId}, excluding user: ${excludeUserId}`);
    let sentCount = 0;
    
    this.clients.forEach((client, userId) => {
      console.log(`WebSocket: Checking client ${userId}, readyState: ${client.readyState}, has eventRoom: ${client.eventRooms?.has(eventId)}`);
      
      if (
        client.readyState === WebSocket.OPEN &&
        client.eventRooms?.has(eventId) &&
        userId !== excludeUserId
      ) {
        this.send(client, message);
        sentCount++;
        console.log(`WebSocket: Message sent to user ${userId}`);
      }
    });
    
    console.log(`WebSocket: Broadcast completed, sent to ${sentCount} clients`);
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
