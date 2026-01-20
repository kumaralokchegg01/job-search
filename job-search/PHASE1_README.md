# JobIntel Phase 1: Foundation & Infrastructure Setup

**Phase Duration:** 1-2 weeks (5 days development)  
**Team Size:** 1-2 developers  
**Priority Level:** CRITICAL (blocking all subsequent phases)  
**Created:** January 18, 2026

---

## 📋 PHASE 1 OVERVIEW

Phase 1 establishes the foundational infrastructure for the entire JobIntel platform. Without completing this phase, no other development can proceed. This phase focuses on:

1. ✅ Environment configuration & dependencies
2. ✅ MongoDB schema expansion & indexing
3. ✅ OpenWeb Ninja API client integration
4. ✅ Rate limiting & retry logic
5. ✅ Job queue setup (BullMQ + Redis)
6. ✅ Scheduled jobs configuration
7. ✅ Authentication hardening
8. ✅ Basic error handling middleware

---

## 📊 PHASE 1 DELIVERABLES

### By End of Phase 1, You Should Have:
- ✅ Complete environment setup (.env with all API keys)
- ✅ MongoDB connected with 16 models (all fields from spec)
- ✅ All 7 MongoDB collections with proper indexes
- ✅ OpenWeb Ninja API client working (can make test calls)
- ✅ Rate limiter implemented (1 request/second)
- ✅ Retry logic with exponential backoff (3 attempts)
- ✅ BullMQ & Redis configured for job queues
- ✅ node-cron scheduler configured for background jobs
- ✅ JWT authentication enhanced with refresh tokens
- ✅ Role-based access control middleware
- ✅ Winston logger configured
- ✅ Global error handler middleware
- ✅ Able to trigger a test scrape and see logs

### Testing Acceptance Criteria:
```bash
# After Phase 1 completion, these should all pass:
✅ npm run dev (backend starts without errors)
✅ MongoDB connection successful
✅ Redis connection successful
✅ OpenWeb Ninja API client can authenticate
✅ Rate limiter enforces 1 second delays
✅ Retry logic kicks in on failure
✅ BullMQ can queue jobs
✅ Scheduler can trigger cron jobs
✅ JWT tokens can be issued & refreshed
✅ Admin-only endpoints reject non-admin users
✅ Logger writes to console & file
✅ Error handler catches uncaught exceptions
```

---

## 🎯 DETAILED PHASE 1 TASKS

### TASK 1.1: Environment Setup (Day 1, 1-2 hours)

**Objective:** Setup all configuration and credentials

**Files to Create/Modify:**
- [ ] Create `.env` file (copy from `.env.example`)
- [ ] Create `.env.example` template
- [ ] Create `src/config/environment.ts` - Config validation

**Required Environment Variables:**
```bash
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jobintel?retryWrites=true&w=majority
MONGODB_LOCAL_URI=mongodb://localhost:27017/jobintel

# Redis (for job queues)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# OpenWeb Ninja API
OPENWEBNINJA_API_KEY=your_api_key_here
OPENWEBNINJA_API_HOST=api.openwebninja.com
OPENWEBNINJA_API_BASE_URL=https://api.openwebninja.com

# External Services
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# WhatsApp Cloud API
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_ID=your_whatsapp_phone_id

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=admin@jobintel.com

# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=logs/app.log

# Admin Credentials (for initial setup)
ADMIN_EMAIL=admin@jobintel.com
ADMIN_PASSWORD=admin_password_here
```

**Implementation Steps:**
1. Copy backend/.env.example to backend/.env
2. Fill in all values with test/development credentials
3. Create config validation script
4. Test: `npm run dev` should start without env errors

---

### TASK 1.2: MongoDB Schema Expansion (Day 1-2, 4-6 hours)

**Objective:** Expand all 16 models to match spec completely

**Current Status:** Models exist but are incomplete

**Models to Review & Enhance:**

#### 1️⃣ Job Model (CRITICAL)
**File:** `src/models/Job.ts`

**Current fields (13):** source, companyId, title, location, employmentType, description, requirements, responsibilities, ctc, applyUrl, externalId, status, meta

