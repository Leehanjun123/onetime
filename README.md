# 일데이 (OneTime) - Backend API

Daily job matching platform backend server built with Node.js, Express, PostgreSQL, and Redis.

## 🏗 Architecture

- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Auth**: JWT with bcryptjs
- **File Upload**: Multer
- **Real-time**: Socket.IO
- **Deployment**: Railway (Backend) + Vercel (Frontend)

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Production Deployment

```bash
# Build the application
npm run build

# Deploy to Railway
railway deploy

# Run migrations in production
npm run db:migrate
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (authenticated)
- `POST /api/auth/logout` - Logout
- `PUT /api/auth/change-password` - Change password

### Jobs
- `GET /api/jobs` - Get all jobs (with filters)
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job (employers only)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Users
- `GET /api/users` - Get users list
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics

### File Upload
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/work-photo` - Upload single work photo
- `POST /api/upload/work-photos` - Upload multiple work photos
- `POST /api/upload/document` - Upload document
- `DELETE /api/upload/file/:filename` - Delete file

### Notifications (Socket.IO)
- `GET /api/notifications/status` - Check notification status
- `POST /api/notifications/test` - Send test notification
- Real-time events: new jobs, application updates, work session updates

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
REDIS_URL="redis://host:port"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="development"
PORT=5001

# CORS
FRONTEND_URL="http://localhost:3000"
```

## 🗂 Project Structure

```
src/
├── config/          # Database & Socket.IO configuration
├── middlewares/     # Auth, upload, and other middlewares
├── routes/          # API route handlers
├── utils/           # JWT, password, and utility functions
├── services/        # Business logic and cache services
└── index.js         # Application entry point

prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations
```

## 🔐 Authentication Flow

1. User registers with email/password
2. Server hashes password with bcryptjs
3. JWT token generated on login
4. Token required for protected routes
5. Socket.IO authentication for real-time features

## 📁 File Upload System

- **Avatars**: Max 2MB, stored in `/uploads/avatars/`
- **Work Photos**: Max 10MB each, up to 5 files
- **Documents**: Max 5MB, PDF/DOC/DOCX/TXT formats
- File URLs: `{host}/uploads/{type}/{filename}`

## ⚡ Real-time Features

Socket.IO implementation for:
- New job notifications
- Application status updates
- Work session updates
- Review notifications
- Chat messages (future feature)

## 🛠 Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server
npm run build      # Generate Prisma client
npm run db:migrate # Deploy database migrations
npm run db:push    # Push schema changes
npm run db:reset   # Reset database
npm run db:studio  # Open Prisma Studio
```

## 🚢 Deployment

### Railway (Backend)
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Railway:
- `DATABASE_URL` - Railway PostgreSQL connection string
- `REDIS_URL` - Railway Redis connection string
- `JWT_SECRET` - Production JWT secret
- `FRONTEND_URL` - Vercel frontend URL
- `NODE_ENV=production`

## 🔍 Health Checks

- `GET /health` - Application health status
- `GET /` - Basic server info

## 📦 Dependencies

### Production
- express - Web framework
- @prisma/client - Database ORM
- jsonwebtoken - JWT authentication
- bcryptjs - Password hashing
- multer - File uploads
- socket.io - Real-time communication
- redis - Caching
- cors - CORS middleware

### Development
- nodemon - Development server
- prisma - Database toolkit
- @types/* - TypeScript definitions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.