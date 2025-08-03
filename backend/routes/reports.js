const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Report = require('../models/Report');
const User = require('../models/User');
const { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrOwner,
  optionalAuth 
} = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createReportValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Description must be between 20 and 1000 characters'),
  body('category')
    .isIn(['road', 'water', 'electricity', 'cleanliness', 'streetlight', 'drainage', 'traffic', 'noise', 'construction', 'safety', 'other'])
    .withMessage('Invalid category'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Address is required'),
  body('location.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority level')
];

const updateStatusValidation = [
  body('status')
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
];

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post('/', authenticateToken, createReportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      location,
      images,
      priority,
      tags,
      isPublic
    } = req.body;

    // Create new report
    const report = new Report({
      title,
      description,
      category,
      location,
      images: images || [],
      priority: priority || 'medium',
      tags: tags || [],
      isPublic: isPublic !== false, // Default to true
      reportedBy: req.user._id,
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    await report.save();

    // Populate the report with user details
    await report.populate('reportedBy', 'name email');

    res.status(201).json({
      message: 'Report created successfully',
      report
    });

  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      message: 'Failed to create report',
      error: 'REPORT_CREATE_ERROR'
    });
  }
});

// @route   GET /api/reports
// @desc    Get reports with filtering and pagination
// @access  Public (with optional auth for personalized results)
router.get('/', optionalAuth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Invalid status filter'),
  query('category')
    .optional()
    .isIn(['road', 'water', 'electricity', 'cleanliness', 'streetlight', 'drainage', 'traffic', 'noise', 'construction', 'safety', 'other'])
    .withMessage('Invalid category filter'),
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'priority', 'upvoteCount'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
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
      limit = 10,
      status,
      category,
      city,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build query
    const query = { isPublic: true };

    if (status) query.status = status;
    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (priority) query.priority = priority;

    // Text search
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.address': new RegExp(search, 'i') }
      ];
    }

    // Sorting
    const sortOptions = {};
    if (sortBy === 'upvoteCount') {
      // For upvote count, we need to use aggregation
      sortOptions['upvoteCount'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await Report.find(query)
      .populate('reportedBy', 'name avatar')
      .populate('assignedTo', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Add upvote count and user's vote status
    const reportsWithMetadata = reports.map(report => ({
      ...report,
      upvoteCount: report.upvotes?.length || 0,
      hasUserUpvoted: req.user ? 
        report.upvotes?.some(vote => vote.user.toString() === req.user._id.toString()) : 
        false
    }));

    // Get total count for pagination
    const totalReports = await Report.countDocuments(query);
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    res.json({
      message: 'Reports retrieved successfully',
      reports: reportsWithMetadata,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      message: 'Failed to retrieve reports',
      error: 'REPORTS_FETCH_ERROR'
    });
  }
});

// @route   GET /api/reports/my-reports
// @desc    Get current user's reports
// @access  Private
router.get('/my-reports', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { reportedBy: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Report.find(query)
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReports = await Report.countDocuments(query);
    const totalPages = Math.ceil(totalReports / parseInt(limit));

    // Get user's report statistics
    const stats = await Report.aggregate([
      { $match: { reportedBy: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    res.json({
      message: 'User reports retrieved successfully',
      reports,
      statistics: stats[0] || { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({
      message: 'Failed to retrieve user reports',
      error: 'USER_REPORTS_FETCH_ERROR'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report by ID
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email avatar')
      .populate('assignedTo', 'name email')
      .populate('statusHistory.changedBy', 'name')
      .populate('adminComments.commentedBy', 'name');

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Check if user can view this report
    if (!report.isPublic && (!req.user || 
        (req.user._id.toString() !== report.reportedBy._id.toString() && 
         req.user.role !== 'admin'))) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    // Add metadata
    const reportData = report.toObject();
    reportData.upvoteCount = report.upvotes.length;
    reportData.hasUserUpvoted = req.user ? 
      report.upvotes.some(vote => vote.user.toString() === req.user._id.toString()) : 
      false;

    res.json({
      message: 'Report retrieved successfully',
      report: reportData
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      message: 'Failed to retrieve report',
      error: 'REPORT_FETCH_ERROR'
    });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report (user can update their own, admin can update any)
// @access  Private
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Check permissions
    if (!report.canEdit(req.user._id, req.user.role)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const { title, description, category, location, images, priority, tags, isPublic } = req.body;

    // Users can only update certain fields, admins can update more
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (location) updateData.location = location;
    if (images) updateData.images = images;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name email');

    res.json({
      message: 'Report updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      message: 'Failed to update report',
      error: 'REPORT_UPDATE_ERROR'
    });
  }
});

// @route   POST /api/reports/:id/upvote
// @desc    Toggle upvote on a report
// @access  Private
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    const hasUpvoted = report.upvotes.some(vote => 
      vote.user.toString() === req.user._id.toString()
    );

    if (hasUpvoted) {
      // Remove upvote
      await report.removeUpvote(req.user._id);
      res.json({
        message: 'Upvote removed',
        upvoted: false,
        upvoteCount: report.upvotes.length
      });
    } else {
      // Add upvote
      await report.addUpvote(req.user._id);
      res.json({
        message: 'Report upvoted',
        upvoted: true,
        upvoteCount: report.upvotes.length
      });
    }

  } catch (error) {
    console.error('Toggle upvote error:', error);
    res.status(500).json({
      message: 'Failed to toggle upvote',
      error: 'UPVOTE_ERROR'
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report (user can delete their own, admin can delete any)
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        message: 'Report not found',
        error: 'REPORT_NOT_FOUND'
      });
    }

    // Check permissions
    if (!report.canEdit(req.user._id, req.user.role)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      message: 'Failed to delete report',
      error: 'REPORT_DELETE_ERROR'
    });
  }
});

module.exports = router;