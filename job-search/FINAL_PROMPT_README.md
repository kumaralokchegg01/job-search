# JobIntel: Complete Implementation Guide

**Version:** 5.0 - Master Compilation  
**Created:** January 18, 2026  
**Status:** Ready for Full Stack Implementation  
**Total Documentation:** 8,800+ lines  
**Phases:** 5 complete (Foundation → API → Extraction → Resume → Notifications)  

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Technology Stack](#technology-stack)
4. [Architecture & Design](#architecture--design)
5. [Complete Phase Breakdown](#complete-phase-breakdown)
6. [Database Schema](#database-schema)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Development Workflow](#development-workflow)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 PROJECT OVERVIEW

**JobIntel** is an AI-powered job aggregation and intelligent matching platform built with modern MERN stack.

### What JobIntel Does:

1. **Scrapes 11 job buckets** from OpenWeb Ninja JSearch API
2. **Normalizes job data** with 30+ extracted fields
3. **Deduplicates** to prevent duplicate job listings
4. **Matches users transparently** with 6-factor algorithm (40-20-15-10-10-5)
5. **Parses resumes** (PDF/DOCX) to extract skills & experience
6. **Auto-triggers matching** when resume uploaded
7. **Sends notifications** via Email, WhatsApp, Telegram
8. **Tracks API usage** with hard limit enforcement (200/month)

### Target Users:

- **Job Seekers:** Find perfectly matched jobs based on skills & preferences
- **Admins:** Monitor scraping, manage API usage, view statistics

### Unique Value Proposition:

- **Transparent Matching:** Users see exactly why a job matched (skill score breakdown)
- **Smart Deduplication:** Same job from multiple sources = 1 listing (by externalJobId)
- **Resume-Based Matching:** Auto-match 10,000+ jobs against resume in seconds
- **India-First:** All queries filtered for Indian jobs only
- **Rate Limited:** Safe API usage with automatic backoff & retry logic

---

## 🚀 QUICK START

### Prerequisites:
- Node.js 18+ & npm/pnpm
- MongoDB 7.5+
- Redis 7.0+
- OpenWeb Ninja API key (200 calls/month)
- Nodemailer SMTP credentials (Gmail/SendGrid)

### 1. Environment Setup (Phase 1, Task 1.1)

```bash
cd backend
cp .env.example .env
```

**Configure in `.env`:**
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/jobintel
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=sk-...
OPENWEBninja_API_KEY=your-api-key

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# WhatsApp
WHATSAPP_API_KEY=...
WHATSAPP_PHONE_ID=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# Application
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=another-secret-key
```

### 2. Install Dependencies

```bash
npm install
cd ../frontend
npm install
```

### 3. Start Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Watch for file changes
npm run watch
```

### 4. Verify Setup

```bash
# Health check
curl http://localhost:5000/api/health

# Run tests
npm test
```

---

## 💻 TECHNOLOGY STACK

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18+ | UI framework |
| **TypeScript** | 5.0 | Type safety |
| **Vite** | Latest | Fast bundler |
| **Tailwind CSS** | 3.x | Styling |
| **shadcn-ui** | Latest | Components |
| **React Router** | 6.x | Navigation |
| **TanStack Query** | 5.x | Data fetching |
| **Zustand** | Latest | State management |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express.js** | 4.18+ | Framework |
| **TypeScript** | 5.0 | Type safety |
| **MongoDB** | 7.5+ | Database |
| **Mongoose** | 8.x | ODM |
| **Redis** | 7.0+ | Cache & queues |
| **BullMQ** | 1.79+ | Job queue |
| **node-cron** | 3.0+ | Scheduling |
| **Winston** | 3.x | Logging |
| **JWT** | - | Authentication |
| **bcryptjs** | 2.4+ | Password hashing |
| **Nodemailer** | 6.10+ | Email |
| **Playwright** | 1.41+ | Scraping |

### External Services
| Service | Purpose | Limit |
|---------|---------|-------|
| **OpenWeb Ninja JSearch** | Job data API | 200/month |
| **Nodemailer (Gmail)** | Email notifications | Unlimited |
| **WhatsApp Cloud API** | WhatsApp messages | Variable |
| **Telegram Bot API** | Telegram notifications | Unlimited |
| **Razorpay** | Payment processing | Variable |

---

## 🏗️ ARCHITECTURE & DESIGN

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                         │
│  - Job Search & Display                                          │
│  - Resume Upload & Parsing Preview                               │
│  - Match Visualization (6-factor breakdown)                      │
│  - Admin Dashboard                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────────────┐
│                      API Gateway (Express)                        │
│  - JWT Authentication                                            │
│  - Rate Limiting & Validation                                    │
│  - Request/Response Logging                                      │
│  - Error Handling Middleware                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼───────┐      ┌─────────▼─────────┐
│   MongoDB     │      │   Redis + BullMQ  │
│  - Jobs       │      │  - Cache          │
│  - Users      │      │  - Job Queues     │
│  - Matches    │      │  - Rate Limiter   │
│  - Resumes    │      │                   │
└───────┬───────┘      └────────┬──────────┘
        │                       │
        │         ┌─────────────┴──────────────────┐
        │         │                                 │
┌───────▼────────────────────────────────────────┐ │
│            Service Layer (Core Logic)           │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ Job Extraction & Normalization Service  │  │ │
│  │ - Parse 30+ fields from API             │  │ │
│  │ - Detect career level, domain, stack    │  │ │
│  │ - Normalize titles & companies          │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ Deduplication Service                   │  │ │
│  │ - Check externalJobId (unique)          │  │ │
│  │ - Change detection                      │  │ │
│  │ - Prevent duplicates                    │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ 6-Factor Matching Engine                │  │ │
│  │ - Skill (40%)                           │  │ │
│  │ - Role (20%)                            │  │ │
│  │ - Level (15%)                           │  │ │
│  │ - Experience (10%)                      │  │ │
│  │ - Location (10%)                        │  │ │
│  │ - Work Mode (5%)                        │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ Resume Processing Service               │  │ │
│  │ - PDF/DOCX extraction                   │  │ │
│  │ - Skill detection (100+ database)       │  │ │
│  │ - Work history & education parsing      │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ Notification Service                    │  │ │
│  │ - Email (Nodemailer)                    │  │ │
│  │ - WhatsApp (Cloud API)                  │  │ │
│  │ - Telegram (Bot API)                    │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ API Usage Tracking Service              │  │ │
│  │ - Record every call                     │  │ │
│  │ - Enforce 200/month hard limit          │  │ │
│  │ - Warning at 80% (160 calls)            │  │ │
│  └─────────────────────────────────────────┘  │ │
│  ┌─────────────────────────────────────────┐  │ │
│  │ Job Lifecycle Service                   │  │ │
│  │ - Mark expired at 30 days                │  │
│  │ - Delete at 60 days                     │  │ │
│  │ - Archive logs at 90 days               │  │ │
│  └─────────────────────────────────────────┘  │ │
└──────────────────────────────────────────────┘ │
                                                  │
        ┌─────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────┐
│      External APIs (Rate Limited)            │
│  - OpenWeb Ninja JSearch (1 req/sec)        │
│  - Email (SMTP)                             │
│  - WhatsApp Cloud API                       │
│  - Telegram Bot API                         │
└──────────────────────────────────────────────┘
```

### Data Flow: Job Scraping

```
Admin triggers scrape
        ↓
OpenWebNinjaClient (Rate Limited: 1 req/sec)
        ↓
API Rate Limiter: Check remaining budget (200/month)
        ↓
Query each bucket (11 total)
        ↓
JobNormalizationService: Extract 30+ fields
        ↓
DeduplicationService: Check externalJobId
        ↓
NEW: Add to DB with _id
DUPLICATE: Update existing with latest info
EXPIRED: Mark as inactive
        ↓
ApiUsageService: Record call count
        ↓
Log: Success/Failure with details
```

### Data Flow: Resume Upload & Auto-Match

```
User uploads resume (PDF/DOCX)
        ↓
multer: Validate file (5MB max, correct type)
        ↓
resumeExtractor: Extract text
  - PDF: pdfjs-dist
  - DOCX: mammoth
        ↓
resumeParserService: Parse structure
  - Skills (via regex against 100+ database)
  - Work history (dates + roles)
  - Education (degree + institution)
  - Contact info
        ↓
Save to ParsedResume collection
        ↓
matchingTriggerService: Batch match against 10,000+ jobs
  - Calculate 6-factor score for each job
  - Filter: score >= 50%
  - Sort by score descending
  - Top 100 jobs returned
        ↓
Create JobMatch documents
        ↓
notificationService: Trigger email/WhatsApp/Telegram
  - Top 5 excellent matches (80%+)
  - Or daily digest
        ↓
Return: Analysis + Top matches to frontend
```

### 11-Job Buckets Taxonomy

| Bucket | Keywords | Examples |
|--------|----------|----------|
| **Fresher** | entry, junior, graduate, trainee | Junior Developer, Fresher Engineer |
| **Batch** | batch, campus, intern | Campus Hiring, Internship Program |
| **Software** | developer, engineer, python, java, javascript | Software Engineer, Full Stack Dev |
| **Data** | data, analytics, science, ml, ai | Data Scientist, ML Engineer |
| **Cloud** | cloud, devops, aws, azure, gcp | DevOps Engineer, Cloud Architect |
| **Mobile** | mobile, ios, android, react-native, flutter | iOS Developer, Mobile Engineer |
| **QA** | qa, test, automation, quality | QA Engineer, Test Automation |
| **Non-Tech** | sales, hr, marketing, support | Sales Executive, HR Manager |
| **Experience** | senior, lead, principal, expert | Senior Developer, Tech Lead |
| **Employment** | full-time, part-time, contract | Full-time, Contract Based |
| **Work-Mode** | remote, wfh, onsite, hybrid | Remote, WFH, Hybrid |

### 6-Factor Matching Algorithm

**Total Score = 100 points**

```
Skill Match (40%)
├─ Extract skills from resume (regex against 100+ database)
├─ Extract required skills from job
├─ Calculate overlap percentage
├─ Multiple matches = higher score
└─ Example: 8/10 required skills = 40 points

Role Match (20%)
├─ Extract target roles from resume
├─ Extract job title classification
├─ Match categories (Designer, Developer, Manager, etc)
└─ Example: Exact match = 20 points, Partial = 10 points

Career Level Match (15%)
├─ Parse experience years from resume
├─ Extract required level from job (Entry/Mid/Senior)
├─ Calculate fit: Entry(0-2yr), Mid(2-7yr), Senior(7yr+)
└─ Example: Senior job + Senior resume = 15 points

Experience Match (10%)
├─ Sum years of experience from resume
├─ Compare against required years
├─ Score higher if exceeds requirement
└─ Example: Need 5yr + Have 7yr = 10 points

Location Match (10%)
├─ Extract location from resume
├─ Extract job location
├─ Exact match = 10 points
├─ Willing to relocate = 5 points
└─ Different city = 0 points

Work Mode Match (5%)
├─ Check WFH preference in resume
├─ Check job work mode (remote/onsite/hybrid)
├─ Exact match = 5 points
└─ Remote-capable job + WFH preference = 5 points

TOTAL = Skill(40) + Role(20) + Level(15) + Exp(10) + Loc(10) + Mode(5)
```

**Match Categories:**
- **Excellent:** 80-100 points ⭐⭐⭐ (Highly Recommended)
- **Good:** 60-79 points ⭐⭐ (Recommended)
- **Okay:** 50-59 points ⭐ (Consider)
- **Poor:** <50 points (Not Suitable)

---

## 📊 COMPLETE PHASE BREAKDOWN

### Phase 1: Foundation & Infrastructure (1-2 weeks)
**Focus:** Setup, database, API client, queues  
**Tasks:** 8  
**Deliverables:** Complete backend infrastructure ready for Phase 2

#### Phase 1 Tasks:
1.1 Environment Setup (20 variables)
1.2 MongoDB Schema Expansion (16 models + 7 collections)
1.3 OpenWeb Ninja API Client (HTTPClient, RateLimiter)
1.4 BullMQ Queue Setup (scraping, notification, matching queues)
1.5 node-cron Scheduler (6 cron jobs for buckets & cleanup)
1.6 Logger Setup (Winston with console + file output)
1.7 Authentication Hardening (JWT + role-based middleware)
1.8 Express Entry Point (middleware chain, error handler)

**Success Criteria:** All 15 acceptance tests pass, no env errors, DB connected

### Phase 2: API Endpoints & Core Logic (2-3 weeks)
**Focus:** REST endpoints, user management, job CRUD  
**Tasks:** 8  
**Deliverables:** 34 REST endpoints fully functional

#### Phase 2 Tasks:
2.1 Auth Endpoints (register, login, refresh, logout, password, verify) - 6 endpoints
2.2 User Profile (get, update, completion, delete) - 4 endpoints
2.3 Admin Scraping (start, status, cancel, logs) - 4 endpoints
2.4 API Usage (current, set-limit, history) - 3 endpoints
2.5 Job Search (search, featured, trending, detail, apply-link) - 5 endpoints
2.6 Resume (upload, get, update, delete) - 4 endpoints
2.7 Matching (my-jobs, detail, stats, viewed) - 4 endpoints
2.8 Saved Jobs (create, read, update, delete) - 4 endpoints

**Success Criteria:** All 34 endpoints tested, pagination works, error handling complete

### Phase 3: Core Business Logic (2-3 weeks)
**Focus:** Job extraction, deduplication, matching engine  
**Tasks:** 6  
**Deliverables:** Complete job pipeline from API to matches

#### Phase 3 Tasks:
3.1 Job Normalization Service (extract 30+ fields, detect career level/domain/tech)
3.2 Deduplication Service (check externalJobId, change detection)
3.3 API Usage Tracking (record calls, enforce 200/month hard limit)
3.4 Scraping Orchestration (all 11 buckets, error recovery)
3.5 6-Factor Matching Engine (skill/role/level/exp/loc/mode = 100 points)
3.6 Job Lifecycle Service (30-day expiry, 60-day delete, cleanup)

**Success Criteria:** End-to-end scrape works, 10,000+ jobs in DB, matching accurate

### Phase 4: Resume Parsing & Advanced Matching (1-2 weeks)
**Focus:** Resume file handling, skill detection, auto-matching  
**Tasks:** 5  
**Deliverables:** Complete resume pipeline with auto-triggered matching

#### Phase 4 Tasks:
4.1 Resume File Upload Handler (multer, PDF/DOCX detection, 5MB limit)
4.2 NLP Skill Detection Service (100+ tech database, regex matching)
4.3 Resume Parser Service (work history, education, contact extraction)
4.4 Auto-Matching Trigger (batch match 10k+ jobs in async)
4.5 Resume Controller & Endpoints (upload, get, update, delete)

**Success Criteria:** Upload → parse → match in <5 seconds, skill detection accurate

### Phase 5: Notifications & Real-Time Updates (1 week)
**Focus:** Multi-channel notifications, preferences, auto-triggers  
**Tasks:** 7  
**Deliverables:** Complete notification system with email/WhatsApp/Telegram

#### Phase 5 Tasks:
5.1 Notification Models (NotificationLog, NotificationPreference)
5.2 Email Service (Nodemailer templates, styling)
5.3 WhatsApp Service (Cloud API integration)
5.4 Telegram Service (Bot API integration)
5.5 Notification Queue Processor (BullMQ worker, retry logic)
5.6 Preferences & Controllers (6 endpoints)
5.7 Auto-Trigger on Matches (daily digest, weekly summary)

**Success Criteria:** All 3 channels work, preferences respected, quiet hours work

### Phase 6: Frontend Implementation (3-4 weeks)
**Focus:** Complete UI/UX for all features  
**Tasks:** 10+ components  
**Deliverables:** Production-ready UI

**Key Pages:**
- Landing page with intro
- Login/Register with validation
- Job search with filters
- Job detail with match breakdown
- Resume upload with progress
- Dashboard with statistics
- Saved jobs with filters
- Admin panel with controls
- Notification settings
- Profile completion wizard

### Phase 7: Testing & QA (2-3 weeks)
**Focus:** Unit, integration, E2E tests  
**Deliverables:** >80% code coverage, E2E tests for all user flows

**Testing Strategy:**
- Unit tests: Services, utilities, models
- Integration tests: API endpoints with DB
- E2E tests: Complete user journeys (signup → upload → match → apply)
- Performance tests: Match 10k jobs in <5 seconds
- Security tests: SQL injection, XSS, auth bypass

### Phase 8: Deployment & CI/CD (1-2 weeks)
**Focus:** Automated deployment, environment management  
**Deliverables:** Staging & production environments

**Deployment Stack:**
- GitHub Actions for CI/CD
- Docker for containerization
- AWS S3 for file uploads
- CloudFront for CDN
- RDS for managed MongoDB
- ElastiCache for Redis
- Auto-scaling groups

### Phase 9: Monitoring & Performance (1 week)
**Focus:** Logging, metrics, alerts  
**Deliverables:** Complete observability

**Monitoring Tools:**
- Winston for application logs
- CloudWatch for infrastructure logs
- Datadog/NewRelic for APM
- Sentry for error tracking
- Custom dashboards for KPIs

### Phase 10: Maintenance & Iteration (Ongoing)
**Focus:** Bug fixes, feature requests, optimizations  
**Deliverables:** Stable, performant production system

**Ongoing Tasks:**
- Monitor API usage & budget
- Update job taxonomy
- Improve matching algorithm
- Add new features based on feedback
- Optimize performance
- Security patches

---

## 🗄️ DATABASE SCHEMA

### Collections Overview

**Total: 16 MongoDB Collections**

```
User Collections (3)
├─ users
├─ notification_preferences
└─ api_usages

Job Collections (4)
├─ jobs
├─ job_matches
├─ saved_jobs
└─ scraping_logs

Resume Collections (2)
├─ parsed_resumes
└─ resume_skills

Application Collections (4)
├─ applications
├─ audit_logs
├─ notifications_log
└─ companies

Admin Collections (3)
├─ scrape_tasks
├─ system_settings
└─ feature_flags
```

### 1. Users Collection

```typescript
{
  _id: ObjectId,
  
  // Auth
  email: string (unique, lowercase),
  passwordHash: string,
  
  // Profile
  firstName: string,
  lastName: string,
  profileImageUrl: string,
  bio: string,
  
  // Career
  currentRole: string,
  yearsOfExperience: number,
  careerLevel: 'entry' | 'mid' | 'senior',
  targetRoles: [string],
  targetDomains: [string], // e.g., [Web, Mobile, Data]
  
  // Location
  currentLocation: string,
  targetLocations: [string],
  openToRelocation: boolean,
  
  // Preferences
  preferredWorkMode: 'remote' | 'onsite' | 'hybrid',
  minSalaryExpectation: number,
  
  // Resume
  resumeId: ObjectId (ref: ParsedResume),
  
  // Status
  profileCompleteness: 0-100,
  isVerified: boolean,
  verificationToken: string,
  verificationTokenExpiry: Date,
  
  // Account
  role: 'user' | 'admin' | 'super_admin',
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
}

Indexes:
- email (unique, sparse)
- targetDomains (array)
- targetLocations (array)
- careerLevel
```

### 2. Jobs Collection

```typescript
{
  _id: ObjectId,
  
  // External ID (Deduplication Key)
  externalJobId: string (unique, sparse), // From OpenWeb Ninja
  
  // Basic Info
  title: string,
  companyName: string,
  description: string (long text),
  
  // Details
  salary: {
    min: number,
    max: number,
    currency: string,
  },
  careerLevel: 'entry' | 'mid' | 'senior',
  experienceRequired: number, // in years
  
  // Location & Work Mode
  location: string,
  workMode: 'remote' | 'onsite' | 'hybrid',
  
  // Technical
  domain: string, // 'web', 'mobile', 'data', 'cloud', etc
  techStack: [string], // ['React', 'Node.js', 'MongoDB']
  
  // Classification
  bucket: string, // One of 11 buckets
  batchEligible: boolean,
  
  // Status
  isActive: boolean,
  normalizedTitle: string,
  normalizedCompany: string,
  
  // Metadata
  sourceUrl: string,
  postDate: Date,
  fetchedAt: Date,
  expiryDate: Date, // 30 days from fetchedAt
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- externalJobId (unique, sparse)
- title
- companyName
- location
- techStack (array)
- expiryDate
- isActive
- bucket
- careerLevel
```

### 3. JobMatches Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User),
  jobId: ObjectId (ref: Job),
  
  // 6-Factor Scores (0-100 each)
  scores: {
    skill: number,        // 0-40 (40%)
    role: number,         // 0-20 (20%)
    level: number,        // 0-15 (15%)
    experience: number,   // 0-10 (10%)
    location: number,     // 0-10 (10%)
    workMode: number,     // 0-5 (5%)
  },
  
  // Derived
  totalScore: number, // 0-100 (sum of above)
  matchType: 'excellent' | 'good' | 'okay' | 'poor',
  
  // Detailed Breakdown (for transparency)
  breakdown: {
    skillsMatched: [string], // e.g., ['React', 'Node.js']
    skillsMissing: [string], // e.g., ['GraphQL']
    roleMatch: string, // "Excellent match for Developer role"
    levelMatch: string, // "Your Senior experience is ideal"
    locationNote: string, // "Remote position available"
  },
  
  // Status
  status: 'matched' | 'viewed' | 'applied' | 'rejected',
  viewedAt: Date,
  appliedAt: Date,
  
  confidence: 0-100, // How sure are we about this match
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId, jobId (unique compound)
- userId, totalScore (for leaderboard)
- totalScore (for trending)
- matchType
- status
```

### 4. ParsedResumes Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User),
  originalFileName: string,
  fileUrl: string (S3),
  
  // Extracted Data
  contact: {
    email: string,
    phone: string,
    location: string,
    linkedin: string,
    github: string,
  },
  
  // Work Experience
  workExperience: [
    {
      companyName: string,
      jobTitle: string,
      startDate: Date,
      endDate: Date,
      isCurrent: boolean,
      description: string,
    }
  ],
  totalExperienceYears: number,
  
  // Education
  education: [
    {
      institution: string,
      degree: string,
      fieldOfStudy: string,
      graduationDate: Date,
    }
  ],
  
  // Skills (from regex matching against 100+ database)
  skills: {
    programming: [string], // ['Python', 'JavaScript']
    frontend: [string],    // ['React', 'Vue']
    backend: [string],     // ['Node.js', 'Django']
    databases: [string],   // ['MongoDB', 'PostgreSQL']
    cloud: [string],       // ['AWS', 'GCP']
    tools: [string],       // ['Git', 'Docker']
    soft: [string],        // ['Leadership', 'Communication']
  },
  allSkills: [string], // Flat list for easy search
  
  // Certifications
  certifications: [
    {
      name: string,
      issuer: string,
      issueDate: Date,
      expiryDate: Date,
    }
  ],
  
  // Quality
  completeness: 0-100, // How complete is the resume
  qualityScore: 0-100,
  extractedText: string, // Full text for AI analysis
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId (unique)
- allSkills (array)
- completeness
```

### 5. NotificationLogs Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User),
  notificationType: 'match' | 'summary' | 'reminder' | 'update' | 'alert',
  channel: 'email' | 'whatsapp' | 'telegram',
  
  // Content
  subject: string,
  message: string,
  templateId: string,
  
  // Status
  status: 'queued' | 'sent' | 'failed' | 'bounced' | 'unsubscribed',
  sentAt: Date,
  failureReason: string,
  retryCount: number,
  maxRetries: number,
  
  // Engagement
  opened: boolean,
  openedAt: Date,
  clicked: boolean,
  clickedAt: Date,
  clickedLink: string,
  
  // Unsubscribe
  unsubscribeToken: string (unique, sparse),
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId, channel, createdAt (compound)
- status, retryCount
- sentAt
- unsubscribeToken (unique, sparse)
```

### 6. NotificationPreferences Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User) (unique),
  
  // Channel Settings
  email: {
    enabled: boolean (default: true),
    frequency: 'instant' | 'daily' | 'weekly' | 'never',
    maxPerDay: number (default: 5),
  },
  whatsapp: {
    enabled: boolean (default: false),
    phoneNumber: string,
    frequency: 'instant' | 'daily' | 'weekly' | 'never',
    maxPerDay: number (default: 3),
  },
  telegram: {
    enabled: boolean (default: false),
    chatId: string,
    frequency: 'instant' | 'daily' | 'weekly' | 'never',
    maxPerDay: number (default: 3),
  },
  
  // Notification Types
  notificationTypes: {
    newMatches: boolean (default: true),
    skillRecommendations: boolean (default: true),
    applicationReminders: boolean (default: true),
    summaryReports: boolean (default: true),
    jobAlerts: boolean (default: false),
  },
  
  // Quiet Hours
  quiet_hours_enabled: boolean (default: false),
  quiet_hours_start: string, // "22:00"
  quiet_hours_end: string,   // "08:00"
  
  timezone: string (default: 'Asia/Kolkata'),
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId (unique)
```

### 7. SavedJobs Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User),
  jobId: ObjectId (ref: Job),
  
  // User note
  userNote: string,
  
  // Status
  savedAt: Date,
  appliedAt: Date,
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId, jobId (unique compound)
- userId, savedAt
```

### 8. ScrapingLogs Collection

```typescript
{
  _id: ObjectId,
  
  // Task Info
  taskId: ObjectId (ref: ScrapeTask),
  bucket: string, // One of 11 buckets
  
  // Execution
  startTime: Date,
  endTime: Date,
  duration: number, // in milliseconds
  
  // Results
  jobsFound: number,
  jobsAdded: number,
  jobsUpdated: number,
  duplicates: number,
  
  // Status
  status: 'in_progress' | 'completed' | 'failed',
  errorMessage: string,
  
  // API Usage
  apiCallsUsed: number,
  remainingBudget: number,
  
  // Details
  details: {
    keywords: [string],
    filters: object,
  },
  
  createdAt: Date,
}

Indexes:
- taskId
- bucket
- status
- createdAt
```

### 9. ApiUsages Collection

```typescript
{
  _id: ObjectId,
  
  userId: ObjectId (ref: User) (unique),
  
  // Monthly Tracking
  callsThisMonth: number (default: 0),
  monthStartDate: Date,
  lastCallDate: Date,
  
  // Budget
  hardLimit: number (default: 200),
  warningThreshold: number (default: 160), // 80% of 200
  
  // History
  callHistory: [
    {
      timestamp: Date,
      endpoint: string,
      buckets: [string],
      jobsReturned: number,
    }
  ],
  
  // Status
  limitExceeded: boolean (default: false),
  lastWarningDate: Date,
  
  createdAt: Date,
  updatedAt: Date,
}

Indexes:
- userId (unique)
- limitExceeded
```

### 10-16. Other Collections

**Applications**
```typescript
{
  userId, jobId, status, appliedAt, notes
}
```

**AuditLogs**
```typescript
{
  userId, action, resource, timestamp, ipAddress, userAgent
}
```

**Companies**
```typescript
{
  name, industry, location, size, description, logoUrl
}
```

**ScrapeTask**
```typescript
{
  createdBy, startTime, endTime, status, bucket, parameters
}
```

**SystemSettings**
```typescript
{
  settingName, value, type, updatedAt
}
```

**FeatureFlags**
```typescript
{
  flagName, enabled, rolloutPercentage, metadata
}
```

---

## 📡 API ENDPOINTS REFERENCE

### Total: 34 REST Endpoints

### 1. Auth Endpoints (6)

```
POST   /api/auth/register          - Create new user account
POST   /api/auth/login             - Login with email & password
POST   /api/auth/refresh           - Refresh JWT token
POST   /api/auth/logout            - Logout (invalidate token)
POST   /api/auth/change-password   - Change password
POST   /api/auth/verify-email      - Verify email address
```

### 2. User Profile Endpoints (4)

```
GET    /api/users/profile          - Get user profile
PUT    /api/users/profile          - Update profile
GET    /api/users/profile/completion  - Get completion percentage
DELETE /api/users/{id}             - Delete account
```

### 3. Admin Scraping Endpoints (4)

```
POST   /api/admin/scraping/start   - Start scraping job
GET    /api/admin/scraping/status  - Get scrape status
POST   /api/admin/scraping/cancel  - Cancel running scrape
GET    /api/admin/scraping/logs    - Get scraping logs
```

### 4. API Usage Endpoints (3)

```
GET    /api/admin/usage/current    - Get current usage stats
PUT    /api/admin/usage/limit      - Set usage limit
GET    /api/admin/usage/history    - Get usage history
```

### 5. Job Search Endpoints (5)

```
GET    /api/jobs/search            - Search jobs with filters
GET    /api/jobs/featured          - Get featured jobs
GET    /api/jobs/trending          - Get trending jobs
GET    /api/jobs/{id}              - Get job details
GET    /api/jobs/{id}/apply-link   - Get job apply link
```

### 6. Resume Endpoints (4)

```
POST   /api/resume/upload          - Upload resume (trigger auto-match)
GET    /api/resume                 - Get uploaded resume
PUT    /api/resume                 - Update resume info
DELETE /api/resume                 - Delete resume
```

### 7. Matching Endpoints (4)

```
GET    /api/matches                - Get all matches for user
GET    /api/matches/{id}           - Get match details
GET    /api/matches/stats          - Get match statistics
GET    /api/matches/viewed         - Get viewed jobs
```

### 8. Saved Jobs Endpoints (4)

```
POST   /api/saved-jobs             - Save a job
GET    /api/saved-jobs             - Get all saved jobs
PUT    /api/saved-jobs/{id}        - Update saved job
DELETE /api/saved-jobs/{id}        - Remove saved job
```

### Request/Response Examples

**POST /api/auth/register**
```json
REQUEST {
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}

RESPONSE {
  "success": true,
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**GET /api/jobs/search?q=react&location=bangalore&level=senior**
```json
RESPONSE {
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Senior React Developer",
      "companyName": "TechCorp",
      "location": "Bangalore",
      "careerLevel": "senior",
      "techStack": ["React", "Node.js", "MongoDB"],
      "salary": { "min": 15, "max": 25, "currency": "LPA" },
      "matchScore": 87
    }
  ],
  "pagination": {
    "total": 234,
    "limit": 20,
    "offset": 0
  }
}
```

**POST /api/resume/upload**
```json
REQUEST (multipart/form-data) {
  "file": <binary PDF/DOCX data>
}

RESPONSE {
  "success": true,
  "resume": {
    "_id": "507f1f77bcf86cd799439013",
    "skills": ["React", "Node.js", "Python"],
    "experience": 5,
    "careerLevel": "mid"
  },
  "matches": {
    "total": 234,
    "excellent": 45,
    "good": 89,
    "topMatches": [
      {
        "jobId": "507f1f77bcf86cd799439014",
        "title": "Senior React Developer",
        "matchScore": 92,
        "matchType": "excellent"
      }
    ]
  }
}
```

---

## 💻 DEVELOPMENT WORKFLOW

### 1. Local Setup

```bash
# Clone repository
git clone https://github.com/your-org/jobintel.git
cd jobintel

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Create .env file
cp backend/.env.example backend/.env

# Start MongoDB & Redis locally
docker-compose up -d mongodb redis

# Run migrations
npm run migrate

# Start development servers
npm run dev
```

### 2. Development Process

```
1. Create feature branch: git checkout -b feature/job-matching
2. Make changes to code
3. Run tests: npm test
4. Commit changes: git commit -m "Add job matching"
5. Push branch: git push origin feature/job-matching
6. Create Pull Request on GitHub
7. Code review + CI/CD tests
8. Merge to main
```

### 3. Code Structure

```
backend/
├─ src/
│  ├─ controllers/     (44 handlers)
│  ├─ services/        (12 services)
│  ├─ models/          (16 schemas)
│  ├─ routes/          (8 routers)
│  ├─ middleware/      (auth, error, logging)
│  ├─ utils/           (helpers)
│  ├─ workers/         (BullMQ workers)
│  ├─ config/          (DB, Redis, env)
│  └─ index.ts         (entry point)
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ package.json
└─ tsconfig.json

frontend/
├─ src/
│  ├─ components/      (40+ components)
│  ├─ pages/           (8 pages)
│  ├─ hooks/           (custom hooks)
│  ├─ services/        (API calls)
│  ├─ store/           (Zustand state)
│  ├─ types/           (TypeScript types)
│  └─ App.tsx
├─ public/
├─ index.html
└─ package.json
```

### 4. Testing Strategy

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm run test:watch
```

### 5. Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format

# Pre-commit hooks
npx husky install
```

---

## 🚀 DEPLOYMENT GUIDE

### Staging Deployment

```bash
# Build Docker images
docker build -t jobintel-backend:latest ./backend
docker build -t jobintel-frontend:latest ./frontend

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag jobintel-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/jobintel-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/jobintel-backend:latest

# Deploy to ECS
aws ecs update-service --cluster jobintel-staging --service backend --force-new-deployment
```

### Production Deployment

```bash
# Same as staging, but with production cluster
aws ecs update-service --cluster jobintel-production --service backend --force-new-deployment
```

### Environment Variables

**Staging (staging-secrets.env)**
```
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/jobintel
REDIS_URL=redis://redis-staging:6379
ENVIRONMENT=staging
API_URL=https://api-staging.jobintel.com
```

**Production (production-secrets.env)**
```
MONGODB_URI=mongodb+srv://user:pass@production-cluster.mongodb.net/jobintel
REDIS_URL=redis://redis-production:6379
ENVIRONMENT=production
API_URL=https://api.jobintel.com
```

---

## 🔧 TROUBLESHOOTING

### Common Issues

**Issue: MongoDB connection fails**
```bash
# Check connection string
echo $MONGODB_URI

# Verify network access
mongo "mongodb+srv://user:pass@cluster.mongodb.net/jobintel"

# Check IP whitelist in MongoDB Atlas
```

**Issue: Redis connection fails**
```bash
# Check Redis running
redis-cli ping

# Check Redis URL
echo $REDIS_URL

# Restart Redis
docker restart redis
```

**Issue: API rate limit exceeded**
```
Solution: API budget reset monthly. Check current usage:
GET /api/admin/usage/current
Response: { "callsThisMonth": 187, "hardLimit": 200 }

Wait for next month or request budget increase.
```

**Issue: Job scraping slow**
```
Solution: Check:
1. Network latency: Verify API response time
2. Database performance: Check indexes exist
3. Queue backlog: Check BullMQ queue size
4. Server resources: Monitor CPU/memory
```

**Issue: Resume parsing fails**
```
Solution: Check:
1. File size <5MB
2. File format: PDF or DOCX only
3. File is readable (not encrypted)
4. Text extraction library installed:
   npm list pdfjs-dist mammoth
```

**Issue: Notifications not sending**
```
Solution: Check:
1. Preferences enabled: GET /api/notifications/preferences
2. Quiet hours: Check current time vs settings
3. Email credentials: Verify SMTP_USER/SMTP_PASS
4. Queue status: Check BullMQ logs
5. Channel credentials: Verify WhatsApp/Telegram tokens
```

---

## 📚 REFERENCE GUIDES

### Quick Reference: Job Bucket Keywords

| Bucket | Query Keywords |
|--------|----------------|
| **Fresher** | entry level, junior, graduate, trainee, fresher, beginner |
| **Batch** | campus hiring, campus recruitment, internship, batch, pool |
| **Software** | developer, software engineer, programming, coding, full-stack |
| **Data** | data scientist, machine learning, data analyst, big data, analytics |
| **Cloud** | devops, cloud engineer, aws, azure, gcp, infrastructure, kubernetes |
| **Mobile** | mobile developer, ios, android, react native, flutter, app developer |
| **QA** | qa engineer, quality assurance, test automation, tester |
| **Non-Tech** | sales, hr, marketing, support, business, operations |
| **Experience** | senior, lead, principal, architect, manager, expert |
| **Employment** | full-time, permanent, part-time, contract, freelance |
| **Work-Mode** | remote, wfh, onsite, hybrid, distributed |

### Quick Reference: 6-Factor Matching

```
Skill (40%) = (matched_skills / required_skills) * 40
Role (20%) = category_match ? 20 : 10
Level (15%) = experience_level_fit * 15
Experience (10%) = (user_years / required_years) * 10 (max 10)
Location (10%) = exact_match ? 10 : willing_relocate ? 5 : 0
WorkMode (5%) = preference_match ? 5 : capable_match ? 2.5 : 0
```

### Quick Reference: Error Codes

```
400 - Bad Request (validation failed)
401 - Unauthorized (token missing/invalid)
403 - Forbidden (no permission)
404 - Not Found (resource doesn't exist)
429 - Too Many Requests (rate limited)
500 - Internal Server Error
503 - Service Unavailable
```

---

## ✨ SUCCESS METRICS

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | <200ms | - |
| Job Scrape (11 buckets) | <2 minutes | - |
| Resume Parse + Match | <5 seconds | - |
| Match 10k jobs | <5 seconds | - |
| Email Send | <1 second | - |
| Page Load Time | <2 seconds | - |
| Database Query | <50ms | - |

### Quality Targets

| Metric | Target | Current |
|--------|--------|---------|
| Code Coverage | >80% | - |
| API Uptime | 99.9% | - |
| Match Accuracy | >85% | - |
| Test Success Rate | 100% | - |
| Incident Response | <1 hour | - |

---

## 🎉 CONCLUSION

JobIntel is a comprehensive job aggregation platform with intelligent matching. This master README provides complete context for all 5 phases of development.

**Total Deliverables:**
- ✅ 16 MongoDB models with complete schemas
- ✅ 34 REST API endpoints fully specified
- ✅ 5 implementation phases with detailed tasks
- ✅ 6-factor transparent matching algorithm
- ✅ Multi-channel notification system
- ✅ Resume parsing with auto-matching
- ✅ Complete database architecture
- ✅ Deployment & CI/CD guide
- ✅ Testing & quality assurance guide
- ✅ Troubleshooting & reference guides

**Start with Phase 1** - it blocks all other phases. Once infrastructure is ready, Phases 2-5 can run in parallel.

**Questions?** Refer to phase-specific READMEs:
- PHASE1_README.md - Infrastructure setup
- PHASE2_README.md - API endpoints
- PHASE3_README.md - Core business logic
- PHASE4_README.md - Resume parsing
- PHASE5_README.md - Notifications

---

**Ready to build the future of job matching!** 🚀

