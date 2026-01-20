# AI Agent Development Prompt: Fresher-First Job Aggregation Platform

## EXECUTIVE SUMMARY

You are tasked with building a **production-ready, MERN-based Job Aggregation Platform** that:
- Scrapes LinkedIn jobs via OpenWeb Ninja JSearch API (200 requests/month free tier)
- Serves unlimited users from local MongoDB (no per-user API calls)
- Intelligently matches jobs to fresher/entry-level candidates
- Uses admin-controlled, scheduled scraping to maximize API efficiency
- Provides resume-based job matching with multi-factor scoring

**Key Constraint**: Fix 200 API calls/month maximum → must cache all data locally

---

## PART 1: TECHNICAL STACK

### Technology Requirements
- **Frontend**: React 18+ with TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js + Express.js with TypeScript
- **Database**: MongoDB (primary), Redis (optional caching)
- **External API**: OpenWeb Ninja JSearch API (200 requests/month)
- **Authentication**: JWT for user sessions, role-based access (admin/user)
- **File Handling**: Resume upload (PDF/DOCX) → text extraction
- **Scheduling**: Node-cron for scheduled scraping tasks
- **Monitoring**: Winston logger for API usage audit trails

### API Service Integration
```
OpenWeb Ninja JSearch API
├─ Endpoint: https://api.openwebninja.com/search/social
├─ Rate Limit: 200 requests/month free tier
├─ Response: Job listings with title, company, location, description
└─ Cost: Must use caching to serve unlimited users
```

---

## PART 2: CORE ARCHITECTURE

### High-Level Data Flow
```
Admin Dashboard
    ↓
[Trigger Scraping]
    ↓
Backend Service (Node.js)
    ↓
[Check API Usage Counter]
    ↓
OpenWeb Ninja API (ONLY for scraping, never for users)
    ↓
[Normalize & Deduplicate]
    ↓
MongoDB (jobs, api_usage, scraping_logs)
    ↓
[User Searches via Frontend]
    ↓
MongoDB Query (NO external API)
    ↓
[Display Results to User]
```

### Key Principle
```
User Queries → MongoDB ONLY (fast, unlimited)
Admin Scraping → OpenWeb Ninja API (limited, scheduled)
No user request ever touches external API
```

---

## PART 3: ROLE BUCKET TAXONOMY (11 Categories)

These are the job search buckets that admin can trigger scraping for:

### Category 1: Fresher/Entry-Level Jobs
- Keywords: "fresher", "fresher developer", "graduate trainee", "entry level developer", "junior developer"
- Priority: HIGH (scrape every Sunday)
- Expected API calls: 8-10 per month

### Category 2: Batch/Campus Hiring
- Keywords: "batch hiring", "campus recruitment", "campus drive", "college hire", "graduate program"
- Priority: MEDIUM (scrape every 2 weeks)
- Expected API calls: 5-6 per month

### Category 3: Software Development
- Keywords: "software developer", "backend engineer", "frontend developer", "full stack developer", "software engineer"
- Priority: HIGH
- Expected API calls: 15-20 per month

### Category 4: Data Science & AI
- Keywords: "data scientist", "machine learning engineer", "AI engineer", "data engineer", "analytics engineer"
- Priority: MEDIUM
- Expected API calls: 12-15 per month

### Category 5: Cloud & DevOps
- Keywords: "cloud engineer", "devops engineer", "aws engineer", "kubernetes", "infrastructure engineer"
- Priority: MEDIUM
- Expected API calls: 8-10 per month

### Category 6: Mobile Development
- Keywords: "android developer", "ios developer", "react native", "flutter developer", "mobile engineer"
- Priority: LOW
- Expected API calls: 6-8 per month

### Category 7: QA & Testing
- Keywords: "qa engineer", "test automation", "quality assurance", "qa tester", "test engineer"
- Priority: MEDIUM
- Expected API calls: 6-8 per month

### Category 8: Non-Technical Roles
- Keywords: "product manager", "business analyst", "scrum master", "project manager", "business development"
- Priority: LOW
- Expected API calls: 8-10 per month

### Category 9: Experience Level Filter
- Keywords: "0-1 years experience", "1-3 years", "mid level", "senior", "principal engineer"
- Priority: MEDIUM
- Expected API calls: 10-12 per month

### Category 10: Employment Type Filter
- Keywords: "full time", "contract", "part time", "freelance", "permanent"
- Priority: MEDIUM
- Expected API calls: 8-10 per month

### Category 11: Work Mode Filter
- Keywords: "remote", "work from home", "hybrid", "onsite", "flexible location"
- Priority: MEDIUM
- Expected API calls: 8-10 per month

---

## PART 4: MONGODB SCHEMA DESIGN (7 Collections)

### Collection 1: `jobs`
```javascript
{
  _id: ObjectId,
  externalJobId: String (unique),
  title: String,
  company: String,
  location: String,
  description: String,
  shortDescription: String (first 200 chars),
  jobUrl: String,
  salaryMin: Number,
  salaryMax: Number,
  currency: String,
  
  // Normalized/Extracted Fields
  careerLevel: String enum ["fresher", "junior", "mid", "senior", "lead"],
  domain: String enum ["software", "data", "cloud", "mobile", "qa", "non-tech"],
  techStack: [String], // ["React", "Node.js", "MongoDB"]
  experienceRequired: Number, // in years
  employmentType: String enum ["full-time", "contract", "part-time", "freelance"],
  workMode: String enum ["remote", "onsite", "hybrid"],
  batchEligible: Boolean, // can freshers apply?
  
  // Metadata
  fetchedAt: Date,
  expiryDate: Date, // fetchedAt + 30 days
  isActive: Boolean, // false if expired
  source: String, // "OpenWeb Ninja"
  bucket: String, // which bucket triggered this job
  scrapedAt: Date,
  
  // Matching-related
  normalizedTitle: String, // lowercase, standardized
  normalizedCompany: String,
  
  createdAt: Date (indexed),
  updatedAt: Date (indexed)
}

// Indexes
db.jobs.createIndex({ externalJobId: 1 }, { unique: true })
db.jobs.createIndex({ careerLevel: 1, isActive: 1 })
db.jobs.createIndex({ domain: 1, isActive: 1 })
db.jobs.createIndex({ techStack: 1 })
db.jobs.createIndex({ workMode: 1, isActive: 1 })
db.jobs.createIndex({ fetchedAt: 1 })
db.jobs.createIndex({ expiryDate: 1 })
db.jobs.createIndex({ batchEligible: 1, isActive: 1 })
```

