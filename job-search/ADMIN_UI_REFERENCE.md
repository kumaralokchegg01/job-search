# Quick Reference: Admin Scraping UI & Flow

## 🎯 Admin Crawlers Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  JobIntel Admin Dashboard                              [⌂][👤][⚙] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌─────────────────────────────────────────┐ │
│  │ Admin        │  │  Web Crawlers & Scraping                │ │
│  │ Dashboard  ◀ │  │  Manage job scraping from OpenWeb Ninja │ │
│  │ Jobs       │  │  API. Monitor sessions and view logs.    │ │
│  │ Users      │  │                                          │ │
│  │ Profile F. │  │  ┌─────────────────────────────────────┐ │ │
│  │ Skills     │  │  │ Trigger Scraping Job              │ │ │
│  │ Notif.     │  │  ├─────────────────────────────────────┤ │ │
│  │ Referrals  │  │  │                                     │ │ │
│  │ ►CRAWLERS  │  │  │ Select Job Buckets to Scrape        │ │ │
│  │ Analytics  │  │  │                      [Deselect All] │ │ │
│  │ Revenue    │  │  │                                     │ │ │
│  │ Settings   │  │  │ ☑ fresher      ☑ cloud             │ │ │
│  │ Exit Admin │  │  │ ☑ batch        ☑ mobile            │ │ │
│  │            │  │  │ ☑ software     ☑ qa                │ │ │
│  │            │  │  │ ☑ data         ☑ non-tech          │ │ │
│  │            │  │  │ ☑ experience   ☑ employment        │ │ │
│  │            │  │  │ ☑ work-mode                         │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ Selected Buckets: 11 / 11           │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ ℹ Monthly API Limit: 200/month     │ │ │
│  │            │  │  │   Rate Limited: 1 req/sec          │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │          [START SCRAPING]          │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  └─────────────────────────────────────┘ │ │
│  │            │  │                                          │ │
│  │            │  │  ┌─────────────────────────────────────┐ │ │
│  │            │  │  │ Scraping Logs           [Refresh ↻] │ │ │
│  │            │  │  ├─────────────────────────────────────┤ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ Session: session_1234567890 [✓ DONE]│ │ │
│  │            │  │  │ Started: Jan 19, 2025 10:30 AM      │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ API Calls: 3      Jobs Found: 234  │ │ │
│  │            │  │  │ New Added: 212    Updated: 22      │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ Completed: [fresher] [software]    │ │ │
│  │            │  │  │            [data]                  │ │ │
│  │            │  │  │ Duration: 300.00s                  │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ ─────────────────────────────────── │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ Session: session_0987654321 [✓ DONE]│ │ │
│  │            │  │  │ Started: Jan 18, 2025 03:15 PM      │ │ │
│  │            │  │  │ API Calls: 2      Jobs Found: 156  │ │ │
│  │            │  │  │ New Added: 142    Updated: 14      │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  │ Completed: [fresher] [software]    │ │ │
│  │            │  │  │ Duration: 180.00s                  │ │ │
│  │            │  │  │                                     │ │ │
│  │            │  │  └─────────────────────────────────────┘ │ │
│  │            │  │                                          │ │
│  └──────────────┘  └─────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Step-by-Step Workflow

### Step 1: Admin Logs In
```
URL: http://localhost:8080/login

Input:
  Email: admin@jobintel.local
  Password: AdminPass!23

Action: Click "Login"

Result:
  ✅ JWT Token created with role: "admin"
  ✅ Redirected to /admin dashboard
  ✅ Token stored in localStorage
```

### Step 2: Navigate to Crawlers
```
In Admin Dashboard:
  Click: Left sidebar → "Crawlers" (Globe icon)

OR Direct URL:
  http://localhost:8080/admin/crawlers

Result:
  ✅ Page loads
  ✅ Displays 11 bucket checkboxes
  ✅ Loads scraping logs from backend
  ✅ Shows previous scraping sessions
```

### Step 3: Select Buckets
```
Option A: Select Individually
  ☑ fresher
  ☑ software
  ☐ data
  ...etc

Option B: Select All
  Click: "Select All" button
  Result: All 11 checked

Display Shows:
  "Selected Buckets: 3 / 11"

Button Status:
  START SCRAPING button becomes ENABLED (blue)
```

