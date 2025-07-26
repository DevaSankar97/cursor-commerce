// MongoDB initialization script for JioMart Clone
db = db.getSiblingDB('jiomart');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: { bsonType: 'string', minLength: 2, maxLength: 50 },
        lastName: { bsonType: 'string', minLength: 2, maxLength: 50 },
        email: { bsonType: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' },
        role: { enum: ['user', 'admin', 'vendor'] }
      }
    }
  }
});

db.createCollection('products');
db.createCollection('categories');
db.createCollection('orders');
db.createCollection('carts');
db.createCollection('reviews');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'addresses.pincode': 1 });

db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ category: 1, subcategory: 1 });
db.products.createIndex({ name: 'text', description: 'text', tags: 'text' });
db.products.createIndex({ 'price.selling': 1 });
db.products.createIndex({ rating: -1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ featured: 1, status: 1 });

db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parent: 1, sortOrder: 1 });

db.orders.createIndex({ user: 1, createdAt: -1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ 'payment.status': 1 });

db.carts.createIndex({ user: 1 }, { unique: true });
db.carts.createIndex({ lastModified: 1 });

db.reviews.createIndex({ product: 1, user: 1 }, { unique: true });
db.reviews.createIndex({ product: 1, createdAt: -1 });

// Insert default categories
db.categories.insertMany([
  {
    name: 'Grocery',
    slug: 'grocery',
    description: 'Fresh fruits, vegetables, and daily essentials',
    level: 0,
    path: 'grocery',
    status: 'active',
    featured: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Mobile phones, laptops, and electronic gadgets',
    level: 0,
    path: 'electronics',
    status: 'active',
    featured: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing, accessories, and footwear',
    level: 0,
    path: 'fashion',
    status: 'active',
    featured: true,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Create admin user
db.users.insertOne({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@jiomart.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeRoRwKJDVpLZFzZO', // password: admin123
  role: 'admin',
  emailVerified: true,
  phoneVerified: true,
  accountStatus: 'active',
  createdAt: new Date(),
  updatedAt: new Date()
});

print('JioMart database initialized successfully!');