# Admin Scraping - Quick Reference Summary

## ✅ QUICK ANSWERS

### Q1: Is the Crawlers page in admin sidebar?
**A:** ✅ **YES**
- **Page:** `/admin/crawlers`
- **Label:** "Crawlers"
- **Icon:** Globe 🌐
- **Position:** 8th in menu (after Referrals, before Analytics)
- **File:** `frontend/src/pages/admin/AdminCrawlers.tsx`

---

### Q2: How does admin scrape data?
**A:** 3-step process:

#### Step 1: Navigate
```
Admin Login → Click "Crawlers" in sidebar → /admin/crawlers page loads
```

#### Step 2: Click Button
```
On AdminCrawlers page → Click [RUN CRAWLERS] button
```

#### Step 3: Watch Progress
```
Progress bar shows:
- 45% Complete
- Fresher ✅
- Batch ✅  
- Software ⏳
- Total: 245 jobs found
- New: 189 added
- Updated: 56
```

---

### Q3: Where does scraped data go?
**A:** **MongoDB `jobs` collection**

**Example document:**
```javascript
{
  externalJobId: "openwebninja_12345",  // Unique ID
  title: "Junior Full Stack Developer",
  company: "TechCorp India",
  location: "Bangalore",
  careerLevel: "fresher",
  domain: "software",
  techStack: ["React", "Node.js", "MongoDB"],
  workMode: "hybrid",
  fetchedAt: "2025-01-19T10:35:00Z",
  expiryDate: "2025-02-18T10:35:00Z",  // Expires in 30 days
  isActive: true
}
```

---

### Q4: How do users see matched jobs?
**A:** **Automatic process:**

```
1. Admin scrapes → Jobs saved to MongoDB
                ↓
2. Matching triggered → Calculate scores for all users
                ↓
3. JobMatch created → 6-factor scoring (0-100)
                ↓
4. Notifications sent → Email, WhatsApp, Telegram
                ↓
5. User sees matches → /matches page with scores
```

---

### Q5: What is the 6-factor matching?

| Factor | Points | How it works |
|--------|--------|------------|
| **Skill** | 40 | User skills vs Job requirements |
| **Role** | 20 | User target role vs Job title |
| **Level** | 15 | User experience level vs Job level |
| **Experience** | 10 | User years vs Job required years |
| **Location** | 10 | User location vs Job location |
| **Work Mode** | 5 | User preference vs Job mode |
| **TOTAL** | **100** | Sum of all (0-100 scale) |

**Example:** User with score 84/100 = "Good Match" ⭐⭐

---

### Q6: What are the 11 scraping buckets?

| # | Bucket | Keywords | Jobs |
|----|--------|----------|------|
| 1 | Fresher | entry, junior, graduate | Junior roles |
| 2 | Batch | campus, internship, placement | Batch programs |
| 3 | Software | developer, engineer | Dev roles |
| 4 | Data | data scientist, analytics, ML | Data roles |
| 5 | Cloud | devops, aws, azure | Cloud roles |
| 6 | Mobile | mobile, iOS, Android, React Native | Mobile roles |
| 7 | QA | QA engineer, test automation | QA roles |
| 8 | Non-Tech | sales, HR, marketing | Non-tech roles |
| 9 | Experience | senior, lead, principal | Senior roles |
| 10 | Employment | full-time, part-time, contract | By type |
| 11 | Work-Mode | remote, hybrid, onsite | By mode |

---

### Q7: What's the API rate limit?
**A:** **200 calls/month** (OpenWeb Ninja free tier)

**Tracking:**
```
GET /api/admin/api-usage

Response:
{
  "totalCallsUsed": 45,      // Out of 200
  "callsRemaining": 155,
  "percentageUsed": 22.5%,
  "isWarningTriggered": false,  // True at 80%
  "isLimitReached": false       // True at 100%
}
```

**Hard Stop:** If 200 calls made → No more scraping until next month

---

## 📊 COMPLETE ENDPOINT REFERENCE

### Admin Scraping Endpoints (Phase 2)

