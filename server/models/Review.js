const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Review must belong to a product']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Review must belong to a user']
  },
  order: {
    type: mongoose.Schema.ObjectId,
    ref: 'Order',
    required: [true, 'Review must be from a purchase']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    maxlength: [100, 'Review title cannot exceed 100 characters'],
    trim: true
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    trim: true
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  pros: [String],
  cons: [String],
  recommendations: {
    wouldRecommend: {
      type: Boolean,
      default: true
    },
    recommendedFor: [String] // e.g., ['families', 'professionals', 'students']
  },
  verified: {
    type: Boolean,
    default: false
  },
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      helpful: {
        type: Boolean,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  responses: [{
    type: {
      type: String,
      enum: ['vendor', 'admin'],
      required: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationNotes: {
    reason: String,
    moderatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date
  },
  flags: [{
    reason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'offensive', 'other'],
      required: true
    },
    description: String,
    flaggedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    flaggedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sentiment: {
    score: {
      type: Number,
      min: [-1, 'Sentiment score cannot be less than -1'],
      max: [1, 'Sentiment score cannot exceed 1']
    },
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    }
  },
  tags: [String], // Auto-generated tags based on content analysis
  featured: {
    type: Boolean,
    default: false
  },
  incentivized: {
    type: Boolean,
    default: false // If review was incentivized (discount, etc.)
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ verified: 1 });
reviewSchema.index({ featured: 1 });
reviewSchema.index({ 'helpful.count': -1 });

// Compound index to ensure one review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Virtual for helpful percentage
reviewSchema.virtual('helpfulPercentage').get(function() {
  if (this.helpful.users.length === 0) return 0;
  const helpfulCount = this.helpful.users.filter(u => u.helpful).length;
  return Math.round((helpfulCount / this.helpful.users.length) * 100);
});

// Virtual for review age in days
reviewSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for review quality score (based on length, images, etc.)
reviewSchema.virtual('qualityScore').get(function() {
  let score = 0;
  
  // Base score for having a review
  score += 10;
  
  // Length bonus
  if (this.comment.length > 100) score += 10;
  if (this.comment.length > 300) score += 10;
  
  // Image bonus
  score += this.images.length * 15;
  
  // Pros/cons bonus
  if (this.pros.length > 0) score += 10;
  if (this.cons.length > 0) score += 10;
  
  // Helpful votes bonus
  score += Math.min(this.helpful.count * 2, 20);
  
  // Verification bonus
  if (this.verified) score += 20;
  
  return Math.min(score, 100);
});

// Pre-save middleware to set verification status
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.order) {
    const Order = mongoose.model('Order');
    const order = await Order.findById(this.order);
    
    if (order && order.user.toString() === this.user.toString()) {
      // Check if the product was actually in the order and delivered
      const productInOrder = order.items.some(item => 
        item.product.toString() === this.product.toString()
      );
      
      if (productInOrder && order.status === 'delivered') {
        this.verified = true;
      }
    }
  }
  next();
});

// Pre-save middleware to calculate sentiment (simplified)
reviewSchema.pre('save', function(next) {
  if (this.isModified('comment') || this.isModified('title')) {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const text = (this.title + ' ' + this.comment).toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) {
      this.sentiment = { score: 0.5, label: 'positive' };
    } else if (negativeCount > positiveCount) {
      this.sentiment = { score: -0.5, label: 'negative' };
    } else {
      this.sentiment = { score: 0, label: 'neutral' };
    }
  }
  next();
});

