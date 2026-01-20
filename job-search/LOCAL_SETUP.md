# Local Development Setup - JobIntel

## Quick Start Guide

### Prerequisites
Make sure you have:
- Node.js v18+ installed
- npm or yarn
- MongoDB running (local or connection string)
- Redis running (local or connection string)

### Step 1: Kill all processes and Docker
```bash
# Kill all node processes
pkill -9 node
pkill -9 npm

# Stop Docker containers
docker-compose down -v
```

### Step 2: Start Local Services (MongoDB & Redis)

#### Option A: Using Docker (Recommended for Database Only)
```bash
cd /workspaces/job-search

# Start only MongoDB and Redis (not backend)
docker-compose up -d mongodb redis
```

#### Option B: Local Installation
- Install and start MongoDB locally
- Install and start Redis locally

### Step 3: Navigate to Project
```bash
cd /workspaces/job-search/JobIntel
```

### Step 4: Install Dependencies (if needed)
```bash
npm install
```

### Step 5: Start Development Server
```bash
npm run dev
```

This will start:
- ✅ Frontend: http://localhost:8080 (or next available port)
- ✅ Backend: http://localhost:5000
- Both frontend and backend running with hot reload

### Step 6: Access the Application

#### Regular User
- URL: http://localhost:8080 (or the port shown in terminal)
- Login with test credentials

#### Admin Dashboard
- URL: http://localhost:8080/admin (or same port)
- Make sure you're logged in as admin user
- You'll see:
  - Dashboard (main admin stats)
  - Jobs (job management)
  - Users (user analytics)
  - Notifications
  - Referrals
  - Crawlers (Job Scraper Management) ⭐
  - Analytics
  - Revenue
  - Settings
  - Skills
  - Profile Fields

### Troubleshooting

#### Port 5000 Already in Use
```bash
# Kill the process using port 5000
lsof -i :5000
kill -9 <PID>

# Or change backend port in backend/src/index.ts
```

#### API 500 Errors
1. Make sure MongoDB is running:
   ```bash
   docker exec jobintel-mongodb mongosh --eval "db.adminCommand('ping')"
   ```
   Should return: `{ ok: 1 }`

2. Make sure Redis is running:
   ```bash
   docker exec jobintel-redis redis-cli ping
   ```
   Should return: `PONG`

3. Check backend logs in terminal for errors

#### Frontend Can't Connect to Backend
- Make sure backend is running on http://localhost:5000
- Check CORS configuration in backend/src/index.ts
- Frontend proxy is configured in frontend/vite.config.ts

### Project Structure
```
JobIntel/
├── frontend/          # React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── DashboardPage.tsx (User Dashboard)
│       │   └── admin/
│       │       ├── AdminDashboard.tsx
│       │       ├── AdminJobs.tsx
│       │       ├── AdminCrawlers.tsx ⭐ (Job Scraper)
│       │       ├── AdminUsers.tsx
│       │       ├── AdminAnalytics.tsx
│       │       ├── AdminRevenue.tsx
│       │       └── ... more admin pages
│       └── components/
└── backend/           # Express + TypeScript
    └── src/
        ├── controllers/
        ├── services/
        ├── models/
        └── routes/
```

### Admin Features Available
1. **Dashboard** - Overview stats and charts
2. **Jobs** - Manage job listings, approve/reject
3. **Users** - View user analytics, tier management
4. **Job Crawlers** - Configure web scrapers, monitor scraping jobs
5. **Notifications** - Send notifications to users
6. **Referrals** - Manage referral program
7. **Analytics** - View visitor analytics
8. **Revenue** - Track subscription revenue
9. **Skills** - Manage available skills
10. **Profile Fields** - Configure profile fields

### Development Commands
```bash
# Start dev server (both frontend + backend)
npm run dev

# Run frontend only
npm --workspace=frontend run dev

# Run backend only
npm --workspace=backend run dev

# Build frontend
npm --workspace=frontend run build

# Build backend
npm --workspace=backend run build

# Type check
npm --workspace=backend run typecheck
```

### Notes
- React Router Future Flags warnings are normal (v6 → v7 deprecations)
- BullMQ deprecation warnings are informational, can be fixed in future updates
- Telegram/WhatsApp credentials are optional (not needed for development)

### Getting Admin Access
1. Register new account in the app
2. In backend database, find your user and set `role: 'admin'`
3. Or modify seed data in backend/src/seed.ts
