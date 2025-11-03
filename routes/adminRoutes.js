const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Admin
router.put('/users/:id/block', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot block admin users'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all events (including pending)
// @route   GET /api/admin/events
// @access  Admin
router.get('/events', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const events = await Event.find(query)
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve/Reject event
// @route   PUT /api/admin/events/:id/status
// @access  Admin
router.put('/events/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either approved or rejected'
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event,
      message: `Event ${status} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
// @access  Admin
router.delete('/events/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
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
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Admin
router.get('/reports', async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const reports = await Report.find(query)
      .populate('event', 'title')
      .populate('reporter', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Admin
router.put('/reports/:id', async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['reviewed', 'resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either reviewed or resolved'
      });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('event', 'title')
     .populate('reporter', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create report for event
// @route   POST /api/admin/reports
// @access  Private (any authenticated user)
router.post('/reports', protect, async (req, res, next) => {
  try {
    const { event, reason, description } = req.body;

    const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const report = await Report.create({
      event,
      reporter: req.user.id,
      reason,
      description
    });

    // Notify admins via WebSocket
    const wsServer = req.app.get('wsServer');
    if (wsServer) {
      wsServer.notifyAdminsOfReport(report, eventExists, req.user);
    }

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