// Post-save middleware to update product rating
reviewSchema.post('save', async function(doc) {
  try {
    const Product = mongoose.model('Product');
    await Product.findById(doc.product).then(product => {
      if (product) {
        product.updateRating(doc.rating);
      }
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
});

// Post-remove middleware to update product rating
reviewSchema.post('remove', async function(doc) {
  try {
    const Product = mongoose.model('Product');
    const product = await Product.findById(doc.product);
    
    if (product) {
      // Recalculate rating after removing this review
      const reviews = await this.constructor.find({ 
        product: doc.product, 
        status: 'approved' 
      });
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        product.rating.average = Number(avgRating.toFixed(1));
        product.rating.count = reviews.length;
      } else {
        product.rating.average = 0;
        product.rating.count = 0;
      }
      
      await product.save();
    }
  } catch (error) {
    console.error('Error updating product rating after review removal:', error);
  }
});

// Static method to get reviews by product
reviewSchema.statics.getProductReviews = function(productId, options = {}) {
  const {
    page = 1,
    limit = 10,
    sort = '-createdAt',
    rating,
    verified,
    withImages
  } = options;

  const query = { 
    product: productId, 
    status: 'approved' 
  };
  
  if (rating) {
    query.rating = rating;
  }
  
  if (verified !== undefined) {
    query.verified = verified;
  }
  
  if (withImages) {
    query['images.0'] = { $exists: true };
  }

  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get review statistics for a product
reviewSchema.statics.getProductReviewStats = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { 
        product: mongoose.Types.ObjectId(productId),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        },
        verifiedReviews: {
          $sum: { $cond: ['$verified', 1, 0] }
        },
        reviewsWithImages: {
          $sum: { $cond: [{ $gt: [{ $size: '$images' }, 0] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalReviews: 1,
        averageRating: { $round: ['$averageRating', 1] },
        verifiedPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$verifiedReviews', '$totalReviews'] }, 100] },
            1
          ]
        },
        imageReviewsPercentage: {
          $round: [
            { $multiply: [{ $divide: ['$reviewsWithImages', '$totalReviews'] }, 100] },
            1
          ]
        },
        ratingDistribution: {
          5: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 5] } } } },
          4: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 4] } } } },
          3: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 3] } } } },
          2: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 2] } } } },
          1: { $size: { $filter: { input: '$ratingDistribution', cond: { $eq: ['$$this', 1] } } } }
        }
      }
    }
  ]);

  return stats[0] || {
    totalReviews: 0,
    averageRating: 0,
    verifiedPercentage: 0,
    imageReviewsPercentage: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

// Method to mark review as helpful/unhelpful
reviewSchema.methods.markHelpful = function(userId, helpful = true) {
  // Remove existing vote from this user
  this.helpful.users = this.helpful.users.filter(
    vote => vote.user.toString() !== userId.toString()
  );
  
  // Add new vote
  this.helpful.users.push({
    user: userId,
    helpful: helpful,
    date: new Date()
  });
  
  // Update helpful count
  this.helpful.count = this.helpful.users.filter(vote => vote.helpful).length;
  
  return this.save();
};

// Method to add vendor/admin response
reviewSchema.methods.addResponse = function(responseData) {
  this.responses.push({
    ...responseData,
    date: new Date()
  });
  
  return this.save();
};

// Method to flag review
reviewSchema.methods.flagReview = function(flagData) {
  this.flags.push({
    ...flagData,
    flaggedAt: new Date()
  });
  
  // Auto-moderate if multiple flags
  if (this.flags.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

// Method to moderate review
reviewSchema.methods.moderate = function(status, moderatorId, reason = '') {
  this.status = status;
  this.moderationNotes = {
    reason,
    moderatedBy: moderatorId,
    moderatedAt: new Date()
  };
  
  return this.save();
};

// Static method to get reviews needing moderation
reviewSchema.statics.getReviewsForModeration = function(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = 'pending'
  } = options;

  return this.find({ 
    $or: [
      { status: status },
      { flags: { $exists: true, $not: { $size: 0 } } }
    ]
  })
  .populate('product', 'name images')
  .populate('user', 'firstName lastName')
  .sort({ createdAt: -1 })
  .limit(limit * 1)
  .skip((page - 1) * limit);
};

// Static method to get featured reviews
reviewSchema.statics.getFeaturedReviews = function(limit = 10) {
  return this.find({ 
    featured: true, 
    status: 'approved' 
  })
  .populate('product', 'name images')
  .populate('user', 'firstName lastName avatar')
  .sort({ 'helpful.count': -1, createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Review', reviewSchema);