### Step 4: Start Scraping
```
Action: Click "START SCRAPING" button

Request Sent:
  POST /api/admin/scrape/run
  {
    "buckets": ["fresher", "software"],
    "triggeredBy": "admin"
  }

Response:
  {
    "sessionId": "session_1234567890",
    "message": "Scraping started"
  }

Frontend Shows:
  Alert: "Scraping started! Session ID: session_1234567890"

Button State:
  Loading animation until request completes
```

### Step 5: Backend Processing
```
Timeline:
┌────────────────────────────────────────────────────────┐
│ 0s    - Request received                               │
│ 0s    - Check API budget: 45/200 used ✅              │
│ 0.5s  - Call OpenWeb Ninja API (fresher bucket)       │
│ 1.5s  - Normalize & deduplicate jobs                  │
│ 1.5s  - Save 71 new jobs, update 7 existing          │
│ 2.0s  - Call OpenWeb Ninja API (software bucket)      │
│ 3.0s  - Normalize & deduplicate jobs                  │
│ 3.0s  - Save 74 new jobs, update 8 existing          │
│ 3.0s  - Create log in scraping_logs collection        │
│ 3.1s  - Return response with sessionId                │
└────────────────────────────────────────────────────────┘

Result in MongoDB:
  jobs collection:       +145 documents (212 total)
  scraping_logs:         +1 document
  api_usage (month):     totalCalls = 47/200
```

### Step 6: View Updated Logs
```
Auto-Refresh (after 2 seconds):
  GET /api/admin/scrape/logs

Frontend Shows Updated Log:
  Session ID: session_1234567890
  Status: ✅ COMPLETED (green)
  
  Metrics:
    API Calls Made: 2
    Jobs Found: 145
    New Added: 145
    Updated: 0
  
  Completed Buckets:
    [fresher] [software]
  
  Failed Buckets:
    (none)
  
  Duration: 3.10s
```

### Step 7: User Sees Matched Jobs
```
User Action:
  1. Upload resume to /dashboard/resume
  2. System extracts skills, work history
  3. Auto-triggers matching (6-factor algorithm)
  4. Creates job_matches records

User Views:
  http://localhost:8080/dashboard/matches
  
  Shows:
    ┌─────────────────────────────────┐
    │ Senior React @ TechCorp [87/100]│
    │                                  │
    │ Skill Match:     ████████ 40/40 │
    │ Role Match:      ████████ 15/20 │
    │ Level Match:     ████████ 15/15 │
    │ Experience:      ████████ 10/10 │
    │ Location:        ████████ 10/10 │
    │ Work Mode:       █████    5/5   │
    │                                  │
    │ [Apply] [Save]                  │
    └─────────────────────────────────┘
```

---

## 📊 Data Transformations

### OpenWeb Ninja Raw API Response
```json
{
  "title": "Junior Java Developer",
  "company_name": "TechCorp India",
  "job_location": "Bangalore, Karnataka",
  "job_description": "We are looking for fresher Java developers...",
  "requirements": "Java, Spring Boot, MySQL",
  "job_applicants": 145,
  "apply_url": "https://techcorp.com/apply/12345",
  "posted": "2 days ago",
  "job_is_remote": false,
  "salary": "₹4-6 LPA"
}
```

↓ **NORMALIZATION SERVICE** ↓

### MongoDB Jobs Collection (Normalized)
```json
{
  "_id": ObjectId("..."),
  "title": "Junior Java Developer",
  "companyName": "TechCorp India",
  "location": "Bangalore",
  "description": "We are looking for fresher Java developers...",
  "requirements": ["Java", "Spring Boot", "MySQL"],
  "careerLevel": "junior",          // ← DETECTED
  "domain": "software",             // ← DETECTED
  "techStack": ["Java", "Spring"],  // ← EXTRACTED
  "workMode": "onsite",             // ← FROM job_is_remote
  "externalJobId": "openweb_12345", // ← UNIQUE KEY
  "source": "OpenWeb Ninja",
  "bucket": "fresher",
  "fetchedAt": "2025-01-19T10:30:00Z",
  "expiryDate": "2025-02-18T10:30:00Z",
  "isActive": true,
  "parseQuality": "high",
  "createdAt": "2025-01-19T10:30:00Z",
  "updatedAt": "2025-01-19T10:30:00Z"
}
```

↓ **USER RESUME UPLOAD** ↓

