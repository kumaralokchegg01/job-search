# JobIntel Admin Scraping Workflow - Complete Guide

**Date:** January 19, 2026  
**Version:** 1.0  
**Status:** Based on Phase 2 Analysis

---

## 📋 QUICK ANSWER

✅ **YES** - The Crawlers page IS added to the admin sidebar  
✅ **Path:** `/admin/crawlers`  
✅ **Icon:** Globe icon  
✅ **Position:** 8th item in admin menu

---

## 🎯 HOW ADMIN SCRAPES DATA - COMPLETE WORKFLOW

### Step 1: Admin Navigates to Crawlers Page

**UI Flow:**
```
Admin Dashboard
    ↓
Left Sidebar (AdminSidebar.tsx)
    ↓
Click "Crawlers" menu item (Globe icon)
    ↓
Route: /admin/crawlers
    ↓
AdminCrawlers.tsx component loads
```

**Frontend Page:** `AdminCrawlers.tsx`
- Shows list of current scraping sources
- Form to add new sources/crawler configurations
- Status of crawlers
- Historical logs

---

### Step 2: Trigger Scraping from Admin Dashboard

**What Admin Sees:**
```
┌─────────────────────────────────────────┐
│  Crawler Sources                        │
│  ─────────────────────────────────────  │
│  [ ] Name     | URL     | Selector      │
│  [ ] LinkedIn | https:// | .jobcard    │
│  [ ] Indeed   | https:// | .job-list   │
│  [ ] Stack... | https:// | .job-item   │
│                                         │
│  [+ Add New Crawler]                    │
│  [⚙ Run Crawlers] ← MAIN ACTION        │
│  [📊 Crawler Logs]                      │
└─────────────────────────────────────────┘
```

**Admin Actions:**
1. **Option A:** Click `[Run Crawlers]` button to start immediate scraping
2. **Option B:** Select specific buckets to scrape (fresher, software, data, etc.)
3. **Option C:** View scraping history/logs

---

### Step 3: API Endpoints Called (Backend)

When admin clicks "Run Crawlers", these endpoints are triggered:

#### **Endpoint 1: Start Scraping**
```
POST /api/admin/scrape/run

Request Body:
{
  "buckets": ["fresher", "software", "data", "cloud"],  // 11 possible buckets
  "triggeredBy": "admin"
}

Response:
{
  "sessionId": "abc-123-def-456",  // Unique session ID for tracking
  "message": "Scraping started",
  "status": "in-progress"
}
```

**PHASE 2 Controller Code (adminController.ts):**
```typescript
export async function runCrawlers(req: AuthRequest, res: Response) {
  const { buckets } = req.body;
  
  // Validate buckets
  const validBuckets = [
    'fresher', 'batch', 'software', 'data', 'cloud', 
    'mobile', 'qa', 'non-tech', 'experience', 'employment', 'work-mode'
  ];
  
  const invalidBuckets = buckets.filter(b => !validBuckets.includes(b));
  if (invalidBuckets.length > 0) {
    return res.status(400).json({ error: 'Invalid buckets' });
  }

  // Queue scraping job
  const sessionId = uuidv4();
  await scrapingQueue.add('scrape', { 
    buckets, 
    sessionId,
    triggeredByUserId: req.userId 
  });

  res.json({ sessionId, message: 'Scraping started', status: 'in-progress' });
}
```

---

### Step 4: Backend Processing (OpenWeb Ninja Integration)

**Flow Chart:**
```
Backend Receives Scraping Request
  ↓
[BullMQ Job Queue] - Queues the scraping task
  ↓
[Rate Limiter] - Checks API budget (200 calls/month)
  ↓
[OpenWeb Ninja Client] - Makes API calls (1 request/second)
  ↓
FOR EACH BUCKET (11 total):
  ├─ Query OpenWeb Ninja API with bucket keyword
  ├─ Receive raw job data
  ├─ Store in Redis queue temporarily
  └─ Move to normalization
  ↓
[Job Normalization Service] - Extract 30+ fields
  ├─ Parse career level (fresher/junior/mid/senior)
  ├─ Detect domain (software/data/cloud/mobile/qa)
  ├─ Extract tech stack (React, Node.js, AWS, etc)
  ├─ Set expiry date (30 days from now)
  └─ Calculate confidence score
  ↓
[Deduplication Service] - Check for duplicates
  ├─ Look up externalJobId in MongoDB
  ├─ If NEW: Insert new job document
  ├─ If DUPLICATE: Update existing job with latest info
  └─ Prevent duplicate job listings
  ↓
[MongoDB] - Store normalized jobs
  Collection: "jobs"
  ├─ Fields: title, company, location, skills, careerLevel...
  ├─ Index by externalJobId (unique constraint)
  └─ Mark isActive = true
  ↓
[API Usage Tracker] - Record this call
  ├─ Increment totalCallsUsed
  ├─ Check if over 200 limit (HARD STOP)
  └─ Log bucket, keyword, result count
  ↓
[Scraping Log] - Record session details
  ├─ Start time, end time
  ├─ Jobs found, new jobs added, updated
  ├─ Success/failure status
  └─ Any errors or rate limit issues
```

