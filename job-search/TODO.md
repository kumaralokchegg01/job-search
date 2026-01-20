# JobIntel Project - Complete Development TODO List

**Project Status:** ~50% Complete (Phase 2-3 Implementation)  
**Target:** India-only Job Aggregation & Matching Platform  
**API Budget:** 200 calls/month (OpenWeb Ninja)  
**Created:** January 18, 2026

---

## PROJECT OVERVIEW

### Current State
✅ **COMPLETED:**
- Basic MERN project structure (React 18, Express.js, MongoDB, TypeScript)
- 16 MongoDB models defined (User, Job, Application, etc.)
- 15 backend route files with controller scaffolding
- Frontend pages (Landing, Login, Register, Jobs, Dashboard)
- Authentication system (JWT with bcryptjs)
- Email notification adapter (Nodemailer)
- Job model with fields (title, location, employmentType, etc.)
- Admin dashboard UI structure
- Some service layer code (aiClient, deltaDetector, playwrightScraper)

❌ **INCOMPLETE/MISSING (~50%):**
- OpenWeb Ninja API integration (critical)
- Complete MongoDB schema alignment with spec
- Job extraction & normalization service
- Deduplication logic by externalJobId
- 6-factor matching algorithm
- Resume parsing (PDF/DOCX extraction)
- Scheduled scraping with node-cron
- API usage tracking & limiting (hard stop at 200/month)
- Real WhatsApp Cloud API integration
- Real Telegram Bot API integration
- Admin scraping control panel
- Complete error handling
- Production-ready testing suite
- Performance optimization & indexing

### Key Differences from Spec
1. **Job Model:** Current has 16 fields, spec requires 30+ fields (careerLevel, domain, techStack, workMode, etc.)
2. **API Integration:** No actual OpenWeb Ninja calls implemented yet
3. **Matching Algorithm:** Spec defines 6-factor system; current uses LLM fallback
4. **India-only Filter:** Not implemented in current codebase
5. **API Usage Tracking:** Collection schema exists but logic not implemented
6. **Scraping Logs:** Collection exists but no session tracking implemented

---

## PHASE 1: FOUNDATION & INFRASTRUCTURE

### 1.1 Backend Configuration & Setup
- [ ] Create `.env` file with all required variables
  - [ ] MongoDB connection string
  - [ ] JWT secret key
  - [ ] OpenWeb Ninja API key
  - [ ] Razorpay API keys
  - [ ] WhatsApp Cloud API credentials
  - [ ] Telegram Bot token
  - [ ] Email SMTP configuration
  - [ ] Redis URL (optional)
- [ ] Setup MongoDB Atlas/Local instance
- [ ] Configure Redis (for BullMQ job queue)
- [ ] Create Docker compose for local development
- [ ] Setup Winston logger with Winston configuration
- [ ] Add error handling middleware (global exception handler)
- [ ] Add request/response logging middleware

### 1.2 Database Initialization & Schema Completion
- [ ] Review and update all 16 models per AI_AGENT_PROMPT.md spec
  - [ ] **Job Model:** Add fields
    - [ ] externalJobId (unique index)
    - [ ] careerLevel enum (fresher, junior, mid, senior, lead)
    - [ ] domain enum (software, data, cloud, mobile, qa, non-tech)
    - [ ] techStack array
    - [ ] experienceRequired number
    - [ ] workMode enum (remote, onsite, hybrid)
    - [ ] batchEligible boolean
    - [ ] bucket string (which scraping bucket found this)
    - [ ] scrapedAt date
    - [ ] normalizedTitle & normalizedCompany
    - [ ] expiryDate (fetchedAt + 30 days)
    - [ ] isActive boolean
  - [ ] **User Model:** Add fields
    - [ ] careerLevel enum
    - [ ] yearsOfExperience number
    - [ ] currentRole string
    - [ ] targetRoles array
    - [ ] targetDomains array
    - [ ] preferredWorkMode enum
    - [ ] targetLocations array
    - [ ] resumeUploadedAt date
    - [ ] resumeId ObjectId reference
    - [ ] openToRelocation boolean
    - [ ] minSalaryExpectation number
    - [ ] userRole enum (user, admin)
  - [ ] **ParsedResume Model:** Create complete schema
    - [ ] rawText string
    - [ ] uploadedFileName string
    - [ ] skills array
    - [ ] technicalSkills array
    - [ ] softSkills array
    - [ ] totalYearsOfExperience number
    - [ ] workHistory array (company, role, dates, tech)
    - [ ] education array (institution, degree, field)
    - [ ] currentRole string
    - [ ] targetRoles array
    - [ ] technicalFocus array
    - [ ] certifications array
    - [ ] parseQuality enum (high, medium, low)
    - [ ] parseConfidence number (0-100)
  - [ ] **JobMatches Model:** Create complete schema
    - [ ] userId, jobId references
    - [ ] skillMatch, roleMatch, levelMatch, experienceMatch, locationMatch, workModeMatch (6 factors)
    - [ ] totalScore (0-100)
    - [ ] matchType enum (excellent, good, okay, poor)
    - [ ] matchReason string
    - [ ] userViewed, userSaved, userApplied booleans
  - [ ] **ApiUsage Model:** Create complete schema
    - [ ] month string (YYYY-MM)
    - [ ] provider string
    - [ ] totalCallsUsed number
    - [ ] monthlyLimit number (default 200)
    - [ ] callsRemaining number
    - [ ] safetyThreshold number
    - [ ] callHistory array (detailed call records)
    - [ ] isLimitReached boolean
    - [ ] isWarningTriggered boolean
    - [ ] adminConfiguredLimit number
  - [ ] **SavedJobs Model:** Create complete schema
    - [ ] userId, jobId references
    - [ ] savedAt date
    - [ ] notes string
    - [ ] priority enum (high, medium, low)
    - [ ] status enum (saved, applied, rejected, interviewing)
  - [ ] **ScrapingLogs Model:** Create complete schema
    - [ ] sessionId unique string
    - [ ] triggeredBy enum (admin, cron, manual)
    - [ ] triggeredByUserId reference
    - [ ] bucketsRequested, bucketsCompleted, bucketsFailed arrays
    - [ ] totalApiCalls, totalJobsFound, newJobsAdded, jobsUpdated
    - [ ] startedAt, completedAt dates
    - [ ] durationMs number
    - [ ] status enum (in-progress, completed, failed, partial)
    - [ ] bucketDetails array (per-bucket metrics)