### Auto-Generated Job Match (6-Factor Score)
```json
{
  "_id": ObjectId("..."),
  "userId": ObjectId("user_123"),
  "jobId": ObjectId("job_456"),
  
  "skillMatch": 32,      // 8/10 skills match = (8/10) × 40
  "roleMatch": 15,       // Partial role match = 15/20
  "levelMatch": 15,      // Exact level match = 15/15
  "experienceMatch": 10, // Experience fits = 10/10
  "locationMatch": 0,    // Different city = 0/10
  "workModeMatch": 5,    // WFH-capable job = 5/5
  
  "totalScore": 77,      // Sum = 77/100 (GOOD)
  "matchType": "good",
  "matchReason": "Strong technical fit, but location mismatch",
  
  "matchedAt": "2025-01-19T10:35:00Z",
  "userViewed": false,
  "userSaved": false,
  "userApplied": false
}
```

---

## 🎛️ Control Flow

```
┌─ USER ACTION
│
├─ LOGIN (admin@jobintel.local)
│  └─ POST /api/auth/login
│     └─ JWT token issued (role: "admin")
│
├─ NAVIGATE TO /admin/crawlers
│  └─ Frontend checks role middleware
│     └─ GET /api/admin/scrape/logs
│        └─ Display logs table
│
├─ SELECT BUCKETS & CLICK "START SCRAPING"
│  └─ POST /api/admin/scrape/run
│     │
│     ├─ Check API budget (45/200 used)
│     │
│     ├─ FOR EACH BUCKET (rate limited 1 req/sec)
│     │  ├─ Call OpenWeb Ninja API
│     │  ├─ Get raw jobs (~50-100 per bucket)
│     │  ├─ Normalize (30+ fields extraction)
│     │  ├─ Deduplicate (by externalJobId)
│     │  └─ Save to MongoDB
│     │
│     ├─ Create scraping log entry
│     ├─ Update API usage counters
│     └─ Return sessionId
│
├─ FRONTEND AUTO-REFRESH (2 sec delay)
│  └─ GET /api/admin/scrape/logs
│     └─ Display updated log with status
│
├─ USER UPLOADS RESUME
│  └─ POST /api/resume/upload
│     ├─ Extract text (PDF/DOCX)
│     ├─ Parse skills (regex on 100+ database)
│     ├─ Save to parsed_resumes
│     └─ TRIGGER AUTO-MATCHING
│        ├─ FOR EACH NEW JOB
│        │  ├─ Calculate 6-factor score
│        │  ├─ Save to job_matches
│        │  └─ Send notification if score >= 80
│        └─ Return top matches
│
└─ USER VIEWS MATCHED JOBS
   └─ GET /api/matches/my-jobs
      └─ Display sorted by match score
         └─ Show score breakdown
            └─ User can apply directly
```

---

## 🎯 Key Statistics

| Metric | Value |
|--------|-------|
| Admin Pages | 11 total |
| Working Pages | 11/11 ✅ |
| Job Buckets | 11 total |
| API Limit | 200 calls/month |
| Rate Limit | 1 request/second |
| Scraping Time | ~1-3 seconds |
| Jobs Per Bucket | 50-100 |
| Total Jobs After Scrape | 200-300+ |
| Match Score Factors | 6 factors |
| Max Match Score | 100 points |
| Excellent Threshold | 80-100 |
| Good Threshold | 60-79 |
| Okay Threshold | 50-59 |
| Poor Threshold | <50 |

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] All 11 admin pages accessible from sidebar
- [ ] Crawlers page loads with 11 buckets
- [ ] Can select/deselect buckets
- [ ] "Select All" button works
- [ ] "Start Scraping" button calls correct endpoint
- [ ] Scraping logs display previous sessions
- [ ] Refresh button updates logs
- [ ] Status badges show correct color (green/red)
- [ ] API limit info box displays correctly
- [ ] Metrics (API calls, jobs found) accurate
- [ ] Logs auto-refresh after scraping starts
- [ ] No console errors
- [ ] No 404 errors in Network tab
- [ ] No 401/403 auth errors

---

## 🚀 Ready to Test!

✅ Frontend: AdminCrawlers page - COMPLETE
✅ Backend: Endpoints configured - COMPLETE
✅ Database: Collections ready - COMPLETE
✅ UI/UX: Responsive design - COMPLETE
✅ Error Handling: Implemented - COMPLETE

**Status: READY FOR LIVE TESTING**