**Add fields (17 more):**
```typescript
interface IJob extends mongoose.Document {
  // Existing
  source: string;
  companyId?: mongoose.Types.ObjectId;
  title: string;
  location?: string;
  employmentType?: string; // full-time, contract, part-time, freelance
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  ctc?: string;
  applyUrl?: string;
  externalId?: string; // UNIQUE INDEX
  status: string;
  meta?: any;
  
  // ADD THESE:
  externalJobId: string; // UNIQUE INDEX - CRITICAL
  
  // Normalized/Extracted Fields
  careerLevel?: "fresher" | "junior" | "mid" | "senior" | "lead";
  domain?: "software" | "data" | "cloud" | "mobile" | "qa" | "non-tech";
  techStack: string[]; // ["React", "Node.js", "MongoDB"]
  experienceRequired?: number; // in years
  workMode?: "remote" | "onsite" | "hybrid";
  batchEligible?: boolean; // can freshers apply?
  
  // Metadata
  fetchedAt: Date;
  expiryDate: Date; // fetchedAt + 30 days
  isActive: boolean; // false if expired
  bucket?: string; // which bucket triggered this job
  scrapedAt?: Date;
  
  // Matching-related
  normalizedTitle?: string; // lowercase, standardized
  normalizedCompany?: string;
  
  // Timestamps
  createdAt?: Date;
  postedAt?: Date;
  updatedAt?: Date;
}
```

**Schema Changes:**
```typescript
const JobSchema = new Schema<IJob>({
  // Keep existing fields...
  
  // Add new fields
  externalJobId: { type: String, required: true, unique: true, index: true },
  careerLevel: { type: String, enum: ["fresher", "junior", "mid", "senior", "lead"], default: "junior" },
  domain: { type: String, enum: ["software", "data", "cloud", "mobile", "qa", "non-tech"] },
  techStack: { type: [String], default: [] },
  experienceRequired: { type: Number, default: 0 },
  workMode: { type: String, enum: ["remote", "onsite", "hybrid"], default: "onsite" },
  batchEligible: { type: Boolean, default: false },
  fetchedAt: { type: Date, default: Date.now, index: true },
  expiryDate: { type: Date, index: true },
  isActive: { type: Boolean, default: true },
  bucket: String,
  scrapedAt: Date,
  normalizedTitle: String,
  normalizedCompany: String,
}, { timestamps: true });
```

**Indexes to Add:**
```typescript
// In JobSchema definition or after:
JobSchema.index({ externalJobId: 1 }, { unique: true });
JobSchema.index({ careerLevel: 1, isActive: 1 });
JobSchema.index({ domain: 1, isActive: 1 });
JobSchema.index({ techStack: 1 });
JobSchema.index({ workMode: 1, isActive: 1 });
JobSchema.index({ fetchedAt: -1 });
JobSchema.index({ expiryDate: 1 });
JobSchema.index({ batchEligible: 1, isActive: 1 });
```

#### 2️⃣ User Model
**File:** `src/models/User.ts`

**Add Fields:**
```typescript
interface IUser extends mongoose.Document {
  // Existing fields...
  
  // ADD:
  careerLevel?: "fresher" | "junior" | "mid" | "senior";
  yearsOfExperience?: number;
  currentRole?: string;
  targetRoles?: string[]; // ["Backend Developer", "Full Stack Developer"]
  targetDomains?: string[]; // ["software", "data", "cloud"]
  preferredWorkMode?: "remote" | "onsite" | "hybrid";
  targetLocations?: string[];
  resumeUploadedAt?: Date;
  resumeId?: mongoose.Types.ObjectId; // reference to ParsedResume
  openToRelocation?: boolean;
  minSalaryExpectation?: number;
  userRole?: "user" | "admin";
  profileCompleteness?: number; // 0-100%
}
```

#### 3️⃣ ParsedResume Model (NEW)
**File:** `src/models/ParsedResume.ts` - Create new file