- [ ] Add all MongoDB indexes for performance
  - [ ] Job collection: 8+ indexes (externalJobId unique, careerLevel+isActive, domain+isActive, techStack, workMode+isActive, fetchedAt, expiryDate, batchEligible+isActive)
  - [ ] User collection: 3+ indexes (email unique, userRole, careerLevel)
  - [ ] ParsedResume: 2+ indexes (userId, skills)
  - [ ] JobMatches: 5+ indexes (userId+totalScore, userId+matchedAt, jobId, totalScore, matchType)
  - [ ] ApiUsage: 2+ indexes (month unique, isLimitReached)
  - [ ] SavedJobs: 2+ indexes (userId+savedAt, userId+status)
  - [ ] ScrapingLogs: 4+ indexes (sessionId unique, startedAt, status, triggeredBy)

### 1.3 OpenWeb Ninja API Integration
- [ ] Create API client wrapper
  - [ ] File: `src/services/openWebNinjaClient.ts`
  - [ ] Methods:
    - [ ] `searchJobs(bucket, keyword, country)` - Main search endpoint
    - [ ] `getJobDetails(jobId, country)` - Detailed job info
    - [ ] `getEstimatedSalary(jobTitle, location)` - Salary estimation
    - [ ] `getCompanySalary(company, jobTitle, location)` - Company-specific salary
  - [ ] Rate limiting: Implement 1 request/second delay
  - [ ] Retry logic: 3 attempts with exponential backoff (2s, 4s, 8s)
  - [ ] Error handling: Specific error codes (401, 429, 500)
  - [ ] Authentication: x-api-key header
  - [ ] India-only filtering: Always use `country: 'in'` parameter
  - [ ] Logging: Log all API calls to console & Winston
- [ ] Copy/adapt rate limiting from LinkedIN-Scraper
  - [ ] File: `src/services/rateLimiter.ts`
  - [ ] Enforce minimum 1 second between requests
  - [ ] Implement exponential backoff
  - [ ] Track request count
- [ ] Create HTTP client utility (reusable for external APIs)
  - [ ] File: `src/utils/httpClient.ts`
  - [ ] GET/POST methods with timeout (30 seconds)
  - [ ] HTTPS support
  - [ ] JSON request/response handling
  - [ ] Error message extraction

### 1.4 Job Queue Setup (BullMQ + Redis)
- [ ] Install BullMQ and ioredis
- [ ] Create queue configuration
  - [ ] File: `src/config/queue.ts`
  - [ ] Initialize BullMQ queues:
    - [ ] `scraping-queue` (for job scraping tasks)
    - [ ] `notification-queue` (for email/WhatsApp/Telegram)
    - [ ] `matching-queue` (for job matching calculations)
- [ ] Create queue listeners/workers
  - [ ] File: `src/workers/scrapingWorker.ts`
  - [ ] File: `src/workers/notificationWorker.ts`
  - [ ] File: `src/workers/matchingWorker.ts`
- [ ] Setup error handling & retry logic for workers
- [ ] Add monitoring/logging for queue health

### 1.5 Scheduled Jobs Setup (node-cron)
- [ ] Create job scheduler configuration
  - [ ] File: `src/jobs/schedulerConfig.ts`
  - [ ] Define all cron expressions:
    - [ ] Sunday 2 AM: Scrape Fresher bucket
    - [ ] Every 2 weeks: Scrape Batch bucket
    - [ ] Weekly: Scrape priority buckets (Software, Data, Cloud)
    - [ ] Monthly: Reset API usage counter
    - [ ] Weekly: Cleanup expired jobs (isActive=false if expiry passed)
- [ ] Create scheduler service
  - [ ] File: `src/services/schedulerService.ts`
  - [ ] Start/stop scheduler
  - [ ] List active jobs
  - [ ] Admin endpoint to trigger manual scraping
- [ ] Add logging for scheduled job execution

### 1.6 Authentication & Authorization Hardening
- [ ] Review JWT token implementation
  - [ ] Verify issuer, expiry, secret
  - [ ] Implement refresh token rotation
  - [ ] Add token blacklist for logout
- [ ] Create role-based access control (RBAC) middleware
  - [ ] File: `src/middleware/roleCheck.ts`
  - [ ] Admin-only endpoints
  - [ ] User-only endpoints
  - [ ] Public endpoints