---

### Step 5: Admin Monitors Progress

#### **Endpoint 2: Check Scraping Status**
```
GET /api/admin/scrape/status/:sessionId

Response:
{
  "sessionId": "abc-123-def-456",
  "status": "in-progress",     // or "completed", "failed", "partial"
  "progress": 45,               // percentage 0-100
  "bucketsCompleted": ["fresher", "batch", "software"],
  "bucketsFailed": [],
  "totalJobsFound": 245,
  "newJobsAdded": 189,
  "jobsUpdated": 56,
  "estimatedTimeRemaining": "5 minutes"
}
```

**Frontend Updates:**
Admin sees a progress bar showing real-time status:
```
├─ Fresher: ✅ Completed (34 jobs)
├─ Batch: ✅ Completed (12 jobs)
├─ Software: ⏳ In Progress... (45%)
├─ Data: ⏱ Queued...
└─ Cloud: ⏱ Queued...

Overall: 45% Complete
ETA: 5 minutes
Jobs Found: 245 | New: 189 | Updated: 56
```

---

### Step 6: Scraping Completes

#### **Endpoint 3: Get Scraping Logs**
```
GET /api/admin/scrape/logs

Response:
{
  "logs": [
    {
      "sessionId": "abc-123-def-456",
      "startedAt": "2025-01-19T10:30:00Z",
      "completedAt": "2025-01-19T10:35:45Z",
      "duration": "5 minutes 45 seconds",
      "status": "completed",
      "buckets": ["fresher", "batch", "software", "data", "cloud"],
      "totalApiCalls": 11,
      "totalJobsFound": 245,
      "newJobsAdded": 189,
      "jobsUpdated": 56,
      "apiCallsUsed": 11,
      "apiCallsRemaining": 189,  // Out of 200/month
      "triggeredBy": "admin"
    }
  ],
  "total": 1
}
```

---

### Step 7: Jobs Saved to MongoDB

**Collection: `jobs`**
```javascript
{
  _id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1"),
  
  // From API
  externalJobId: "openwebninja_12345",
  source: "OpenWeb Ninja JSearch API",
  bucket: "fresher",
  
  // Normalized Data
  title: "Junior Full Stack Developer",
  companyName: "TechCorp India",
  location: "Bangalore",
  
  // Extracted Fields
  careerLevel: "fresher",
  domain: "software",
  techStack: ["React", "Node.js", "MongoDB", "AWS"],
  experienceRequired: 0,
  workMode: "hybrid",
  
  // Metadata
  description: "...",
  requirements: ["React", "JavaScript", "Communication"],
  responsibilities: ["Develop features", "Debug issues", "Write tests"],
  applyUrl: "https://company.com/apply/123",
  
  // Lifecycle
  fetchedAt: 2025-01-19T10:35:00Z,
  expiryDate: 2025-02-18T10:35:00Z,  // 30 days
  isActive: true,
  parseQuality: "high",
  parseConfidence: 92,
  
  createdAt: 2025-01-19T10:35:00Z,
  updatedAt: 2025-01-19T10:35:00Z
}
```

---

### Step 8: Matching Begins (Automatic)

**Background Process (Phase 3):**
```
MongoDB receives new jobs
  ↓
For each new job, trigger batch matching:
  ├─ Query all users with uploaded resumes
  ├─ Calculate 6-factor match score for each user
  ├─ Store matches in job_matches collection
  └─ Create notifications
  ↓
Create JobMatch Documents:
{
  userId: "user123",
  jobId: "job456",
  skillMatch: 40,        // 0-40 points
  roleMatch: 18,         // 0-20 points
  levelMatch: 15,        // 0-15 points
  experienceMatch: 8,    // 0-10 points
  locationMatch: 10,     // 0-10 points
  workModeMatch: 5,      // 0-5 points
  totalScore: 96,        // Total: 0-100
  matchType: "excellent" // ⭐⭐⭐
}
```

