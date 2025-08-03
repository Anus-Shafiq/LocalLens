const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireAdmin 
} = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Validation rules
const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  body('estimatedResolutionTime')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for estimated resolution time')
];

const assignReportValidation = [
  body('assignedTo')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// @route   GET /api/admin/reports
// @desc    Get all reports for admin with advanced filtering
// @access  Private (Admin only)
router.get('/reports', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isIn(['road', 'water', 'electricity', 'cleanliness', 'streetlight', 'drainage', 'traffic', 'noise', 'construction', 'safety', 'other'])
    .withMessage('Invalid category filter'),
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority filter'),
  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid assigned user ID'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      status,
      category,
      priority,
      city,
      assignedTo,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (assignedTo) query.assignedTo = assignedTo;

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Text search
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }

    // Admin area filtering (if admin has specific area)
    if (req.user.adminArea) {
      query['location.city'] = new RegExp(req.user.adminArea, 'i');
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'name email phone avatar')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalReports = await Report.countDocuments(query);
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    res.json({
      message: 'Admin reports retrieved successfully',
      reports,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({
      message: 'Failed to retrieve reports',
      error: 'ADMIN_REPORTS_FETCH_ERROR'
    });
  }
});

// @route   PUT /api/admin/reports/:id/status
// @desc    Update report status
// @access  Private (Admin only)
router.put('/reports/:id/status', updateStatusValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, comment, estimatedResolutionTime } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Check if admin can manage this report (area-based access)
    if (req.user.adminArea && 
        !report.location.city.toLowerCase().includes(req.user.adminArea.toLowerCase())) {
      return res.status(403).json({
        message: 'Access denied - report outside your administrative area',
        error: 'AREA_ACCESS_DENIED'
      });
    }

    const oldStatus = report.status;
    report.status = status;

    if (estimatedResolutionTime) {
      report.estimatedResolutionTime = new Date(estimatedResolutionTime);
    }

    // Add to status history
    report.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      comment
    });

    // Add admin comment if provided
    if (comment) {
      report.adminComments.push({
        comment,
        commentedBy: req.user._id,
        commentedAt: new Date()
      });
    }

    await report.save();

    // Populate the updated report
    await report.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'statusHistory.changedBy', select: 'name' },
      { path: 'adminComments.commentedBy', select: 'name' }
    ]);

    res.json({
      message: 'Report status updated successfully',
      report,
      statusChanged: oldStatus !== status
    });

  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      message: 'Failed to update report status',
      error: 'STATUS_UPDATE_ERROR'
    });
  }
});

// @route   PUT /api/admin/reports/:id/assign
// @desc    Assign report to admin user
// @access  Private (Admin only)
router.put('/reports/:id/assign', assignReportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { assignedTo, comment } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Verify the assigned user exists and is an admin
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'admin') {
      return res.status(400).json({
        message: 'Invalid admin user for assignment',
        error: 'INVALID_ADMIN_USER'
      });
    }

    report.assignedTo = assignedTo;

    // Add admin comment about assignment
    const assignmentComment = comment || 
      `Report assigned to ${assignedUser.name} by ${req.user.name}`;

    report.adminComments.push({
      comment: assignmentComment,
      commentedBy: req.user._id,
      commentedAt: new Date()
    });

    // Update status to in_progress if it's pending
    if (report.status === 'pending') {
      report.status = 'in_progress';
      report.statusHistory.push({
        status: 'in_progress',
        changedBy: req.user._id,
        changedAt: new Date(),
        comment: 'Status updated due to assignment'
      });
    }

    await report.save();

    await report.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'adminComments.commentedBy', select: 'name' }
    ]);

    res.json({
      message: 'Report assigned successfully',
      report
    });

  } catch (error) {
    console.error('Assign report error:', error);
    res.status(500).json({
      message: 'Failed to assign report',
      error: 'REPORT_ASSIGN_ERROR'
    });
  }
});

// @route   POST /api/admin/reports/:id/comment
// @desc    Add admin comment to report
// @access  Private (Admin only)
router.post('/reports/:id/comment', [
  body('comment')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { comment } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    report.adminComments.push({
      comment,
      commentedBy: req.user._id,
      commentedAt: new Date()
    });

    await report.save();

    await report.populate('adminComments.commentedBy', 'name');

    res.json({
      message: 'Comment added successfully',
      comment: report.adminComments[report.adminComments.length - 1]
    });

  } catch (error) {
    console.error('Add admin comment error:', error);
    res.status(500).json({
      message: 'Failed to add comment',
      error: 'COMMENT_ADD_ERROR'
    });
  }
});

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    // Calculate date range based on timeframe
    let dateFrom = new Date();
    switch (timeframe) {
      case '7d':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case '30d':
        dateFrom.setDate(dateFrom.getDate() - 30);
        break;
      case '90d':
        dateFrom.setDate(dateFrom.getDate() - 90);
        break;
      case '1y':
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
      default:
        dateFrom.setDate(dateFrom.getDate() - 30);
    }

    // Base query for admin area
    const baseQuery = req.user.adminArea ? 
      { 'location.city': new RegExp(req.user.adminArea, 'i') } : {};

    // Overall statistics
    const totalStats = await Report.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgressReports: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          rejectedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    // Category breakdown
    const categoryStats = await Report.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent reports trend
    const trendQuery = { ...baseQuery, createdAt: { $gte: dateFrom } };
    const trendStats = await Report.aggregate([
      { $match: trendQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Priority distribution
    const priorityStats = await Report.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent activity (last 10 status changes)
    const recentActivity = await Report.find(baseQuery)
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('statusHistory.changedBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status statusHistory location.city updatedAt');

    // Top reporters
    const topReporters = await Report.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$reportedBy',
          reportCount: { $sum: 1 },
          resolvedCount: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          reportCount: 1,
          resolvedCount: 1
        }
      }
    ]);

    // Average resolution time
    const avgResolutionTime = await Report.aggregate([
      { 
        $match: { 
          ...baseQuery, 
          status: 'resolved', 
          resolvedAt: { $exists: true } 
        } 
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$resolvedAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$resolutionTime' }
        }
      }
    ]);

    res.json({
      message: 'Dashboard data retrieved successfully',
      dashboard: {
        overview: totalStats[0] || {
          totalReports: 0,
          pendingReports: 0,
          inProgressReports: 0,
          resolvedReports: 0,
          rejectedReports: 0
        },
        categoryBreakdown: categoryStats,
        priorityDistribution: priorityStats,
        recentTrend: trendStats,
        recentActivity,
        topReporters,
        averageResolutionTime: avgResolutionTime[0]?.avgDays || 0,
        timeframe,
        adminArea: req.user.adminArea || 'All Areas'
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      message: 'Failed to retrieve dashboard data',
      error: 'DASHBOARD_ERROR'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get users list for admin
// @access  Private (Admin only)
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Invalid role filter')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;

    // Text search
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / parseInt(limit));

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      message: 'Failed to retrieve users',
      error: 'USERS_FETCH_ERROR'
    });
  }
});

module.exports = router;