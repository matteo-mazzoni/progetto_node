const express = require('express');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// @desc    Get messages for an event
// @route   GET /api/chat/:eventId
// @access  Private (only participants)
router.get('/:eventId', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is participant or creator
    const isParticipant = event.participants.includes(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;

    if (!isParticipant && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to view messages'
      });
    }

    const messages = await Message.find({ event: req.params.eventId })
      .populate('user', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Send a message to event chat
// @route   POST /api/chat/:eventId
// @access  Private (only participants)
router.post('/:eventId', protect, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is participant or creator
    const isParticipant = event.participants.includes(req.user.id);
    const isCreator = event.creator.toString() === req.user.id;

    if (!isParticipant && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'You must be registered for this event to send messages'
      });
    }

    const message = await Message.create({
      event: req.params.eventId,
      user: req.user.id,
      content: req.body.content,
      type: 'text'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
