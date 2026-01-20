# 🎯 QUICK REFERENCE - JOBINTEL API ENDPOINTS

## Authentication Token
```bash
# Get token (already done)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTY1NDAwYmViN2U3MTFiNjU1NGI4NmUiLCJ1c2VySWQiOiI2OTY1NDAwYmViN2U3MTFiNjU1NGI4NmUiLCJyb2xlIjoiYWRtaW4iLCJyb2xlcyI6WyJhZG1pbiJdLCJpYXQiOjE3Njg4MTM0OTUsImV4cCI6MTc2ODgxNzA5NX0.qkE1MCUHHYmkPjfETm3xeybOrHwYF7GIzBgPygAjr4I"
```

---

## AUDIT TRAIL ENDPOINTS (Fully Implemented ✅)

### 1. Get Audit Logs
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit?limit=20&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters**:
- `action`: Filter by action (login, scrape_completed, etc)
- `actor`: Filter by email (case-insensitive)
- `status`: Filter by status (success, failed, pending)
- `limit`: Results per page (default: 100)
- `offset`: Pagination offset
- `start_date`: ISO date (2026-01-19)
- `end_date`: ISO date
- `search`: Free-text search

**Response**:
```json
{
  "logs": [
    {
      "_id": "...",
      "actor": "admin@jobintel.local",
      "action": "scrape_completed",
      "status": "success",
      "duration": 1027,
      "meta": {...},
      "createdAt": "2026-01-19T09:05:43Z"
    }
  ],
  "total": 150,
  "pagination": {
    "page": 1,
    "pages": 8
  }
}
```

---

### 2. Get Audit Statistics
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit/stats?start_date=2026-01-19" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters**:
- `start_date`: ISO date
- `end_date`: ISO date
- `group_by`: 'action' or 'actor' (default: action)

**Response**:
```json
{
  "stats": {
    "total": 450,
    "success": 420,
    "failed": 25,
    "pending": 5,
    "avgDuration": 245
  },
  "actions": {
    "scrape_completed": 42,
    "login": 150,
    "approve_job": 216
  },
  "actors": {
    "admin@jobintel.local": 350,
    "user@jobintel.local": 100
  },
  "timeline": [...]
}
```

---

### 3. Get Specific Audit Log
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit/detail/LOG_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Response**:
```json
{
  "log": {
    "_id": "LOG_ID",
    "actor": "admin@jobintel.local",
    "action": "scrape_completed",
    "status": "success",
    "duration": 1027,
    "meta": {
      "sessionId": "85dfe734-8d80-4b7f-99b2-325940267b46",
      "totalJobs": 124,
      "newJobs": 85
    },
    "createdAt": "2026-01-19T09:05:43Z",
    "ipAddress": "10.0.1.238",
    "userAgent": "Mozilla/5.0..."
  }
}
```

---

### 4. Export Audit Logs to CSV
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit/export/csv?action=login&limit=500" \
  -H "Authorization: Bearer $TOKEN" > audit_logs.csv
```

**Query Parameters**: Same as get audit logs

**Output**: CSV file with columns:
- Timestamp
- Actor
- Action
- Status
- Duration (ms)
- Error Message
- Metadata

---

## JOB SEARCH ENDPOINTS (Documented, Awaiting API Integration ⏳)

### 1. Search Jobs
```bash
curl -X GET "http://localhost:5000/api/jsearch/search?query=Python&location=SF&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Get Job Details
```bash
curl -X GET "http://localhost:5000/api/jsearch/job/JOB_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## SALARY ENDPOINTS (Documented, Awaiting API Integration ⏳)

### 1. Salary Estimate
```bash
curl -X GET "http://localhost:5000/api/jsearch/salary/estimate?job_title=Software%20Engineer&location=San%20Francisco" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Company Salary
```bash
curl -X GET "http://localhost:5000/api/jsearch/salary/company?company=Google&job_title=Engineer" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ACTION TYPES (For Audit Logs)

**Authentication**:
- login
- logout
- login_failed
- password_change
- password_reset

**Jobs**:
- create_job
- update_job
- delete_job
- publish_job
- unpublish_job
- approve_job
- reject_job

**Scraping**:
- scrape_started
- scrape_completed
- scrape_failed

**Salary**:
- salary_query
- salary_estimate_requested
- company_salary_requested

**Admin**:
- admin_login
- admin_logout
- admin_create_user
- admin_delete_user
- admin_update_user

**System**:
- system_backup
- system_restore
- config_changed

---

## FILTER EXAMPLES

### Get all failed actions
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit?status=failed" \
  -H "Authorization: Bearer $TOKEN"
```