### Collection 2: `users`
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  firstName: String,
  lastName: String,
  profilePicture: String (URL),
  
  // Profile Info
  careerLevel: String enum ["fresher", "junior", "mid", "senior"],
  yearsOfExperience: Number,
  currentRole: String,
  targetRoles: [String], // ["Backend Developer", "Full Stack Developer"]
  targetDomains: [String], // ["software", "data", "cloud"]
  preferredWorkMode: String enum ["remote", "onsite", "hybrid"],
  targetLocations: [String],
  
  // Resume Info
  resumeUploadedAt: Date,
  resumeId: ObjectId, // reference to parsed_resumes
  
  // Preferences
  openToRelocation: Boolean,
  salaryCurrencyCode: String,
  minSalaryExpectation: Number,
  
  // Activity Tracking
  lastLoginAt: Date,
  profileCompleteness: Number, // 0-100%
  
  // Role
  userRole: String enum ["user", "admin"],
  createdAt: Date (indexed),
  updatedAt: Date (indexed)
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ userRole: 1 })
db.users.createIndex({ careerLevel: 1 })
```

### Collection 3: `parsed_resumes`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  
  // Raw Resume Data
  rawText: String, // extracted text from PDF/DOCX
  uploadedFileName: String,
  uploadedAt: Date,
  expiryDate: Date, // uploadedAt + 365 days
  
  // Extracted Skills
  skills: [String], // ["Java", "Spring Boot", "AWS", "Docker"]
  technicalSkills: [String],
  softSkills: [String],
  
  // Work Experience
  totalYearsOfExperience: Number,
  workHistory: [{
    company: String,
    role: String,
    startDate: Date,
    endDate: Date,
    description: String,
    technologiesUsed: [String]
  }],
  
  // Education
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    graduationDate: Date
  }],
  
  // Extracted from Resume
  currentRole: String,
  yearsInCurrentRole: Number,
  targetRoles: [String], // extracted from objective
  technicalFocus: [String], // ["backend", "cloud", "data"]
  certifications: [String],
  
  // Metadata
  isActive: Boolean,
  parseQuality: String enum ["high", "medium", "low"],
  parseConfidence: Number, // 0-100
  createdAt: Date,
  updatedAt: Date (indexed)
}

// Indexes
db.parsed_resumes.createIndex({ userId: 1 })
db.parsed_resumes.createIndex({ skills: 1 })
```

### Collection 4: `job_matches`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  jobId: ObjectId (reference to jobs),
  externalJobId: String, // denormalized for quick lookup
  
  // Match Score Breakdown (total: 100)
  skillMatch: Number, // 0-40: % of user skills found in job
  roleMatch: Number, // 0-20: how well title matches target role
  levelMatch: Number, // 0-15: career level alignment
  experienceMatch: Number, // 0-10: experience requirement fit
  locationMatch: Number, // 0-10: location preference match
  workModeMatch: Number, // 0-5: remote/onsite preference
  
  totalScore: Number, // sum of all above (0-100)
  matchReason: String, // "High skill match", "Role mismatch but location good"
  
  // Match Category
  matchType: String enum ["excellent", "good", "okay", "poor"], // based on totalScore
  
  // User Actions
  userViewed: Boolean,
  userSaved: Boolean,
  userApplied: Boolean,
  
  // Timestamps
  matchedAt: Date (indexed),
  viewedAt: Date,
  savedAt: Date,
  appliedAt: Date,
  
  createdAt: Date,
  updatedAt: Date (indexed)
}

// Indexes
db.job_matches.createIndex({ userId: 1, totalScore: -1 })
db.job_matches.createIndex({ userId: 1, matchedAt: -1 })
db.job_matches.createIndex({ jobId: 1 })
db.job_matches.createIndex({ totalScore: -1 })
db.job_matches.createIndex({ matchType: 1 })
```

### Collection 5: `api_usage`
```javascript
{
  _id: ObjectId,
  month: String, // "2025-01" (Year-Month)
  provider: String, // "OpenWeb Ninja"
  
  // Usage Tracking
  totalCallsUsed: Number, // actual calls made
  monthlyLimit: Number, // admin-configurable, default: 200
  callsRemaining: Number, // monthlyLimit - totalCallsUsed
  safetyThreshold: Number, // 80% of limit, trigger warning
  
  // Call Details
  callHistory: [{
    timestamp: Date,
    bucket: String, // "fresher", "software", etc.
    keyword: String,
    resultCount: Number,
    status: String enum ["success", "failed", "rate-limited"],
    errorMessage: String (optional),
    initiatedBy: ObjectId (reference to admin user)
  }],
  
  // Status
  isLimitReached: Boolean, // true if totalCallsUsed >= monthlyLimit
  isWarningTriggered: Boolean, // true if totalCallsUsed >= safetyThreshold
  
  // Admin Settings
  adminConfiguredLimit: Number, // admin-set custom limit (overrides default)
  lastConfiguredAt: Date,
  lastConfiguredBy: ObjectId,
  
  createdAt: Date,
  updatedAt: Date (indexed)
}

// Indexes
db.api_usage.createIndex({ month: 1 }, { unique: true })
db.api_usage.createIndex({ isLimitReached: 1 })
```

### Collection 6: `saved_jobs`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (reference to users),
  jobId: ObjectId (reference to jobs),
  externalJobId: String, // denormalized
  
  // Metadata
  savedAt: Date,
  notes: String, // user can add personal notes
  priority: String enum ["high", "medium", "low"],
  status: String enum ["saved", "applied", "rejected", "interviewing"],
  
  createdAt: Date,
  updatedAt: Date (indexed)
}

// Indexes
db.saved_jobs.createIndex({ userId: 1, savedAt: -1 })
db.saved_jobs.createIndex({ userId: 1, status: 1 })
```