```
1. POST /api/admin/scrape/run
   ├─ Start scraping with selected buckets
   ├─ Auth: Admin only
   └─ Response: sessionId, status

2. GET /api/admin/scrape/status/:sessionId
   ├─ Check scraping progress (real-time)
   ├─ Auth: Admin only
   └─ Response: progress %, buckets, job count

3. POST /api/admin/scrape/cancel/:sessionId
   ├─ Stop running scrape
   ├─ Auth: Admin only
   └─ Response: Cancelled message

4. GET /api/admin/scrape/logs
   ├─ View history of all scraping sessions
   ├─ Auth: Admin only
   └─ Response: Array of scraping logs
```

### API Usage Endpoints (Phase 2)

```
1. GET /api/admin/api-usage
   ├─ Get current month's usage
   ├─ Auth: Admin only
   └─ Response: Used/remaining calls

2. POST /api/admin/api-usage/limit
   ├─ Set custom monthly limit
   ├─ Auth: Admin only
   ├─ Body: { monthlyLimit: 150 }
   └─ Response: New limit confirmed

3. GET /api/admin/api-usage/history
   ├─ Get detailed call history
   ├─ Auth: Admin only
   └─ Response: Array of API calls with details
```

---

## 🔄 DATA FLOW SUMMARY

```
┌─────────────┐
│ Admin Click │
│ RUN CRAWLS  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ POST /api/admin/scrape  │
│ + buckets array         │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────────────┐
│ BullMQ Queue (Redis)     │
│ scraping-queue           │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ For each bucket (1-11):          │
│ 1. Check rate limit              │
│ 2. Call OpenWeb Ninja API        │
│ 3. Normalize job data (30+ fields)│
│ 4. Check for duplicates          │
│ 5. Save to MongoDB               │
│ 6. Track API usage               │
└──────┬───────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ MongoDB Collections Updated:   │
│ - jobs (10,000+ docs)          │
│ - api_usage (tracking)         │
│ - scraping_logs (history)      │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Auto-trigger Matching (Phase 3)│
│ For each user:                 │
│ Calculate 6-factor score       │
│ Create job_matches documents   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Notifications (Phase 5)        │
│ - Email                        │
│ - WhatsApp                     │
│ - Telegram                     │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ User sees matches:             │
│ /dashboard/matches             │
│ Sorted by score (high→low)     │
│ Filtered by match type         │
└────────────────────────────────┘
```

---

## 🎯 KEY FILES INVOLVED

### Frontend Files
```
frontend/src/
├─ pages/admin/AdminCrawlers.tsx          ← Main scraping page
├─ components/admin/AdminSidebar.tsx      ← Sidebar with Crawlers link
└─ hooks/useAuthStore.ts                  ← Token management
```

### Backend Files  
```
backend/src/
├─ routes/admin.ts                        ← Admin route definitions
├─ controllers/adminController.ts         ← Scraping logic
├─ services/openWebNinjaClient.ts        ← API client
├─ services/jobNormalizationService.ts   ← Data normalization
├─ services/deduplicationService.ts      ← Duplicate checking
├─ models/Job.ts                         ← Job schema
├─ models/ApiUsage.ts                    ← Usage tracking
└─ models/ScrapingLog.ts                 ← Session logs
```

### Configuration Files
```
backend/
├─ .env                                   ← API keys & env vars
├─ config/queue.ts                       ← BullMQ setup
└─ config/redis.ts                       ← Redis connection
```

---

## 💾 MONGODB COLLECTIONS SCHEMA

