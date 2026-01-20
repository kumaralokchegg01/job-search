# How Admin Scrapes Data: Complete Walkthrough

## 📍 Admin Dashboard Entry Point

### Step 1: Admin Logs In
```
URL: http://localhost:8080/login
Email: admin@jobintel.local
Password: AdminPass!23
```

**What happens:**
- Backend authenticates credentials
- Creates JWT token with `role: "admin"`
- Stores token in localStorage
- Redirects to `/admin` dashboard

---

## 🎯 Navigate to Crawlers Page

### Step 2: Open Admin Sidebar
```
URL: http://localhost:8080/admin
```

**You see:**
- Left sidebar with 11 menu items
- Top navbar with admin controls
- Main content area

### Step 3: Click "Crawlers" in Sidebar
```
Click: Globe icon + "Crawlers" text
OR
Navigate directly to: http://localhost:8080/admin/crawlers
```

**Page loads with:**
- ✅ "Web Crawlers & Scraping" title
- ✅ "Trigger Scraping Job" card
- ✅ 11 job bucket checkboxes
- ✅ "Start Scraping" button
- ✅ "Scraping Logs" table below

---

## 🚀 Trigger Scraping Job

### Step 4: Select Job Buckets

**Option A: Select Individual Buckets**
```
☑ fresher
☑ software  
☑ data
☐ cloud
☐ mobile
...
```

**Option B: Select All**
```
Click "Select All" button
→ All 11 buckets checked
```

**Available Buckets:**
1. **fresher** - Entry-level jobs (0-1 years)
2. **batch** - Campus/batch hiring
3. **software** - Developer/engineer roles
4. **data** - Data scientist/engineer roles
5. **cloud** - DevOps/cloud engineer roles
6. **mobile** - Mobile app developer roles
7. **qa** - QA/testing engineer roles
8. **non-tech** - Non-technical roles
9. **experience** - Senior/experienced roles
10. **employment** - Full-time/part-time/contract
11. **work-mode** - Remote/hybrid/onsite

### Step 5: Review API Usage Info
```
Info Box Shows:
┌─────────────────────────────────┐
│ Monthly API Limit: 200 calls/month
│ Rate Limited: 1 request/sec
│ Selected Buckets: 3 / 11        │
└─────────────────────────────────┘
```

---

## ▶️ Start Scraping

### Step 6: Click "Start Scraping" Button

```typescript
// Frontend Action
POST /api/admin/scrape/run
{
  "buckets": ["fresher", "software", "data"],
  "triggeredBy": "admin"
}
```

**Frontend shows:**
- Button loading state
- Alert: "Scraping started! Session ID: session_1234567890"

---

## 🔄 Backend Processing

### Step 7: API Budget Check

```typescript
// Backend checks monthly limit
if (apiUsage.totalCallsUsed >= 200) {
  throw Error("Monthly API limit reached");
}
```

**Current Usage Example:**
- Used: 45 calls
- Limit: 200 calls
- Remaining: 155 calls ✅

### Step 8: For Each Selected Bucket

```typescript
// Rate Limited: 1 request per second
for (const bucket of ["fresher", "software", "data"]) {
  
  // Call OpenWeb Ninja API
  const response = await openWebNinjaClient.search({
    q: BUCKET_KEYWORD[bucket], // e.g., "fresher developer"
    country: "in",
    limit: 100,
    ...
  });

  // Result: ~50-100 jobs per bucket
  const rawJobs = response.data; // Array of raw job objects
  
  // For each job:
  for (const rawJob of rawJobs) {
    
    // 1. NORMALIZE: Extract 30+ fields
    const normalized = jobNormalizationService.normalize(rawJob);
    // Result example:
    // {
    //   title: "Senior React Developer",
    //   careerLevel: "senior",
    //   domain: "software",
    //   techStack: ["React", "Node.js", "MongoDB"],
    //   workMode: "remote",
    //   externalJobId: "openweb_12345", // UNIQUE KEY
    //   ...
    // }

    // 2. DEDUPLICATE: Check if already in DB
    const existing = await Job.findOne({
      externalJobId: normalized.externalJobId
    });

    if (!existing) {
      // NEW JOB: Insert
      await Job.create(normalized);
      newJobsAdded++;
    } else {
      // DUPLICATE: Update with latest info
      await Job.updateOne(
        { externalJobId: normalized.externalJobId },
        normalized
      );
      jobsUpdated++;
    }
  }

  // Wait 1 second before next bucket (rate limit)
  await delay(1000);
}
```

