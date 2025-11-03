const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Message = require('../models/Message');

// @desc    Get all events (public catalog)
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { category, location, dateFrom, dateTo, search, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { status: 'approved', isPublic: true };

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const events = await Event.find(query)
      .populate('creator', 'name email avatar')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      count: events.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email avatar')
      .populate('participants', 'name email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res, next) => {
  try {
    req.body.creator = req.user.id;

    // Add image if uploaded
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    const event = await Event.create(req.body);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Add image if uploaded
    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check ownership
    if (event.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's created events
// @route   GET /api/events/my/created
// @access  Private
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ creator: req.user.id })
      .populate('participants', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's registered events
// @route   GET /api/events/my/registered
// @access  Private
exports.getRegisteredEvents = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ 
      user: req.user.id, 
      status: 'registered' 
    }).populate({
      path: 'event',
      populate: {
        path: 'creator',
        select: 'name email avatar'
      }
    });

    const events = registrations.map(reg => reg.event);

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if event is full
    if (event.participants.length >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: req.params.id,
      user: req.user.id,
      status: 'registered'
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Create registration
    const registration = await Registration.create({
      event: req.params.id,
      user: req.user.id
    });

    // Add user to participants
    event.participants.push(req.user.id);
    await event.save();

    // Create system message in chat
    await Message.create({
      event: req.params.id,
      user: req.user.id,
      content: `${req.user.name} joined the event`,
      type: 'system'
    });

    res.status(201).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unregister from event
// @route   POST /api/events/:id/unregister
// @access  Private
exports.unregisterFromEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const registration = await Registration.findOne({
      event: req.params.id,
      user: req.user.id,
      status: 'registered'
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Not registered for this event'
      });
    }

    // Update registration status
    registration.status = 'cancelled';
    await registration.save();

    // Remove user from participants
    event.participants = event.participants.filter(
      p => p.toString() !== req.user.id
    );
    await event.save();

    // Create system message
    await Message.create({
      event: req.params.id,
      user: req.user.id,
      content: `${req.user.name} left the event`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Unregistered successfully'
    });
  } catch (error) {
    next(error);
  }
};