### Collection 7: `scraping_logs`
```javascript
{
  _id: ObjectId,
  
  // Scrape Session Info
  sessionId: String (unique per scraping run),
  triggeredBy: String enum ["admin", "cron", "manual"],
  triggeredByUserId: ObjectId, // if admin triggered
  
  // Buckets Scraped
  bucketsRequested: [String], // ["fresher", "software", "data"]
  bucketsCompleted: [String],
  bucketsFailed: [String],
  
  // API Metrics
  totalApiCalls: Number,
  totalJobsFound: Number,
  newJobsAdded: Number,
  jobsUpdated: Number,
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
  
  // Status
  status: String enum ["in-progress", "completed", "failed", "partial"],
  errorMessage: String (optional),
  
  // Details for each bucket
  bucketDetails: [{
    bucket: String,
    keyword: String,
    apiCallsMade: Number,
    jobsFound: Number,
    newJobsAdded: Number,
    jobsUpdated: Number,
    startTime: Date,
    endTime: Date,
    status: String enum ["success", "failed"]
  }],
  
  createdAt: Date,
  updatedAt: Date (indexed)
}

// Indexes
db.scraping_logs.createIndex({ sessionId: 1 }, { unique: true })
db.scraping_logs.createIndex({ startedAt: -1 })
db.scraping_logs.createIndex({ status: 1 })
db.scraping_logs.createIndex({ triggeredBy: 1 })
```

---

## PART 5: BACKEND API ENDPOINTS (Node.js + Express)

### Authentication Endpoints
```
POST /api/auth/register
  Body: { email, password, firstName, lastName }
  Response: { token, user }

POST /api/auth/login
  Body: { email, password }
  Response: { token, user }

POST /api/auth/logout
  Response: { message: "Logged out" }

GET /api/auth/me
  Headers: { Authorization: "Bearer token" }
  Response: { user }
```

### Admin Scraping Endpoints
```
POST /api/admin/scrape/start
  Body: { buckets: ["fresher", "software"], triggeredBy: "admin" }
  Auth: Admin only
  Response: { sessionId, message, status }

GET /api/admin/scrape/status/:sessionId
  Auth: Admin only
  Response: { status, progress, completedBuckets, failedBuckets }

POST /api/admin/scrape/cancel/:sessionId
  Auth: Admin only
  Response: { message: "Scraping cancelled" }

GET /api/admin/scraping-logs
  Auth: Admin only
  Query: { limit, offset, status, startDate, endDate }
  Response: { logs: [...], total }
```

### API Usage Endpoints
```
GET /api/admin/api-usage/current
  Auth: Admin only
  Response: {
    month: "2025-01",
    totalCallsUsed: 45,
    monthlyLimit: 200,
    callsRemaining: 155,
    isWarningTriggered: false,
    isLimitReached: false
  }

PUT /api/admin/api-usage/limit
  Body: { monthlyLimit: 150 }
  Auth: Admin only
  Response: { message: "Limit updated", newLimit: 150 }

GET /api/admin/api-usage/history
  Auth: Admin only
  Query: { limit, offset, bucket, status }
  Response: { callHistory: [...], total }
```

### Job Search Endpoints
```
GET /api/jobs/search
  Query: {
    query: "react developer",
    careerLevel: "fresher",
    domain: "software",
    workMode: "remote",
    location: "bangalore",
    page: 1,
    limit: 20
  }
  Response: {
    jobs: [...],
    total,
    page,
    totalPages
  }

GET /api/jobs/:jobId
  Response: { job (full details) }

GET /api/jobs/featured
  Query: { limit: 10 }
  Response: { jobs: [...] }

GET /api/jobs/trending
  Response: { trendingSkills, trendingRoles, trendingLocations }
```

### Resume Endpoints
```
POST /api/resume/upload
  Body: FormData { file: PDF/DOCX }
  Auth: User
  Response: { resumeId, parseQuality, extractedSkills, workHistory }

GET /api/resume/me
  Auth: User
  Response: { resume (full details) }

PUT /api/resume/me
  Body: { skills, targetRoles, targetDomains }
  Auth: User
  Response: { resume (updated) }

DELETE /api/resume/me
  Auth: User
  Response: { message: "Resume deleted" }
```

### Job Matching Endpoints
```
GET /api/matches/my-jobs
  Auth: User
  Query: { page: 1, limit: 20, matchType: "excellent" }
  Response: {
    matches: [{
      job: { ...full job details },
      matchScore: 85,
      matchType: "excellent",
      matchReason: "High skill match"
    }],
    total,
    page
  }

POST /api/matches/refresh
  Auth: User
  Response: { message: "Matches refreshed", newMatches: 45 }

GET /api/matches/statistics
  Auth: User
  Response: {
    totalMatches: 156,
    excellentMatches: 12,
    goodMatches: 34,
    okayMatches: 89,
    poorMatches: 21
  }
```

### Saved Jobs Endpoints
```
POST /api/saved-jobs/:jobId
  Auth: User
  Body: { notes: "Interesting role" }
  Response: { savedJob }

GET /api/saved-jobs
  Auth: User
  Query: { page: 1, limit: 20, status: "saved" }
  Response: { savedJobs: [...], total }

PUT /api/saved-jobs/:jobId
  Auth: User
  Body: { status: "applied", priority: "high" }
  Response: { savedJob (updated) }

DELETE /api/saved-jobs/:jobId
  Auth: User
  Response: { message: "Job unsaved" }
```

### User Profile Endpoints
```
GET /api/users/me
  Auth: User
  Response: { user }

PUT /api/users/me
  Auth: User
  Body: { careerLevel, yearsOfExperience, targetRoles, targetDomains }
  Response: { user (updated) }

GET /api/users/me/matches-summary
  Auth: User
  Response: {
    profileCompleteness: 85,
    resumeUploaded: true,
    totalMatches: 156,
    viewedMatches: 34,
    savedMatches: 12
  }
```

---

## PART 6: JOB EXTRACTION & NORMALIZATION LOGIC

### Step 1: API Call Process
```javascript
// Pseudo-code for backend scraping service
async function scrapeRoleBucket(bucket, keyword) {
  // Check API limit before calling
  const usage = await ApiUsage.findOne({ month: currentMonth });
  
  if (usage.totalCallsUsed >= usage.monthlyLimit) {
    throw new Error("Monthly API limit reached");
  }
  
  if (usage.totalCallsUsed >= usage.safetyThreshold) {
    logger.warn(`API usage at ${usage.callsRemaining} calls remaining`);
  }
  
  // Make API call
  const response = await openWebNinjaAPI.search({
    q: keyword,
    type: "linkedin",
    num_results: 100 // request max results per call
  });
  
  // Log the call
  await ApiUsage.updateOne(
    { month: currentMonth },
    {
      $inc: { totalCallsUsed: 1 },
      $push: { callHistory: { timestamp, bucket, keyword, resultCount } }
    }
  );
  
  return response.jobs;
}
```

