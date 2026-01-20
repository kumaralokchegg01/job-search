# PHASE 2 - Admin Scraping Implementation Analysis

**Based on:** PHASE2_README.md  
**Date:** January 19, 2026  
**Focus:** How Admin Scrapes Data Through UI

---

## 📋 PHASE 2 OVERVIEW (From PHASE2_README.md)

**Phase 2 Objective:** Implement all REST API endpoints that connect frontend to database

**Key Stats:**
- Duration: 2-3 weeks (10 days development)
- Endpoints: 50+ total
- Admin Scraping Endpoints: **4 main endpoints**
- Priority: CRITICAL

---

## 🎯 ADMIN SCRAPING - 4 KEY ENDPOINTS (TASK 2.3)

### From PHASE2_README.md - TASK 2.3: Admin Scraping Control Endpoints

#### Endpoint 1: Start Scraping
```typescript
POST /api/admin/scrape/run

Request:
{
  "buckets": ["fresher", "batch", "software", "data", "cloud", ...]
}

Response:
{
  "sessionId": "abc-123-def-456",
  "message": "Scraping started",
  "status": "in-progress"
}
```

**Implementation (from PHASE2_README.md):**
```typescript
export const startScraping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { buckets } = req.body;

  // Validate buckets
  const invalidBuckets = buckets.filter(b => !VALID_BUCKETS.includes(b));
  if (invalidBuckets.length > 0) {
    return res.status(400).json({ error: `Invalid buckets: ${invalidBuckets.join(', ')}` });
  }

  const sessionId = uuidv4();
  
  // Queue to BullMQ
  const scrapingLog = new ScrapingLog({
    sessionId,
    bucketsRequested: buckets,
    triggeredBy: 'admin',
    triggeredByUserId: req.userId,
    status: 'in-progress',
  });
  
  await scrapingLog.save();
  
  // Add to BullMQ queue
  await scrapingQueue.add('scrape', {
    buckets,
    sessionId,
    triggeredByUserId: req.userId
  });
  
  res.json({ sessionId, message: 'Scraping started', status: 'in-progress' });
});
```

---

#### Endpoint 2: Check Scraping Status
```typescript
GET /api/admin/scrape/status/:sessionId

Response:
{
  "sessionId": "abc-123-def-456",
  "status": "in-progress",
  "progress": 45,
  "completedBuckets": ["fresher", "batch", "software"],
  "failedBuckets": [],
  "totalJobsFound": 245,
  "newJobsAdded": 189,
  "jobsUpdated": 56
}
```

**Implementation:**
```typescript
export const getScrapeStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  
  const scrapingLog = await ScrapingLog.findOne({ sessionId });
  if (!scrapingLog) {
    return res.status(404).json({ error: 'Scraping session not found' });
  }

  res.json({
    sessionId,
    status: scrapingLog.status,
    progress: scrapingLog.progress || 0,
    completedBuckets: scrapingLog.bucketsCompleted,
    failedBuckets: scrapingLog.bucketsFailed,
    totalJobsFound: scrapingLog.totalJobsFound,
    newJobsAdded: scrapingLog.newJobsAdded,
    jobsUpdated: scrapingLog.jobsUpdated,
  });
});
```

---

#### Endpoint 3: Cancel Scraping
```typescript
POST /api/admin/scrape/cancel

Request:
{
  "sessionId": "abc-123-def-456"
}

Response:
{
  "message": "Scraping cancelled"
}
```

**Implementation:**
```typescript
export const cancelScrape = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.body;
  
  const scrapingLog = await ScrapingLog.findOne({ sessionId });
  if (!scrapingLog) {
    return res.status(404).json({ error: 'Scraping session not found' });
  }

  if (scrapingLog.status !== 'in-progress') {
    return res.status(400).json({ error: 'Scraping is not in progress' });
  }

  // Cancel BullMQ job
  const job = await scrapingQueue.getJob(sessionId);
  if (job) {
    await job.remove();
  }

  // Update status
  scrapingLog.status = 'cancelled';
  await scrapingLog.save();

  res.json({ message: 'Scraping cancelled' });
});
```

