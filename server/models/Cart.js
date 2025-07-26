const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Cart must belong to a user'],
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [10, 'Maximum 10 items allowed per product']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    specifications: {
      size: String,
      color: String,
      variant: String
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  pricing: {
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    shipping: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative']
    }
  },
  coupon: {
    code: String,
    discount: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    appliedAt: Date
  },
  savedForLater: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    specifications: {
      size: String,
      color: String,
      variant: String
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  shippingAddress: {
    type: mongoose.Schema.ObjectId,
    ref: 'User.addresses'
  },
  estimatedDelivery: {
    date: Date,
    slot: {
      start: String,
      end: String
    }
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
cartSchema.index({ user: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ lastModified: 1 });

// Virtual for total items count
cartSchema.virtual('itemsCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for unique items count
cartSchema.virtual('uniqueItemsCount').get(function() {
  return this.items.length;
});

// Virtual for cart value category
cartSchema.virtual('valueCategory').get(function() {
  if (this.pricing.total >= 10000) return 'high';
  if (this.pricing.total >= 5000) return 'medium';
  return 'low';
});

// Virtual for free shipping eligibility
cartSchema.virtual('freeShippingEligible').get(function() {
  return this.pricing.subtotal >= 500; // Free shipping above ₹500
});

// Virtual for savings
cartSchema.virtual('totalSavings').get(function() {
  return this.pricing.discount + (this.coupon ? this.coupon.discount : 0);
});

// Pre-save middleware to update lastModified
cartSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Pre-save middleware to calculate pricing
cartSchema.pre('save', async function(next) {
  if (this.isModified('items')) {
    await this.calculatePricing();
  }
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, specifications = {}) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.status !== 'active') {
    throw new Error('Product is not available');
  }
  
  // Check stock availability
  if (product.inventory.trackQuantity && product.inventory.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  // Check if item already exists with same specifications
  const existingItemIndex = this.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.specifications) === JSON.stringify(specifications)
  );
  
  if (existingItemIndex > -1) {
    // Update quantity if item exists
    const newQuantity = this.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > 10) {
      throw new Error('Maximum 10 items allowed per product');
    }
    
    if (product.inventory.trackQuantity && product.inventory.stock < newQuantity) {
      throw new Error('Insufficient stock');
    }
    
    this.items[existingItemIndex].quantity = newQuantity;
    this.items[existingItemIndex].price = product.price.selling;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      quantity,
      price: product.price.selling,
      specifications,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity, specifications = {}) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.specifications) === JSON.stringify(specifications)
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items.splice(itemIndex, 1);
  } else {
    if (quantity > 10) {
      throw new Error('Maximum 10 items allowed per product');
    }
    
    // Check stock availability
    if (product.inventory.trackQuantity && product.inventory.stock < quantity) {
      throw new Error('Insufficient stock');
    }
    
    this.items[itemIndex].quantity = quantity;
    this.items[itemIndex].price = product.price.selling; // Update price
  }
  
  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, specifications = {}) {
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.specifications) === JSON.stringify(specifications)
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  this.items.splice(itemIndex, 1);
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.coupon = undefined;
  return this.save();
};

// Method to save item for later
cartSchema.methods.saveForLater = function(productId, specifications = {}) {
  const itemIndex = this.items.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.specifications) === JSON.stringify(specifications)
  );
  
  if (itemIndex === -1) {
    throw new Error('Item not found in cart');
  }
  
  const item = this.items[itemIndex];
  
  // Add to saved for later
  this.savedForLater.push({
    product: item.product,
    specifications: item.specifications,
    savedAt: new Date()
  });
  
  // Remove from cart
  this.items.splice(itemIndex, 1);
  
  return this.save();
};