### Step 2: Job Normalization & Enrichment
```javascript
// Extract and normalize each job
function normalizeJob(rawJob, bucket, keyword) {
  const normalized = {
    externalJobId: rawJob.id || generateHash(rawJob.url),
    title: rawJob.title,
    company: rawJob.company,
    location: rawJob.location || "Not specified",
    description: rawJob.description || "",
    shortDescription: (rawJob.description || "").substring(0, 200),
    jobUrl: rawJob.url,
    
    // Extract salary if present
    salaryMin: extractSalaryMin(rawJob),
    salaryMax: extractSalaryMax(rawJob),
    currency: extractCurrency(rawJob),
    
    // Career Level Detection
    careerLevel: detectCareerLevel(rawJob.description),
    
    // Domain Detection
    domain: detectDomain(rawJob.title, rawJob.description),
    
    // Tech Stack Extraction
    techStack: extractTechStack(rawJob.description),
    
    // Experience Required
    experienceRequired: extractExperienceYears(rawJob.description),
    
    // Employment Type
    employmentType: detectEmploymentType(rawJob),
    
    // Work Mode
    workMode: detectWorkMode(rawJob.description),
    
    // Batch Eligibility (freshers can apply?)
    batchEligible: checkBatchEligibility(rawJob.description),
    
    // Metadata
    fetchedAt: new Date(),
    expiryDate: addDays(new Date(), 30),
    isActive: true,
    source: "OpenWeb Ninja",
    bucket: bucket, // which bucket triggered this
    normalizedTitle: normalizeText(rawJob.title),
    normalizedCompany: normalizeText(rawJob.company)
  };
  
  return normalized;
}

// Helper: Detect career level
function detectCareerLevel(description) {
  const text = description.toLowerCase();
  if (text.includes("fresher") || text.includes("0-1 year") || text.includes("graduate")) {
    return "fresher";
  }
  if (text.includes("junior") || text.includes("1-3 year")) return "junior";
  if (text.includes("senior") || text.includes("5+ year") || text.includes("principal")) return "senior";
  return "mid"; // default
}

// Helper: Extract tech stack
function extractTechStack(description) {
  const technologies = [
    "React", "Vue", "Angular", "Node.js", "Python", "Java", "C++", "Go",
    "AWS", "Azure", "GCP", "Kubernetes", "Docker", "MongoDB", "PostgreSQL",
    "Redis", "GraphQL", "REST", "TypeScript", "JavaScript"
  ];
  
  const text = description || "";
  return technologies.filter(tech => text.includes(tech));
}

// Helper: Detect employment type
function detectEmploymentType(job) {
  const text = (job.title + " " + job.description).toLowerCase();
  if (text.includes("full time")) return "full-time";
  if (text.includes("contract")) return "contract";
  if (text.includes("part time")) return "part-time";
  if (text.includes("freelance")) return "freelance";
  return "full-time"; // default
}

// Helper: Detect work mode
function detectWorkMode(description) {
  const text = (description || "").toLowerCase();
  if (text.includes("remote") || text.includes("wfh")) return "remote";
  if (text.includes("hybrid")) return "hybrid";
  if (text.includes("onsite") || text.includes("on-site")) return "onsite";
  return "onsite"; // default assumption
}
```

### Step 3: Deduplication Check
```javascript
async function saveBatch(normalizedJobs, sessionId) {
  const results = {
    newJobs: 0,
    updatedJobs: 0,
    duplicates: 0
  };
  
  for (const job of normalizedJobs) {
    // Check if job already exists
    const existing = await Job.findOne({ externalJobId: job.externalJobId });
    
    if (existing) {
      // Update existing
      await Job.updateOne(
        { externalJobId: job.externalJobId },
        {
          $set: {
            description: job.description,
            fetchedAt: new Date(),
            expiryDate: addDays(new Date(), 30),
            isActive: true
          }
        }
      );
      results.updatedJobs++;
    } else {
      // Insert new
      await Job.insertOne(job);
      results.newJobs++;
    }
  }
  
  // Log scraping session
  await ScrapingLog.updateOne(
    { sessionId },
    {
      $set: { completedAt: new Date(), status: "completed" },
      $inc: { newJobsAdded: results.newJobs, jobsUpdated: results.updatedJobs }
    }
  );
  
  return results;
}
```

---

## PART 7: JOB MATCHING ALGORITHM