---

## 📊 Example: Scraping "Fresher" Bucket

```javascript
// Raw API Response from OpenWeb Ninja
[
  {
    "title": "Junior Java Developer",
    "company": "TechCorp",
    "location": "Bangalore",
    "description": "Looking for fresher Java developers...",
    "job_is_remote": false,
    "salary": "₹4-6 LPA",
    "apply_url": "https://...",
    ...
  },
  {
    "title": "Fresher Python Developer",
    "company": "CloudTech",
    "location": "Remote",
    ...
  },
  ... (78+ more jobs)
]

↓ NORMALIZATION SERVICE ↓

// Normalized for Database
[
  {
    _id: ObjectId(...),
    title: "Junior Java Developer",
    careerLevel: "fresher",        // Detected from "junior"
    domain: "software",             // Detected from job title
    techStack: ["Java", "Spring"],  // Extracted from description
    workMode: "onsite",             // From job_is_remote: false
    externalJobId: "openweb_123",   // Unique key for deduplication
    source: "OpenWeb Ninja",
    bucket: "fresher",
    fetchedAt: 2025-01-19T10:30Z,
    expiryDate: 2025-02-18T10:30Z,  // 30 days later
    isActive: true,
    ...
  },
  ...
]

↓ SAVED TO MONGODB ↓

Database: jobs collection
- New jobs: 71 added
- Duplicate updates: 7 updated
- Total processed: 78
```

---

## 📝 Create Scraping Log Entry

```typescript
// After completing all buckets, create log
const log = await ScrapingLog.create({
  sessionId: "session_1234567890",
  status: "completed",
  bucketsRequested: ["fresher", "software", "data"],
  bucketsCompleted: ["fresher", "software", "data"],
  bucketsFailed: [],
  totalApiCalls: 3,
  totalJobsFound: 234,      // 78 + 82 + 74
  newJobsAdded: 212,        // 71 + 74 + 67
  jobsUpdated: 22,          // 7 + 8 + 7
  startedAt: "2025-01-19T10:30:00Z",
  completedAt: "2025-01-19T10:35:00Z",
  durationMs: 300000,       // 5 minutes
  triggeredBy: "admin",
  triggeredByUserId: ObjectId("admin_id"),
  bucketDetails: [
    {
      bucket: "fresher",
      apiCallsMade: 1,
      jobsFound: 78,
      newJobsAdded: 71,
      jobsUpdated: 7,
      status: "success"
    },
    {
      bucket: "software",
      apiCallsMade: 1,
      jobsFound: 82,
      newJobsAdded: 74,
      jobsUpdated: 8,
      status: "success"
    },
    {
      bucket: "data",
      apiCallsMade: 1,
      jobsFound: 74,
      newJobsAdded: 67,
      jobsUpdated: 7,
      status: "success"
    }
  ]
});

// API Usage updated
await ApiUsage.updateOne(
  { month: "2025-01" },
  { 
    $inc: { totalCallsUsed: 3 },
    callsRemaining: 197
  }
);
```

---

## 📋 Logs Display in Frontend

### Step 9: View Scraping Logs

**Auto-refresh after 2 seconds**

```
┌─────────────────────────────────────────┐
│ SCRAPING LOGS                  Refresh ↻ │
├─────────────────────────────────────────┤
│
│ Session ID: session_1234567890 [COMPLETED]
│ Started: Jan 19, 2025, 10:30 AM
│
│ API Calls: 3      Jobs Found: 234
│ New Added: 212    Updated: 22
│
│ Completed Buckets: [fresher] [software] [data]
│ Failed Buckets: (none)
│
│ Duration: 300.00s
│
├─────────────────────────────────────────┤
│
│ Session ID: session_0987654321 [COMPLETED]
│ Started: Jan 18, 2025, 3:15 PM
│ ... (previous scraping session)
│
└─────────────────────────────────────────┘
```

---

## 👥 User Sees Matched Jobs

### Step 10: User Uploads Resume

```
URL: http://localhost:8080/dashboard
Click: "Upload Resume"
Select: resume.pdf
```

**Backend Process:**
1. Extract text from PDF/DOCX
2. Parse skills using regex (100+ technology database)
3. Extract work history, education, experience
4. Save to `parsed_resumes` collection
5. **Trigger Auto-Matching:**