- [ ] Implement request validation middleware
  - [ ] Use joi or zod for schema validation
  - [ ] Validate request body, query params, headers
- [ ] Add API key authentication (for external service calls)
- [ ] Setup CORS properly for frontend domain

---

## PHASE 2: API ENDPOINTS & CORE LOGIC

### 2.1 Complete Authentication Endpoints
- [ ] **POST /api/auth/register**
  - [ ] Validate email format
  - [ ] Hash password with bcryptjs
  - [ ] Create user record
  - [ ] Return JWT token + user object
  - [ ] Send welcome email
- [ ] **POST /api/auth/login**
  - [ ] Validate credentials
  - [ ] Return JWT token + user object
  - [ ] Update lastLoginAt timestamp
- [ ] **POST /api/auth/logout**
  - [ ] Add token to blacklist
  - [ ] Clear cookies
- [ ] **GET /api/auth/me**
  - [ ] Verify JWT
  - [ ] Return current user profile
- [ ] **POST /api/auth/refresh**
  - [ ] Validate refresh token
  - [ ] Issue new access token
- [ ] **PUT /api/auth/change-password**
  - [ ] Verify old password
  - [ ] Hash new password
  - [ ] Update user

### 2.2 Complete Admin Scraping Endpoints
- [ ] **POST /api/admin/scrape/start**
  - [ ] Validate admin role
  - [ ] Create scraping session
  - [ ] Queue scraping jobs for selected buckets
  - [ ] Return sessionId
  - [ ] Trigger `scrapeJobBuckets(buckets)` function
- [ ] **GET /api/admin/scrape/status/:sessionId**
  - [ ] Query ScrapingLogs collection
  - [ ] Return progress (completed/failed buckets)
  - [ ] Return metrics (jobs found, added, updated)
- [ ] **POST /api/admin/scrape/cancel/:sessionId**
  - [ ] Cancel queued jobs
  - [ ] Update ScrapingLogs status to "cancelled"
- [ ] **GET /api/admin/scraping-logs**
  - [ ] Query ScrapingLogs with pagination
  - [ ] Filter by status, date range, triggeredBy
  - [ ] Return detailed logs with bucket details

### 2.3 Complete API Usage Endpoints
- [ ] **GET /api/admin/api-usage/current**
  - [ ] Query ApiUsage collection for current month
  - [ ] Return usage metrics:
    - [ ] totalCallsUsed
    - [ ] monthlyLimit
    - [ ] callsRemaining
    - [ ] isLimitReached
    - [ ] isWarningTriggered
  - [ ] Calculate remaining days in month
- [ ] **PUT /api/admin/api-usage/limit**
  - [ ] Update monthlyLimit
  - [ ] Log change with admin ID
  - [ ] Validate limit >= 1
- [ ] **GET /api/admin/api-usage/history**
  - [ ] Query callHistory array
  - [ ] Filter by bucket, status, date range
  - [ ] Return paginated results with details

### 2.4 Complete Job Search Endpoints
- [ ] **GET /api/jobs/search**
  - [ ] Query parameters:
    - [ ] query (text search)
    - [ ] careerLevel
    - [ ] domain
    - [ ] workMode
    - [ ] location
    - [ ] page, limit
    - [ ] techStack array
    - [ ] employmentType
  - [ ] Build Mongoose query with filters
  - [ ] Only return isActive=true jobs
  - [ ] Apply sorting (recency, relevance)
  - [ ] Paginate results
  - [ ] Return jobs + total count
- [ ] **GET /api/jobs/:jobId**
  - [ ] Return full job details
  - [ ] Check isActive
  - [ ] Log page view
- [ ] **GET /api/jobs/featured**
  - [ ] Return newest jobs (limit 10)
  - [ ] Mark as featured in response
- [ ] **GET /api/jobs/trending**
  - [ ] Calculate trending skills (most requested)
  - [ ] Calculate trending roles (most posted)
  - [ ] Calculate trending locations (most jobs)
  - [ ] Use aggregation pipeline

### 2.5 Complete Resume Endpoints
- [ ] **POST /api/resume/upload**
  - [ ] Accept PDF/DOCX file
  - [ ] Validate file size (max 5MB)
  - [ ] Extract text from PDF/DOCX
  - [ ] Call resume parser service
  - [ ] Save to ParsedResume collection
  - [ ] Trigger matching for all jobs
  - [ ] Return parseQuality + extracted data
- [ ] **GET /api/resume/me**
  - [ ] Return user's resume
  - [ ] Include extracted skills, experience, education
- [ ] **PUT /api/resume/me**
  - [ ] Update skills, targetRoles, targetDomains
  - [ ] Mark for re-matching
  - [ ] Return updated resume
- [ ] **DELETE /api/resume/me**
  - [ ] Delete resume
  - [ ] Delete all job matches for this user

### 2.6 Complete Job Matching Endpoints
- [ ] **GET /api/matches/my-jobs**
  - [ ] Query JobMatches for user
  - [ ] Filter by matchType (if provided)
  - [ ] Sort by totalScore descending
  - [ ] Paginate results
  - [ ] Return jobs with match scores
- [ ] **POST /api/matches/refresh**
  - [ ] Delete all existing matches for user
  - [ ] Calculate matches for all active jobs
  - [ ] Save new matches
  - [ ] Return count of new matches
- [ ] **GET /api/matches/statistics**
  - [ ] Count matches by type (excellent, good, okay, poor)
  - [ ] Calculate average match score
  - [ ] Return statistics