### Matching Calculation Engine
```javascript
async function calculateMatch(user, job) {
  // 1. Skill Match (0-40 points)
  const skillMatch = calculateSkillMatch(user.resume.skills, job.techStack) * 40;
  
  // 2. Role Match (0-20 points)
  const roleMatch = calculateRoleMatch(user.targetRoles, job.title, job.description) * 20;
  
  // 3. Career Level Match (0-15 points)
  const levelMatch = calculateLevelMatch(user.careerLevel, job.careerLevel) * 15;
  
  // 4. Experience Match (0-10 points)
  const experienceMatch = calculateExperienceMatch(
    user.yearsOfExperience,
    job.experienceRequired
  ) * 10;
  
  // 5. Location Match (0-10 points)
  const locationMatch = calculateLocationMatch(
    user.targetLocations,
    job.location,
    user.openToRelocation
  ) * 10;
  
  // 6. Work Mode Match (0-5 points)
  const workModeMatch = calculateWorkModeMatch(
    user.preferredWorkMode,
    job.workMode
  ) * 5;
  
  // Total Score
  const totalScore = 
    skillMatch + roleMatch + levelMatch + experienceMatch + 
    locationMatch + workModeMatch;
  
  // Determine match type
  let matchType = "poor";
  if (totalScore >= 80) matchType = "excellent";
  else if (totalScore >= 60) matchType = "good";
  else if (totalScore >= 40) matchType = "okay";
  
  return {
    skillMatch,
    roleMatch,
    levelMatch,
    experienceMatch,
    locationMatch,
    workModeMatch,
    totalScore,
    matchType,
    matchReason: generateMatchReason(...)
  };
}

// Helper: Calculate skill match (0-1 scale)
function calculateSkillMatch(userSkills, jobTechStack) {
  if (!userSkills || userSkills.length === 0) return 0;
  if (!jobTechStack || jobTechStack.length === 0) return 0;
  
  const matches = userSkills.filter(skill =>
    jobTechStack.some(tech => 
      skill.toLowerCase().includes(tech.toLowerCase()) ||
      tech.toLowerCase().includes(skill.toLowerCase())
    )
  );
  
  return matches.length / Math.max(userSkills.length, jobTechStack.length);
}

// Helper: Calculate role match (0-1 scale)
function calculateRoleMatch(targetRoles, jobTitle, jobDescription) {
  if (!targetRoles || targetRoles.length === 0) return 0;
  
  const jobText = (jobTitle + " " + jobDescription).toLowerCase();
  const matches = targetRoles.filter(role =>
    jobText.includes(role.toLowerCase())
  );
  
  return matches.length / targetRoles.length;
}

// Helper: Calculate level match (0-1 scale)
function calculateLevelMatch(userLevel, jobLevel) {
  const levels = ["fresher", "junior", "mid", "senior", "lead"];
  const userIndex = levels.indexOf(userLevel);
  const jobIndex = levels.indexOf(jobLevel);
  
  // Perfect match = 1.0
  if (userIndex === jobIndex) return 1.0;
  
  // User overqualified but can apply = 0.9
  if (userIndex > jobIndex) return 0.9;
  
  // User underqualified but below 2 levels = 0.6
  if (jobIndex - userIndex <= 2) return 0.6;
  
  // Too much gap = 0.2
  return 0.2;
}

// Helper: Calculate experience match (0-1 scale)
function calculateExperienceMatch(userExperience, jobRequired) {
  jobRequired = jobRequired || 0;
  
  // Perfect match or overqualified = 1.0
  if (userExperience >= jobRequired) return 1.0;
  
  // Missing experience proportionally = linear falloff
  return Math.max(0, userExperience / Math.max(1, jobRequired));
}

// Helper: Calculate location match (0-1 scale)
function calculateLocationMatch(userLocations, jobLocation, openToRelocation) {
  if (!userLocations || userLocations.length === 0) return 0;
  
  // Exact match = 1.0
  if (userLocations.includes(jobLocation)) return 1.0;
  
  // Open to relocation = 0.9
  if (openToRelocation) return 0.9;
  
  // No match = 0
  return 0;
}

// Helper: Calculate work mode match (0-1 scale)
function calculateWorkModeMatch(userPreference, jobMode) {
  if (userPreference === "remote") {
    if (jobMode === "remote") return 1.0;
    if (jobMode === "hybrid") return 0.5;
    return 0;
  }
  
  if (userPreference === "hybrid") {
    if (jobMode === "hybrid") return 1.0;
    if (jobMode === "remote" || jobMode === "onsite") return 0.7;
    return 0;
  }
  
  if (userPreference === "onsite") {
    if (jobMode === "onsite") return 1.0;
    if (jobMode === "hybrid") return 0.5;
    return 0;
  }
  
  return 0.5; // No preference = flexible
}
```

### Batch Matching for User
```javascript
async function matchAllJobsForUser(userId) {
  const user = await User.findById(userId);
  const resume = await ParsedResume.findById(user.resumeId);
  
  if (!resume) {
    throw new Error("User must upload resume before matching");
  }
  
  const allJobs = await Job.find({ isActive: true });
  const matches = [];
  
  for (const job of allJobs) {
    const match = await calculateMatch(user, job);
    
    matches.push({
      userId,
      jobId: job._id,
      externalJobId: job.externalJobId,
      ...match,
      matchedAt: new Date()
    });
  }
  
  // Bulk insert/update matches
  await JobMatch.deleteMany({ userId }); // Clear old matches
  await JobMatch.insertMany(matches);
  
  return matches;
}
```

---

## PART 8: FRONTEND STRUCTURE (React + TypeScript)

### Component Hierarchy
```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── Dashboard/
│   │   ├── UserDashboard.tsx
│   │   └── AdminDashboard.tsx
│   ├── JobSearch/
│   │   ├── JobSearchFilters.tsx
│   │   ├── JobCard.tsx
│   │   └── JobListView.tsx
│   ├── Resume/
│   │   ├── ResumeUpload.tsx
│   │   ├── ResumeParser.tsx
│   │   └── ResumePreview.tsx
│   ├── Matches/
│   │   ├── MatchList.tsx
│   │   ├── MatchCard.tsx
│   │   └── MatchStats.tsx
│   ├── Admin/
│   │   ├── ScrapingControl.tsx
│   │   ├── ApiUsageMonitor.tsx
│   │   ├── ScrapingLogs.tsx
│   │   └── ApiLimitConfig.tsx
│   └── Common/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Layout.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── SearchPage.tsx
│   ├── MatchesPage.tsx
│   ├── SavedJobsPage.tsx
│   ├── ProfilePage.tsx
│   └── AdminPage.tsx
├── hooks/
│   ├── useJobs.ts
│   ├── useMatches.ts
│   ├── useResume.ts
│   ├── useSavedJobs.ts
│   └── useAuth.ts
├── services/
│   ├── api.ts (axios instance + interceptors)
│   ├── jobService.ts
│   ├── matchService.ts
│   ├── resumeService.ts
│   └── authService.ts
├── store/ (Redux/Zustand state management)
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── jobsSlice.ts
│   │   ├── matchesSlice.ts
│   │   └── uiSlice.ts
│   └── store.ts
└── types/
    ├── job.ts
    ├── user.ts
    ├── match.ts
    └── api.ts
```

### Key Frontend Features

#### 1. Job Search Page
```typescript
// User can filter jobs by:
- Search query (text)
- Career level (fresher, junior, mid, senior)
- Domain (software, data, cloud, mobile, qa)
- Work mode (remote, hybrid, onsite)
- Location
- Salary range
- Employment type

// Results show:
- Job title, company, location
- Short description
- Salary (if available)
- Match score (if resume uploaded) [background color: red->yellow->green]
- Apply button (external link to job)
- Save button (save to saved jobs)
```