// Method to move from saved for later to cart
cartSchema.methods.moveToCart = async function(productId, specifications = {}) {
  const savedItemIndex = this.savedForLater.findIndex(item => 
    item.product.toString() === productId &&
    JSON.stringify(item.specifications) === JSON.stringify(specifications)
  );
  
  if (savedItemIndex === -1) {
    throw new Error('Item not found in saved for later');
  }
  
  const savedItem = this.savedForLater[savedItemIndex];
  
  // Add to cart with quantity 1
  await this.addItem(savedItem.product, 1, savedItem.specifications);
  
  // Remove from saved for later
  this.savedForLater.splice(savedItemIndex, 1);
  
  return this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = async function(couponCode) {
  // This would typically involve validating the coupon against a Coupon model
  // For now, we'll implement a simple validation
  
  const validCoupons = {
    'SAVE10': { discount: 10, type: 'percentage', minAmount: 500 },
    'FLAT50': { discount: 50, type: 'fixed', minAmount: 1000 },
    'WELCOME20': { discount: 20, type: 'percentage', minAmount: 300 }
  };
  
  const coupon = validCoupons[couponCode.toUpperCase()];
  
  if (!coupon) {
    throw new Error('Invalid coupon code');
  }
  
  if (this.pricing.subtotal < coupon.minAmount) {
    throw new Error(`Minimum order amount ₹${coupon.minAmount} required for this coupon`);
  }
  
  let discountAmount = 0;
  if (coupon.type === 'percentage') {
    discountAmount = (this.pricing.subtotal * coupon.discount) / 100;
  } else {
    discountAmount = coupon.discount;
  }
  
  this.coupon = {
    code: couponCode.toUpperCase(),
    discount: discountAmount,
    type: coupon.type,
    appliedAt: new Date()
  };
  
  return this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = function() {
  this.coupon = undefined;
  return this.save();
};

// Method to calculate pricing
cartSchema.methods.calculatePricing = async function() {
  const Product = mongoose.model('Product');
  
  let subtotal = 0;
  
  // Calculate subtotal
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    if (product) {
      item.price = product.price.selling; // Update price in case it changed
      subtotal += item.price * item.quantity;
    }
  }
  
  this.pricing.subtotal = subtotal;
  
  // Calculate tax (18% GST)
  this.pricing.tax = Math.round(subtotal * 0.18);
  
  // Calculate shipping (free above ₹500)
  this.pricing.shipping = subtotal >= 500 ? 0 : 40;
  
  // Apply coupon discount
  let couponDiscount = 0;
  if (this.coupon) {
    if (this.coupon.type === 'percentage') {
      couponDiscount = (subtotal * this.coupon.discount) / 100;
    } else {
      couponDiscount = this.coupon.discount;
    }
    this.coupon.discount = couponDiscount;
  }
  
  // Calculate total
  this.pricing.total = Math.max(0, subtotal + this.pricing.tax + this.pricing.shipping - couponDiscount);
  
  return this;
};

// Method to validate cart before checkout
cartSchema.methods.validateForCheckout = async function() {
  const Product = mongoose.model('Product');
  const errors = [];
  
  if (this.items.length === 0) {
    errors.push('Cart is empty');
    return errors;
  }
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      errors.push(`Product ${item.product} not found`);
      continue;
    }
    
    if (product.status !== 'active') {
      errors.push(`${product.name} is no longer available`);
    }
    
    if (product.inventory.trackQuantity && product.inventory.stock < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Only ${product.inventory.stock} items available`);
    }
    
    // Update price if it has changed
    if (item.price !== product.price.selling) {
      item.price = product.price.selling;
      errors.push(`Price updated for ${product.name}`);
    }
  }
  
  if (errors.length > 0 && errors.some(error => error.includes('Price updated'))) {
    await this.save(); // Save updated prices
  }
  
  return errors;
};

// Static method to get abandoned carts
cartSchema.statics.getAbandonedCarts = function(daysSince = 1) {
  const cutoffDate = new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);
  
  return this.find({
    lastModified: { $lt: cutoffDate },
    'items.0': { $exists: true } // Cart has items
  }).populate('user', 'firstName lastName email');
};

// Static method to get cart analytics
cartSchema.statics.getCartAnalytics = async function() {
  const analytics = await this.aggregate([
    {
      $match: {
        'items.0': { $exists: true } // Only carts with items
      }
    },
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        averageCartValue: { $avg: '$pricing.total' },
        averageItemsPerCart: { $avg: { $size: '$items' } },
        totalCartValue: { $sum: '$pricing.total' }
      }
    }
  ]);

  return analytics[0] || {
    totalCarts: 0,
    averageCartValue: 0,
    averageItemsPerCart: 0,
    totalCartValue: 0
  };
};

module.exports = mongoose.model('Cart', cartSchema);