const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    image: {
      public_id: String,
      url: String
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    sku: String,
    category: String,
    brand: String,
    specifications: {
      size: String,
      color: String,
      variant: String
    }
  }],
  shippingAddress: {
    fullName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: String,
    landmark: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'India'
    },
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    }
  },
  billingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    },
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      amount: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0
      }
    },
    shipping: {
      amount: {
        type: Number,
        default: 0
      },
      free: {
        type: Boolean,
        default: false
      }
    },
    discount: {
      amount: {
        type: Number,
        default: 0
      },
      coupon: {
        code: String,
        description: String
      }
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cod', 'card', 'upi', 'netbanking', 'wallet'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    stripePaymentIntentId: String,
    paidAt: Date,
    failureReason: String
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out-for-delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'pending'
  },
  tracking: {
    trackingNumber: String,
    carrier: String,
    trackingUrl: String,
    estimatedDelivery: Date,
    actualDelivery: Date,
    updates: [{
      status: String,
      description: String,
      location: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  timeline: [{
    status: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  delivery: {
    type: {
      type: String,
      enum: ['standard', 'express', 'same-day'],
      default: 'standard'
    },
    slot: {
      date: Date,
      timeStart: String,
      timeEnd: String
    },
    instructions: String,
    contactless: {
      type: Boolean,
      default: false
    }
  },
  cancellation: {
    reason: String,
    description: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    refundAmount: Number
  },
  return: {
    reason: String,
    description: String,
    images: [{
      public_id: String,
      url: String
    }],
    requestedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'picked-up', 'completed']
    },
    refundAmount: Number
  },
  notes: {
    customer: String,
    internal: String
  },
  loyaltyPoints: {
    earned: {
      type: Number,
      default: 0
    },
    used: {
      type: Number,
      default: 0
    }
  },
  invoice: {
    number: String,
    url: String,
    generatedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'payment.method': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'shippingAddress.pincode': 1 });

// Virtual for order value categories
orderSchema.virtual('valueCategory').get(function() {
  if (this.pricing.total >= 10000) return 'high';
  if (this.pricing.total >= 5000) return 'medium';
  return 'low';
});

// Virtual for days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for delivery status
orderSchema.virtual('deliveryStatus').get(function() {
  if (this.status === 'delivered') return 'delivered';
  if (this.tracking.estimatedDelivery && this.tracking.estimatedDelivery < new Date()) {
    return 'delayed';
  }
  return 'on-time';
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get the count of orders for today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    
    const todayOrdersCount = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    });
    
    const sequence = (todayOrdersCount + 1).toString().padStart(4, '0');
    this.orderNumber = `JM${year}${month}${day}${sequence}`;
  }
  next();
});

// Pre-save middleware to add timeline entry
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.timeline.push({
      status: this.status,
      description: `Order status changed to ${this.status}`,
      timestamp: new Date()
    });
  }
  next();
});

// Pre-save middleware to set billing address same as shipping if required
orderSchema.pre('save', function(next) {
  if (this.billingAddress && this.billingAddress.sameAsShipping) {
    this.billingAddress = {
      ...this.shippingAddress,
      sameAsShipping: true
    };
  }
  next();
});

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(status, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    user,
    startDate,
    endDate
  } = options;

  const query = { status };
  
  if (user) {
    query.user = user;
  }
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  return this.find(query)
    .populate('user', 'firstName lastName email phone')
    .populate('items.product', 'name images category brand')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to get sales analytics
orderSchema.statics.getSalesAnalytics = async function(period = 'month') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const analytics = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'shipped', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        totalItems: { $sum: { $size: '$items' } }
      }
    }
  ]);

  return analytics[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalItems: 0
  };
};

// Method to calculate estimated delivery
orderSchema.methods.calculateEstimatedDelivery = function() {
  const baseDeliveryDays = {
    'standard': 5,
    'express': 2,
    'same-day': 0
  };
  
  const days = baseDeliveryDays[this.delivery.type] || 5;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + days);
  
  this.tracking.estimatedDelivery = estimatedDate;
  return this.save();
};

// Method to update order status
orderSchema.methods.updateStatus = function(newStatus, description, updatedBy) {
  this.status = newStatus;
  this.timeline.push({
    status: newStatus,
    description: description || `Order status changed to ${newStatus}`,
    timestamp: new Date(),
    updatedBy: updatedBy
  });
  
  return this.save();
};

// Method to process payment
orderSchema.methods.processPayment = function(paymentData) {
  this.payment = {
    ...this.payment,
    ...paymentData,
    paidAt: new Date()
  };
  
  if (paymentData.status === 'completed') {
    this.status = 'confirmed';
  }
  
  return this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = function(reason, description, cancelledBy) {
  this.status = 'cancelled';
  this.cancellation = {
    reason,
    description,
    cancelledAt: new Date(),
    cancelledBy,
    refundStatus: this.payment.status === 'completed' ? 'pending' : 'completed'
  };
  
  this.timeline.push({
    status: 'cancelled',
    description: `Order cancelled: ${reason}`,
    timestamp: new Date(),
    updatedBy: cancelledBy
  });
  
  return this.save();
};

// Method to initiate return
orderSchema.methods.initiateReturn = function(returnData) {
  this.return = {
    ...returnData,
    requestedAt: new Date(),
    status: 'requested'
  };
  
  this.timeline.push({
    status: 'return-requested',
    description: `Return requested: ${returnData.reason}`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to generate invoice number
orderSchema.methods.generateInvoice = function() {
  if (!this.invoice.number) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    this.invoice.number = `INV-${year}${month}-${this.orderNumber}`;
    this.invoice.generatedAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);