### 2.7 Complete Saved Jobs Endpoints
- [ ] **POST /api/saved-jobs/:jobId**
  - [ ] Create SavedJob record
  - [ ] Add to user's saved list
  - [ ] Return saved job
- [ ] **GET /api/saved-jobs**
  - [ ] Query user's SavedJobs
  - [ ] Filter by status
  - [ ] Paginate
  - [ ] Return with full job details
- [ ] **PUT /api/saved-jobs/:jobId**
  - [ ] Update status/priority/notes
  - [ ] Return updated record
- [ ] **DELETE /api/saved-jobs/:jobId**
  - [ ] Remove from saved list

### 2.8 Complete User Profile Endpoints
- [ ] **GET /api/users/me**
  - [ ] Return full user profile
- [ ] **PUT /api/users/me**
  - [ ] Update profile fields
  - [ ] Validate all inputs
  - [ ] Trigger re-matching if preferences change
- [ ] **GET /api/users/me/matches-summary**
  - [ ] Return dashboard summary:
    - [ ] profileCompleteness percentage
    - [ ] resumeUploaded boolean
    - [ ] totalMatches count
    - [ ] viewedMatches count
    - [ ] savedMatches count

---

## PHASE 3: JOB EXTRACTION & MATCHING ENGINE

### 3.1 Job Normalization Service
- [ ] Create normalization service
  - [ ] File: `src/services/jobNormalization.ts`
  - [ ] Function: `normalizeJob(rawJob, bucket, keyword)`
    - [ ] Extract and map all fields from API response
    - [ ] Generate externalJobId (hash of URL)
    - [ ] Detect careerLevel from description
    - [ ] Extract tech stack (from description, skills)
    - [ ] Detect employmentType
    - [ ] Detect workMode (remote/hybrid/onsite)
    - [ ] Detect batchEligibility
    - [ ] Normalize title & company (lowercase)
    - [ ] Set fetchedAt + expiryDate (30 days)
    - [ ] Return normalized job object
  - [ ] Helper functions:
    - [ ] `detectCareerLevel(text)` - fresher/junior/mid/senior/lead
    - [ ] `extractTechStack(text)` - Array of tech names
    - [ ] `extractExperienceYears(text)` - Number of years
    - [ ] `detectEmploymentType(job)` - full-time/contract/part-time/freelance
    - [ ] `detectWorkMode(text)` - remote/hybrid/onsite
    - [ ] `checkBatchEligibility(text)` - Boolean
    - [ ] `extractSalaryMin/Max(text)` - Numbers
    - [ ] `extractCurrency(text)` - Currency code
    - [ ] `normalizeText(text)` - Lowercase, trim, remove extra spaces

### 3.2 Deduplication Logic
- [ ] Create deduplication service
  - [ ] File: `src/services/deduplication.ts`
  - [ ] Function: `saveBatch(normalizedJobs, sessionId)`
    - [ ] For each job:
      - [ ] Check if externalJobId exists in DB
      - [ ] If exists: UPDATE (description, fetchedAt, expiryDate, isActive)
      - [ ] If new: INSERT
      - [ ] Track new vs updated count
    - [ ] Update ScrapingLogs with results
    - [ ] Log deduplication statistics

### 3.3 API Limit Enforcement
- [ ] Create API usage tracking
  - [ ] File: `src/services/apiUsageService.ts`
  - [ ] Function: `checkApiLimit(bucket, keyword)` - Before API call
    - [ ] Query ApiUsage for current month
    - [ ] Check if totalCallsUsed >= monthlyLimit
    - [ ] If yes: Throw error "Monthly limit reached"
    - [ ] Check if totalCallsUsed >= safetyThreshold (80%)
    - [ ] If yes: Log warning "Approaching limit"
    - [ ] Return remaining calls
  - [ ] Function: `recordApiCall(bucket, keyword, resultCount, status)`
    - [ ] Increment totalCallsUsed
    - [ ] Push to callHistory
    - [ ] Update callsRemaining
    - [ ] Check if new limit reached
  - [ ] Function: `resetMonthlyUsage()` - Called monthly
    - [ ] Create new ApiUsage record for new month
    - [ ] Set totalCallsUsed = 0

### 3.4 Scraping Service (Main Orchestrator)
- [ ] Create scraping orchestrator
  - [ ] File: `src/services/scrapingService.ts`
  - [ ] Function: `scrapeJobBuckets(buckets, sessionId)`
    - [ ] Create ScrapingLogs entry with sessionId
    - [ ] For each bucket:
      - [ ] Call openWebNinjaClient.searchJobs(bucket, keyword)
      - [ ] Normalize each job
      - [ ] Save to DB with deduplication
      - [ ] Update bucketDetails with results
      - [ ] On error: Mark bucket as failed, continue
    - [ ] Update ScrapingLogs with final status
    - [ ] Trigger matching for all users
    - [ ] Send admin notification
  - [ ] Include all 11 buckets with keywords (from spec)
  - [ ] Implement retry on temporary failures

### 3.5 Job Extraction (from HTML if needed)
- [ ] Create HTML extraction service
  - [ ] File: `src/services/htmlExtraction.ts`
  - [ ] Function: `extractJobDetailsFromHtml(html)` - For career pages
    - [ ] Use cheerio or jsdom to parse HTML
    - [ ] Extract title, description, requirements, salary, etc.
    - [ ] Return normalized object
  - [ ] Use Playwright for JavaScript-heavy pages (if needed)