---

#### Endpoint 4: Get Scraping Logs
```typescript
GET /api/admin/scrape/logs

Query Parameters:
- limit: 20 (default)
- offset: 0 (default)
- status: "completed" (optional filter)
- triggeredBy: "admin" (optional filter)

Response:
{
  "logs": [
    {
      "sessionId": "abc-123-def-456",
      "startedAt": "2025-01-19T10:30:00Z",
      "completedAt": "2025-01-19T10:35:45Z",
      "duration": "5 minutes 45 seconds",
      "status": "completed",
      "buckets": ["fresher", "batch", "software"],
      "totalApiCalls": 11,
      "totalJobsFound": 245,
      "newJobsAdded": 189,
      "jobsUpdated": 56
    }
  ],
  "total": 45
}
```

**Implementation:**
```typescript
export const getScrapeLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 20, offset = 0, status, triggeredBy } = req.query;
  
  const query: any = {};
  if (status) query.status = status;
  if (triggeredBy) query.triggeredBy = triggeredBy;
  
  const logs = await ScrapingLog.find(query)
    .sort({ startedAt: -1 })
    .limit(Number(limit))
    .skip(Number(offset));
  
  const total = await ScrapingLog.countDocuments(query);
  
  res.json({ logs, total, limit, offset });
});
```

---

## 🔧 VALID BUCKETS (11 Total)

From PHASE2_README.md:

```typescript
const VALID_BUCKETS = [
  'fresher',      // Entry-level jobs
  'batch',        // Campus/batch recruitment
  'software',     // Software engineers
  'data',         // Data scientists & engineers
  'cloud',        // DevOps & Cloud engineers
  'mobile',       // Mobile developers
  'qa',           // QA & Test engineers
  'non-tech',     // Sales, HR, Marketing
  'experience',   // Senior roles
  'employment',   // Employment type (FT/PT/Contract)
  'work-mode'     // Remote/hybrid/onsite
];
```

---

## 🔐 AUTHENTICATION REQUIREMENT

**Endpoint Security (from PHASE2_README.md):**
```typescript
router.post('/scrape/run', authenticateToken, requireRole('admin'), startScraping);
router.get('/scrape/status/:sessionId', authenticateToken, requireRole('admin'), getScrapeStatus);
router.post('/scrape/cancel', authenticateToken, requireRole('admin'), cancelScrape);
router.get('/scrape/logs', authenticateToken, requireRole('admin'), getScrapeLogs);
```

**Middleware Chain:**
1. `authenticateToken` - Verifies JWT token is valid
2. `requireRole('admin')` - Ensures user is admin

**If not authenticated:** 401 "Token required"  
**If not admin:** 403 "Admin access required"

---

## 📱 FRONTEND - ADMIN CRAWLERS PAGE

### Page File: `frontend/src/pages/admin/AdminCrawlers.tsx`

**From code analysis:**
```typescript
export default function AdminCrawlers() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((s) => s.token);

  const api = (path: string, opts: RequestInit = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`/api/admin${path}`, { headers, ...opts });
  };

  // When page loads, fetch sources
  useEffect(() => {
    if (token) {
      load(); // Calls GET /api/admin/sources
    }
  }, [token]);

  // Handle form submission to add source
  async function createSource(e: React.FormEvent) {
    e.preventDefault();
    const res = await api('/sources', { 
      method: 'POST', 
      body: JSON.stringify(form) 
    });
    if (res.ok) {
      setForm({ url: '', selector: '', enabled: true });
      load(); // Refresh list
    }
  }

  return (
    <div className="space-y-4">
      <h2>Crawler Sources</h2>
      <p>Manage scraping sources and selectors.</p>
      
      {/* List of sources */}
      {/* Form to add source */}
      {/* Run crawlers button */}
    </div>
  );
}
```

**UI Components on Page:**
- Admin Bearer Token input
- Crawler Sources form (Name, URL, Selector)
- Add Source button
- Sources list table
- Run Crawlers button