---

### Step 9: Users See Matched Jobs (Frontend)

**User Dashboard Flow:**
```
User logs in to /dashboard
  ↓
Clicks "My Matches" or "/matches"
  ↓
Frontend calls: GET /api/matching/my-jobs
  ↓
Shows matched jobs sorted by score:
  
┌──────────────────────────────────────┐
│ 🟢 Excellent Match (96/100)          │
│ Junior Full Stack Developer          │
│ TechCorp India | Bangalore | Hybrid  │
│                                      │
│ Skills: 40/40 ✅                     │
│ Role: 18/20 ✅                       │
│ Level: 15/15 ✅                      │
│ Location: 10/10 ✅                   │
│                                      │
│ [View Details] [Save] [Apply]       │
└──────────────────────────────────────┘
```

---

## 📊 11 JOB BUCKETS EXPLAINED

When admin clicks "Run Crawlers", these 11 buckets are scraped:

| Bucket | Keywords | Example |
|--------|----------|---------|
| **1. Fresher** | entry, junior, graduate, trainee | Junior Developer, Fresher Engineer |
| **2. Batch** | batch, campus, intern, placement | Campus Hiring, Internship Program |
| **3. Software** | developer, engineer, python, java | Software Engineer, Full Stack Dev |
| **4. Data** | data, analytics, science, ml, ai | Data Scientist, ML Engineer |
| **5. Cloud** | cloud, devops, aws, azure, gcp | DevOps Engineer, Cloud Architect |
| **6. Mobile** | mobile, ios, android, react-native | iOS Developer, Mobile Engineer |
| **7. QA** | qa, test, automation, quality | QA Engineer, Test Automation |
| **8. Non-Tech** | sales, hr, marketing, support | Sales Executive, HR Manager |
| **9. Experience** | senior, lead, principal, expert | Senior Developer, Tech Lead |
| **10. Employment** | full-time, part-time, contract | Full-time, Contract Based |
| **11. Work-Mode** | remote, wfh, onsite, hybrid | Remote, WFH, Hybrid |

---

## 🔐 ADMIN SIDEBAR - COMPLETE MENU

**File:** `AdminSidebar.tsx`

```
Navigation Items (11 total):
├─ 📊 Dashboard (/admin)
├─ 💼 Jobs (/admin/jobs)
├─ 👥 Users (/admin/users)
├─ 📄 Profile Fields (/admin/profile-fields)
├─ 🏆 Skills (/admin/skills)
├─ 🔔 Notifications (/admin/notifications)
├─ 🤝 Referrals (/admin/referrals)
├─ 🌐 Crawlers (/admin/crawlers)         ← SCRAPING PAGE
├─ 📈 Analytics (/admin/analytics)
├─ 💳 Revenue (/admin/revenue)
├─ ⚙️ Settings (/admin/settings)
└─ Exit Admin ← Logout button
```

---

## 🚀 API RATE LIMITING - CRITICAL CONSTRAINT

**Monthly Budget:** 200 API calls/month (OpenWeb Ninja Free Tier)

**How It Works:**

```
API Usage Collection: api_usage
{
  month: "2025-01",
  totalCallsUsed: 45,      // Current month usage
  monthlyLimit: 200,       // Admin-configurable
  callsRemaining: 155,     // 200 - 45
  
  isWarningTriggered: false,    // True at 80% (160 calls)
  isLimitReached: false,        // True at 200% (HARD STOP)
  
  callHistory: [
    {
      timestamp: "2025-01-19T10:35:00Z",
      bucket: "fresher",
      resultCount: 23,
      status: "success",
      initiatedBy: "admin_user_id"
    },
    // ... more calls
  ]
}
```

**Admin Checks Usage:**
```
GET /api/admin/api-usage

Response:
{
  "totalCallsUsed": 45,
  "monthlyLimit": 200,
  "callsRemaining": 155,
  "percentageUsed": 22.5,
  "isWarningTriggered": false,      // Warning at 80%
  "isLimitReached": false,          // Hard stop at 100%
  "safetyThreshold": 160            // 80% of 200
}
```

**Frontend Display:**
```
┌─────────────────────────────┐
│ API Usage This Month        │
│ ─────────────────────────   │
│ [████░░░░░░░░░░░░] 45/200  │
│ 22.5% used | 155 remaining  │
│                             │
│ Status: ✅ Good to scrape   │
│ Next Reset: Feb 01, 2025    │
└─────────────────────────────┘
```

