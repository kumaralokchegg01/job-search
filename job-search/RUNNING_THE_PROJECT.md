# 🚀 Running JobIntel Project

**Status:** ✅ All code complete and deployed  
**Build:** ✅ TypeScript compilation successful  
**Ready for:** Local development or cloud deployment

---

## 📋 Prerequisites

Before running JobIntel locally, you need:

### Required Services:
1. **Redis** (6379) - Job queue & caching
2. **MongoDB** (27017 or MongoDB Atlas) - Database
3. **Node.js** (18+) - Runtime
4. **npm/pnpm** (7+) - Package manager

### API Keys Required:
- **OpenWeb Ninja API Key** - Job scraping (200 calls/month limit)
- **SMTP Credentials** - Email notifications (Gmail/SendGrid)
- **Telegram Bot Token** - Telegram notifications
- **WhatsApp API Key** - WhatsApp Cloud API
- **Razorpay Keys** - Payment processing

---

## ✅ Setup Steps

### Step 1: Install Dependencies

```bash
cd /workspaces/job-search/JobIntel

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Environment Configuration

Create `.env` file in `backend/` with required variables:

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobintel
# OR local:
MONGODB_URI=mongodb://localhost:27017/jobintel

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_REFRESH_SECRET=another_secret_key

# OpenWeb Ninja API
OPENWEBNINJA_API_KEY=your_api_key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# WhatsApp
WHATSAPP_API_KEY=your_api_key
WHATSAPP_PHONE_ID=your_phone_id

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret
```

### Step 3: Start Services

#### Option A: Docker Compose (Recommended)

```bash
cd /workspaces/job-search/JobIntel

# Create docker-compose.yml if not exists
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mongodb:
    image: mongo:7.5
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: jobintel
    volumes:
      - mongo_data:/data/db

volumes:
  redis_data:
  mongo_data:
EOF

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

#### Option B: Local Services (Mac/Linux)

```bash
# 1. Start Redis
redis-server --port 6379 &

# 2. Start MongoDB (if installed locally)
# macOS:
brew services start mongodb-community

# Linux:
sudo service mongod start

# Or use MongoDB Atlas (cloud) instead - update MONGODB_URI in .env
```

#### Option C: Windows

Use WSL2 with Docker Desktop or install services natively:
- Redis: Download from https://github.com/microsoftarchive/redis/releases
- MongoDB: Download from https://www.mongodb.com/try/download/community

---

## 🚀 Running the Application

### Backend Development

```bash
cd backend

# Install dependencies (first time only)
npm install

# Build TypeScript
npm run build

# Start development server
npm run dev

# Expected output:
# Server running on http://localhost:5000
# MongoDB connected
# Redis connected
# BullMQ queues initialized
```

### Frontend Development

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Access at http://localhost:5173
```

### Both Simultaneously (in separate terminals)

```bash
# Terminal 1: Backend
cd JobIntel/backend && npm run dev

# Terminal 2: Frontend
cd JobIntel/frontend && npm run dev

# Terminal 3: Watch TypeScript (optional)
cd JobIntel/backend && npm run watch
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test
npm test -- --grep "auth"

# Watch mode
npm test -- --watch
```

### API Testing

```bash
# Health check
curl http://localhost:5000/api/health

# Get jobs
curl http://localhost:5000/api/jobs/search?q=developer

# Authentication example
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe"
  }'
```

---

## 📊 API Endpoints

### Available Routes:

```
Authentication:
  POST   /api/auth/register           - Register user
  POST   /api/auth/login              - Login user
  POST   /api/auth/refresh            - Refresh token
  POST   /api/auth/logout             - Logout
  POST   /api/auth/password-reset     - Reset password

Jobs:
  GET    /api/jobs/search             - Search jobs
  GET    /api/jobs/featured           - Featured jobs
  GET    /api/jobs/:id                - Job details
  POST   /api/jobs/:id/apply          - Apply to job

Resume:
  POST   /api/resume/upload           - Upload & parse resume
  GET    /api/resume                  - Get parsed resume
  GET    /api/resume/matches          - Matched jobs

Matching:
  GET    /api/jobs/matches            - User's job matches
  GET    /api/jobs/matches/stats      - Matching statistics

Admin:
  GET    /api/admin/stats             - Dashboard stats
  POST   /api/admin/scrape/start      - Trigger job scraping
  GET    /api/admin/scrape/status     - Scraping status
  GET    /api/admin/api-usage         - API usage tracker
```

---

