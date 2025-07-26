const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    uppercase: true
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subcategory: {
    type: mongoose.Schema.ObjectId,
    ref: 'Subcategory'
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
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
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  price: {
    selling: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price cannot be negative']
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },
  inventory: {
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    trackQuantity: {
      type: Boolean,
      default: true
    },
    allowBackorder: {
      type: Boolean,
      default: false
    }
  },
  specifications: {
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ['g', 'kg', 'mg', 'lb', 'oz']
      }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'm', 'in', 'ft'],
        default: 'cm'
      }
    },
    color: String,
    size: String,
    material: String,
    features: [String],
    warranty: {
      duration: Number,
      unit: {
        type: String,
        enum: ['days', 'months', 'years'],
        default: 'months'
      },
      description: String
    }
  },
  // Category-specific fields
  grocery: {
    expiryDate: Date,
    nutritionalInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      sodium: Number
    },
    ingredients: [String],
    allergens: [String],
    storageInstructions: String,
    organic: {
      type: Boolean,
      default: false
    },
    vegan: {
      type: Boolean,
      default: false
    },
    glutenFree: {
      type: Boolean,
      default: false
    }
  },
  electronics: {
    modelNumber: String,
    powerConsumption: String,
    batteryLife: String,
    connectivity: [String],
    ports: [String],
    operatingSystem: String,
    processor: String,
    memory: String,
    storage: String,
    display: {
      size: String,
      resolution: String,
      type: String
    },
    camera: {
      megapixels: Number,
      features: [String]
    }
  },
  fashion: {
    gender: {
      type: String,
      enum: ['men', 'women', 'unisex', 'kids']
    },
    ageGroup: {
      type: String,
      enum: ['infant', 'toddler', 'kids', 'teen', 'adult']
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'autumn', 'winter', 'all-season']
    },
    occasion: [String],
    pattern: String,
    sleeves: String,
    neckline: String,
    fit: String,
    careInstructions: String,
    fabric: String,
    style: String
  },
  tags: [String],
  seo: {
    title: String,
    metaDescription: String,
    keywords: [String]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  reviews: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  }],
  variants: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  relatedProducts: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  }],
  shipping: {
    free: {
      type: Boolean,
      default: false
    },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    restrictions: [String],
    estimatedDays: {
      min: Number,
      max: Number
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'discontinued'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  bestseller: {
    type: Boolean,
    default: false
  },
  newArrival: {
    type: Boolean,
    default: false
  },
  onSale: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  wishlistCount: {
    type: Number,
    default: 0
  },
  vendor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'price.selling': 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ featured: 1, status: 1 });
productSchema.index({ trending: 1, status: 1 });
productSchema.index({ bestseller: 1, status: 1 });
productSchema.index({ newArrival: 1, status: 1 });
productSchema.index({ onSale: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.mrp && this.price.selling) {
    return Math.round(((this.price.mrp - this.price.selling) / this.price.mrp) * 100);
  }
  return 0;
});

// Virtual for savings amount
productSchema.virtual('savings').get(function() {
  if (this.price.mrp && this.price.selling) {
    return this.price.mrp - this.price.selling;
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (!this.inventory.trackQuantity) return 'in-stock';
  if (this.inventory.stock === 0) return 'out-of-stock';
  if (this.inventory.stock <= this.inventory.lowStockThreshold) return 'low-stock';
  return 'in-stock';
});

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg || this.images[0] || null;
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Ensure slug uniqueness
    const timestamp = Date.now();
    this.slug = `${this.slug}-${timestamp}`;
  }
  next();
});

// Pre-save middleware to calculate discount
productSchema.pre('save', function(next) {
  if (this.price.mrp && this.price.selling) {
    this.price.discount = Math.round(((this.price.mrp - this.price.selling) / this.price.mrp) * 100);
  }
  next();
});

// Pre-save middleware to set main image
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const hasMain = this.images.some(img => img.isMain);
    if (!hasMain) {
      this.images[0].isMain = true;
    }
  }
  next();
});

// Static method to get products by category
productSchema.statics.getByCategory = function(categoryId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    minPrice,
    maxPrice,
    rating,
    brand,
    inStock = true
  } = options;

  const query = { category: categoryId, status: 'active' };
  
  if (minPrice || maxPrice) {
    query['price.selling'] = {};
    if (minPrice) query['price.selling'].$gte = Number(minPrice);
    if (maxPrice) query['price.selling'].$lte = Number(maxPrice);
  }
  
  if (rating) {
    query['rating.average'] = { $gte: Number(rating) };
  }
  
  if (brand) {
    query.brand = { $in: Array.isArray(brand) ? brand : [brand] };
  }
  
  if (inStock) {
    query['inventory.stock'] = { $gt: 0 };
  }

  return this.find(query)
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Static method to search products
productSchema.statics.searchProducts = function(searchTerm, options = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    sort = '-relevance'
  } = options;

  const query = {
    $text: { $search: searchTerm },
    status: 'active'
  };
  
  if (category) {
    query.category = category;
  }
  
  if (minPrice || maxPrice) {
    query['price.selling'] = {};
    if (minPrice) query['price.selling'].$gte = Number(minPrice);
    if (maxPrice) query['price.selling'].$lte = Number(maxPrice);
  }

  let sortObj = {};
  if (sort === '-relevance') {
    sortObj = { score: { $meta: 'textScore' } };
  } else {
    sortObj = sort;
  }

  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('category', 'name slug')
    .populate('subcategory', 'name slug')
    .sort(sortObj)
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Method to update rating
productSchema.methods.updateRating = function(newRating, oldRating = null) {
  if (oldRating) {
    // Remove old rating
    this.rating.distribution[oldRating]--;
    this.rating.count--;
  }
  
  // Add new rating
  this.rating.distribution[newRating]++;
  this.rating.count++;
  
  // Calculate new average
  const total = Object.keys(this.rating.distribution).reduce((sum, star) => {
    return sum + (Number(star) * this.rating.distribution[star]);
  }, 0);
  
  this.rating.average = Number((total / this.rating.count).toFixed(1));
  
  return this.save();
};

// Method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.viewCount++;
  return this.save();
};

// Method to increment sales count
productSchema.methods.incrementSalesCount = function(quantity = 1) {
  this.salesCount += quantity;
  return this.save();
};

// Method to update stock
productSchema.methods.updateStock = function(quantity, operation = 'decrease') {
  if (!this.inventory.trackQuantity) return this.save();
  
  if (operation === 'decrease') {
    this.inventory.stock = Math.max(0, this.inventory.stock - quantity);
  } else {
    this.inventory.stock += quantity;
  }
  
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);