#### 2. My Matches Page
```typescript
// Shows intelligent job recommendations based on:
- Resume skills
- Target roles & domains
- Career level
- Location preferences
- Work mode preferences

// Displays:
- Match score (0-100)
- Match type badge (excellent, good, okay, poor)
- Match breakdown (skill %, role %, level %, etc.)
- Job details
- Action buttons: View → Apply → Save
- Mark as applied (save to saved jobs with status)
```

#### 3. Resume Upload
```typescript
// User can:
- Upload PDF or DOCX file
- See extraction progress
- View parsed skills, work history, education
- Confirm accuracy
- Edit/add missing information
- Auto-trigger re-matching of all jobs

// System extracts:
- Technical skills
- Soft skills
- Work experience (company, role, duration)
- Education details
- Years of experience
```

#### 4. Admin Dashboard
```typescript
// Admin can:
1. Scraping Control
   - View list of all 11 buckets
   - Select buckets to scrape
   - Click "Start Scraping"
   - See progress bar
   - View results (new jobs, updated jobs, duplicates)

2. API Usage Monitor
   - Current month: X/200 calls used
   - Calls remaining: Y
   - Progress bar
   - Safety threshold indicator (turns red at 80%)
   - Set custom API limit (dropdown or input)
   - View call history (table with timestamp, bucket, keyword, status)

3. Scraping Logs
   - Table of all scraping sessions
   - Columns: Date, Triggered by, Duration, Status, Jobs found, Jobs added
   - Filter by date, status
   - Click row to see details

4. Dashboard Stats
   - Total jobs in database
   - Active jobs count
   - Stale jobs count
   - Total users
   - User registration trend
   - Most searched roles
   - Most scraped buckets
```

---

## PART 9: SCHEDULED JOBS (CRON)

### Sunday 2 AM: Fresher Jobs Refresh
```javascript
// Every Sunday at 2:00 AM UTC
cron.schedule('0 2 * * 0', async () => {
  logger.info('Starting fresher jobs refresh');
  
  const sessionId = generateSessionId();
  
  await ScrapingLog.insertOne({
    sessionId,
    triggeredBy: 'cron',
    bucketsRequested: ['fresher', 'batch-hiring'],
    status: 'in-progress',
    startedAt: new Date()
  });
  
  try {
    const freshers = await scrapeRoleBucket('fresher', 'fresher developer');
    const batches = await scrapeRoleBucket('batch-hiring', 'batch hiring');
    
    // Normalize and save
    const normalizedFreshers = freshers.map(j => normalizeJob(j, 'fresher', 'fresher developer'));
    const normalizedBatches = batches.map(j => normalizeJob(j, 'batch-hiring', 'batch hiring'));
    
    const results = await saveBatch([...normalizedFreshers, ...normalizedBatches], sessionId);
    
    // Re-match jobs for all users
    const users = await User.find({});
    for (const user of users) {
      await matchAllJobsForUser(user._id);
    }
    
    await ScrapingLog.updateOne(
      { sessionId },
      { $set: { status: 'completed', completedAt: new Date() } }
    );
    
    logger.info(`Fresher jobs refresh completed. New: ${results.newJobs}, Updated: ${results.updatedJobs}`);
  } catch (error) {
    logger.error('Fresher jobs refresh failed', error);
    await ScrapingLog.updateOne(
      { sessionId },
      { $set: { status: 'failed', errorMessage: error.message } }
    );
  }
});
```

### Monthly API Limit Reset (1st of month)
```javascript
cron.schedule('0 0 1 * *', async () => {
  logger.info('Resetting API usage counter for new month');
  
  const newMonth = format(new Date(), 'yyyy-MM');
  
  await ApiUsage.insertOne({
    month: newMonth,
    provider: 'OpenWeb Ninja',
    totalCallsUsed: 0,
    monthlyLimit: 200, // or admin-configured limit
    callsRemaining: 200,
    safetyThreshold: 160, // 80% of 200
    isLimitReached: false,
    isWarningTriggered: false,
    callHistory: [],
    createdAt: new Date()
  });
  
  logger.info(`New month ${newMonth} API usage initialized`);
});
```

### Weekly Job Expiry Cleanup (Monday 3 AM)
```javascript
cron.schedule('0 3 * * 1', async () => {
  logger.info('Starting weekly job expiry cleanup');
  
  // Mark expired jobs
  const expiredCount = await Job.updateMany(
    { expiryDate: { $lt: new Date() } },
    { $set: { isActive: false } }
  );
  
  // Delete very old inactive jobs (older than 60 days)
  const deletedCount = await Job.deleteMany({
    isActive: false,
    expiryDate: { $lt: addDays(new Date(), -60) }
  });
  
  logger.info(`Job cleanup: ${expiredCount.modifiedCount} marked expired, ${deletedCount.deletedCount} deleted`);
});
```

---

## PART 10: COMPLETE USER JOURNEY EXAMPLE

### Scenario: Fresher User Finds Their First Job

**Step 1: User Registration**
```
User visits app → Clicks "Register"
Form: Email, Password, First Name, Last Name
System creates user in `users` collection with default careerLevel="fresher"
User redirected to profile completion page
```

**Step 2: Profile Completion**
```
User fills:
- Career Level: Fresher
- Years of Experience: 0
- Target Roles: ["Backend Developer", "Full Stack Developer"]
- Target Domains: ["software"]
- Preferred Work Mode: "remote"
- Target Locations: ["Bangalore", "Pune"]
- Open to Relocation: false
- Min Salary Expectation: 300000

Profile stored in `users` collection
```

**Step 3: Resume Upload**
```
User uploads resume.pdf
System:
1. Extracts text from PDF
2. Parses skills: ["Java", "Spring Boot", "MySQL", "Git"]
3. Parses work history: (none - fresher)
4. Stores in `parsed_resumes` collection
5. Triggers matchAllJobsForUser(userId)
   - Queries all ~5000 jobs from MongoDB
   - Calculates match score for each
   - Stores matches in `job_matches` collection
6. Returns: "Resume parsed! Found 247 matching jobs"
```

