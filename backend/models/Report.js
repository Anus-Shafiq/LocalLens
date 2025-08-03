const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    minlength: [20, 'Description must be at least 20 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'road',
      'water',
      'electricity',
      'cleanliness',
      'streetlight',
      'drainage',
      'traffic',
      'noise',
      'construction',
      'safety',
      'other'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String, // For Cloudinary
    caption: String
  }],
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'rejected']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    comment: String
  }],
  adminComments: [{
    comment: {
      type: String,
      required: true
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    commentedAt: {
      type: Date,
      default: Date.now
    }
  }],
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  resolvedAt: Date,
  estimatedResolutionTime: Date,
  tags: [String],
  metadata: {
    deviceInfo: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reportSchema.index({ status: 1 });
reportSchema.index({ category: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ 'location.city': 1 });
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ priority: 1, status: 1 });

// Compound indexes
reportSchema.index({ status: 1, category: 1 });
reportSchema.index({ 'location.city': 1, status: 1 });

// Virtual for upvote count
reportSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

// Virtual for days since reported
reportSchema.virtual('daysSinceReported').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to update status history
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date()
    });
    
    if (this.status === 'resolved') {
      this.resolvedAt = new Date();
    }
  }
  next();
});

// Static method to get reports by area
reportSchema.statics.getReportsByArea = function(city, status = null) {
  const query = { 'location.city': new RegExp(city, 'i') };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get reports statistics
reportSchema.statics.getStatistics = function(city = null) {
  const matchStage = city ? { 'location.city': new RegExp(city, 'i') } : {};
  
  return this.aggregate([
    { $match: matchStage },
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
        },
        categoryBreakdown: {
          $push: '$category'
        }
      }
    }
  ]);
};

// Instance method to check if user can edit
reportSchema.methods.canEdit = function(userId, userRole) {
  return userRole === 'admin' || this.reportedBy.toString() === userId.toString();
};

// Instance method to add upvote
reportSchema.methods.addUpvote = function(userId) {
  const existingVote = this.upvotes.find(vote => 
    vote.user.toString() === userId.toString()
  );
  
  if (!existingVote) {
    this.upvotes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove upvote
reportSchema.methods.removeUpvote = function(userId) {
  this.upvotes = this.upvotes.filter(vote => 
    vote.user.toString() !== userId.toString()
  );
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);