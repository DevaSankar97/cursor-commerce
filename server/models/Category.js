const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    public_id: String,
    url: String,
    alt: String
  },
  icon: {
    type: String // For storing icon class names or SVG paths
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0 for main categories, 1 for subcategories, etc.
  },
  path: {
    type: String // Store the path like "grocery/fruits/citrus"
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    metaDescription: String,
    keywords: [String]
  },
  attributes: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'select', 'multiselect'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String], // For select and multiselect types
    unit: String // For number types
  }],
  filters: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['range', 'checkbox', 'radio', 'select'],
      default: 'checkbox'
    },
    field: {
      type: String,
      required: true // The product field this filter applies to
    },
    options: [{
      label: String,
      value: String,
      count: Number
    }],
    min: Number, // For range filters
    max: Number, // For range filters
    unit: String
  }],
  commission: {
    type: Number,
    default: 0,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  shipping: {
    free: {
      type: Boolean,
      default: false
    },
    charges: {
      type: Number,
      default: 0
    },
    estimatedDays: {
      min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number,
        default: 7
      }
    }
  },
  productCount: {
    type: Number,
    default: 0
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
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ status: 1, featured: 1 });
categorySchema.index({ sortOrder: 1 });
categorySchema.index({ path: 1 });

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Virtual for products
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Pre-save middleware to set level and path
categorySchema.pre('save', async function(next) {
  if (this.isModified('parent') || this.isNew) {
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.level = parentCategory.level + 1;
        this.path = parentCategory.path ? `${parentCategory.path}/${this.slug}` : this.slug;
      }
    } else {
      this.level = 0;
      this.path = this.slug;
    }
  }
  next();
});

// Static method to get category tree
categorySchema.statics.getCategoryTree = async function(parentId = null) {
  const categories = await this.find({ 
    parent: parentId, 
    status: 'active' 
  }).sort({ sortOrder: 1, name: 1 });

  const categoryTree = [];
  
  for (const category of categories) {
    const categoryObj = category.toObject();
    categoryObj.children = await this.getCategoryTree(category._id);
    categoryTree.push(categoryObj);
  }
  
  return categoryTree;
};

// Static method to get main categories
categorySchema.statics.getMainCategories = function() {
  return this.find({ 
    parent: null, 
    status: 'active' 
  }).sort({ sortOrder: 1, name: 1 });
};

// Static method to get featured categories
categorySchema.statics.getFeaturedCategories = function(limit = 10) {
  return this.find({ 
    featured: true, 
    status: 'active' 
  })
  .sort({ sortOrder: 1, name: 1 })
  .limit(limit);
};

// Method to get full category path with names
categorySchema.methods.getFullPath = async function() {
  const pathParts = this.path.split('/');
  const pathWithNames = [];
  
  for (const slug of pathParts) {
    const category = await this.constructor.findOne({ slug });
    if (category) {
      pathWithNames.push({
        id: category._id,
        name: category.name,
        slug: category.slug
      });
    }
  }
  
  return pathWithNames;
};

// Method to get all subcategories recursively
categorySchema.methods.getAllSubcategories = async function() {
  const subcategories = await this.constructor.find({
    path: new RegExp(`^${this.path}/`)
  });
  
  return subcategories;
};

// Method to update product count
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({
    category: this._id,
    status: 'active'
  });
  
  this.productCount = count;
  return this.save();
};

// Static method to create default categories
categorySchema.statics.createDefaultCategories = async function() {
  const defaultCategories = [
    {
      name: 'Grocery',
      description: 'Fresh groceries, food items, and daily essentials',
      icon: 'shopping-cart',
      featured: true,
      sortOrder: 1,
      subcategories: [
        { name: 'Fruits & Vegetables', sortOrder: 1 },
        { name: 'Dairy & Bakery', sortOrder: 2 },
        { name: 'Staples', sortOrder: 3 },
        { name: 'Snacks & Beverages', sortOrder: 4 },
        { name: 'Personal Care', sortOrder: 5 },
        { name: 'Household Items', sortOrder: 6 }
      ]
    },
    {
      name: 'Electronics',
      description: 'Latest electronics, gadgets, and tech accessories',
      icon: 'smartphone',
      featured: true,
      sortOrder: 2,
      subcategories: [
        { name: 'Mobiles & Tablets', sortOrder: 1 },
        { name: 'Laptops & Computers', sortOrder: 2 },
        { name: 'TV & Audio', sortOrder: 3 },
        { name: 'Cameras', sortOrder: 4 },
        { name: 'Gaming', sortOrder: 5 },
        { name: 'Accessories', sortOrder: 6 }
      ]
    },
    {
      name: 'Fashion',
      description: 'Trendy clothing, footwear, and fashion accessories',
      icon: 'shirt',
      featured: true,
      sortOrder: 3,
      subcategories: [
        { name: "Men's Clothing", sortOrder: 1 },
        { name: "Women's Clothing", sortOrder: 2 },
        { name: "Kids' Clothing", sortOrder: 3 },
        { name: 'Footwear', sortOrder: 4 },
        { name: 'Bags & Luggage', sortOrder: 5 },
        { name: 'Watches & Jewelry', sortOrder: 6 }
      ]
    }
  ];

  const User = mongoose.model('User');
  const adminUser = await User.findOne({ role: 'admin' });
  
  if (!adminUser) {
    console.log('No admin user found. Please create an admin user first.');
    return;
  }

  for (const categoryData of defaultCategories) {
    const existingCategory = await this.findOne({ name: categoryData.name });
    
    if (!existingCategory) {
      const { subcategories, ...mainCategoryData } = categoryData;
      mainCategoryData.createdBy = adminUser._id;
      
      const mainCategory = await this.create(mainCategoryData);
      
      // Create subcategories
      for (const subCategoryData of subcategories) {
        await this.create({
          ...subCategoryData,
          parent: mainCategory._id,
          createdBy: adminUser._id
        });
      }
      
      console.log(`Created category: ${categoryData.name} with ${subcategories.length} subcategories`);
    }
  }
};

module.exports = mongoose.model('Category', categorySchema);