**Step 4: Browse Matches**
```
User clicks "My Matches" page
System queries:
SELECT * FROM job_matches 
WHERE userId = xxx 
ORDER BY totalScore DESC 
LIMIT 20

Results show (example):
1. "Senior Backend Developer at TCS"
   - Score: 92/100 (excellent)
   - Skill match: 90% (Java, Spring Boot, MySQL all match!)
   - Role match: 95% (Perfect "Backend Developer")
   - Level match: 70% (Fresher applying for Senior - but company says fresher ok)
   - Location: Bangalore (match!)
   - Work mode: Remote (match!)

2. "Junior Frontend Engineer at Flipkart"
   - Score: 45/100 (okay)
   - Skill match: 20% (No React/Vue in resume)
   - Role match: 15% (Not looking for frontend)
   - Level match: Perfect (junior level)

3. "Batch Recruitment 2025 - Infosys"
   - Score: 85/100 (excellent)
   - Skill match: 80%
   - Batch eligible: YES
   - Level match: 100% (specifically for freshers)
```

**Step 5: Save & Apply**
```
User clicks "Save" on TCS job
POST /api/saved-jobs/tcs-job-id
Body: { notes: "Great company, remote friendly" }

User clicks "Apply" (external link to job portal)
User clicks "Mark as Applied"
PUT /api/saved-jobs/tcs-job-id
Body: { status: "applied" }
```

**Step 6: Track Applications**
```
User visits "Saved Jobs" page
Sees all saved jobs filtered by status:
- 8 Saved (not applied yet)
- 4 Applied (waiting for response)
- 1 Interviewing (got shortlisted)
- 2 Rejected
```

---

## PART 11: ADMIN WORKFLOW EXAMPLE

### Scenario: Admin Runs Monthly Scraping

**Step 1: Check API Usage**
```
Admin visits Admin Dashboard
Sees: "December 2024: 142/200 calls used"
"Calls remaining: 58 (safe to proceed)"
```

**Step 2: Plan Scraping Strategy**
```
Thinks: "I have 58 calls left. Let me prioritize freshers."

Checks ScrapingLogs history:
- Last month: Scraped all 11 buckets
- This month: Only scraped fresher, batch, software (cron did it)
- Plan: Manually scrape data, cloud, mobile buckets (remaining budget)
```

**Step 3: Initiate Scraping**
```
Admin selects buckets:
☑ Data Science & AI
☑ Cloud & DevOps
☑ Mobile Development
☐ QA & Testing (skip - low priority)

Clicks "Start Scraping Now"
System responds: { sessionId: "scrape-2024-12-15-001", status: "in-progress" }
```

**Step 4: Monitor Progress**
```
Admin sees real-time progress:

[====>            ] 30% Complete
Data Science & AI: ✓ (12 calls, 234 jobs found)
Cloud & DevOps: ⏳ In progress... (8 calls so far)
Mobile Development: ⏳ Waiting...

API Usage: 142 + 20 = 162 / 200 calls
```

**Step 5: Scraping Completes**
```
Scraping finishes after 15 minutes:
✓ Data Science & AI: 12 calls, 234 jobs found, 145 new
✓ Cloud & DevOps: 18 calls, 312 jobs found, 201 new
✓ Mobile Development: 14 calls, 178 jobs found, 98 new

Total this scrape: 44 calls, 724 jobs found, 444 new

Total month usage: 142 + 44 = 186 / 200
Remaining: 14 calls (warning: low budget)

System automatically:
- Re-matched all 5000+ jobs for all 150 users
- Updated job_matches collection
- Notified users via email: "New job matches available!"
```

**Step 6: View Audit Trail**
```
Admin clicks on the scraping session
ScrapingLog details:
- SessionId: scrape-2024-12-15-001
- Triggered by: admin
- Triggered by user: Admin User (id: xxx)
- Buckets: [data, cloud, mobile]
- Started: 2024-12-15 14:30:00
- Completed: 2024-12-15 14:45:00
- Duration: 15 minutes
- API Calls: 44
- Jobs Found: 724
- New Jobs: 444
- Updated Jobs: 280

callHistory (detailed):
| Bucket | Keyword | Calls | Results | Status | Time |
|--------|---------|-------|---------|--------|------|
| data | data scientist | 1 | 98 | ✓ | 14:30 |
| data | machine learning engineer | 1 | 87 | ✓ | 14:35 |
| ...
```

---

## PART 12: ERROR HANDLING & EDGE CASES

### Edge Case 1: API Limit Reached Mid-Scraping
```javascript
// Solution:
try {
  for (const bucket of selectedBuckets) {
    const jobs = await scrapeRoleBucket(bucket, keyword);
    // This function checks limit before API call
  }
} catch (error) {
  if (error.message.includes("Monthly API limit reached")) {
    // Log partially completed session
    await ScrapingLog.updateOne(
      { sessionId },
      {
        $set: { 
          status: 'partial',
          errorMessage: 'API limit reached mid-scraping',
          completedAt: new Date()
        }
      }
    );
    
    // Notify admin
    sendEmailToAdmin({
      subject: 'Scraping stopped - API limit reached',
      message: `Scraping stopped after ${completedBuckets.length} buckets.
                Completed buckets: ${completedBuckets.join(', ')}
                Use remaining calls next month or upgrade plan.`
    });
  }
}
```

### Edge Case 2: Same Job Posted Multiple Times
```javascript
// Solution: externalJobId deduplication
// OpenWeb Ninja returns same job multiple times?
// Our deduplication logic:
// If externalJobId exists, UPDATE (not INSERT)
// Only increment newJobsAdded if it's truly new
// Prevents bloating database with duplicates
```

### Edge Case 3: Resume File Too Large
```javascript
// Solution: File size validation
POST /api/resume/upload
if (file.size > 5 * 1024 * 1024) { // 5MB limit
  return { error: "File too large. Max 5MB." };
}
```

### Edge Case 4: Job Description Parsing Fails
```javascript
// Solution: Graceful degradation
try {
  const techStack = extractTechStack(job.description);
  const careerLevel = detectCareerLevel(job.description);
} catch (error) {
  logger.warn(`Parse error for job ${job.externalJobId}`, error);
  
  // Use defaults
  const techStack = [];
  const careerLevel = 'mid'; // safe default
  
  // Still store the job
  job.techStack = techStack;
  job.careerLevel = careerLevel;
  job.parseQuality = 'low';
}
```

### Edge Case 5: User's Resume Becomes Stale
```javascript
// Solution: Re-trigger matching when user updates resume
PUT /api/resume/me
Body: { skills: [...] }

// Response:
{
  message: "Resume updated",
  matchingInProgress: true,
  estimatedTime: "2-3 minutes"
}

// Backend:
await ParsedResume.updateOne({ userId }, updatedResume);
await matchAllJobsForUser(userId); // Re-match all jobs
await sendEmail(user.email, "Your job matches have been refreshed!");
```