---

## 📱 ADMIN CRAWLERS PAGE - UI COMPONENTS

**File:** `AdminCrawlers.tsx`

**Page Structure:**
```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard > Crawlers                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  [1] 📊 API Usage Status                        │
│      ├─ Total Calls Used: 45/200               │
│      ├─ Calls Remaining: 155                    │
│      └─ Status: ✅ Good                         │
│                                                  │
│  [2] ⚙️ Quick Actions                          │
│      ├─ [Run All Crawlers]   ← MAIN BUTTON     │
│      ├─ [Select Buckets]     ← Custom selection │
│      ├─ [Cancel Active Job]  ← If running      │
│      └─ [View Logs]          ← History         │
│                                                  │
│  [3] 🔍 Crawler Sources                        │
│      ├─ LinkedIn Sources                        │
│      ├─ Indeed Sources                          │
│      ├─ Stack Overflow Sources                  │
│      └─ [+ Add New Source]   ← Custom sources  │
│                                                  │
│  [4] 📋 Scraping History                       │
│      ├─ Session ID | Date | Status | Jobs Found│
│      ├─ abc-123 | Jan 19 | ✅ Complete | 245  │
│      ├─ def-456 | Jan 18 | ✅ Complete | 189  │
│      └─ ghi-789 | Jan 17 | ✅ Complete | 212  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔄 COMPLETE USER JOURNEY AFTER SCRAPING

```
1️⃣ ADMIN SCRAPES DATA
   └─ Clicks "Run Crawlers" on /admin/crawlers

2️⃣ DATA STORED TO MONGODB
   └─ Jobs collection has 10,000+ new jobs

3️⃣ MATCHING TRIGGERED (Automatic)
   └─ For each user with resume:
      ├─ Calculate 6-factor match for each job
      ├─ Filter jobs with score >= 50%
      ├─ Create JobMatch documents
      └─ Queue notifications (email, WhatsApp, Telegram)

4️⃣ USER SEES NOTIFICATIONS
   └─ Email: "🔥 You have 12 new job matches!"
   └─ WhatsApp: "Hey! Check out 12 jobs tailored for you"

5️⃣ USER VIEWS MATCHES
   └─ Goes to /matches
   └─ Sees jobs sorted by match score
   └─ Filters by: excellent (80+), good (60-79), okay (50-59)

6️⃣ USER APPLIES FOR JOB
   └─ Clicks [Apply]
   └─ Redirected to job's apply URL (LinkedIn, Indeed, etc)
   └─ Job marked as "applied" in SavedJobs

7️⃣ ADMIN SEES ANALYTICS
   └─ Views /admin/analytics
   └─ Tracks: Matches created, Notifications sent, Applications
```

---

## ✅ ADMIN SCRAPING - QUICK REFERENCE

| Question | Answer |
|----------|--------|
| **Page Location?** | `/admin/crawlers` |
| **Sidebar Item?** | YES - "Crawlers" with Globe icon (8th position) |
| **How to access?** | Login as admin → Click "Crawlers" in sidebar |
| **What does it do?** | Triggers scraping of 11 job buckets from OpenWeb Ninja |
| **Rate limit?** | 200 calls/month (OpenWeb Ninja free tier) |
| **Who scrapes?** | Admin triggers manually (or cron job automatically) |
| **Data stored?** | MongoDB `jobs` collection |
| **Users see matches?** | YES - Automatically matched and notified |
| **Real-time progress?** | YES - Progress bar shows status |
| **Can cancel?** | YES - `POST /api/admin/scrape/cancel/:sessionId` |
| **View history?** | YES - `GET /api/admin/scrape/logs` |

---

## 🎓 PHASE REFERENCE

| Phase | What Happens |
|-------|--------------|
| **Phase 1** | Infrastructure setup, database schema, API client |
| **Phase 2** | Admin scraping endpoints + UI page created ✅ |
| **Phase 3** | Job normalization, matching algorithm (you're here) |
| **Phase 4** | Resume parsing, auto-matching (you're here) |
| **Phase 5** | Notifications (email, WhatsApp, Telegram) |

---

**Summary:** Admin scrapes by clicking one button → Jobs saved to MongoDB → Users get automatic match notifications → Users see matched jobs on dashboard → Users apply → Admin sees analytics. All controlled from the admin dashboard "Crawlers" page! 🚀