```typescript
interface IParsedResume extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  rawText: string;
  uploadedFileName: string;
  uploadedAt: Date;
  expiryDate: Date;
  
  // Extracted Skills
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  
  // Work Experience
  totalYearsOfExperience: number;
  workHistory: Array<{
    company: string;
    role: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    technologiesUsed?: string[];
  }>;
  
  // Education
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationDate?: Date;
  }>;
  
  // Metadata
  isActive: boolean;
  parseQuality: "high" | "medium" | "low";
  parseConfidence: number; // 0-100
  
  createdAt?: Date;
  updatedAt?: Date;
}

const ParsedResumeSchema = new Schema<IParsedResume>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  rawText: String,
  uploadedFileName: String,
  uploadedAt: { type: Date, default: Date.now },
  expiryDate: Date,
  
  skills: { type: [String], default: [] },
  technicalSkills: { type: [String], default: [] },
  softSkills: { type: [String], default: [] },
  
  totalYearsOfExperience: { type: Number, default: 0 },
  workHistory: [{
    company: String,
    role: String,
    startDate: Date,
    endDate: Date,
    description: String,
    technologiesUsed: [String]
  }],
  
  education: [{
    institution: String,
    degree: String,
    fieldOfStudy: String,
    graduationDate: Date
  }],
  
  isActive: { type: Boolean, default: true },
  parseQuality: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  parseConfidence: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

ParsedResumeSchema.index({ userId: 1 });
ParsedResumeSchema.index({ skills: 1 });
```

#### 4️⃣ JobMatches Model (NEW)
**File:** `src/models/JobMatch.ts` - Create new file

```typescript
interface IJobMatch extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  externalJobId: string;
  
  // 6-Factor Match Scores
  skillMatch: number; // 0-40
  roleMatch: number; // 0-20
  levelMatch: number; // 0-15
  experienceMatch: number; // 0-10
  locationMatch: number; // 0-10
  workModeMatch: number; // 0-5
  
  totalScore: number; // 0-100
  matchType: "excellent" | "good" | "okay" | "poor";
  matchReason: string;
  
  // User Actions
  userViewed: boolean;
  userSaved: boolean;
  userApplied: boolean;
  
  // Timestamps
  matchedAt: Date;
  viewedAt?: Date;
  savedAt?: Date;
  appliedAt?: Date;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const JobMatchSchema = new Schema<IJobMatch>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  externalJobId: String,
  
  skillMatch: { type: Number, default: 0, min: 0, max: 40 },
  roleMatch: { type: Number, default: 0, min: 0, max: 20 },
  levelMatch: { type: Number, default: 0, min: 0, max: 15 },
  experienceMatch: { type: Number, default: 0, min: 0, max: 10 },
  locationMatch: { type: Number, default: 0, min: 0, max: 10 },
  workModeMatch: { type: Number, default: 0, min: 0, max: 5 },
  
  totalScore: { type: Number, default: 0, min: 0, max: 100, index: true },
  matchType: { type: String, enum: ["excellent", "good", "okay", "poor"], index: true },
  matchReason: String,
  
  userViewed: { type: Boolean, default: false },
  userSaved: { type: Boolean, default: false },
  userApplied: { type: Boolean, default: false },
  
  matchedAt: { type: Date, default: Date.now, index: true },
  viewedAt: Date,
  savedAt: Date,
  appliedAt: Date,
}, { timestamps: true });

JobMatchSchema.index({ userId: 1, totalScore: -1 });
JobMatchSchema.index({ userId: 1, matchedAt: -1 });
```

#### 5️⃣ ApiUsage Model (NEW)
**File:** `src/models/ApiUsage.ts` - Create new file