---

## PHASE 4: RESUME PARSING & MATCHING ENGINE

### 4.1 Resume Parsing Service
- [ ] Create resume parser
  - [ ] File: `src/services/resumeParser.ts`
  - [ ] Dependencies: pdfparse, docxtemplater or similar
  - [ ] Function: `parseResume(filePath)`
    - [ ] Detect file type (PDF/DOCX)
    - [ ] Extract raw text
    - [ ] Parse skills (regex + keyword matching)
    - [ ] Parse work history (company, role, dates)
    - [ ] Parse education (institution, degree, dates)
    - [ ] Calculate yearsOfExperience
    - [ ] Detect targetRoles from objective/summary
    - [ ] Detect technicalFocus (backend/frontend/data/etc.)
    - [ ] Return ParsedResume object
  - [ ] Quality indicators:
    - [ ] parseQuality: high/medium/low
    - [ ] parseConfidence: 0-100 percentage
  - [ ] Error handling:
    - [ ] Corrupted file: Graceful error
    - [ ] Missing text: Mark low quality
    - [ ] Unrecognized format: Reject with message

### 4.2 6-Factor Matching Algorithm
- [ ] Create matching engine
  - [ ] File: `src/services/matchingEngine.ts`
  - [ ] Function: `calculateMatch(user, job)`
    - [ ] **Factor 1 - Skill Match (0-40 points)**
      - [ ] Compare user.resume.skills with job.techStack
      - [ ] Score = (matched_skills / max_skills) * 40
      - [ ] Return skillMatch score
    - [ ] **Factor 2 - Role Match (0-20 points)**
      - [ ] Compare user.targetRoles with job.title
      - [ ] Use keyword matching + fuzzy matching
      - [ ] Score = (matched_roles / user_roles) * 20
      - [ ] Return roleMatch score
    - [ ] **Factor 3 - Level Match (0-15 points)**
      - [ ] Compare user.careerLevel with job.careerLevel
      - [ ] Perfect match = 15
      - [ ] Overqualified = 13.5
      - [ ] Gap ≤ 2 levels = 9
      - [ ] Gap > 2 levels = 3
      - [ ] Return levelMatch score
    - [ ] **Factor 4 - Experience Match (0-10 points)**
      - [ ] Compare user.yearsOfExperience with job.experienceRequired
      - [ ] Equal or more = 10
      - [ ] Linear falloff: (user_yrs / job_yrs) * 10
      - [ ] Return experienceMatch score
    - [ ] **Factor 5 - Location Match (0-10 points)**
      - [ ] Check if job.location in user.targetLocations
      - [ ] Exact match = 10
      - [ ] user.openToRelocation = 9
      - [ ] No match = 0
      - [ ] Return locationMatch score
    - [ ] **Factor 6 - Work Mode Match (0-5 points)**
      - [ ] Compare user.preferredWorkMode with job.workMode
      - [ ] Exact match = 5
      - [ ] Hybrid match = 2.5
      - [ ] No preference = 2.5
      - [ ] Return workModeMatch score
    - [ ] **Total Score Calculation:**
      - [ ] totalScore = sum of all 6 factors (0-100)
      - [ ] Determine matchType based on score:
        - [ ] ≥ 80 = "excellent" (green)
        - [ ] 60-79 = "good" (yellow)
        - [ ] 40-59 = "okay" (orange)
        - [ ] < 40 = "poor" (red)
      - [ ] Generate matchReason string
    - [ ] Return complete match object with all factors
  - [ ] Helper functions for each factor
  - [ ] Fuzzy matching utility (for role matching)

### 4.3 Batch Matching Service
- [ ] Create batch matching service
  - [ ] File: `src/services/batchMatchingService.ts`
  - [ ] Function: `matchAllJobsForUser(userId)`
    - [ ] Query user + resume
    - [ ] Query all active jobs
    - [ ] For each job: Calculate match score
    - [ ] Save all matches to JobMatches collection
    - [ ] Return summary (count by matchType)
  - [ ] Function: `matchUserForNewJobs(userId)` - When new jobs added
    - [ ] Query user + resume
    - [ ] Query new jobs (added today)
    - [ ] Calculate matches
    - [ ] Save matches
  - [ ] Optimize for performance:
    - [ ] Batch database operations
    - [ ] Use projection to reduce data transfer
    - [ ] Add caching if needed

### 4.4 Match Statistics Service
- [ ] Create statistics service
  - [ ] File: `src/services/matchStatisticsService.ts`
  - [ ] Function: `getMatchStats(userId)`
    - [ ] Count matches by type
    - [ ] Calculate averages
    - [ ] Return statistics object
  - [ ] Function: `getTrendingMatches()`
    - [ ] Most matched jobs
    - [ ] Most matched skills
    - [ ] Most matched roles

---

## PHASE 5: NOTIFICATIONS & COMMUNICATION

### 5.1 Email Notification Service
- [ ] Review existing Nodemailer setup
- [ ] Create email templates
  - [ ] Welcome email
  - [ ] Job match notification
  - [ ] Resume parsed notification
  - [ ] API limit warning
  - [ ] Scraping completed notification
- [ ] Implement email sending
  - [ ] File: `src/services/emailService.ts`
  - [ ] Send welcome email on signup
  - [ ] Send job match daily digest
  - [ ] Send API limit warning at 80%
  - [ ] Send scraping completion notification
