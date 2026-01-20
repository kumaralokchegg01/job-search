# JobIntel - Job Scraping & Management Platform

> A comprehensive job scraping and management platform that aggregates job listings from the JSearch API with Indian job filtering, real-time analytics, and admin dashboard.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Project](#running-the-project)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Git Workflow](#git-workflow)

## ✨ Features

### Admin Dashboard
- ✅ Real-time job scraping from JSearch API
- ✅ Filter for Indian jobs (location + company matching)
- ✅ Job approval/rejection workflow
- ✅ Analytics and statistics
- ✅ User management
- ✅ Scraping history and logs

### Job Management
- ✅ View all scraped jobs
- ✅ Edit job details
- ✅ Add manual job listings
- ✅ AI-powered job parsing (from text)
- ✅ Job approval status tracking
- ✅ Real apply links from scraped data

### User Features
- ✅ Browse job listings
- ✅ Apply to jobs
- ✅ Search and filter
- ✅ Save job preferences
- ✅ Application tracking

### Data Collection
- ✅ JSearch API integration (OpenWeb Ninja)
- ✅ LinkedIn Scraper (Python-based)
- ✅ Real-time data extraction
- ✅ Duplicate detection
- ✅ Data quality validation

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Build Tool**: Vite
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Task Queue**: Bull (Redis-based)
- **Authentication**: JWT
- **API**: OpenWeb Ninja JSearch API

### Additional Tools
- **Python Scraper**: LinkedIn job scraper
- **Cache**: Redis
- **Scheduler**: Node-cron
- **Environment**: dotenv

## 📦 Prerequisites

Before starting, ensure you have:

**For Docker Deployment (Recommended):**
- **Docker**: v20+ (Download from [docker.com](https://www.docker.com/products/docker-desktop))
- **Docker Compose**: v2.0+ (usually comes with Docker Desktop)
- **Git**: v2.30+
- No other dependencies needed! (Node.js, MongoDB, Redis all included in containers)

**For Local Development:**
- **Node.js**: v20+ (Download from [nodejs.org](https://nodejs.org))
- **npm**: v10+ (comes with Node.js)
- **MongoDB**: v6+ (local or cloud instance)
- **Git**: v2.30+
- **OpenWeb Ninja JSearch API Key** (optional, has fallback data)

**Optional:**
- **Python**: v3.8+ (for LinkedIn scraper)
- **Redis**: v7+ (for job queuing - included in Docker)

## 📁 Project Structure

```
job-search/
├── JobIntel/                          # Main project
│   ├── backend/                       # Express backend
│   │   ├── src/
│   │   │   ├── config/               # Database, Redis, Queues
│   │   │   ├── controllers/          # Request handlers
│   │   │   ├── middleware/           # Auth, error handling
│   │   │   ├── models/               # MongoDB schemas
│   │   │   ├── routes/               # API routes
│   │   │   ├── services/             # Business logic
│   │   │   │   └── jsearchService.ts # JSearch API integration
│   │   │   ├── utils/                # Helpers
│   │   │   └── index.ts              # Entry point
│   │   ├── .env                      # Environment variables
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── frontend/                      # React frontend
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   ├── pages/                # Page components
│   │   │   ├── store/                # Zustand stores
│   │   │   ├── services/             # API calls
│   │   │   ├── hooks/                # Custom hooks
│   │   │   └── App.tsx               # Main component
│   │   ├── .env                      # Environment variables
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── Dockerfile
│   │
│   ├── package.json                  # Monorepo workspace config
│   └── docker-compose.yml
│
├── linkedIN-Scraper/                 # Python-based LinkedIn scraper
│   ├── src/
│   ├── requirements.txt
│   └── README.md
│
└── README.md                          # This file
```

## 🚀 Installation & Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/pritamkumarchegg/job-search.git
cd job-search
```

### Step 2: Install Dependencies
```bash
cd JobIntel
npm install
```

This installs dependencies for both backend and frontend (monorepo setup).

### Step 3: Configure Environment Variables

**Backend** - Create `JobIntel/backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobintel

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=1h

# JSearch API (OpenWeb Ninja)
OPENWEBNINJA_API_KEY=ak_your_api_key_here
API_KEY=ak_your_api_key_here

# Redis (optional, for job queuing)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Seed
SEED_ADMIN_EMAIL=admin@jobintel.local
SEED_ADMIN_PASS=AdminPass!23

# CORS
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
API_RATE_LIMIT_REQUESTS=200
API_REQUEST_DELAY_MS=1000
```

**Frontend** - Create `JobIntel/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=JobIntel
```

### Step 4: Start MongoDB

**Option A: Local MongoDB**
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**Option B: MongoDB Atlas (Cloud)**
- Update `MONGODB_URI` in `.env` with your MongoDB Atlas connection string

## ▶️ Running the Project

### Option 1: Run with Docker Compose (Recommended - Easiest)

**Prerequisites:**
- Docker installed
- Docker Compose installed
- No need to install Node.js, MongoDB, or Redis locally

**Start All Services:**
```bash
cd /workspaces/pritamkumarchegg-job-search
docker-compose up -d
```

This automatically:
- ✅ Builds backend and frontend Docker images
- ✅ Starts MongoDB container (port 27017)
- ✅ Starts Redis container (port 6379)
- ✅ Starts Backend container (port 5000)
- ✅ Starts Frontend container (port 8080)
- ✅ Creates network for inter-container communication
- ✅ Seeds admin user automatically

**Access Services:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000
- Backend Health: http://localhost:5000/api/health
- MongoDB: mongodb://localhost:27017/jobintel
- Redis: redis://localhost:6379

**Check Status:**
```bash
docker-compose ps
```

**View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

**Stop Services:**
```bash
docker-compose down
```

**Rebuild Images (after code changes):**
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Option 2: Run Both Frontend & Backend (Local Development)

**Prerequisites:**
- Node.js v20+
- MongoDB v6+ running locally or MongoDB Atlas connection string

```bash
cd JobIntel
npm run dev
```

This runs both services concurrently:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:8080

### Option 3: Run Services Separately (Local Development)

**Terminal 1 - Backend:**
```bash
cd JobIntel
npm run dev --workspace=backend
```

**Terminal 2 - Frontend:**
```bash
cd JobIntel
npm run dev --workspace=frontend
```

### Option 4: Production Build (Local)

```bash
cd JobIntel

# Build both
npm run build

# Start backend
npm run start --workspace=backend

# Build and preview frontend
npm run preview --workspace=frontend
```

## 🔧 Configuration

### For Docker Deployment

The Docker Compose setup uses `JobIntel/backend/.env.docker` for environment variables in containers. This file is automatically loaded by docker-compose.

**Key Docker Environment Variables:**
```env
# MongoDB (uses internal Docker DNS)
MONGODB_URI=mongodb://mongo:27017/jobintel

# Redis (uses internal Docker DNS)
REDIS_URL=redis://redis:6379

# API Configuration
OPENWEBNINJA_API_KEY=ak_your_api_key_here
API_HOST=api.openwebninja.com

# Authentication
JWT_SECRET=dev_jwt_secret_9f3a2b4c_min_32_chars_required
JWT_EXPIRY=1h

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_test_S3PPTtA01y5KS1
RAZORPAY_KEY_SECRET=62teXpoWCnK8Gik7PxCYoYDU
```

### For Local Development

**Backend** - Create `JobIntel/backend/.env`:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobintel

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRY=1h

# JSearch API (OpenWeb Ninja)
OPENWEBNINJA_API_KEY=ak_your_api_key_here
API_KEY=ak_your_api_key_here

# Redis (optional, for job queuing)
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Seed
SEED_ADMIN_EMAIL=admin@jobintel.local
SEED_ADMIN_PASS=AdminPass!23

# CORS
CORS_ORIGIN=http://localhost:8080

# Rate Limiting
API_RATE_LIMIT_REQUESTS=200
API_REQUEST_DELAY_MS=1000
```

**Frontend** - Create `JobIntel/frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=JobIntel
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh token

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (manual)
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

### Admin Only
- `POST /api/admin/scrape` - Start scraping
- `GET /api/admin/jobs/list` - Get all jobs for management
- `GET /api/admin/scrape/logs` - Get scraping logs
- `GET /api/admin/stats` - Get statistics

### Applications
- `POST /api/applications` - Apply to job
- `GET /api/applications/user/:userId` - Get user applications

## 💾 Database

### Collections

**jobs**
```javascript
{
  _id: ObjectId,
  title: String,
  company: String,
  location: String,
  description: String,
  applyUrl: String,
  salary: String,
  source: String,  // "JSearch API", "manual", "linkedin-scraper"
  status: String,  // "published", "pending", "active"
  meta: Object,
  createdAt: Date,
  updatedAt: Date
}
```

**users**
```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  name: String,
  roles: [String],  // ["admin", "user"]
  createdAt: Date
}
```

**scrape_sessions**
```javascript
{
  _id: ObjectId,
  sessionId: String,
  status: String,  // "in-progress", "completed", "failed"
  bucketsRequested: [String],
  bucketsCompleted: [String],
  totalJobsFound: Number,
  indianJobsFound: Number,
  indianJobsAdded: Number,
  startedAt: Date,
  completedAt: Date
}
```

## 🧪 Testing

### Run Tests
```bash
cd JobIntel

# Backend tests
npm test --workspace=backend

# Frontend tests
npm test --workspace=frontend
```

### Manual Testing

1. **Login**: Go to http://localhost:8080/login
   - Email: admin@jobintel.local
   - Password: AdminPass!23

2. **Scrape Jobs**: Admin → Crawlers
   - Select all buckets
   - Enable "Filter Indian Jobs"
   - Click "Start Scraping"

3. **View Jobs**: Admin → Jobs Management
   - See real scraped jobs
   - Click "Apply" on any job

4. **Check Database**: Use MongoDB Compass
   - Connection: `mongodb://localhost:27017`
   - Database: `jobintel`
   - Collections: jobs, users, scrape_sessions

## 🐛 Troubleshooting

### Docker Issues

**Issue: Container won't start**
```bash
# Check logs
docker-compose logs -f backend

# Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Issue: Port already in use**
```bash
# Kill process using port
lsof -i :5000   # Check port 5000
lsof -i :8080   # Check port 8080
kill -9 <PID>
```

**Issue: MongoDB not connecting**
```bash
# Check MongoDB container
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
docker-compose logs mongo
```

**Issue: Frontend shows "Cannot reach backend"**
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check frontend environment
cat JobIntel/frontend/.env | grep VITE_API

# Restart frontend
docker-compose restart frontend
```

### Local Development Issues

**Issue: Backend won't start**
```bash
# Clear node_modules and reinstall
rm -rf JobIntel/node_modules
npm install

# Check port 5000 is free
lsof -i :5000  # On macOS/Linux
netstat -ano | findstr :5000  # On Windows
```

**Issue: MongoDB connection failed**
```bash
# Verify MongoDB is running
mongosh

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/jobintel

# For MongoDB Atlas, use full connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobintel
```

**Issue: Scraping returns Fallback Data**
```bash
# Check API key is set
echo $OPENWEBNINJA_API_KEY

# Check backend logs for API errors
# Look for: "❌ Error searching jobs" in console

# Verify API key is valid
# Login to https://api.openwebninja.com
```

**Issue: Apply links show as "#"**
```bash
# Ensure jobs were scraped with real API (not fallback)
# Check MongoDB: db.jobs.findOne({ source: "JSearch API" })

# Look for applyUrl field that is not "#"
# If still seeing "#", API didn't return apply link
```

### Authentication Issues

**Issue: Login fails with "Invalid credentials"**
```bash
# Reseed admin user
cd JobIntel/backend
npm run seed

# Check admin user exists in MongoDB
mongosh
db.jobintel.users.findOne({email: 'admin@jobintel.local'})

# If using Docker
docker exec -it jobintel-mongo mongosh jobintel --eval "db.users.findOne({email: 'admin@jobintel.local'})"
```

**Issue: Login returns HTML error instead of JSON (502 error)**
```bash
# Check backend logs
docker-compose logs backend

# Verify MongoDB is running
docker-compose logs mongo

# Restart services
docker-compose restart backend
```

**Issue: EventSource MIME type error in frontend**
```bash
# This typically indicates a 502 error from backend
# Check backend health
curl http://localhost:5000/api/health

# Verify backend is responding to requests
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jobintel.local","password":"AdminPass!23"}'
```

## 📝 Git Workflow

### Commit Changes
```bash
git add .
git commit -m "feat: Add your feature description"
git push origin main
```

### View History
```bash
git log --oneline -10
git diff HEAD~1  # See changes in last commit
```

### Common Commits
```bash
# Fixes
git commit -m "fix: Fix apply URL extraction from API"

# Features
git commit -m "feat: Add Indian job filtering"

# Documentation
git commit -m "docs: Update README with setup instructions"

# Bug fixes
git commit -m "fix: Resolve MongoDB connection timeout"
```

## 📚 Key Documents

- **[SCRAPING_AND_DISPLAY_FIX.md](./SCRAPING_AND_DISPLAY_FIX.md)** - Frontend fixes and data display
- **[JSEARCH_API_FIXES.md](./JSEARCH_API_FIXES.md)** - JSearch API integration and field mapping
- **[linkedIN-Scraper/README.md](./linkedIN-Scraper/README.md)** - Python scraper documentation

## 🚀 Deployment

### Docker Deployment
```bash
cd JobIntel
docker-compose up -d
```

### Environment-specific .env files
```bash
.env              # Local development
.env.staging      # Staging environment
.env.production   # Production environment
```

## 📞 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review log files in `backend/logs/`
3. Check MongoDB data in MongoDB Compass
4. Review API responses in browser DevTools

## 📄 License

This project is proprietary software.

## 👤 Author

**Pritam Kumar**
- GitHub: [@pritamkumarchegg](https://github.com/pritamkumarchegg)
- Email: pritam@example.com

---

**Last Updated**: January 19, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