```typescript
interface IApiUsage extends mongoose.Document {
  month: string; // "2025-01"
  provider: string; // "OpenWeb Ninja"
  
  totalCallsUsed: number;
  monthlyLimit: number;
  callsRemaining: number;
  safetyThreshold: number;
  
  callHistory: Array<{
    timestamp: Date;
    bucket: string;
    keyword: string;
    resultCount: number;
    status: "success" | "failed" | "rate-limited";
    errorMessage?: string;
    initiatedBy?: mongoose.Types.ObjectId;
  }>;
  
  isLimitReached: boolean;
  isWarningTriggered: boolean;
  
  adminConfiguredLimit?: number;
  lastConfiguredAt?: Date;
  lastConfiguredBy?: mongoose.Types.ObjectId;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const ApiUsageSchema = new Schema<IApiUsage>({
  month: { type: String, required: true, unique: true, index: true },
  provider: { type: String, default: "OpenWeb Ninja" },
  
  totalCallsUsed: { type: Number, default: 0 },
  monthlyLimit: { type: Number, default: 200 },
  callsRemaining: { type: Number, default: 200 },
  safetyThreshold: { type: Number, default: 160 }, // 80% of 200
  
  callHistory: [{
    timestamp: { type: Date, default: Date.now },
    bucket: String,
    keyword: String,
    resultCount: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "failed", "rate-limited"] },
    errorMessage: String,
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  }],
  
  isLimitReached: { type: Boolean, default: false, index: true },
  isWarningTriggered: { type: Boolean, default: false },
  
  adminConfiguredLimit: Number,
  lastConfiguredAt: Date,
  lastConfiguredBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
```

#### 6️⃣ SavedJobs Model (NEW)
**File:** `src/models/SavedJob.ts` - Create new file

```typescript
interface ISavedJob extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  externalJobId: string;
  
  savedAt: Date;
  notes?: string;
  priority?: "high" | "medium" | "low";
  status?: "saved" | "applied" | "rejected" | "interviewing";
  
  createdAt?: Date;
  updatedAt?: Date;
}

const SavedJobSchema = new Schema<ISavedJob>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true },
  externalJobId: String,
  
  savedAt: { type: Date, default: Date.now },
  notes: String,
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  status: { type: String, enum: ["saved", "applied", "rejected", "interviewing"], default: "saved", index: true },
}, { timestamps: true });

SavedJobSchema.index({ userId: 1, savedAt: -1 });
SavedJobSchema.index({ userId: 1, status: 1 });
```

#### 7️⃣ ScrapingLogs Model (NEW)
**File:** `src/models/ScrapingLog.ts` - Create new file

```typescript
interface IScrapingLog extends mongoose.Document {
  sessionId: string;
  triggeredBy: "admin" | "cron" | "manual";
  triggeredByUserId?: mongoose.Types.ObjectId;
  
  bucketsRequested: string[];
  bucketsCompleted: string[];
  bucketsFailed: string[];
  
  totalApiCalls: number;
  totalJobsFound: number;
  newJobsAdded: number;
  jobsUpdated: number;
  
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  
  status: "in-progress" | "completed" | "failed" | "partial";
  errorMessage?: string;
  
  bucketDetails: Array<{
    bucket: string;
    keyword: string;
    apiCallsMade: number;
    jobsFound: number;
    newJobsAdded: number;
    jobsUpdated: number;
    startTime?: Date;
    endTime?: Date;
    status: "success" | "failed";
  }>;
  
  createdAt?: Date;
  updatedAt?: Date;
}

const ScrapingLogSchema = new Schema<IScrapingLog>({
  sessionId: { type: String, required: true, unique: true, index: true },
  triggeredBy: { type: String, enum: ["admin", "cron", "manual"], default: "manual", index: true },
  triggeredByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  
  bucketsRequested: { type: [String], default: [] },
  bucketsCompleted: { type: [String], default: [] },
  bucketsFailed: { type: [String], default: [] },
  
  totalApiCalls: { type: Number, default: 0 },
  totalJobsFound: { type: Number, default: 0 },
  newJobsAdded: { type: Number, default: 0 },
  jobsUpdated: { type: Number, default: 0 },
  
  startedAt: { type: Date, default: Date.now, index: true },
  completedAt: Date,
  durationMs: Number,
  
  status: { type: String, enum: ["in-progress", "completed", "failed", "partial"], default: "in-progress", index: true },
  errorMessage: String,
  
  bucketDetails: [{
    bucket: String,
    keyword: String,
    apiCallsMade: { type: Number, default: 0 },
    jobsFound: { type: Number, default: 0 },
    newJobsAdded: { type: Number, default: 0 },
    jobsUpdated: { type: Number, default: 0 },
    startTime: Date,
    endTime: Date,
    status: { type: String, enum: ["success", "failed"] }
  }],
}, { timestamps: true });
```