---

## 🚀 COMPLETE FLOW FROM PHASE 2

### When Admin Clicks "Run Crawlers":

```
┌─────────────────────────────────────────────────────────────┐
│ AdminCrawlers.tsx Component                                 │
│                                                             │
│ User clicks [RUN CRAWLERS]                                 │
│        ↓                                                    │
│ Frontend calls:                                             │
│ POST /api/admin/scrape/run                                 │
│ Body: { buckets: [all 11] }                               │
│ Headers: { Authorization: Bearer <token> }               │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend - adminController.ts                               │
│                                                             │
│ Handler: startScraping()                                   │
│        ↓                                                    │
│ Middleware:                                                │
│ ├─ authenticateToken ✅                                    │
│ ├─ requireRole('admin') ✅                                │
│ └─ Validate buckets ✅                                     │
│        ↓                                                    │
│ Create sessionId: "abc-123-def-456"                       │
│        ↓                                                    │
│ Save ScrapingLog entry to MongoDB                         │
│        ↓                                                    │
│ Queue job: scrapingQueue.add('scrape', {...})            │
│        ↓                                                    │
│ Response: {                                                │
│   sessionId: "abc-123-def-456",                           │
│   message: "Scraping started",                            │
│   status: "in-progress"                                   │
│ }                                                          │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend - Polling                                          │
│                                                             │
│ Receives sessionId: "abc-123-def-456"                      │
│        ↓                                                    │
│ Every 2 seconds:                                           │
│ GET /api/admin/scrape/status/abc-123-def-456             │
│        ↓                                                    │
│ Shows progress bar                                         │
│ Fresher  ✅ Completed (34 jobs)                           │
│ Batch    ✅ Completed (12 jobs)                           │
│ Software ⏳ In Progress (45%)                             │
│ ...                                                        │
│        ↓                                                    │
│ When complete:                                             │
│ Status = "completed"                                       │
│ Total jobs found: 245                                     │
│ New added: 189                                            │
│ Updated: 56                                               │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ BullMQ Worker (Background)                                 │
│                                                             │
│ Processes scraping job                                     │
│        ↓                                                    │
│ FOR EACH BUCKET:                                          │
│ ├─ Check rate limit (200/month)                           │
│ ├─ Call OpenWeb Ninja API                                 │
│ ├─ Get raw job data                                       │
│ ├─ Normalize (30+ fields)                                 │
│ ├─ Deduplicate (check externalJobId)                      │
│ ├─ Save to MongoDB jobs collection                        │
│ ├─ Track API usage                                        │
│ └─ Update progress                                        │
│        ↓                                                    │
│ Update ScrapingLog:                                        │
│ ├─ status: "in-progress" → "completed"                   │
│ ├─ completedAt: now()                                     │
│ ├─ totalJobsFound: 245                                   │
│ ├─ newJobsAdded: 189                                     │
│ └─ jobsUpdated: 56                                       │
│                                                             │
│ DONE!                                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 API USAGE TRACKING (TASK 2.4)

### Three API Usage Endpoints (also in Phase 2):

#### 1. Get Current Usage
```typescript
GET /api/admin/api-usage

Response:
{
  "totalCallsUsed": 45,
  "monthlyLimit": 200,
  "callsRemaining": 155,
  "percentageUsed": 22.5,
  "isWarningTriggered": false,  // True at 80% (160 calls)
  "isLimitReached": false       // True at 100% (200 calls)
}
```

#### 2. Set Monthly Limit
```typescript
POST /api/admin/api-usage/limit

Body: { monthlyLimit: 150 }

Response:
{
  "message": "Limit updated",
  "newLimit": 150
}
```

#### 3. Get Usage History
```typescript
GET /api/admin/api-usage/history