### Edge Case 6: Handle Resume Parsing Errors
```javascript
// Solution:
async function uploadResume(file) {
  try {
    const text = await extractTextFromPDF(file);
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract text from PDF");
    }
    
    const parsed = parseResume(text);
    
    // If parsing fails, ask user to verify manually
    if (parsed.skills.length === 0) {
      return {
        success: false,
        needsManualReview: true,
        message: "We couldn't automatically extract skills. Please review and add manually."
      };
    }
    
    return { success: true, parsed };
  } catch (error) {
    return {
      success: false,
      error: "Resume upload failed. Please try another file format."
    };
  }
}
```

---

## PART 13: MONITORING & ALERTING

### Key Metrics to Track
```
1. API Usage
   - Total calls used
   - Calls remaining
   - Usage trend (graph)
   - Alert if > 80% used

2. Job Scraping
   - Total jobs in database
   - Jobs added per month
   - Jobs updated per month
   - Stale jobs percentage
   - Average parse quality

3. User Activity
   - Total registered users
   - Active users (last 30 days)
   - Resumes uploaded
   - Jobs saved
   - Applications submitted
   - User registration trend

4. Matching
   - Average match score
   - Distribution of match types
   - Jobs matched per user (avg)
   - Match refresh time

5. System Health
   - API response times
   - Database query times
   - Scraping duration
   - Server uptime
   - Error rates
```

### Alert Conditions
```javascript
// Alert 1: API usage nearing limit
if (usage.totalCallsUsed >= usage.safetyThreshold) {
  sendAlert({
    level: 'warning',
    message: `API usage at 80%: ${usage.totalCallsUsed}/${usage.monthlyLimit}`,
    recipent: 'admin'
  });
}

// Alert 2: API limit reached
if (usage.totalCallsUsed >= usage.monthlyLimit) {
  sendAlert({
    level: 'critical',
    message: 'Monthly API limit reached. Cannot scrape new jobs.',
    recipient: 'admin'
  });
}

// Alert 3: Scraping failed
if (scrapingSession.status === 'failed') {
  sendAlert({
    level: 'error',
    message: `Scraping failed: ${scrapingSession.errorMessage}`,
    recipient: 'admin'
  });
}

// Alert 4: High stale job percentage
if (stalePercentage > 50) {
  sendAlert({
    level: 'warning',
    message: `${stalePercentage}% of jobs are stale. Consider scraping fresh jobs.`,
    recipient: 'admin'
  });
}
```

---

## PART 14: IMPLEMENTATION ROADMAP

### Phase 1: Setup (Week 1-2)
- [ ] Setup Node.js + Express project
- [ ] Configure MongoDB + collections + indexes
- [ ] Setup authentication (JWT)
- [ ] Create .env configuration
- [ ] Setup logging infrastructure

### Phase 2: Backend APIs (Week 3-4)
- [ ] Implement user auth endpoints
- [ ] Implement job CRUD endpoints
- [ ] Implement API usage tracking
- [ ] Implement resume upload endpoint
- [ ] Create job normalization pipeline

### Phase 3: Scraping Service (Week 5-6)
- [ ] Integrate OpenWeb Ninja API
- [ ] Implement scraping controller
- [ ] Add scheduling (node-cron)
- [ ] Implement deduplication logic
- [ ] Add logging and error handling

### Phase 4: Matching Engine (Week 7-8)
- [ ] Implement resume parser
- [ ] Create matching algorithm
- [ ] Add batch matching for users
- [ ] Implement match storage

### Phase 5: Frontend (Week 9-12)
- [ ] Setup React + Vite project
- [ ] Create authentication pages
- [ ] Build job search UI
- [ ] Build matches display
- [ ] Build admin dashboard
- [ ] Add resume upload flow

### Phase 6: Testing & Optimization (Week 13-14)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Optimize queries with indexes
- [ ] Load testing
- [ ] Security audit

### Phase 7: Deployment (Week 15)
- [ ] Setup MongoDB Atlas
- [ ] Deploy backend (Heroku/Railway/Render)
- [ ] Deploy frontend (Vercel/Netlify)
- [ ] Configure CI/CD pipeline
- [ ] Monitor production

---

## KEY DEVELOPMENT PRINCIPLES

1. **API Efficiency First**
   - Every external API call should be justified
   - Cache aggressively
   - Log all API usage

2. **User Experience Second**
   - Fast query responses (< 500ms)
   - Instant job search
   - Real-time match scores

3. **Data Quality Third**
   - Validate all inputs
   - Normalize job data
   - Track parse quality

4. **Security Fourth**
   - Hash passwords
   - Validate JWT tokens
   - Sanitize user inputs
   - Rate limit endpoints

5. **Scalability Last** (but keep in mind)
   - Use database indexes
   - Implement pagination
   - Can serve 10,000+ users on free tier

---

## SUCCESS CRITERIA

✅ Users can register and upload resume (takes 2 minutes)
✅ Match scores generated in < 500ms
✅ Admin can trigger scraping with 1 click
✅ API usage never exceeds 200/month
✅ Database can store 10,000+ jobs
✅ System can serve 1,000+ concurrent users
✅ Admin sees all audit trails
✅ Job matches update weekly
✅ Stale jobs automatically archived
✅ All data normalized and searchable

---

## TESTING CHECKLIST

- [ ] Can register and login successfully
- [ ] Resume upload parses correctly
- [ ] Match scores calculated correctly
- [ ] Admin scraping respects API limit
- [ ] Duplicate jobs not created
- [ ] Job expiry works automatically
- [ ] Stale data cleaned up weekly
- [ ] Email notifications sent
- [ ] API logs complete and accurate
- [ ] Admin can set custom API limit
- [ ] System handles network failures
- [ ] Database queries optimized

---

This prompt provides everything an AI agent needs to build the complete system. It includes:
- Architecture diagrams and data flows
- Complete schema definitions
- All API endpoints
- Matching algorithm details
- Frontend component structure
- Scheduling logic
- Error handling strategies
- Monitoring & alerting
- Implementation roadmap
- Testing checklist

An AI agent reading this should be able to implement the entire platform from scratch.
