# JSearch API Real Data Fixes - Complete Guide

## Problem Identified
The scraping was returning **Fallback Data** (placeholder jobs) instead of real data from OpenWeb Ninja JSearch API, resulting in:
- ❌ Apply links showing `https://example.com/jobs/19` (placeholders)
- ❌ Company names being random placeholders (Netflix, Google, etc.)
- ❌ Locations being generic (Austin, TX; New York, NY)
- ❌ All jobs marked with `source: "Fallback Data"`

## Root Causes Found

### 1. **Wrong API Endpoint** 
- **Wrong**: `/jsearch/search_jobs` 
- **Correct**: `/jsearch/search`
- **Impact**: API calls were failing silently and falling back to simulated data

### 2. **Incorrect Field Name Parsing**
- The API returns `job_apply_link` (not `apply_url`)
- The API returns location as three separate fields: `job_city`, `job_state`, `job_country`
- These weren't being parsed correctly

### 3. **Silent API Failures**
- When API failed, the system would silently generate fallback data
- No error logging to show what went wrong
- No way to debug the actual API response

## Fixes Applied

### File: `JobIntel/backend/src/services/jsearchService.ts`

#### Fix 1: Correct API Endpoint
```diff
- const response = await this.makeRequestWithRetry('search_jobs', {
+ const response = await this.makeRequestWithRetry('search', {
```

#### Fix 2: Parse Real API Field Names
```typescript
// Before: Only extracted some fields
externalLink: jobData.job_apply_link || jobData.job_url || ''

// After: Extract apply link from real API with all field variations
const applyLink = jobData.job_apply_link || jobData.apply_link || jobData.job_url || jobData.google_link || '';

// Before: Used generic location field
location: jobData.job_location || jobData.location || 'Remote'

// After: Extract location from separate city/state/country fields like real API returns
const locationParts = [];
if (jobData.job_city) locationParts.push(jobData.job_city);
if (jobData.job_state) locationParts.push(jobData.job_state);
if (jobData.job_country) locationParts.push(jobData.job_country);
const location = locationParts.length > 0 ? locationParts.join(', ') : (jobData.job_location || 'Remote');
```

#### Fix 3: Enhanced Error Logging
```typescript
// Before: Silent failures
} catch (error) {
  logger.error(`❌ Error searching jobs: ${error}`);
  return this.generateFallbackJobs(params);
}

// After: Detailed error information
} catch (error: any) {
  logger.error(`❌ Error searching jobs: ${error?.message || error}`);
  if (error?.stack) logger.error(`Error stack: ${error.stack}`);
  logger.warn('⚠️  Falling back to simulated data due to API error');
  return this.generateFallbackJobs(params);
}
```

## API Field Mapping Reference

Based on OpenWeb Ninja JSearch API (from LinkedIn scraper):

```typescript
// Real API Response Fields → Our ParsedJob Fields
{
  job_title: string,              // → title
  employer_name: string,          // → company
  job_city: string,               // → location (part 1)
  job_state: string,              // → location (part 2)
  job_country: string,            // → location (part 3)
  job_description: string,        // → description
  job_apply_link: string,         // → externalLink ✨ KEY FIELD
  job_employment_type: string,    // → jobType
  job_min_salary: number,         // → minSalary
  job_max_salary: number,         // → maxSalary
  job_salary_period: string,      // → salaryPeriod
  job_posted_at_datetime_utc: string,  // → postedDate
  job_id: string,                 // → jobId
}
```

## Expected Result After Fix

When scraping with these fixes:

```json
{
  "_id": "696e40e5...",
  "title": "Senior Software Engineer",
  "company": "Microsoft",
  "location": "Bangalore, Karnataka, India",
  "description": "We are looking for a Senior Software Engineer to join our team...",
  "applyUrl": "https://careers.microsoft.com/us/en/job/1234567/",  // ✅ REAL LINK
  "source": "JSearch API",                                          // ✅ REAL SOURCE
  "status": "published",
  "salary": "50000-120000 YEARLY",
  "createdAt": "2026-01-19T15:00:00.000Z"
}
```

## How to Verify the Fix

### 1. Check Backend Logs During Scraping
```
🔍 Searching jobs: software in India
📡 API Request: search with params: {"query":"software", ...}
✅ Found 32 jobs from API
📝 Parsed job: Senior Software Engineer at Microsoft, apply_link: https://careers.microsoft.com/...
```

**NOT** (before fix):
```
📊 Using fallback simulated data (no API key configured)
⚠️  No jobs returned from API, using fallback data
```

### 2. Query Database for Real Data
```bash
# Check a recently scraped job
db.jobs.findOne({ source: "JSearch API" })

# Result should have real apply URLs
{
  applyUrl: "https://careers.microsoft.com/..."  // NOT "https://example.com/jobs/19"
}
```

### 3. Test Admin Jobs Page
- Navigate to Admin → Jobs Management
- Filter for `source: "JSearch API"`
- Click "Apply" link - should navigate to real job posting
- Company names should be real (Microsoft, Google, etc.)
- Locations should be specific (Bangalore, Mumbai, etc.)

## Configuration Required

Ensure these environment variables are set in `.env`:

```env
# OpenWeb Ninja JSearch API
OPENWEBNINJA_API_KEY=ak_58a8asv2uix2dbxls7sitbar9zq647ld0iqbio1phiz29ar
API_KEY=ak_58a8asv2uix2dbxls7sitbar9zq647ld0iqbio1phiz29ar

# MongoDB
MONGODB_URI=mongodb://localhost:27017/jobintel
```

## Next Steps for User

1. **Restart Backend** (to load new code)
   ```bash
   npm run dev --workspace=backend
   ```

2. **Run Full Scraping** with all 11 buckets
   - Go to Admin → Crawlers
   - Select ALL buckets (fresher, batch, software, data, cloud, mobile, qa, non-tech, experience, employment, work-mode)
   - Enable "Filter Indian Jobs"
   - Click "Start Scraping"

3. **Monitor Scraping**
   - Check backend console for "Found X jobs from API"
   - Should see real job titles and companies being logged

4. **Verify in Database**
   - Open MongoDB
   - Check jobs collection for `source: "JSearch API"`
   - Verify `applyUrl` contains real URLs (not `https://example.com/...`)

5. **Check Admin Page**
   - Navigate to Admin → Jobs Management
   - Should see real job data with working apply links

## Commits Made

- Fixed jsearchService to use correct API endpoint `/jsearch/search`
- Fixed field name parsing to extract real job_apply_link
- Added location formatting from separate city/state/country fields
- Enhanced error logging to catch API failures

## File Modified

- `JobIntel/backend/src/services/jsearchService.ts`

---

**Last Updated**: January 19, 2026
**Status**: Ready for testing with real API data