Response:
{
  "callHistory": [
    {
      "timestamp": "2025-01-19T10:35:00Z",
      "bucket": "fresher",
      "resultCount": 23,
      "status": "success"
    },
    ...
  ],
  "total": 245
}
```

---

## ✅ PHASE 2 DELIVERABLES - ADMIN SCRAPING SECTION

From PHASE2_README.md - By end of Phase 2:

```
✅ 4 admin scraping endpoints implemented & working
✅ 3 API usage endpoints implemented & working
✅ JWT authentication on all admin endpoints
✅ Role-based access control (admin only)
✅ Proper HTTP status codes
   ├─ 201 (Created)
   ├─ 400 (Bad request - invalid buckets)
   ├─ 401 (Unauthorized - no token)
   ├─ 403 (Forbidden - not admin)
   ├─ 404 (Not found - session not found)
   └─ 500 (Server error)
✅ Request validation on all endpoints
✅ Error messages clear & helpful
✅ All endpoints have logging (Winston)
✅ Postman collection includes all endpoints
✅ All endpoints tested manually
```

---

## 🔄 COMPARISON: PHASE 2 vs PHASE 3

| Aspect | Phase 2 | Phase 3 |
|--------|---------|---------|
| **Focus** | REST endpoints | Business logic |
| **Scraping Trigger** | ✅ Admin API endpoints | ✅ Background processing |
| **Job Normalization** | ❌ Not yet | ✅ Extracts 30+ fields |
| **Deduplication** | ❌ Not yet | ✅ Check externalJobId |
| **Matching Algorithm** | ❌ Not yet | ✅ 6-factor scoring |
| **Rate Limiting** | ✅ Tracked | ✅ Enforced (200/month) |
| **MongoDB Storage** | ✅ Basic | ✅ Optimized with indexes |

---

## 📋 PHASE 2 ADMIN SCRAPING - TASK CHECKLIST

**TASK 2.3: Admin Scraping Control Endpoints**

- [ ] Create admin controller with 4 scraping endpoints
- [ ] Create scraping log functionality (MongoDB)
- [ ] Test: POST /api/admin/scrape/run starts job
- [ ] Test: GET /api/admin/scrape/status/:sessionId returns status
- [ ] Test: POST /api/admin/scrape/cancel stops job
- [ ] Test: GET /api/admin/scrape/logs returns history
- [ ] Add authentication middleware (token + admin role)
- [ ] Add request validation (validate buckets array)
- [ ] Add error handling (400, 401, 403, 404)
- [ ] Add logging (Winston) to all endpoints
- [ ] Test with invalid buckets → 400 error
- [ ] Test without token → 401 error
- [ ] Test as non-admin user → 403 error
- [ ] Test cancelled session → proper status
- [ ] Create Postman tests for all 4 endpoints

**TASK 2.4: API Usage Tracking Endpoints**

- [ ] Create API usage controller
- [ ] Implement usage tracking service
- [ ] Test: GET /api/admin/api-usage returns current usage
- [ ] Test: POST /api/admin/api-usage/limit sets limit
- [ ] Test: GET /api/admin/api-usage/history returns call log
- [ ] Implement hard stop at 200 calls/month
- [ ] Implement warning at 80% (160 calls)
- [ ] Store all tracking in MongoDB api_usage collection
- [ ] Create Postman tests for all 3 endpoints

---

## 🎓 SUMMARY

**PHASE 2 provides:**
1. ✅ 4 REST endpoints for admin to trigger scraping
2. ✅ 3 REST endpoints for tracking API usage
3. ✅ JWT authentication & admin role check
4. ✅ Real-time progress tracking
5. ✅ Scraping history/logs
6. ✅ Rate limit enforcement (200/month)

**NOT IN PHASE 2 (comes in PHASE 3):**
- ❌ Actual scraping logic
- ❌ Job normalization
- ❌ Deduplication
- ❌ OpenWeb Ninja API calls
- ❌ Matching algorithm

**What admin sees:**
- AdminCrawlers page at `/admin/crawlers`
- Click [RUN CRAWLERS] button
- Progress bar updates every 2 seconds
- View scraping history
- Monitor API usage (45/200 calls)

---

**Analysis Complete:** January 19, 2026  
**Based on:** PHASE2_README.md - Tasks 2.3 & 2.4  
**Status:** All admin scraping endpoints documented