**Checklist:**
- [ ] Update Job.ts with all new fields + indexes
- [ ] Update User.ts with all new fields
- [ ] Create ParsedResume.ts with complete schema
- [ ] Create JobMatch.ts with complete schema
- [ ] Create ApiUsage.ts with complete schema
- [ ] Create SavedJob.ts with complete schema
- [ ] Create ScrapingLog.ts with complete schema
- [ ] Create index files (src/models/index.ts) exporting all models
- [ ] Run MongoDB migrations to add indexes
- [ ] Test: Can create & query all models

---

### TASK 1.3: OpenWeb Ninja API Client (Day 2-3, 4-5 hours)

**Objective:** Implement API client for OpenWeb Ninja JSearch API

**Files to Create:**

#### 1️⃣ HTTP Client Utility
**File:** `src/utils/httpClient.ts`

```typescript
import http from 'http';
import https from 'https';
import { URL } from 'url';

export class HTTPError extends Error {
  constructor(public statusCode: number, message: string) {
    super(`HTTP ${statusCode}: ${message}`);
    this.name = 'HTTPError';
  }
}

export interface HTTPClientOptions {
  host: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class HTTPClient {
  private host: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(options: HTTPClientOptions) {
    this.host = options.host;
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(`https://${this.host}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return this.request('GET', url);
  }

  async post(endpoint: string, body: any): Promise<any> {
    const url = new URL(`https://${this.host}${endpoint}`);
    return this.request('POST', url, body);
  }

  private request(method: string, url: URL, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        timeout: this.timeout,
      };

      const req = https.request(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new HTTPError(res.statusCode || 500, data || 'Unknown error'));
            return;
          }

          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(new Error(`Failed to parse JSON: ${err}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}
```

#### 2️⃣ Rate Limiter
**File:** `src/services/rateLimiter.ts`

```typescript
import { logger } from '../utils/logger';

export class RateLimiter {
  private delay: number;
  private maxRetries: number;
  private retryDelay: number;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor(options: {
    delay?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}) {
    this.delay = options.delay || 1000; // 1 second
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 2000;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.delay) {
      const sleepTime = this.delay - timeSinceLastRequest;
      logger.debug(`Rate limiting: waiting ${sleepTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
    logger.debug(`Request #${this.requestCount}`);
  }

  async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        await this.wait();
        return await fn();
      } catch (err) {
        lastError = err as Error;
        logger.warn(`Attempt ${attempt + 1}/${this.maxRetries} failed: ${lastError.message}`);

        if (attempt < this.maxRetries - 1) {
          const sleepTime = this.retryDelay * Math.pow(2, attempt);
          logger.info(`Retrying in ${sleepTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
        }
      }
    }

    throw lastError || new Error('Max retries reached');
  }

  getStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}
```

#### 3️⃣ OpenWeb Ninja API Client
**File:** `src/services/openWebNinjaClient.ts`

```typescript
import { HTTPClient, HTTPError } from '../utils/httpClient';
import { RateLimiter } from './rateLimiter';
import { logger } from '../utils/logger';

export interface JobSearchParams {
  q: string;
  country?: string;
  num_results?: number;
  date_posted?: string;
  employment_types?: string;
  job_is_remote?: boolean;
}

export interface JobSearchResponse {
  data?: any[];
  error?: string;
  status: number;
}

export class OpenWebNinjaClient {
  private client: HTTPClient;
  private rateLimiter: RateLimiter;

  constructor(apiKey: string, config?: { timeout?: number }) {
    this.client = new HTTPClient({
      host: process.env.OPENWEBNINJA_API_HOST || 'api.openwebninja.com',
      headers: {
        'x-api-key': apiKey,
      },
      timeout: config?.timeout || 30000,
    });

    this.rateLimiter = new RateLimiter({
      delay: 1000, // 1 request per second
      maxRetries: 3,
      retryDelay: 2000,
    });

    logger.info('OpenWebNinjaClient initialized');
  }

  async searchJobs(params: JobSearchParams): Promise<any[]> {
    logger.info(`Searching jobs: ${params.q} in ${params.country || 'US'}`);

    const queryParams = {
      q: params.q,
      country: params.country || 'in', // India-only default
      num_results: params.num_results || 100,
      ...( params.date_posted && { date_posted: params.date_posted }),
      ...( params.employment_types && { employment_types: params.employment_types }),
      ...( params.job_is_remote !== undefined && { job_is_remote: params.job_is_remote }),
    };

    return this.rateLimiter.withRetry(async () => {
      try {
        const response = await this.client.get('/jsearch/search', queryParams);

        if (response.error) {
          throw new HTTPError(400, response.error);
        }

        const jobs = response.data || [];
        logger.info(`Found ${jobs.length} jobs`);
        return jobs;
      } catch (err) {
        logger.error(`Job search error: ${err}`);
        throw err;
      }
    });
  }

  async getJobDetails(jobId: string, country: string = 'in'): Promise<any> {
    logger.info(`Getting job details: ${jobId}`);

    return this.rateLimiter.withRetry(async () => {
      try {
        const response = await this.client.get('/jsearch/job-details', {
          job_id: jobId,
          country,
        });

        if (response.error) {
          throw new HTTPError(400, response.error);
        }

        const data = response.data || [];
        if (data.length === 0) {
          throw new HTTPError(404, 'Job not found');
        }

        return data[0];
      } catch (err) {
        logger.error(`Get job details error: ${err}`);
        throw err;
      }
    });
  }

  async getEstimatedSalary(
    jobTitle: string,
    location: string,
    options?: { locationtype?: string; years_of_experience?: string }
  ): Promise<any[]> {
    logger.info(`Getting estimated salary: ${jobTitle} in ${location}`);

    return this.rateLimiter.withRetry(async () => {
      try {
        const response = await this.client.get('/jsearch/estimated-salary', {
          job_title: jobTitle,
          location,
          location_type: options?.locationtype || 'ANY',
          years_of_experience: options?.years_of_experience || 'ALL',
        });

        if (response.error) {
          throw new HTTPError(400, response.error);
        }

        return response.data || [];
      } catch (err) {
        logger.error(`Get salary error: ${err}`);
        throw err;
      }
    });
  }

  getRateLimiterStats() {
    return this.rateLimiter.getStats();
  }
}

// Export singleton instance
export const openWebNinjaClient = new OpenWebNinjaClient(
  process.env.OPENWEBNINJA_API_KEY || ''
);
```

**Checklist:**
- [ ] Create HTTPClient utility with GET/POST methods
- [ ] Create RateLimiter with 1-second delay enforcement
- [ ] Create RateLimiter with 3-attempt retry logic + exponential backoff
- [ ] Create OpenWebNinjaClient with all 4 methods
- [ ] Add India-only filtering (country: 'in')
- [ ] Add comprehensive logging
- [ ] Test: Call API and verify rate limiting works

---

### TASK 1.4: Job Queue Setup (Day 3, 2-3 hours)

**Objective:** Setup BullMQ job queues with Redis

**Files to Create:**

#### 1️⃣ Queue Configuration
**File:** `src/config/queue.ts`

```typescript
import Queue from 'bullmq';
import { redis } from './redis';
import { logger } from '../utils/logger';

export enum QueueNames {
  SCRAPING = 'scraping-queue',
  NOTIFICATION = 'notification-queue',
  MATCHING = 'matching-queue',
}

export interface ScrapingJobData {
  buckets: string[];
  sessionId: string;
  triggeredBy: 'admin' | 'cron';
  triggeredByUserId?: string;
}

export interface NotificationJobData {
  userId: string;
  event: string;
  channels: string[];
  data: Record<string, any>;
}

export interface MatchingJobData {
  userId: string;
  jobId?: string;
}

// Create queues
export const scrapingQueue = new Queue(QueueNames.SCRAPING, { connection: redis });
export const notificationQueue = new Queue(QueueNames.NOTIFICATION, { connection: redis });
export const matchingQueue = new Queue(QueueNames.MATCHING, { connection: redis });

// Setup event listeners
export function setupQueueListeners() {
  [scrapingQueue, notificationQueue, matchingQueue].forEach((queue) => {
    queue.on('completed', (job) => {
      logger.info(`Job ${job.id} completed`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed:${err.message}`);
    });

    queue.on('active', (job) => {
      logger.debug(`Job ${job.id} started`);
    });
  });
}