### jobs
```javascript
{
  _id: ObjectId,
  externalJobId: String (UNIQUE),
  source: "OpenWeb Ninja",
  bucket: "fresher",
  
  // Core data
  title: String,
  companyName: String,
  location: String,
  applyUrl: String,
  
  // Normalized data
  careerLevel: String,           // fresher/junior/mid/senior
  domain: String,                // software/data/cloud/mobile/qa
  techStack: [String],           // ["React", "Node", "MongoDB"]
  workMode: String,              // remote/hybrid/onsite
  experienceRequired: Number,    // years
  
  // Lifecycle
  fetchedAt: Date,
  expiryDate: Date,              // +30 days
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### api_usage
```javascript
{
  _id: ObjectId,
  month: String,                 // "2025-01"
  totalCallsUsed: Number,        // 0-200
  monthlyLimit: Number,          // default 200
  callsRemaining: Number,        // limit - used
  isWarningTriggered: Boolean,   // at 80%
  isLimitReached: Boolean,       // at 100%
  
  callHistory: [{
    timestamp: Date,
    bucket: String,
    resultCount: Number,
    status: String               // success/failed/rate-limited
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### scraping_logs
```javascript
{
  _id: ObjectId,
  sessionId: String (UNIQUE),
  status: String,                // in-progress/completed/failed
  
  // Stats
  totalJobsFound: Number,
  newJobsAdded: Number,
  jobsUpdated: Number,
  totalApiCalls: Number,
  
  // Buckets
  bucketsRequested: [String],
  bucketsCompleted: [String],
  bucketsFailed: [String],
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
  
  // Details
  bucketDetails: [{
    bucket: String,
    apiCallsMade: Number,
    jobsFound: Number,
    status: String
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⏱️ TIMING REFERENCE

| Activity | Time |
|----------|------|
| Click "Run Crawlers" → Response | <100ms |
| API call per bucket (1 sec delay) | ~1 second |
| Job normalization per job | <10ms |
| MongoDB insert/update | <100ms |
| Total scrape (11 buckets) | ~5-10 mins |
| Poll for status every | 2 seconds |
| Matching (per user-job) | <10ms |
| Batch matching (10k jobs, 100 users) | ~10 seconds |
| Send all notifications | <30 seconds |

---

## 🚀 ADMIN SCRAPING - ONE PAGE SUMMARY

```
┌────────────────────────────────────────────────────────┐
│                  ADMIN SCRAPING WORKFLOW               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  1. LOCATION                                           │
│     Admin Dashboard → Sidebar → Click "Crawlers"      │
│     Route: /admin/crawlers                            │
│                                                        │
│  2. UI ELEMENTS                                        │
│     ├─ API Usage Status: 45/200 calls                │
│     ├─ [RUN CRAWLERS] Button → Trigger scraping     │
│     ├─ Progress Bar (real-time)                       │
│     └─ Scraping History Logs                          │
│                                                        │
│  3. WHAT HAPPENS                                       │
│     Scraping Request                                   │
│           ↓                                            │
│     API calls OpenWeb Ninja (1 call/sec)             │
│           ↓                                            │
│     Normalize 30+ job fields                          │
│           ↓                                            │
│     Deduplicate by externalJobId                      │
│           ↓                                            │
│     Save 10,000+ jobs to MongoDB                      │
│           ↓                                            │
│     Track API usage (200/month limit)                 │
│           ↓                                            │
│     Create scraping log entry                         │
│                                                        │
│  4. DATA STORED                                        │
│     MongoDB collections:                              │
│     ├─ jobs (documents indexed by externalJobId)     │
│     ├─ api_usage (monthly tracking)                   │
│     ├─ scraping_logs (session history)                │
│     └─ job_matches (created after matching)           │
│                                                        │
│  5. USERS GET MATCHES                                  │
│     Auto-matching triggered (Phase 3)                 │
│           ↓                                            │
│     6-factor scoring: 0-100 points                    │
│           ↓                                            │
│     Notifications sent (Phase 5)                      │
│           ↓                                            │
│     Users see on /dashboard/matches                   │
│                                                        │
│  6. RATE LIMIT                                        │
│     OpenWeb Ninja: 200 API calls/month                │
│     Hard stop: No scraping after limit reached        │
│     Warning: Triggered at 80% (160 calls)             │
│     Reset: Monthly on Jan 1, Feb 1, etc              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Created:** January 19, 2026  
**Version:** 1.0 - Quick Reference  
**Status:** Complete Analysis