## 🛠️ Development Commands

### Backend

```bash
# Development server with auto-reload
npm run dev

# Build production bundle
npm run build

# Run TypeScript compiler in watch mode
npm run watch

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test

# Clean build artifacts
npm run clean
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run typecheck
```

---

## 🐛 Troubleshooting

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379

Solution:
1. Ensure Redis is running: redis-server --port 6379
2. Check Redis status: redis-cli ping
3. Update REDIS_URL in .env if using different port
```

### MongoDB Connection Error

```
Error: MongooseError: Could not connect to MongoDB

Solution:
1. Verify MongoDB is running locally or MongoDB Atlas is accessible
2. Check connection string in MONGODB_URI
3. Ensure firewall allows connections to port 27017 (local)
4. For MongoDB Atlas, whitelist IP address in dashboard
```

### Port Already in Use

```
Error: EADDRINUSE: address already in use :::5000

Solution:
# Find process using port 5000
lsof -i :5000

# Kill process (replace PID)
kill -9 <PID>

# Or change PORT in .env
echo "PORT=5001" >> backend/.env
```

### Missing Dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 Performance Optimization

### Backend

```bash
# Production build with optimizations
npm run build --production

# Enable compression and caching in .env
NODE_ENV=production
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
```

### Frontend

```bash
# Optimized build
npm run build

# Check bundle size
npm run build -- --report

# Use preview to test production build
npm run preview
```

---

## 🚀 Deployment

### Cloud Platforms Supported:

1. **Render** (Recommended)
   - Connect GitHub repo
   - Auto-deploy on push
   - Environment variables in dashboard

2. **AWS** (Heroku alternative)
   - Deploy via AWS AppRunner
   - Use RDS for MongoDB
   - Use ElastiCache for Redis

3. **Azure**
   - Deploy via Azure App Service
   - Use Azure Cosmos DB
   - Use Azure Cache for Redis

4. **Vercel** (Frontend)
   - Deploy Next.js frontend
   - Connect to GitHub
   - Auto-preview deployments

### Deployment Checklist:

- [ ] All environment variables set
- [ ] MongoDB credentials configured
- [ ] Redis/cache setup complete
- [ ] API keys added (OpenWeb Ninja, etc.)
- [ ] SMTP credentials verified
- [ ] Database backups configured
- [ ] Monitoring enabled (logs, errors)
- [ ] SSL/HTTPS configured
- [ ] Domain set up
- [ ] CDN configured (optional)

---

## 📊 Monitoring & Logging

### View Logs

```bash
# Backend logs
tail -f logs/app.log

# Filter by level
grep ERROR logs/app.log

# Real-time monitoring
npm run dev -- --verbose
```

### Health Checks

```bash
# Check API health
curl http://localhost:5000/api/health

# Check database
curl http://localhost:5000/api/admin/stats

# Check Redis
redis-cli ping
```

---

## 📝 Configuration Files

### Important Files:

```
backend/
├── .env                    ← Environment variables
├── src/config/
│   ├── db.ts              ← MongoDB config
│   ├── redis.ts           ← Redis config
│   ├── queues.ts          ← BullMQ config
│   └── scheduler.ts       ← Cron jobs config
├── src/index.ts           ← Server entry point
└── tsconfig.json          ← TypeScript config

frontend/
├── .env                    ← Frontend env vars
├── vite.config.ts         ← Vite bundler config
└── tsconfig.json          ← TypeScript config
```

---

## 🎯 Next Steps

1. **Setup Services:** Docker Compose or local installation
2. **Configure Environment:** Copy .env.example → .env and fill values
3. **Start Development:** Run `npm run dev` in both directories
4. **Test API:** Use curl or Postman to test endpoints
5. **Deploy:** Push to GitHub and deploy to cloud platform

---

## 📚 Documentation

- **API Documentation:** See [FINAL_PROMPT_README.md](./FINAL_PROMPT_README.md)
- **Phase Details:** See [PHASES_COMPLETION_REPORT.md](./PHASES_COMPLETION_REPORT.md)
- **Architecture:** See [PROJECT_COMPREHENSIVE_ANALYSIS.md](./PROJECT_COMPREHENSIVE_ANALYSIS.md)

---

## 💬 Support

For issues or questions:
1. Check [Troubleshooting](#-troubleshooting) section
2. Review error logs
3. Check GitHub issues
4. Refer to documentation files

---

**Last Updated:** January 19, 2026  
**Status:** ✅ Ready for Development & Deployment