export async function closeQueues() {
  await Promise.all([
    scrapingQueue.close(),
    notificationQueue.close(),
    matchingQueue.close(),
  ]);
}
```

#### 2️⃣ Redis Configuration
**File:** `src/config/redis.ts`

```typescript
import Redis from 'ioredis';
import { logger } from '../utils/logger';

const redisUrl = process.env.REDIS_URL || 
  `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

export const redis = new Redis(redisUrl, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`);
});

redis.on('ready', () => {
  logger.info('Redis ready');
});

export async function closeRedis() {
  await redis.quit();
}
```

**Checklist:**
- [ ] Create queue configuration with 3 queue types
- [ ] Create Redis configuration
- [ ] Test: BullMQ can connect to Redis
- [ ] Test: Can enqueue and process jobs
- [ ] Test: Job events fire correctly

---

### TASK 1.5: Scheduled Jobs Setup (Day 3, 2 hours)

**Objective:** Setup node-cron for scheduled scraping

**File:** `src/config/scheduler.ts`

```typescript
import cron from 'node-cron';
import { logger } from '../utils/logger';
import { scrapingQueue, ScrapingJobData } from './queue';
import { v4 as uuidv4 } from 'uuid';

const BUCKETS = [
  'fresher',
  'batch',
  'software',
  'data',
  'cloud',
  'mobile',
  'qa',
  'non-tech',
  'experience',
  'employment',
  'work-mode',
];