- [ ] Add retry logic for failed emails

### 5.2 WhatsApp Cloud API Integration
- [ ] Setup WhatsApp Cloud API credentials
- [ ] Create WhatsApp service
  - [ ] File: `src/services/whatsappService.ts`
  - [ ] Function: `sendMessage(phoneNumber, message)`
    - [ ] Validate phone number (India format)
    - [ ] Call WhatsApp Cloud API
    - [ ] Handle errors
    - [ ] Log result
  - [ ] Message templates:
    - [ ] New job match notification
    - [ ] Daily digest
    - [ ] API limit warning
- [ ] Store user WhatsApp preferences
- [ ] Implement opt-in/opt-out

### 5.3 Telegram Bot Integration
- [ ] Setup Telegram Bot API
- [ ] Create Telegram service
  - [ ] File: `src/services/telegramService.ts`
  - [ ] Function: `sendMessage(chatId, message)`
    - [ ] Call Telegram Bot API
    - [ ] Handle errors
    - [ ] Log result
  - [ ] Implement bot commands:
    - [ ] /start - Initialize
    - [ ] /jobs - Get latest matches
    - [ ] /status - API usage status
    - [ ] /help - Help menu
- [ ] Store user Telegram chat IDs

### 5.4 Notification Manager
- [ ] Create unified notification service
  - [ ] File: `src/services/notificationManager.ts`
  - [ ] Function: `notifyUser(userId, event, channels)`
    - [ ] event = "job_match", "resume_parsed", "api_limit_warning", etc.
    - [ ] channels = ["email", "whatsapp", "telegram"]
    - [ ] Send via appropriate channels
    - [ ] Log to NotificationLog collection
  - [ ] Queue notifications using BullMQ
  - [ ] Retry on failure
  - [ ] Respect user notification preferences

---

## PHASE 6: STALE DATA MANAGEMENT & CLEANUP

### 6.1 Job Expiration Logic
- [ ] Implement job cleanup
  - [ ] File: `src/services/jobCleanupService.ts`
  - [ ] Function: `markExpiredJobs()`
    - [ ] Query jobs where expiryDate < now
    - [ ] Set isActive = false
    - [ ] Log marked jobs
  - [ ] Function: `deleteOldJobs()`
    - [ ] Query jobs where expiryDate < 30 days ago
    - [ ] Delete completely from DB
    - [ ] Log deleted jobs
  - [ ] Schedule: Weekly cleanup job (Sundays)

### 6.2 Admin Dashboard for Stale Job Management
- [ ] Create admin endpoint: **GET /api/admin/stale-jobs**
  - [ ] Query isActive=false jobs
  - [ ] Return with metadata (expiration date, last updated)
  - [ ] Allow filtering
- [ ] Create admin endpoint: **PUT /api/admin/stale-jobs/:jobId**
  - [ ] Manually reactivate jobs
  - [ ] Update expiryDate
  - [ ] Trigger re-matching

### 6.3 Resume Expiration
- [ ] Mark resumed as expired after 365 days
- [ ] Notify user to upload new resume
- [ ] Delete old matches when resume expires

---

## PHASE 7: FRONTEND IMPLEMENTATION

### 7.1 Job Search Page
- [ ] Create JobSearchFilters component
  - [ ] Search box (text query)
  - [ ] Dropdown: Career Level
  - [ ] Dropdown: Domain
  - [ ] Dropdown: Work Mode
  - [ ] Dropdown: Location
  - [ ] Checkbox: Employment Type
  - [ ] Checkbox: Tech Stack
  - [ ] Date range picker
  - [ ] Search button
- [ ] Create JobCard component
  - [ ] Display job basics (title, company, location)
  - [ ] Show salary range
  - [ ] Show match score (if logged in + resume uploaded)
  - [ ] Save job button
  - [ ] View details button
- [ ] Create JobListView component
  - [ ] List of job cards
  - [ ] Pagination
  - [ ] Empty state

### 7.2 Job Detail Page
- [ ] Create JobDetailView component
  - [ ] Full job description
  - [ ] Requirements list
  - [ ] Tech stack tags
  - [ ] Salary info
  - [ ] Company info
  - [ ] Apply button (external link)
  - [ ] Save job button
  - [ ] Share job button
  - [ ] Match breakdown (if user logged in)
    - [ ] Show all 6 factors with scores
    - [ ] Visual progress bars
    - [ ] Match reason text

### 7.3 Resume Upload & Parsing
- [ ] Create ResumeUpload component
  - [ ] Drag-drop zone for PDF/DOCX
  - [ ] File validation (size, format)
  - [ ] Upload progress bar
  - [ ] Success/error message
- [ ] Create ResumeParsing component
  - [ ] Show extracted skills
  - [ ] Show work history
  - [ ] Show education
  - [ ] Allow manual editing
  - [ ] Save button

### 7.4 Matches Display
- [ ] Create MatchList component
  - [ ] Filter by match type (excellent, good, okay, poor)
  - [ ] Sort by score
  - [ ] Display match score + reason
  - [ ] List jobs
- [ ] Create MatchCard component
  - [ ] Job info
  - [ ] Match score (large, colored)
  - [ ] 6 factors breakdown (sparkline or bar chart)
  - [ ] Quick save button
