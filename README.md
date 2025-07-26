# JioMart Clone - Complete E-commerce Platform

A comprehensive e-commerce platform that exactly replicates JioMart's functionality using the MERN (MongoDB, Express.js, React.js, Node.js) technology stack, specifically focusing on three core product categories: **Grocery**, **Electronics**, and **Fashion**.

## 🚀 Features

### Core Functionality
- **Exact JioMart UI/UX Replication**: Pixel-perfect recreation of JioMart's interface
- **Multi-Category Support**: Dedicated sections for Grocery, Electronics, and Fashion
- **Advanced Search**: Smart search with filters, sorting, and autocomplete
- **Shopping Cart**: Full cart management with saved items and quantity controls
- **User Authentication**: Secure JWT-based authentication with 2FA support
- **Order Management**: Complete order lifecycle from checkout to delivery
- **Payment Integration**: Support for multiple payment methods (Razorpay, Stripe, COD)
- **Admin Dashboard**: Comprehensive admin panel for complete platform management

### Security Features
- **Military-Grade Security**: JWT authentication with advanced token management
- **HTTPS Encryption**: All communications encrypted
- **Input Validation**: Comprehensive sanitization against XSS and SQL injection
- **Rate Limiting**: Protection against brute force attacks
- **Multi-Layer Authentication**: Email/phone verification and 2FA support
- **GDPR Compliance**: Data protection and privacy compliance

### Performance & Scalability
- **Server-Side Rendering**: Optimized page loading
- **Code Splitting**: Efficient bundle loading
- **Database Optimization**: Indexed queries and efficient data modeling
- **Responsive Design**: Mobile-first approach with all device compatibility
- **Cloud Deployment Ready**: AWS/Google Cloud deployment configuration

## 🏗️ Project Structure

```
jiomart-clone/
├── client/                     # React.js Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/         # Header, Footer, etc.
│   │   │   ├── grocery/        # Grocery-specific components
│   │   │   ├── electronics/    # Electronics-specific components
│   │   │   ├── fashion/        # Fashion-specific components
│   │   │   └── admin/          # Admin dashboard components
│   │   ├── pages/              # Page components
│   │   │   ├── grocery/        # Grocery pages
│   │   │   ├── electronics/    # Electronics pages
│   │   │   ├── fashion/        # Fashion pages
│   │   │   ├── admin/          # Admin pages
│   │   │   ├── auth/           # Authentication pages
│   │   │   ├── cart/           # Shopping cart pages
│   │   │   ├── checkout/       # Checkout flow
│   │   │   └── account/        # User account pages
│   │   ├── redux/              # State management
│   │   │   ├── slices/         # Redux slices
│   │   │   └── store/          # Store configuration
│   │   ├── utils/              # Utility functions
│   │   └── assets/             # Static assets
│   └── package.json
├── server/                     # Node.js Backend
│   ├── controllers/            # Request handlers
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API routes
│   ├── middleware/             # Custom middleware
│   ├── config/                 # Configuration files
│   ├── utils/                  # Server utilities
│   └── package.json
├── database/                   # Database scripts and seeders
├── docs/                       # Documentation
├── deployment/                 # Deployment configurations
└── package.json               # Root package.json
```

## 🛠️ Technology Stack

### Frontend
- **React.js 18**: Latest React with hooks and functional components
- **TypeScript**: Type-safe development
- **Redux Toolkit**: State management
- **React Router**: Client-side routing
- **Styled Components**: CSS-in-JS styling
- **Framer Motion**: Smooth animations
- **React Hook Form**: Form management with validation
- **Axios**: HTTP client
- **React Toastify**: Notifications

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Helmet**: Security headers
- **Rate Limiting**: API protection
- **Multer**: File uploads
- **Cloudinary**: Image management

### Payment Integration
- **Razorpay**: Indian payment gateway
- **Stripe**: International payments
- **Cash on Delivery**: COD support

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **Nodemon**: Development server
- **Concurrently**: Running multiple scripts

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/jiomart-clone.git
   cd jiomart-clone
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Install all project dependencies**
   ```bash
   npm run install-all
   ```

4. **Set up environment variables**
   ```bash
   # Copy example environment files
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Edit the .env files with your configuration
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Start the development servers**
   ```bash
   # This starts both client and server concurrently
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

### Environment Configuration

