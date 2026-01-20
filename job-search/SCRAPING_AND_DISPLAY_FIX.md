# Job Scraping and Display Fix - Complete Guide

## Current Status

### Issues Identified:
1. ❌ Apply links showing as `#` instead of real URLs
2. ❌ Source showing as "Fallback Data" instead of "JSearch API"
3. ❌ Only 1 bucket ("fresher") was scraped instead of all 11 buckets
4. ✅ Frontend fetch now includes auth token
5. ✅ Job data mapping fixed to extract location, description, applyUrl
6. ✅ Job transformation added before saving to MongoDB

## What's Been Fixed

### 1. Frontend Authentication (✅ COMPLETED)
**File**: `JobIntel/frontend/src/pages/admin/AdminJobs.tsx`
- Added import: `import { useAuthStore } from '@/store/authStore';`
- Added auth token retrieval: `const token = useAuthStore((s) => s.token);`
- Updated fetch request to include Authorization header:
  ```typescript
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch('/api/admin/jobs/list', { 
    cache: 'no-store',
    headers 
  });
  ```

### 2. Job Data Mapping in AdminJobs (✅ COMPLETED)
**File**: `JobIntel/frontend/src/pages/admin/AdminJobs.tsx`
- Fixed `combinedJobs` useMemo to extract real data from backend response:
  - `location`: Now maps from backend job location
  - `description`: Now maps from backend job description
  - `applyUrl`: Now maps from backend job applyUrl
  - Properly formats data from API response

### 3. Job Data Transformation During Scraping (✅ COMPLETED)
**File**: `JobIntel/backend/src/controllers/adminController.ts`
- Added transformation layer before saving jobs to MongoDB:
  ```typescript
  const transformedJobs = filteredJobs.map((job: any) => ({
    title: job.title || 'Untitled',
    company: job.company || 'Unknown Company',
    location: job.location || 'Remote',
    description: job.description || '',
    applyUrl: job.externalLink || job.applyUrl || '',  // ← KEY FIX
    salary: job.maxSalary ? `${job.minSalary}-${job.maxSalary}` : '',
    source: job.source || 'JSearch API',
    meta: {
      jobId: job.jobId,
      externalLink: job.externalLink,
      rawData: job.rawData,
    },
  }));
  ```

## Current Architecture

### Data Flow:
```
JSearch API Response
    ↓
jsearchService.searchJobs() [returns ParsedJob[]]
    ├─ Field: externalLink (apply URL from API)
    ├─ Field: title, company, location, description
    └─ Field: source ('JSearch API' or 'Fallback Data')
    ↓
adminController.runCrawlers() [transforms data]
    ├─ Maps externalLink → applyUrl
    ├─ Preserves all job details
    └─ Sets source field
    ↓
saveJobsToDatabase() [persists to MongoDB]
    ├─ Creates Job document with all fields
    └─ Sets status: 'published'
    ↓
getAllJobsForListing() [retrieves for admin page]
    ├─ Queries MongoDB for all jobs
    ├─ Formats response with: id, title, company, location, description, applyUrl, etc.
    └─ Returns array of formatted jobs
    ↓
AdminJobs Page [frontend displays]
    ├─ Fetches with auth token
    ├─ Maps data to table rows
    └─ Shows Location, Job Details, Apply Link columns
```

## Next Steps - What You Need to Do

### Step 1: Run Full Scraping (ALL BUCKETS)
Go to Admin → Admin Crawlers page:

1. Click on the scraping interface
2. **IMPORTANT**: Make sure ALL 11 buckets are selected:
   - [ ] fresher
   - [ ] batch
   - [ ] software
   - [ ] data
   - [ ] cloud
   - [ ] mobile
   - [ ] qa
   - [ ] non-tech
   - [ ] experience
   - [ ] employment
   - [ ] work-mode

3. Enable **"Filter Indian Jobs"** (recommended for Indian job market)
4. Click "Start Scraping"
5. Wait for completion

### Step 2: Monitor Scraping Output
Look for these in the scraping history:

**✅ GOOD SIGNS**:
- `Source: JSearch API` (NOT "Fallback Data")
- `applyUrl: https://...` (real URLs, not `#`)
- Multiple buckets listed in "Completed Buckets"
- Sample jobs showing real company names and locations