export function setupScheduledJobs() {
  logger.info('Setting up scheduled jobs...');

  // Sunday 2 AM - Scrape Fresher bucket
  cron.schedule('0 2 * * 0', async () => {
    logger.info('Cron: Triggering fresher bucket scrape');
    await scrapingQueue.add(
      'scrape-bucket',
      {
        buckets: ['fresher'],
        sessionId: uuidv4(),
        triggeredBy: 'cron',
      } as ScrapingJobData
    );
  });

  // Every 2 weeks (every other Sunday) - Scrape Batch bucket
  cron.schedule('0 3 * * 0', async () => {
    const now = new Date();
    const weekOfYear = Math.ceil((now.getDate() + new Date(now.getFullYear(), 0, 1).getDay()) / 7);
    if (weekOfYear % 2 === 0) {
      logger.info('Cron: Triggering batch bucket scrape');
      await scrapingQueue.add(
        'scrape-bucket',
        {
          buckets: ['batch'],
          sessionId: uuidv4(),
          triggeredBy: 'cron',
        } as ScrapingJobData
      );
    }
  });

  // Weekly (Mondays 4 AM) - Scrape other priority buckets
  cron.schedule('0 4 * * 1', async () => {
    logger.info('Cron: Triggering priority buckets scrape');
    await scrapingQueue.add(
      'scrape-bucket',
      {
        buckets: ['software', 'data', 'cloud'],
        sessionId: uuidv4(),
        triggeredBy: 'cron',
      } as ScrapingJobData
    );
  });

  // Monthly (1st of month 5 AM) - Reset API usage counter
  cron.schedule('0 5 1 * *', async () => {
    logger.info('Cron: Resetting monthly API usage');
    // TODO: Implement API usage reset logic
  });

  // Weekly (Sundays 6 AM) - Cleanup expired jobs
  cron.schedule('0 6 * * 0', async () => {
    logger.info('Cron: Cleaning up expired jobs');
    // TODO: Implement job cleanup logic
  });

  logger.info('Scheduled jobs setup complete');
}