```typescript
// For each of 212 NEW JOBS just scraped:
for (const job of newJobs) {
  
  // Calculate 6-factor match score
  const matchScore = calculateMatch(userResume, job);
  
  // Skill Match (40%)
  const userSkills = ["Java", "Spring", "MongoDB"];
  const jobSkills = ["Java", "Spring Boot", "MySQL"];
  skillScore = (2/3) * 40 = 26.67

  // Role Match (20%)
  const userRole = "Backend Developer";
  const jobRole = "Senior Backend Developer";
  roleScore = 15 // Partial match

  // Career Level Match (15%)
  // + Experience Match (10%)
  // + Location Match (10%)
  // + Work Mode Match (5%)
  
  totalScore = 26.67 + 15 + ... = 87 // EXCELLENT
  
  // Save to job_matches collection
  await JobMatch.create({
    userId: user._id,
    jobId: job._id,
    totalScore: 87,
    matchType: "excellent",
    skillScore: 26.67,
    roleScore: 15,
    ...
  });
  
  // Send notification
  if (totalScore >= 80) {
    await notificationService.send({
      userId: user._id,
      type: "excellent_match",
      job: job,
      score: 87
    });
  }
}
```

### Step 11: User Views Matched Jobs

```
URL: http://localhost:8080/dashboard/matches
```

**User sees:**
```
┌────────────────────────────────────────────┐
│ Senior React Developer @ TechCorp [87/100] │
├────────────────────────────────────────────┤
│
│ Skill Match:        ██████████ 40/40
│ Role Match:         ████████   15/20
│ Level Match:        ██████████ 15/15
│ Experience Match:   ██████████ 10/10
│ Location Match:     ██████████ 10/10
│ Work Mode Match:    █████      5/5
│
│ Reason: High skill match + Perfect role fit
│
│ [View Job] [Save] [Apply]
│
└────────────────────────────────────────────┘
```

---

## 🔗 Complete Data Flow Diagram

```
ADMIN DASHBOARD
    ↓
[Admin clicks "Crawlers" sidebar]
    ↓
/admin/crawlers page loads
    ↓
GET /api/admin/scrape/logs
    ↓ (returns existing logs)
    ↓
[Admin selects buckets + clicks "Start Scraping"]
    ↓
POST /api/admin/scrape/run
{
  buckets: ["fresher", "software"],
  triggeredBy: "admin"
}
    ↓ (response: sessionId)
    ↓
[Backend processes in background]
    ├─ OpenWeb Ninja API (rate limited: 1 req/sec)
    ├─ Job Normalization (30+ fields)
    ├─ Deduplication (by externalJobId)
    ├─ MongoDB Save (jobs collection)
    └─ Log Creation (scraping_logs collection)
    ↓
[Frontend auto-refreshes logs]
    ↓
GET /api/admin/scrape/logs
    ↓ (returns: new scraping log with status)
    ↓
[User uploads resume]
    ↓
POST /api/resume/upload
    ├─ Extract text (PDF/DOCX)
    ├─ Parse skills (regex)
    └─ Save to parsed_resumes
    ↓
[Auto-trigger matching]
    ├─ Calculate 6-factor score for each job
    ├─ Create job_matches records
    └─ Send notifications
    ↓
[User sees matched jobs]
    ↓
GET /api/matches/my-jobs
    ↓ (returns: jobs sorted by match score)
    ↓
[Display with score breakdown + apply button]
```

---

## 📌 Key Takeaways

✅ **Admin Workflow:**
1. Login → Open Crawlers → Select buckets → Click "Start"
2. Backend scrapes OpenWeb Ninja API
3. Normalizes jobs (30+ fields)
4. Deduplicates by externalJobId
5. Saves 200+ new jobs to MongoDB
6. Creates audit log

✅ **User Workflow:**
1. Upload resume
2. Auto-matching triggers
3. Calculates 6-factor scores
4. Creates match records
5. Shows matched jobs with score breakdown
6. User applies directly

✅ **Database:**
- **jobs:** 1000s of jobs from scraping
- **parsed_resumes:** User resume data
- **job_matches:** Match scores for each user-job pair
- **scraping_logs:** Audit trail of all scraping sessions
- **api_usage:** Monthly API budget tracking

✅ **API Limits:**
- 200 calls/month (OpenWeb Ninja)
- 1 request/second (rate limiting)
- Warning at 80% (160 calls)
- Hard stop at 200/month

---

## 🎯 Current Status

✅ Phase 1-5 Complete
✅ Admin pages working (11 pages)
✅ Crawlers page: Scraping UI ready
✅ Backend: Endpoints configured
✅ Ready for: Live scraping testing

**Next:** Test with real OpenWeb Ninja API key!