- [ ] Create MatchStats component
  - [ ] Total matches count
  - [ ] Breakdown by type (pie chart)
  - [ ] Average match score
  - [ ] Refresh button

### 7.5 Admin Dashboard
- [ ] Create AdminDashboard component
  - [ ] Scraping controls
  - [ ] API usage monitor
  - [ ] Scraping logs viewer
- [ ] Create ScrapingControl component
  - [ ] Checkbox list of buckets
  - [ ] Start scraping button
  - [ ] Cancel button
  - [ ] Real-time progress
- [ ] Create ApiUsageMonitor component
  - [ ] Current usage (progress bar)
  - [ ] Remaining calls
  - [ ] Warning if > 80%
  - [ ] Critical if = 100%
  - [ ] Set limit button
- [ ] Create ScrapingLogs component
  - [ ] Table of scraping sessions
  - [ ] Filter by status
  - [ ] View detailed logs
  - [ ] Drill down to bucket details

### 7.6 User Profile Page
- [ ] Create ProfileForm component
  - [ ] Edit basic info (name, email)
  - [ ] Career level selector
  - [ ] Years of experience
  - [ ] Current role
  - [ ] Target roles input
  - [ ] Target domains checkboxes
  - [ ] Preferred work mode
  - [ ] Target locations
  - [ ] Salary expectations
  - [ ] Relocation openness toggle
  - [ ] Save button
- [ ] Create MatchesSummary component
  - [ ] Profile completeness % (visual)
  - [ ] Resume upload status
  - [ ] Total matches count
  - [ ] View all matches button

---

## PHASE 8: TESTING & QUALITY ASSURANCE

### 8.1 Backend Unit Tests
- [ ] Test suite: Jest or Mocha
- [ ] Create test files for all services
  - [ ] `openWebNinjaClient.test.ts` - API client tests
  - [ ] `jobNormalization.test.ts` - Normalization logic
  - [ ] `deduplication.test.ts` - Deduplication tests
  - [ ] `matchingEngine.test.ts` - Matching algorithm tests
  - [ ] `resumeParser.test.ts` - Resume parsing tests
  - [ ] `apiUsageService.test.ts` - Limit enforcement tests
- [ ] Test coverage target: > 80%

### 8.2 Backend Integration Tests
- [ ] Test complete workflows
  - [ ] End-to-end job scraping
  - [ ] API limit enforcement
  - [ ] Deduplication with multiple runs
  - [ ] User matching flow
  - [ ] Resume upload → parsing → matching
- [ ] Database integration tests
  - [ ] Model save/retrieve
  - [ ] Index performance
  - [ ] Query optimization

### 8.3 API Endpoint Tests
- [ ] Supertest for all endpoints
- [ ] Test each endpoint:
  - [ ] Auth endpoints
  - [ ] Job search endpoints
  - [ ] Admin scraping endpoints
  - [ ] Resume endpoints
  - [ ] Matching endpoints
- [ ] Test error cases:
  - [ ] Invalid input
  - [ ] Authentication failures
  - [ ] Not found errors
  - [ ] Rate limits

### 8.4 Frontend Component Tests
- [ ] Use React Testing Library
- [ ] Test components:
  - [ ] JobCard renders correctly
  - [ ] Filters update results
  - [ ] Match display shows correct data
  - [ ] Resume upload validates file
  - [ ] Admin controls work

### 8.5 E2E Tests
- [ ] Use Cypress or Playwright
- [ ] Test complete user journeys:
  - [ ] Sign up → upload resume → view matches
  - [ ] Admin scrape → view logs → check API usage
  - [ ] Search jobs → save → view saved list

### 8.6 Performance Testing
- [ ] Load testing (k6 or Apache JMeter)
  - [ ] Job search with 10K jobs
  - [ ] Match calculation for 1000 jobs
  - [ ] Concurrent user login
- [ ] Database query optimization
  - [ ] Profile slow queries
  - [ ] Verify indexes used
  - [ ] Optimize N+1 queries
- [ ] Memory leak detection

---

## PHASE 9: DEPLOYMENT & PRODUCTION SETUP

### 9.1 Backend Deployment
- [ ] Prepare production environment
  - [ ] Use MongoDB Atlas (cloud)
  - [ ] Use Redis Cloud or AWS ElastiCache
  - [ ] Setup environment variables (secrets)
  - [ ] Enable HTTPS/TLS
- [ ] Deploy options:
  - [ ] Heroku, Railway, Render, or AWS EC2/ECS
  - [ ] Setup CI/CD pipeline (GitHub Actions)
  - [ ] Automated testing before deploy
  - [ ] Automated database migrations
- [ ] Setup logging & monitoring
  - [ ] Winston logger to file/cloud
  - [ ] Sentry for error tracking
  - [ ] DataDog or New Relic for APM
- [ ] Setup alerts
  - [ ] API limit reached
  - [ ] Scraping failed
  - [ ] High error rate
  - [ ] Database down

### 9.2 Frontend Deployment
- [ ] Build optimization
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization
  - [ ] Bundle analysis
- [ ] Deploy to CDN (Vercel, Netlify, AWS CloudFront)
- [ ] Setup domain & SSL
- [ ] Automated deployments on push to main
- [ ] Rollback strategy

### 9.3 Database Backups & Recovery
- [ ] Setup automated backups (daily)
- [ ] Test restore process
- [ ] Document recovery procedure
- [ ] Store backups in separate region