export function listScheduledJobs() {
  // Returns list of active cron tasks
  // Can be used for monitoring
}
```

**Checklist:**
- [ ] Create scheduler config with 6 cron jobs
- [ ] Configure job timings
- [ ] Test: Cron jobs can queue jobs
- [ ] Test: Can list active scheduled jobs

---

### TASK 1.6: Logger Setup (Day 1, 1 hour)

**Objective:** Setup Winston logger

**File:** `src/utils/logger.ts`

```typescript
import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_FILE_PATH || 'logs';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] ${message}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});
```

**Checklist:**
- [ ] Create Winston logger configuration
- [ ] Setup console + file transports
- [ ] Create logs directory in .gitignore
- [ ] Test: Logger writes to console and file

---

### TASK 1.7: Authentication Enhancements (Day 4, 2-3 hours)

**Objective:** Enhance JWT with refresh tokens and role-based access

**File:** `src/middleware/roleCheck.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    logger.warn(`Unauthorized admin access attempt by ${req.userId}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const userRequired = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const publicRoute = (req: AuthRequest, res: Response, next: NextFunction) => {
  // No authentication check
  next();
};
```

**File:** `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation error', details: err.message });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate entry' });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**Checklist:**
- [ ] Create role-based middleware
- [ ] Create error handler middleware
- [ ] Create async handler wrapper
- [ ] Test: Admin-only endpoints reject non-admins
- [ ] Test: Public endpoints work without auth

---

### TASK 1.8: Application Entry Point (Day 4, 2 hours)

**Objective:** Setup main application with all middleware

**File:** `src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import { logger } from './utils/logger';
import { redis } from './config/redis';
import { setupQueueListeners, closeQueues, scrapingQueue } from './config/queue';
import { setupScheduledJobs } from './config/scheduler';
import { globalErrorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI || 'mongodb://localhost:27017/jobintel')
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => logger.error(`MongoDB error: ${err.message}`));

// Queue setup
setupQueueListeners();

// Scheduled jobs setup
setupScheduledJobs();

// Routes (to be implemented)
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/jobs', jobRoutes);
// ... other routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler (must be last)
app.use(globalErrorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  server.close();
  await mongoose.disconnect();
  await closeQueues();
  await redis.quit();
  process.exit(0);
});
```

**Checklist:**
- [ ] Setup Express app with all middleware
- [ ] Connect MongoDB on startup
- [ ] Setup Redis on startup
- [ ] Initialize queue listeners
- [ ] Initialize scheduled jobs
- [ ] Add health check endpoint
- [ ] Test: `npm run dev` starts without errors
- [ ] Test: Health endpoint responds
- [ ] Test: MongoDB connects
- [ ] Test: Redis connects
- [ ] Test: Can queue jobs

---

## 📝 ACCEPTANCE CRITERIA

By the end of Phase 1, all of these should pass:

```bash
✅ Backend starts: npm run dev
✅ Health check: curl http://localhost:5000/health → {"status": "ok"}
✅ MongoDB: Connected and all models instantiable
✅ Redis: Connected and functional
✅ OpenWeb Ninja: Can authenticate and make test API call
✅ Rate limiter: Enforces 1-second minimum between requests
✅ Retry logic: Retries on failure with exponential backoff
✅ BullMQ: Can queue and process jobs
✅ Scheduler: Cron jobs registered and triggering
✅ Logger: Writes to console and file
✅ Error handling: Catches and logs errors gracefully
✅ Auth: JWT tokens can be created and validated
✅ RBAC: Admin-only endpoints reject non-admins
```

## 🚀 NEXT STEPS

Once Phase 1 is complete:
→ Move to **Phase 2: API Endpoints & Core Logic** for implementing all REST endpoints
→ Continue with **Phase 3: Job Extraction & Matching Engine** for core business logic

---

**Document Version:** 1.0  
**Created:** January 18, 2026  
**Estimated Completion:** 1-2 weeks  
**Dependencies:** Node.js 16+, MongoDB 4.4+, Redis 6+