**❌ BAD SIGNS**:
- `Source: Fallback Data` (means API failed)
- `applyUrl: #` (placeholder value)
- No externalLink in API response

### Step 3: Check Admin Jobs Page
Navigate to Admin → Jobs Management:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Look for request to `/api/admin/jobs/list`
5. Check response - should have real apply URLs

Expected sample job:
```json
{
  "id": "...",
  "title": "Senior Software Engineer",
  "company": "Microsoft",
  "location": "Bangalore, India",
  "description": "Looking for experienced developers...",
  "applyUrl": "https://microsoft.com/careers/job/...",  // ← REAL URL
  "source": "JSearch API",
  "status": "published"
}
```

### Step 4: Troubleshooting

**Problem**: Apply link showing as `#`
- **Cause**: API not returning externalLink OR fallback data being used
- **Fix**: 
  - Check if API key is set: `echo $OPENWEBNINJA_API_KEY` in terminal
  - Check backend logs for "Fallback Data" or API errors
  - Try scraping single bucket to test API

**Problem**: Still showing old "Fallback Data" jobs
- **Cause**: Old jobs in database not updated
- **Fix**: 
  - Delete old jobs from MongoDB
  - Or modify query to only show recently scraped jobs
  - Check `source` field in database

**Problem**: Only 1 bucket scraped
- **Cause**: User only selected 1 bucket in UI
- **Fix**: Select all 11 buckets before clicking Start

## Database Structure
Jobs are stored in MongoDB with these key fields:

```typescript
{
  _id: ObjectId,
  title: string,
  company: string,
  location: string,
  description: string,
  applyUrl: string,           // ← This should be populated from API
  salary: string,
  source: 'JSearch API' | 'Fallback Data' | 'manual',
  status: 'published' | 'pending' | 'active',
  sessionId: string,          // Links to scraping session
  bucket: string,             // Which bucket was scraped
  meta: {
    jobId: string,
    externalLink: string,
    rawData: any,
  },
  createdAt: Date,
  updatedAt: Date,
}
```

## API Endpoints

### Get All Jobs (Admin Only)
```
GET /api/admin/jobs/list
Authorization: Bearer <token>

Response: Array[Job]
```

### Start Scraping (Admin Only)
```
POST /api/admin/scrape
Authorization: Bearer <token>
Body: {
  buckets: ['fresher', 'software', ...],
  filterIndianJobs: true,
  country: 'in',
  location: 'Bangalore'
}

Response: { sessionId, message, status }
```

### Get Scraping Logs (Admin Only)
```
GET /api/admin/scrape/logs
Authorization: Bearer <token>

Response: Array[ScrapeSession]
```

## Key Commits
- `92a46a0`: Added real MongoDB data display with Location, Job Details, Apply Link columns
- `6fc8a51`: Fixed auth token in fetch and job data mapping
- `96f7a14`: Transform jsearchService job data to include applyUrl
- `909a9cd`: Preserve source field and add logging

## Testing Checklist

- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 8080
- [ ] Can login as admin with `AdminPass!23`
- [ ] Auth token is being sent in requests
- [ ] Can see 85 jobs in `/api/admin/jobs/list`
- [ ] Jobs show real apply URLs (not `#`)
- [ ] Job Management page displays data correctly
- [ ] Table has columns: Job Title, Company, Location, Job Details, Apply Link, Status, Source, etc.
- [ ] Apply links are clickable and navigate to real job pages
- [ ] When scraping, only real API jobs are saved (no Fallback Data)

## Admin Credentials
- Email: `admin@jobintel.local`
- Password: `AdminPass!23`

## Environment Variables
```
OPENWEBNINJA_API_KEY=ak_58a8asv2uix2dbxls7sitbar9zq647ld0iqbio1phiz29ar
API_KEY=ak_58a8asv2uix2dbxls7sitbar9zq647ld0iqbio1phiz29ar
MONGODB_URI=mongodb://localhost:27017/jobintel
```

---

**Last Updated**: January 19, 2026
**Status**: Ready for full scraping test