### 9.4 Security Hardening
- [ ] API security:
  - [ ] Rate limiting on public endpoints
  - [ ] CORS configuration
  - [ ] CSRF protection
  - [ ] XSS protection
  - [ ] SQL injection prevention (via Mongoose)
  - [ ] Input validation everywhere
- [ ] Authentication:
  - [ ] Secure password hashing (bcryptjs)
  - [ ] JWT expiry & refresh logic
  - [ ] Token blacklist on logout
- [ ] Data protection:
  - [ ] Encrypt sensitive fields in DB
  - [ ] HTTPS everywhere
  - [ ] Secure cookies (httpOnly, Secure, SameSite)
- [ ] Infrastructure:
  - [ ] VPC for database
  - [ ] Firewall rules
  - [ ] DDoS protection

---

## PHASE 10: MONITORING & MAINTENANCE

### 10.1 Health Checks & Monitoring
- [ ] Setup health check endpoints
  - [ ] GET /health - Basic health
  - [ ] GET /health/db - Database connectivity
  - [ ] GET /health/redis - Redis connectivity
  - [ ] GET /health/api - External API status
- [ ] Monitor key metrics:
  - [ ] API response times
  - [ ] Error rates
  - [ ] Job queue depth
  - [ ] Database query times
  - [ ] Disk space
  - [ ] Memory usage

### 10.2 Logging Strategy
- [ ] Structured logging with Winston
  - [ ] Log level: debug, info, warn, error
  - [ ] Include request ID for tracing
  - [ ] Log all API calls (method, path, status, duration)
  - [ ] Log all database operations (query, duration)
  - [ ] Log all external API calls
  - [ ] Log all errors with stack traces
- [ ] Log retention: 30 days in cloud

### 10.3 Scheduled Maintenance
- [ ] Weekly tasks:
  - [ ] Review error logs
  - [ ] Check disk space
  - [ ] Verify backups
  - [ ] Check API limits
- [ ] Monthly tasks:
  - [ ] Performance review
  - [ ] Security updates
  - [ ] Database optimization
  - [ ] Cost review

### 10.4 User Support Documentation
- [ ] Create user guides
  - [ ] How to upload resume
  - [ ] How to search jobs
  - [ ] How to understand match scores
  - [ ] How to save jobs
- [ ] Create admin guides
  - [ ] How to trigger scraping
  - [ ] How to monitor API usage
  - [ ] How to view logs
- [ ] FAQ document
- [ ] Troubleshooting guide

---

## APPENDIX: QUICK REFERENCE

### Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Project structure | ✅ Done | Basic MERN setup |
| MongoDB models | ⚠️ 50% | Existing models need expansion |
| API routes | ⚠️ 50% | 15 route files exist, logic incomplete |
| OpenWeb Ninja integration | ❌ Missing | Critical path item |
| Job normalization | ❌ Missing | Need to build from spec |
| Deduplication logic | ❌ Missing | Critical for data quality |
| API usage tracking | ❌ Missing | Collection exists, logic missing |
| 6-factor matching | ❌ Missing | Critical differentiator |
| Resume parsing | ❌ Missing | Need PDF/DOCX extraction |
| WhatsApp integration | ❌ Missing | Mock exists, need real API |
| Telegram integration | ❌ Missing | Mock exists, need real API |
| Job cleanup/expiry | ❌ Missing | Need scheduled tasks |
| Frontend pages | ⚠️ 30% | Basic pages exist, features missing |
| Admin dashboard | ⚠️ 20% | UI structure only |
| Testing suite | ❌ Missing | No tests in place |
| Deployment pipeline | ❌ Missing | Need CI/CD setup |

### Technology Stack Summary

**Backend:**
- Runtime: Node.js
- Framework: Express.js
- Language: TypeScript
- Database: MongoDB + Mongoose
- Cache: Redis (ioredis)
- Job Queue: BullMQ
- Scheduler: node-cron
- Password: bcryptjs
- Auth: JWT
- Email: Nodemailer
- File Upload: Multer (implied)

**Frontend:**
- Framework: React 18
- Language: TypeScript
- Bundler: Vite
- UI: shadcn/ui + Tailwind CSS
- HTTP: Axios (implied)
- State: Redux/Zustand (implied)

**External Services:**
- OpenWeb Ninja API (job search)
- Razorpay (payments)
- WhatsApp Cloud API
- Telegram Bot API

### Key Constraints & Considerations

1. **API Budget:** 200 calls/month maximum - No per-user API calls
2. **India-Only:** All queries must filter for India jobs
3. **Data Flow:** User → MongoDB only (never direct API calls)
4. **6-Factor Match:** Transparent scoring system, not ML-based
5. **Resume Quality:** Parse PDFs/DOCX, handle errors gracefully
6. **Job Expiry:** 30 days active, delete after 60 days
7. **Deduplication:** By externalJobId, update existing instead of duplicating
8. **Rate Limiting:** 1 request/second minimum between API calls
9. **Retry Logic:** 3 attempts with exponential backoff (2s, 4s, 8s)

---

**Created:** January 18, 2026  
**Last Updated:** January 18, 2026  
**Document Version:** 1.0

For detailed implementation guidance, refer to:
- AI_AGENT_PROMPT.md (complete specification)
- JOBINTEL_DETAILED_ANALYSIS.md (current state analysis)
- TECHNICAL_README.md (architecture details)
- LinkedIN-Scraper/TECHNICAL_README.md (API patterns to follow)