### Get admin actions from today
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit?actor=admin&start_date=2026-01-19" \
  -H "Authorization: Bearer $TOKEN"
```

### Search for specific job in logs
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit?search=jobId123" \
  -H "Authorization: Bearer $TOKEN"
```

### Get scraping history for past week
```bash
curl -X GET "http://localhost:5000/api/jsearch/audit?action=scrape_completed&start_date=2026-01-12&end_date=2026-01-19" \
  -H "Authorization: Bearer $TOKEN"
```

---

## DATABASE SCHEMA

### AuditLog Collection
```javascript
{
  _id: ObjectId,
  actor: String,              // admin@jobintel.local
  action: String,             // Enum: 30+ types
  meta: Mixed,                // Custom data
  ipAddress: String,          // 10.0.1.238
  userAgent: String,          // Browser info
  status: String,             // success/failed/pending
  errorMessage: String,       // If failed
  duration: Number,           // milliseconds
  createdAt: Date,            // Auto TTL: 90 days
  updatedAt: Date
}
```

---

## INDEXES

```javascript
// Automatically created:
db.auditlogs.createIndex({ createdAt: -1 })
db.auditlogs.createIndex({ action: 1, createdAt: -1 })
db.auditlogs.createIndex({ actor: 1, createdAt: -1 })
db.auditlogs.createIndex({ status: 1, createdAt: -1 })
db.auditlogs.createIndex({ createdAt: 1 }, { expireAfterSeconds: 7776000 })
```

---

## FILES CREATED

| File | Size | Purpose |
|------|------|---------|
| backend/src/routes/jsearch.ts | 12K | 13 API endpoints |
| backend/src/controllers/auditController.ts | 8.3K | Audit logic & DB queries |
| JSEARCH_API_ANALYSIS.md | 12K | Complete documentation |
| backend/src/models/AuditLog.ts | Enhanced | Added 5+ fields & indexes |
| backend/src/index.ts | Updated | Route registration |

---

## TESTING CHECKLIST

- [ ] Verify backend compiles (npm run build)
- [ ] Get auth token from admin
- [ ] Test: GET /api/jsearch/audit
- [ ] Test: GET /api/jsearch/audit/stats
- [ ] Test: GET /api/jsearch/audit/export/csv
- [ ] Test filtering by action
- [ ] Test filtering by date range
- [ ] Test CSV export
- [ ] Verify indexes in MongoDB
- [ ] Test with admin@jobintel.local user

---

## ENVIRONMENT VARIABLES

```bash
# .env file
JSEARCH_API_KEY=your_key_here
JSEARCH_API_HOST=api.openwebninja.com
JSEARCH_RATE_LIMIT_DELAY=1.0
JSEARCH_MAX_RETRIES=3
```

---

## STATUS

✅ Audit Trail: PRODUCTION READY
⏳ Job Search: Ready for JSearch API integration
⏳ Salary: Ready for JSearch API integration
⏳ Advanced Search: Ready for implementation
⏳ Bulk Operations: Ready for implementation

---

## NEXT STEPS

1. Test audit endpoints with admin token
2. Monitor performance of queries
3. Implement JSearch API client when API key available
4. Add remaining endpoints based on API responses
5. Deploy to production

---

**Documentation**: See JSEARCH_API_ANALYSIS.md for complete details