#### Server (.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jiomart_clone
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=your_stripe_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

#### Client (.env)
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id
```

## 📦 Available Scripts

### Root Scripts
- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start only the React client
- `npm run server` - Start only the Node.js server
- `npm run build` - Build the client for production
- `npm run install-all` - Install all dependencies (client + server)
- `npm start` - Start the production server

### Client Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

### Server Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run server tests

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Bcrypt password hashing with salt rounds
- Role-based access control (User, Admin, Vendor)
- Account lockout after failed login attempts
- Email and phone verification
- Two-factor authentication (2FA)

### API Security
- Helmet.js for security headers
- Rate limiting to prevent abuse
- CORS configuration
- Input validation and sanitization
- XSS protection
- SQL injection prevention
- HPP (HTTP Parameter Pollution) protection

### Data Protection
- MongoDB sanitization
- Sensitive data encryption
- Secure cookie handling
- HTTPS enforcement in production
- File upload validation
- Size limits and type restrictions

## 🎨 UI/UX Features

### JioMart Design Replication
- **Header**: Exact recreation with logo, search, location selector, and user menu
- **Navigation**: Category navigation with icons and active states
- **Product Cards**: Detailed product display with images, pricing, and ratings
- **Cart Interface**: Comprehensive cart management with saved items
- **Checkout Flow**: Step-by-step checkout process
- **Mobile Responsive**: Optimized for all device sizes

### Category-Specific Features
- **Grocery**: Nutrition info, expiry dates, organic/vegan labels
- **Electronics**: Technical specifications, warranty information
- **Fashion**: Size charts, color variants, care instructions

## 🛍️ E-commerce Features

### Product Management
- Comprehensive product catalog
- Category and subcategory organization
- Advanced filtering and sorting
- Product variants (size, color, etc.)
- Inventory management
- Price comparison and discounts

### Shopping Experience
- Smart search with autocomplete
- Product recommendations
- Wishlist functionality
- Recently viewed products
- Product reviews and ratings
- Q&A section

### Order Processing
- Multi-step checkout process
- Address management
- Multiple payment options
- Order tracking
- Return and refund management
- Email notifications

## 👨‍💼 Admin Dashboard

### Product Management
- Add/edit/delete products
- Bulk product operations
- Inventory management
- Category management
- Image upload and management

### Order Management
- Order tracking and status updates
- Refund and return processing
- Customer communication
- Shipping management
- Invoice generation

### User Management
- User account management
- Role assignments
- Account verification
- Activity monitoring
- Security settings

### Analytics & Reporting
- Sales analytics
- Product performance
- Customer behavior
- Revenue tracking
- Inventory reports

## 🚀 Deployment

### Production Build
```bash
# Build the client
npm run build

# Start production server
npm start
```

### Environment Setup
1. Set NODE_ENV to 'production'
2. Configure production database
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up process manager (PM2)

### Cloud Deployment
- **AWS**: EC2, S3, CloudFront, RDS
- **Google Cloud**: Compute Engine, Cloud Storage, Cloud SQL
- **Heroku**: Ready for Heroku deployment
- **Docker**: Containerization support

## 📱 Mobile Responsiveness

- **Breakpoints**: Mobile (320px+), Tablet (768px+), Desktop (1024px+)
- **Touch-Friendly**: Optimized touch targets
- **Performance**: Fast loading on mobile networks
- **PWA Ready**: Progressive Web App features
- **Offline Support**: Basic offline functionality

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test
```

### Backend Testing
```bash
cd server
npm test
```

### Test Coverage
- Unit tests for components and functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing
- Security testing

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password/:token` - Reset password

### Product Endpoints
- `GET /api/products` - Get products with filters
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Cart Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove` - Remove cart item

[Full API documentation available in `/docs/api.md`]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- JioMart for the design inspiration
- React.js community for excellent documentation
- Node.js ecosystem for powerful tools
- MongoDB for flexible data storage
- All open-source contributors

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: your-email@example.com
- Documentation: [Wiki](https://github.com/your-username/jiomart-clone/wiki)

---

**⚠️ Disclaimer**: This is a clone project for educational purposes. All design and branding rights belong to JioMart/Reliance Industries.

**🎯 Status**: ✅ Production Ready | 🔄 Actively Maintained | 📈 Performance Optimized