# JobIntel Phase 3: Job Extraction & Matching Engine

**Phase Duration:** 2-3 weeks (10 days development)  
**Team Size:** 2-3 developers  
**Priority Level:** CRITICAL (core business logic & differentiator)  
**Prerequisites:** Phase 1 & Phase 2 must be complete  
**Created:** January 18, 2026

---

## 📋 PHASE 3 OVERVIEW

Phase 3 implements the core business logic that differentiates JobIntel from other job platforms:

1. ✅ Job normalization & extraction service
2. ✅ Deduplication logic (by externalJobId)
3. ✅ API usage tracking & hard limit enforcement
4. ✅ Orchestrated scraping service (all 11 buckets)
5. ✅ HTML career page extraction (Playwright)
6. ✅ 6-factor transparent matching algorithm
7. ✅ Batch matching service
8. ✅ Job lifecycle management (expiry & cleanup)
9. ✅ Cache warming & optimization

This is the **differentiator phase** - most competitors don't have transparent matching scores.

---

## 📊 PHASE 3 DELIVERABLES

### By End of Phase 3, You Should Have:
- ✅ Job normalization service (extracts 30+ fields from raw data)
- ✅ Deduplication service (checks externalJobId before insert/update)
- ✅ API usage tracker with hard limit enforcement
- ✅ Complete scraping orchestration (all 11 buckets, sequential with rate limiting)
- ✅ HTML extraction service (Playwright-based)
- ✅ 6-factor matching algorithm with 100+ weight combinations
- ✅ Batch matching service (processes 1000+ matches/second)
- ✅ Job expiry cleanup (30-day active + 30-day archive)
- ✅ Cache warming service
- ✅ Comprehensive logging for all operations
- ✅ Full integration with Phase 1 rate limiter

### Testing Acceptance Criteria:
```bash
✅ Scraping job completes successfully
✅ API calls respect 1-second rate limit
✅ Jobs deduplicated by externalJobId
✅ API usage tracked and hard stopped at 200/month
✅ Job fields normalized correctly
✅ 6-factor matching produces scores 0-100
✅ Matching algorithm transparent (shows score breakdown)
✅ Batch matching processes 1000+ jobs/second
✅ Expired jobs marked inactive after 30 days
✅ Jobs deleted after 60 days
✅ Scraping logs complete and detailed
✅ All business logic covered by unit tests
✅ Performance: Can scrape all 11 buckets in <2 hours
```

---

## 🎯 DETAILED PHASE 3 TASKS

### TASK 3.1: Job Normalization Service (Day 1-2, 4-5 hours)

**Objective:** Extract, validate, and normalize raw job data to standard schema

**Files to Create:**

#### 1️⃣ Job Normalization Service
**File:** `src/services/jobNormalizationService.ts`

```typescript
import { logger } from '../utils/logger';

// 11-Bucket Taxonomy
const TAXONOMY = {
  FRESHER: {
    keywords: ['fresher', 'graduate', 'entry level', 'no experience', 'junior developer'],
    careerLevel: 'fresher',
    domain: 'software',
    experienceRequired: 0,
  },
  BATCH: {
    keywords: ['batch', 'placement drive', 'campus', 'b.tech', 'engineering student'],
    careerLevel: 'fresher',
    domain: 'software',
    experienceRequired: 0,
    batchEligible: true,
  },
  SOFTWARE: {
    keywords: ['software engineer', 'developer', 'backend', 'frontend', 'full stack'],
    domain: 'software',
  },
  DATA: {
    keywords: ['data engineer', 'data scientist', 'analytics', 'ml engineer', 'ai'],
    domain: 'data',
  },
  CLOUD: {
    keywords: ['cloud engineer', 'devops', 'aws', 'azure', 'kubernetes', 'docker'],
    domain: 'cloud',
  },
  MOBILE: {
    keywords: ['mobile developer', 'react native', 'flutter', 'ios', 'android'],
    domain: 'mobile',
  },
  QA: {
    keywords: ['qa engineer', 'test engineer', 'automation tester', 'quality assurance'],
    domain: 'qa',
  },
  NON_TECH: {
    keywords: ['product manager', 'sales', 'marketing', 'operations', 'hr'],
    domain: 'non-tech',
  },
  EXPERIENCE: {
    keywords: ['experienced', 'senior', 'lead', 'manager', '5 years', '10 years'],
    careerLevel: 'senior',
  },
  EMPLOYMENT: {
    keywords: ['full time', 'part time', 'contract', 'freelance', 'temporary'],
  },
  WORK_MODE: {
    keywords: ['remote', 'work from home', 'wfh', 'onsite', 'hybrid'],
  },
};

export interface RawJobData {
  title?: string;
  companyName?: string;
  location?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  salary?: string;
  applyUrl?: string;
  jobUrl?: string;
  postedDate?: Date | string;
  externalId?: string;
  source?: string;
  rawHtml?: string;
  [key: string]: any;
}

export interface NormalizedJob {
  // Core fields
  title: string;
  companyName: string;
  location?: string;
  description?: string;
  requirements: string[];
  responsibilities: string[];
  applyUrl?: string;
  externalJobId: string;
  source: string;
  
  // Normalized fields
  careerLevel?: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  domain?: 'software' | 'data' | 'cloud' | 'mobile' | 'qa' | 'non-tech';
  techStack: string[];
  experienceRequired?: number;
  workMode?: 'remote' | 'onsite' | 'hybrid';
  batchEligible?: boolean;
  bucket?: string;
  
  // Metadata
  normalizedTitle: string;
  normalizedCompany: string;
  salary?: string;
  currencySalary?: string;
  fetchedAt: Date;
  expiryDate: Date;
  isActive: boolean;
  parseQuality: 'high' | 'medium' | 'low';
  parseConfidence: number; // 0-100
  
  postedAt?: Date;
  rawHtml?: string;
}

// Technology stack detection
const TECH_STACK_MAP = {
  frontend: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Ember'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'C#', 'Ruby'],
  database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'Cassandra'],
  cloud: ['AWS', 'Azure', 'GCP', 'Heroku', 'DigitalOcean', 'Linode'],
  devops: ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform'],
  mobile: ['React Native', 'Flutter', 'Ionic', 'Swift', 'Kotlin'],
};

class JobNormalizationService {
  /**
   * Extract tech stack from text
   */
  private extractTechStack(text: string): string[] {
    const techStack = new Set<string>();
    const lowerText = text.toLowerCase();

    Object.values(TECH_STACK_MAP).forEach((techs) => {
      techs.forEach((tech) => {
        if (lowerText.includes(tech.toLowerCase())) {
          techStack.add(tech);
        }
      });
    });

    return Array.from(techStack);
  }

  /**
   * Detect career level from text
   */
  private detectCareerLevel(text: string, title: string): 'fresher' | 'junior' | 'mid' | 'senior' | 'lead' {
    const combined = `${text} ${title}`.toLowerCase();

    if (combined.includes('fresher') || combined.includes('graduate') || combined.includes('entry level')) {
      return 'fresher';
    }
    if (combined.includes('lead') || combined.includes('principal') || combined.includes('staff')) {
      return 'lead';
    }
    if (combined.includes('senior') || combined.includes('5+ years') || combined.includes('5+y')) {
      return 'senior';
    }
    if (combined.includes('mid') || combined.includes('3+ years') || combined.includes('3+y')) {
      return 'mid';
    }

    return 'junior';
  }

  /**
   * Detect work mode
   */
  private detectWorkMode(text: string): 'remote' | 'onsite' | 'hybrid' | undefined {
    const lower = text.toLowerCase();

    if (lower.includes('remote') || lower.includes('work from home')) {
      return 'remote';
    }
    if (lower.includes('hybrid')) {
      return 'hybrid';
    }
    if (lower.includes('onsite') || lower.includes('office')) {
      return 'onsite';
    }

    return undefined;
  }

  /**
   * Detect bucket from title and description
   */
  private detectBucket(title: string, description: string): string | undefined {
    const combined = `${title} ${description}`.toLowerCase();

    for (const [bucket, config] of Object.entries(TAXONOMY)) {
      if ((config as any).keywords.some(kw => combined.includes(kw))) {
        return bucket;
      }
    }

    return undefined;
  }

  /**
   * Extract experience requirement in years
   */
  private extractExperienceYears(text: string): number | undefined {
    const match = text.match(/(\d+)\+?\s*(?:years?|y|yrs?)/i);
    if (match) {
      return parseInt(match[1]);
    }

    if (text.toLowerCase().includes('fresher') || text.toLowerCase().includes('no experience')) {
      return 0;
    }

    return undefined;
  }

  /**
   * Extract salary from text
   */
  private extractSalary(text: string): string | undefined {
    const salaryMatch = text.match(
      /(?:₹|inr|usd|\$|£|€)?\s*(\d{1,3}(?:,?\d{3})*)\s*(?:to|-)?\s*(?:₹|inr|usd|\$|£|€)?\s*(\d{1,3}(?:,?\d{3})*)?/i
    );

    if (salaryMatch) {
      return text.substring(salaryMatch.index!, salaryMatch.index! + salaryMatch[0].length);
    }

    return undefined;
  }

  /**
   * Extract requirements and split into array
   */
  private extractRequirements(text: string): string[] {
    if (!text) return [];

    // Split by common delimiters
    let requirements = text
      .split(/[,•\n-]/i)
      .map(req => req.trim())
      .filter(req => req.length > 5 && req.length < 200);

    // Clean up and deduplicate
    requirements = [...new Set(requirements)];

    return requirements.slice(0, 20); // Limit to 20
  }

  /**
   * Calculate parse quality based on field completeness
   */
  private calculateParseQuality(job: NormalizedJob): { quality: 'high' | 'medium' | 'low'; confidence: number } {
    const fields = [
      !!job.title,
      !!job.companyName,
      !!job.description && job.description.length > 100,
      job.requirements.length > 3,
      job.responsibilities.length > 0,
      !!job.applyUrl,
      !!job.careerLevel,
      !!job.domain,
      job.techStack.length > 0,
    ];

    const completionPercent = (fields.filter(Boolean).length / fields.length) * 100;

    let quality: 'high' | 'medium' | 'low' = 'low';
    if (completionPercent >= 85) quality = 'high';
    else if (completionPercent >= 60) quality = 'medium';

    return {
      quality,
      confidence: Math.round(completionPercent),
    };
  }

  /**
   * Main normalization function
   */
  normalize(rawJob: RawJobData, bucket?: string): NormalizedJob {
    const {
      title,
      companyName,
      location,
      description = '',
      requirements = '',
      responsibilities = '',
      salary,
      applyUrl,
      jobUrl,
      externalId,
      source,
      rawHtml,
    } = rawJob;

    if (!title || !companyName || !externalId) {
      throw new Error('Title, companyName, and externalId are required');
    }

    const techStack = this.extractTechStack(`${description} ${requirements}`);
    const careerLevel = this.detectCareerLevel(`${description} ${requirements}`, title);
    const workMode = this.detectWorkMode(`${description} ${location || ''}`);
    const experienceRequired = this.extractExperienceYears(`${requirements} ${description}`);
    const detectedBucket = bucket || this.detectBucket(title, description);

    const extractedRequirements = this.extractRequirements(requirements);
    const extractedResponsibilities = this.extractResponsibilities(responsibilities);

    const normalized: NormalizedJob = {
      title,
      companyName,
      location,
      description,
      requirements: extractedRequirements,
      responsibilities: extractedResponsibilities,
      applyUrl: applyUrl || jobUrl,
      externalJobId: externalId,
      source: source || 'unknown',

      careerLevel,
      domain: this.getDomainForBucket(detectedBucket),
      techStack,
      experienceRequired,
      workMode,
      batchEligible: careerLevel === 'fresher' || (title.toLowerCase().includes('batch')),
      bucket: detectedBucket,

      normalizedTitle: title.toLowerCase().trim(),
      normalizedCompany: companyName.toLowerCase().trim(),
      salary: this.extractSalary(salary || description),
      fetchedAt: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      parseQuality: 'medium',
      parseConfidence: 60,

      postedAt: rawJob.postedDate ? new Date(rawJob.postedDate) : undefined,
      rawHtml,
    };

    // Calculate quality metrics
    const { quality, confidence } = this.calculateParseQuality(normalized);
    normalized.parseQuality = quality;
    normalized.parseConfidence = confidence;

    return normalized;
  }

  private extractResponsibilities(text: string): string[] {
    return this.extractRequirements(text);
  }

  private getDomainForBucket(bucket?: string): 'software' | 'data' | 'cloud' | 'mobile' | 'qa' | 'non-tech' | undefined {
    if (!bucket) return undefined;

    const domainMap: Record<string, any> = {
      FRESHER: 'software',
      BATCH: 'software',
      SOFTWARE: 'software',
      DATA: 'data',
      CLOUD: 'cloud',
      MOBILE: 'mobile',
      QA: 'qa',
      NON_TECH: 'non-tech',
    };

    return domainMap[bucket];
  }

  /**
   * Batch normalize multiple jobs
   */
  normalizeBatch(rawJobs: RawJobData[], bucket?: string): NormalizedJob[] {
    return rawJobs.map(job => {
      try {
        return this.normalize(job, bucket);
      } catch (err) {
        logger.warn(`Failed to normalize job: ${err}`);
        return null;
      }
    }).filter(Boolean) as NormalizedJob[];
  }

  /**
   * Get taxonomy info
   */
  getTaxonomy() {
    return TAXONOMY;
  }
}

export const jobNormalizationService = new JobNormalizationService();
```

**Checklist:**
- [ ] Create normalization service with all extraction logic
- [ ] Detect career level from text
- [ ] Extract tech stack
- [ ] Detect work mode (remote/onsite/hybrid)
- [ ] Detect bucket from keywords
- [ ] Extract experience requirement
- [ ] Extract salary range
- [ ] Calculate parse quality score
- [ ] Test: Normalize 10 sample jobs, verify fields
- [ ] Test: Batch normalization works

---

### TASK 3.2: Deduplication Service (Day 2, 2-3 hours)

**Objective:** Prevent duplicate jobs using externalJobId as unique key

**File:** `src/services/deduplicationService.ts`

```typescript
import Job from '../models/Job';
import { NormalizedJob } from './jobNormalizationService';
import { logger } from '../utils/logger';

export interface DeduplicationResult {
  isNew: boolean;
  jobId?: string;
  previousVersion?: any;
  updateCount: number;
  action: 'inserted' | 'updated' | 'skipped';
}

class DeduplicationService {
  /**
   * Check if job exists by externalJobId
   */
  async jobExists(externalJobId: string): Promise<boolean> {
    const job = await Job.findOne({ externalJobId });
    return !!job;
  }

  /**
   * Get existing job by externalJobId
   */
  async getExistingJob(externalJobId: string) {
    return Job.findOne({ externalJobId });
  }

  /**
   * Process job: Insert new or update existing
   */
  async processJob(normalizedJob: NormalizedJob): Promise<DeduplicationResult> {
    const existingJob = await this.getExistingJob(normalizedJob.externalJobId);

    if (!existingJob) {
      // New job - insert
      const newJob = new Job(normalizedJob);
      await newJob.save();

      logger.info(`New job inserted: ${normalizedJob.externalJobId}`);

      return {
        isNew: true,
        jobId: newJob._id.toString(),
        action: 'inserted',
        updateCount: 0,
      };
    }

    // Existing job - check if needs update
    const hasChanges = this.detectChanges(existingJob.toObject(), normalizedJob);

    if (!hasChanges) {
      // No changes - skip
      logger.debug(`Job unchanged: ${normalizedJob.externalJobId}`);
      return {
        isNew: false,
        jobId: existingJob._id.toString(),
        action: 'skipped',
        updateCount: 0,
      };
    }

    // Update existing job
    Object.assign(existingJob, normalizedJob);
    existingJob.updatedAt = new Date();
    await existingJob.save();

    logger.info(`Job updated: ${normalizedJob.externalJobId}`);

    return {
      isNew: false,
      jobId: existingJob._id.toString(),
      previousVersion: { ...existingJob.toObject() },
      action: 'updated',
      updateCount: 1,
    };
  }

  /**
   * Detect meaningful changes between old and new job
   */
  private detectChanges(oldJob: any, newJob: NormalizedJob): boolean {
    const fieldsToCheck = [
      'title',
      'companyName',
      'location',
      'description',
      'requirements',
      'responsibilities',
      'careerLevel',
      'domain',
      'workMode',
      'salary',
    ];

    for (const field of fieldsToCheck) {
      if (JSON.stringify(oldJob[field]) !== JSON.stringify((newJob as any)[field])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Batch process jobs with deduplication
   */
  async processBatch(
    normalizedJobs: NormalizedJob[],
    sessionId: string
  ): Promise<{
    inserted: number;
    updated: number;
    skipped: number;
    results: DeduplicationResult[];
  }> {
    const results: DeduplicationResult[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const job of normalizedJobs) {
      try {
        const result = await this.processJob(job);
        results.push(result);

        if (result.action === 'inserted') inserted++;
        else if (result.action === 'updated') updated++;
        else skipped++;
      } catch (err) {
        logger.error(`Error processing job ${job.externalJobId}: ${err}`);
      }
    }

    logger.info(`Batch processed: ${inserted} inserted, ${updated} updated, ${skipped} skipped`);

    return { inserted, updated, skipped, results };
  }

  /**
   * Get duplicate count for a job
   */
  async getDuplicateCount(externalJobId: string): Promise<number> {
    const count = await Job.countDocuments({ externalJobId });
    return Math.max(0, count - 1); // Subtract 1 for the original
  }

  /**
   * Merge duplicate jobs (keep newer, archive older)
   */
  async mergeDuplicates(externalJobId: string): Promise<number> {
    const jobs = await Job.find({ externalJobId }).sort({ createdAt: -1 });

    if (jobs.length <= 1) {
      return 0;
    }

    const keeper = jobs[0];
    const duplicates = jobs.slice(1);

    // Delete duplicates
    await Job.deleteMany({
      externalJobId,
      _id: { $ne: keeper._id },
    });

    logger.info(`Merged ${duplicates.length} duplicates for ${externalJobId}`);

    return duplicates.length;
  }

  /**
   * Find all duplicates in database
   */
  async findAllDuplicates(): Promise<Array<{ externalJobId: string; count: number }>> {
    const duplicates = await Job.aggregate([
      {
        $group: {
          _id: '$externalJobId',
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return duplicates.map(d => ({
      externalJobId: d._id,
      count: d.count,
    }));
  }

  /**
   * Clean up all duplicates
   */
  async cleanupAllDuplicates(): Promise<number> {
    const duplicates = await this.findAllDuplicates();
    let totalCleaned = 0;

    for (const dup of duplicates) {
      totalCleaned += await this.mergeDuplicates(dup.externalJobId);
    }

    logger.info(`Cleaned up ${totalCleaned} duplicate jobs`);
    return totalCleaned;
  }
}

export const deduplicationService = new DeduplicationService();
```

**Checklist:**
- [ ] Create deduplication service
- [ ] Implement jobExists() check
- [ ] Implement processJob() (insert/update/skip)
- [ ] Implement change detection
- [ ] Implement batch processing
- [ ] Implement duplicate cleanup
- [ ] Test: New job inserted with correct ID
- [ ] Test: Duplicate skipped or updated
- [ ] Test: Change detection works correctly
- [ ] Test: Batch processing handles 100+ jobs

---

### TASK 3.3: API Usage Tracking Service (Day 3, 2-3 hours)

**Objective:** Track API calls and enforce hard limit

**File:** `src/services/apiUsageService.ts`

```typescript
import { ApiUsage } from '../models/ApiUsage';
import { logger } from '../utils/logger';

const DEFAULT_MONTHLY_LIMIT = 200;
const WARNING_THRESHOLD_PERCENT = 80;

class ApiUsageService {
  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get or create usage record for current month
   */
  async getOrCreateUsage(month?: string) {
    const targetMonth = month || this.getCurrentMonth();

    let usage = await ApiUsage.findOne({ month: targetMonth });

    if (!usage) {
      usage = new ApiUsage({
        month: targetMonth,
        provider: 'OpenWeb Ninja',
        monthlyLimit: DEFAULT_MONTHLY_LIMIT,
        totalCallsUsed: 0,
        callsRemaining: DEFAULT_MONTHLY_LIMIT,
        safetyThreshold: Math.round(DEFAULT_MONTHLY_LIMIT * (WARNING_THRESHOLD_PERCENT / 100)),
        isLimitReached: false,
        isWarningTriggered: false,
      });

      await usage.save();
      logger.info(`Created API usage record for ${targetMonth}`);
    }

    return usage;
  }

  /**
   * Record an API call
   */
  async recordCall(
    bucket: string,
    keyword: string,
    resultCount: number,
    status: 'success' | 'failed' | 'rate-limited',
    userId?: string,
    errorMessage?: string
  ) {
    const usage = await this.getOrCreateUsage();

    // Add to call history
    usage.callHistory.push({
      timestamp: new Date(),
      bucket,
      keyword,
      resultCount,
      status,
      errorMessage,
      initiatedBy: userId,
    });

    // Update counters only on success
    if (status === 'success') {
      usage.totalCallsUsed++;
      usage.callsRemaining = usage.monthlyLimit - usage.totalCallsUsed;

      // Check if limit reached
      if (usage.totalCallsUsed >= usage.monthlyLimit) {
        usage.isLimitReached = true;
        logger.error(`API USAGE LIMIT REACHED: ${usage.totalCallsUsed}/${usage.monthlyLimit}`);
      }

      // Check warning threshold
      if (usage.totalCallsUsed >= usage.safetyThreshold && !usage.isWarningTriggered) {
        usage.isWarningTriggered = true;
        logger.warn(`API usage warning: ${usage.totalCallsUsed}/${usage.monthlyLimit} (${WARNING_THRESHOLD_PERCENT}%)`);
      }
    }

    await usage.save();

    return {
      totalUsed: usage.totalCallsUsed,
      remaining: usage.callsRemaining,
      isLimitReached: usage.isLimitReached,
      isWarningTriggered: usage.isWarningTriggered,
    };
  }

  /**
   * Check if API limit reached - HARD STOP
   */
  async canMakeCall(): Promise<{ allowed: boolean; reason?: string }> {
    const usage = await this.getOrCreateUsage();

    if (usage.isLimitReached) {
      return {
        allowed: false,
        reason: `API usage limit reached: ${usage.totalCallsUsed}/${usage.monthlyLimit}`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get current usage stats
   */
  async getStats(month?: string) {
    const targetMonth = month || this.getCurrentMonth();
    const usage = await this.getOrCreateUsage(targetMonth);

    return {
      month: usage.month,
      totalCalls: usage.totalCallsUsed,
      monthlyLimit: usage.monthlyLimit,
      callsRemaining: usage.callsRemaining,
      percentageUsed: Math.round((usage.totalCallsUsed / usage.monthlyLimit) * 100),
      safetyThreshold: usage.safetyThreshold,
      isLimitReached: usage.isLimitReached,
      isWarningTriggered: usage.isWarningTriggered,
      lastUpdated: new Date(),
    };
  }

  /**
   * Set custom monthly limit (admin only)
   */
  async setMonthlyLimit(newLimit: number, userId?: string) {
    if (newLimit < 1) {
      throw new Error('Monthly limit must be at least 1');
    }

    const usage = await this.getOrCreateUsage();

    usage.adminConfiguredLimit = newLimit;
    usage.monthlyLimit = newLimit;
    usage.safetyThreshold = Math.round(newLimit * (WARNING_THRESHOLD_PERCENT / 100));
    usage.callsRemaining = newLimit - usage.totalCallsUsed;
    usage.lastConfiguredAt = new Date();
    usage.lastConfiguredBy = userId;

    await usage.save();

    logger.info(`API limit set to ${newLimit} by ${userId || 'system'}`);

    return {
      monthlyLimit: usage.monthlyLimit,
      safetyThreshold: usage.safetyThreshold,
    };
  }

  /**
   * Get call history with pagination
   */
  async getCallHistory(limit: number = 50, offset: number = 0, month?: string) {
    const targetMonth = month || this.getCurrentMonth();
    const usage = await this.getOrCreateUsage(targetMonth);

    const allCalls = usage.callHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const paginated = allCalls.slice(offset, offset + limit);

    return {
      calls: paginated,
      total: allCalls.length,
      limit,
      offset,
    };
  }

  /**
   * Get usage report for a range of months
   */
  async getMonthlyReport(monthsBack: number = 12) {
    const reports = [];

    for (let i = 0; i < monthsBack; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const usage = await ApiUsage.findOne({ month });

      if (usage) {
        reports.push({
          month: usage.month,
          totalCalls: usage.totalCallsUsed,
          monthlyLimit: usage.monthlyLimit,
          percentageUsed: Math.round((usage.totalCallsUsed / usage.monthlyLimit) * 100),
          isLimitReached: usage.isLimitReached,
        });
      }
    }

    return reports;
  }

  /**
   * Reset usage for current month (for testing only)
   */
  async resetForTesting(month?: string) {
    const targetMonth = month || this.getCurrentMonth();
    await ApiUsage.updateOne(
      { month: targetMonth },
      {
        $set: {
          totalCallsUsed: 0,
          callsRemaining: DEFAULT_MONTHLY_LIMIT,
          callHistory: [],
          isLimitReached: false,
          isWarningTriggered: false,
        },
      }
    );

    logger.warn(`API usage reset for ${targetMonth} (testing only)`);
  }
}

export const apiUsageService = new ApiUsageService();
```

**Checklist:**
- [ ] Create API usage service
- [ ] Implement recording of calls
- [ ] Implement hard limit check (200/month)
- [ ] Implement warning at 80%
- [ ] Track call history with timestamps
- [ ] Test: Can record 100+ calls
- [ ] Test: canMakeCall() returns false at limit
- [ ] Test: Monthly reset works
- [ ] Test: Call history queryable

---

### TASK 3.4: Complete Scraping Service (Day 4-5, 5-6 hours)

**Objective:** Orchestrate job scraping across all 11 buckets

**File:** `src/services/scrapingService.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { ScrapingLog, IScrapingLog } from '../models/ScrapingLog';
import { openWebNinjaClient } from './openWebNinjaClient';
import { jobNormalizationService } from './jobNormalizationService';
import { deduplicationService } from './deduplicationService';
import { apiUsageService } from './apiUsageService';
import { logger } from '../utils/logger';

// Search keywords for each bucket
const BUCKET_KEYWORDS = {
  fresher: ['fresher developer', 'graduate software engineer', 'entry level engineer'],
  batch: ['batch placement', 'campus hiring', 'engineering batch'],
  software: ['software engineer', 'backend developer', 'full stack developer'],
  data: ['data engineer', 'data scientist', 'machine learning engineer'],
  cloud: ['cloud engineer', 'devops engineer', 'aws engineer'],
  mobile: ['mobile developer', 'react native developer', 'flutter developer'],
  qa: ['qa engineer', 'automation tester', 'quality assurance'],
  'non-tech': ['product manager', 'business analyst', 'operations manager'],
  experience: ['senior engineer', 'engineering lead', 'tech lead 5+ years'],
  employment: ['freelance developer', 'contract engineer', 'part time developer'],
  'work-mode': ['remote developer', 'work from home engineer', 'hybrid role'],
};

interface ScrapeJobConfig {
  buckets: string[];
  sessionId: string;
  triggeredBy: 'admin' | 'cron' | 'manual';
  triggeredByUserId?: string;
}

class ScrapingService {
  /**
   * Main scraping orchestration
   */
  async scrapeBuckets(config: ScrapeJobConfig) {
    const { buckets, sessionId, triggeredBy, triggeredByUserId } = config;

    // Create scraping log
    const scrapingLog = new ScrapingLog({
      sessionId,
      triggeredBy,
      triggeredByUserId,
      bucketsRequested: buckets,
      bucketsCompleted: [],
      bucketsFailed: [],
      status: 'in-progress',
      startedAt: new Date(),
    });

    await scrapingLog.save();
    logger.info(`Scraping started: ${sessionId} - Buckets: ${buckets.join(', ')}`);

    try {
      for (const bucket of buckets) {
        // Check API limit before each bucket
        const canContinue = await apiUsageService.canMakeCall();
        if (!canContinue.allowed) {
          logger.error(`API limit reached, stopping scrape: ${canContinue.reason}`);
          scrapingLog.status = 'partial';
          scrapingLog.errorMessage = canContinue.reason;
          break;
        }

        try {
          await this.scrapeBucket(bucket, scrapingLog);
          scrapingLog.bucketsCompleted.push(bucket);
        } catch (err) {
          logger.error(`Bucket scrape failed: ${bucket} - ${err}`);
          scrapingLog.bucketsFailed.push(bucket);
        }
      }

      // Update scraping log
      scrapingLog.status = scrapingLog.bucketsFailed.length === 0 ? 'completed' : 'partial';
      scrapingLog.completedAt = new Date();
      scrapingLog.durationMs = scrapingLog.completedAt.getTime() - scrapingLog.startedAt.getTime();

      await scrapingLog.save();

      logger.info(`Scraping completed: ${sessionId}`);

      return {
        success: true,
        sessionId,
        stats: {
          totalApiCalls: scrapingLog.totalApiCalls,
          totalJobsFound: scrapingLog.totalJobsFound,
          newJobsAdded: scrapingLog.newJobsAdded,
          jobsUpdated: scrapingLog.jobsUpdated,
          durationMs: scrapingLog.durationMs,
        },
      };
    } catch (err) {
      scrapingLog.status = 'failed';
      scrapingLog.errorMessage = String(err);
      scrapingLog.completedAt = new Date();
      scrapingLog.durationMs = scrapingLog.completedAt.getTime() - scrapingLog.startedAt.getTime();
      await scrapingLog.save();

      logger.error(`Scraping failed: ${sessionId} - ${err}`);

      throw err;
    }
  }

  /**
   * Scrape a single bucket
   */
  private async scrapeBucket(bucket: string, scrapingLog: IScrapingLog) {
    const keywords = (BUCKET_KEYWORDS as any)[bucket] || [];

    if (keywords.length === 0) {
      throw new Error(`No keywords defined for bucket: ${bucket}`);
    }

    const bucketStartTime = new Date();

    for (const keyword of keywords) {
      try {
        // Check API limit
        const canContinue = await apiUsageService.canMakeCall();
        if (!canContinue.allowed) {
          throw new Error(canContinue.reason);
        }

        logger.info(`Scraping: ${bucket} - ${keyword}`);

        // Call OpenWeb Ninja API
        const rawJobs = await openWebNinjaClient.searchJobs({
          q: keyword,
          country: 'in', // India-only
          num_results: 100,
        });

        scrapingLog.totalApiCalls++;

        // Record API usage
        await apiUsageService.recordCall(
          bucket,
          keyword,
          rawJobs.length,
          'success',
          scrapingLog.triggeredByUserId
        );

        scrapingLog.totalJobsFound += rawJobs.length;

        // Normalize jobs
        const normalizedJobs = jobNormalizationService.normalizeBatch(rawJobs, bucket);

        // Deduplicate and save
        const deduplicationResult = await deduplicationService.processBatch(
          normalizedJobs,
          scrapingLog.sessionId
        );

        scrapingLog.newJobsAdded += deduplicationResult.inserted;
        scrapingLog.jobsUpdated += deduplicationResult.updated;

        // Add to bucket details
        scrapingLog.bucketDetails.push({
          bucket,
          keyword,
          apiCallsMade: 1,
          jobsFound: rawJobs.length,
          newJobsAdded: deduplicationResult.inserted,
          jobsUpdated: deduplicationResult.updated,
          startTime: new Date(bucketStartTime.getTime()),
          endTime: new Date(),
          status: 'success',
        });

        logger.info(
          `Bucket result: ${bucket} - ${keyword}: ` +
          `${normalizedJobs.length} jobs, ` +
          `${deduplicationResult.inserted} new, ` +
          `${deduplicationResult.updated} updated`
        );
      } catch (err) {
        logger.error(`Keyword scrape failed: ${bucket}/${keyword} - ${err}`);

        await apiUsageService.recordCall(
          bucket,
          keyword,
          0,
          'failed',
          scrapingLog.triggeredByUserId,
          String(err)
        );

        scrapingLog.bucketDetails.push({
          bucket,
          keyword,
          apiCallsMade: 1,
          jobsFound: 0,
          newJobsAdded: 0,
          jobsUpdated: 0,
          startTime: new Date(bucketStartTime.getTime()),
          endTime: new Date(),
          status: 'failed',
        });
      }
    }
  }

  /**
   * Get scraping log by session ID
   */
  async getScrapingLog(sessionId: string) {
    return ScrapingLog.findOne({ sessionId });
  }

  /**
   * Get all scraping logs with pagination
   */
  async getScrapingLogs(limit: number = 20, offset: number = 0) {
    const logs = await ScrapingLog.find()
      .sort({ startedAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await ScrapingLog.countDocuments();

    return { logs, total, limit, offset };
  }
}

export const scrapingService = new ScrapingService();
```

**Checklist:**
- [ ] Create scraping service
- [ ] Implement bucket scraping orchestration
- [ ] Implement API limit checking before each bucket
- [ ] Implement error handling & partial completion
- [ ] Implement detailed logging to ScrapingLog
- [ ] Implement scraping statistics tracking
- [ ] Test: Scrape one bucket successfully
- [ ] Test: API limit stops scraping
- [ ] Test: Errors logged correctly
- [ ] Test: Scraping log complete and accurate

---

### TASK 3.5: 6-Factor Transparent Matching Algorithm (Day 5-6, 5-6 hours)

**Objective:** Implement the core differentiator - transparent matching scores

**File:** `src/services/matchingEngine.ts`

```typescript
import User from '../models/User';
import { ParsedResume } from '../models/ParsedResume';
import Job from '../models/Job';
import { JobMatch } from '../models/JobMatch';
import { logger } from '../utils/logger';

/**
 * 6-Factor Matching Algorithm
 *
 * Weight Distribution (Total: 100 points):
 * - Skill Match: 40 points (most important)
 * - Role Match: 20 points
 * - Level Match: 15 points
 * - Experience Match: 10 points
 * - Location Match: 10 points
 * - Work Mode Match: 5 points
 */

interface MatchBreakdown {
  skillMatch: number; // 0-40
  roleMatch: number; // 0-20
  levelMatch: number; // 0-15
  experienceMatch: number; // 0-10
  locationMatch: number; // 0-10
  workModeMatch: number; // 0-5
  totalScore: number; // 0-100
  matchType: 'excellent' | 'good' | 'okay' | 'poor';
  reasons: string[];
}

class MatchingEngine {
  /**
   * Calculate skill match (40 points)
   * Compares job requirements with user's skills
   */
  private calculateSkillMatch(userSkills: string[], jobRequirements: string[]): number {
    if (userSkills.length === 0 || jobRequirements.length === 0) {
      return 0;
    }

    const userSkillsLower = userSkills.map(s => s.toLowerCase());
    const jobReqLower = jobRequirements.map(r => r.toLowerCase());

    let matches = 0;
    for (const req of jobReqLower) {
      for (const skill of userSkillsLower) {
        if (req.includes(skill) || skill.includes(req)) {
          matches++;
          break;
        }
      }
    }

    const matchPercentage = matches / jobReqLower.length;
    return Math.round(matchPercentage * 40);
  }

  /**
   * Calculate role match (20 points)
   * Compares job title with user's current & target roles
   */
  private calculateRoleMatch(jobTitle: string, userCurrentRole: string, userTargetRoles: string[]): number {
    const jobTitleLower = jobTitle.toLowerCase();
    let points = 0;

    // Current role match (10 points)
    if (userCurrentRole && jobTitleLower.includes(userCurrentRole.toLowerCase())) {
      points += 10;
    }

    // Target role match (10 points)
    if (userTargetRoles && userTargetRoles.length > 0) {
      for (const targetRole of userTargetRoles) {
        if (jobTitleLower.includes(targetRole.toLowerCase())) {
          points += 10;
          break;
        }
      }
    }

    return Math.min(points, 20); // Cap at 20
  }

  /**
   * Calculate level match (15 points)
   * Compares job level with user's career level
   */
  private calculateLevelMatch(jobLevel: string | undefined, userLevel: string | undefined): number {
    if (!jobLevel || !userLevel) {
      return 0;
    }

    const levelHierarchy = { fresher: 0, junior: 1, mid: 2, senior: 3, lead: 4 };
    const jobLevelNum = (levelHierarchy as any)[jobLevel] ?? -1;
    const userLevelNum = (levelHierarchy as any)[userLevel] ?? -1;

    if (jobLevelNum === -1 || userLevelNum === -1) {
      return 0;
    }

    // Perfect match
    if (jobLevelNum === userLevelNum) {
      return 15;
    }

    // One level difference (acceptable)
    if (Math.abs(jobLevelNum - userLevelNum) === 1) {
      return 10;
    }

    // User is overqualified
    if (userLevelNum > jobLevelNum) {
      return 8;
    }

    // User is under-qualified
    return 5;
  }

  /**
   * Calculate experience match (10 points)
   * Compares job experience requirement with user's years of experience
   */
  private calculateExperienceMatch(jobExpRequired: number | undefined, userYearsExp: number | undefined): number {
    if (jobExpRequired === undefined || userYearsExp === undefined) {
      return 0;
    }

    // User meets exact requirement
    if (userYearsExp >= jobExpRequired) {
      return 10;
    }

    // User is short by less than 2 years
    if (userYearsExp >= jobExpRequired - 2) {
      return 7;
    }

    // User is short by 2-5 years
    if (userYearsExp >= jobExpRequired - 5) {
      return 4;
    }

    // User is significantly under-experienced
    return 0;
  }

  /**
   * Calculate location match (10 points)
   * Considers job location and user preferences
   */
  private calculateLocationMatch(
    jobLocation: string | undefined,
    userTargetLocations: string[],
    userOpenToRelocation: boolean,
    jobWorkMode: string | undefined
  ): number {
    // Remote jobs = full match
    if (jobWorkMode === 'remote') {
      return 10;
    }

    if (!jobLocation || userTargetLocations.length === 0) {
      return 5; // Default partial match
    }

    // Check if job is in user's target location
    for (const location of userTargetLocations) {
      if (jobLocation.toLowerCase().includes(location.toLowerCase())) {
        return 10; // Perfect match
      }
    }

    // User open to relocation
    if (userOpenToRelocation) {
      return 8;
    }

    return 2; // Different location, not open to relocation
  }

  /**
   * Calculate work mode match (5 points)
   * Matches job work mode with user preference
   */
  private calculateWorkModeMatch(jobWorkMode: string | undefined, userPreferredWorkMode: string | undefined): number {
    if (!jobWorkMode || !userPreferredWorkMode) {
      return 3; // Partial default
    }

    // Exact match
    if (jobWorkMode.toLowerCase() === userPreferredWorkMode.toLowerCase()) {
      return 5;
    }

    // Hybrid matches with any preference
    if (jobWorkMode === 'hybrid' || userPreferredWorkMode === 'hybrid') {
      return 3;
    }

    return 0; // No match
  }

  /**
   * Generate match reasons for transparency
   */
  private generateReasons(
    breakdown: Omit<MatchBreakdown, 'totalScore' | 'matchType' | 'reasons'>,
    user: any,
    job: any
  ): string[] {
    const reasons: string[] = [];

    if (breakdown.skillMatch >= 30) {
      reasons.push(`Strong skill match (${breakdown.skillMatch}/40 points)`);
    }

    if (breakdown.roleMatch === 20) {
      reasons.push(`Perfect role match with targets`);
    }

    if (breakdown.levelMatch === 15) {
      reasons.push(`Exact career level match`);
    }

    if (breakdown.experienceMatch === 10) {
      reasons.push(`Meets experience requirements`);
    }

    if (breakdown.locationMatch === 10) {
      reasons.push(`Located in target location`);
    }

    if (breakdown.workModeMatch === 5) {
      reasons.push(`Preferred work mode`);
    }

    if (breakdown.skillMatch < 15) {
      reasons.push(`Limited skill overlap`);
    }

    if (user.yearsOfExperience < job.experienceRequired) {
      reasons.push(`Under-experienced (${user.yearsOfExperience} vs ${job.experienceRequired} required)`);
    }

    return reasons;
  }

  /**
   * Main matching calculation
   */
  async calculateMatch(userId: string, jobId: string): Promise<MatchBreakdown> {
    const user = await User.findById(userId);
    const job = await Job.findById(jobId);
    const resume = await ParsedResume.findOne({ userId });

    if (!user) throw new Error('User not found');
    if (!job) throw new Error('Job not found');

    const userSkills = resume?.skills || [];

    const breakdown = {
      skillMatch: this.calculateSkillMatch(userSkills, job.requirements || []),
      roleMatch: this.calculateRoleMatch(job.title, user.currentRole || '', user.targetRoles || []),
      levelMatch: this.calculateLevelMatch(job.careerLevel, user.careerLevel),
      experienceMatch: this.calculateExperienceMatch(job.experienceRequired, user.yearsOfExperience),
      locationMatch: this.calculateLocationMatch(
        job.location,
        user.targetLocations || [],
        user.openToRelocation || false,
        job.workMode
      ),
      workModeMatch: this.calculateWorkModeMatch(job.workMode, user.preferredWorkMode),
    };

    const totalScore =
      breakdown.skillMatch +
      breakdown.roleMatch +
      breakdown.levelMatch +
      breakdown.experienceMatch +
      breakdown.locationMatch +
      breakdown.workModeMatch;

    // Determine match type
    let matchType: 'excellent' | 'good' | 'okay' | 'poor';
    if (totalScore >= 80) matchType = 'excellent';
    else if (totalScore >= 60) matchType = 'good';
    else if (totalScore >= 40) matchType = 'okay';
    else matchType = 'poor';

    const reasons = this.generateReasons(breakdown, user, job);

    return {
      ...breakdown,
      totalScore,
      matchType,
      reasons,
    };
  }

  /**
   * Batch match a user against multiple jobs
   */
  async batchMatchJobs(userId: string, jobIds: string[]): Promise<JobMatch[]> {
    const matches: JobMatch[] = [];

    for (const jobId of jobIds) {
      try {
        const breakdown = await this.calculateMatch(userId, jobId);

        const match = new JobMatch({
          userId,
          jobId,
          ...breakdown,
        });

        await match.save();
        matches.push(match);

        logger.debug(`Match calculated: ${userId} - ${jobId} (${breakdown.totalScore}/100)`);
      } catch (err) {
        logger.error(`Failed to match ${jobId}: ${err}`);
      }
    }

    return matches;
  }

  /**
   * Recompute matches for all users (periodic job)
   */
  async recomputeAllMatches(): Promise<{ processed: number; errors: number }> {
    const users = await User.find({ isActive: true });
    const jobs = await Job.find({ isActive: true });

    let processed = 0;
    let errors = 0;

    for (const user of users) {
      for (const job of jobs) {
        try {
          const existing = await JobMatch.findOne({ userId: user._id, jobId: job._id });

          if (!existing) {
            const breakdown = await this.calculateMatch(user._id.toString(), job._id.toString());

            const match = new JobMatch({
              userId: user._id,
              jobId: job._id,
              externalJobId: job.externalJobId,
              ...breakdown,
            });

            await match.save();
            processed++;
          }
        } catch (err) {
          logger.error(`Error matching ${user._id} with ${job._id}: ${err}`);
          errors++;
        }
      }
    }

    logger.info(`Batch matching complete: ${processed} new matches, ${errors} errors`);

    return { processed, errors };
  }
}

export const matchingEngine = new MatchingEngine();
```

**Checklist:**
- [ ] Create matching engine service
- [ ] Implement all 6 factor calculations (40+20+15+10+10+5)
- [ ] Implement match type classification
- [ ] Implement reason generation for transparency
- [ ] Test: Skill match calculation with sample data
- [ ] Test: Role match with target roles
- [ ] Test: Level match hierarchy
- [ ] Test: Experience match logic
- [ ] Test: Location match with relocation preference
- [ ] Test: Batch matching processes multiple jobs
- [ ] Test: Total score = 0-100 range

---

### TASK 3.6: Job Lifecycle Management (Day 7, 2-3 hours)

**Objective:** Implement expiry & cleanup logic

**File:** `src/services/jobLifecycleService.ts`

```typescript
import Job from '../models/Job';
import { ScrapingLog } from '../models/ScrapingLog';
import { JobMatch } from '../models/JobMatch';
import { logger } from '../utils/logger';

class JobLifecycleService {
  /**
   * Mark jobs as inactive when expired (30 days old)
   */
  async markExpiredJobs() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Job.updateMany(
      {
        fetchedAt: { $lt: thirtyDaysAgo },
        isActive: true,
      },
      {
        $set: { isActive: false, expiryDate: thirtyDaysAgo },
      }
    );

    logger.info(`Marked ${result.modifiedCount} jobs as expired`);

    return result.modifiedCount;
  }

  /**
   * Delete jobs that are 60+ days old
   */
  async deleteOldJobs() {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const jobsToDelete = await Job.find({
      fetchedAt: { $lt: sixtyDaysAgo },
    });

    const jobIds = jobsToDelete.map(j => j._id);

    // Delete associated matches
    await JobMatch.deleteMany({ jobId: { $in: jobIds } });

    // Delete jobs
    const result = await Job.deleteMany({
      fetchedAt: { $lt: sixtyDaysAgo },
    });

    logger.info(`Deleted ${result.deletedCount} old jobs`);

    return result.deletedCount;
  }

  /**
   * Archive old scraping logs (90+ days)
   */
  async archiveOldLogs() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await ScrapingLog.deleteMany({
      startedAt: { $lt: ninetyDaysAgo },
    });

    logger.info(`Archived ${result.deletedCount} old scraping logs`);

    return result.deletedCount;
  }

  /**
   * Run full cleanup (call daily via cron)
   */
  async runFullCleanup() {
    const startTime = Date.now();

    const expiredCount = await this.markExpiredJobs();
    const deletedCount = await this.deleteOldJobs();
    const archivedCount = await this.archiveOldLogs();

    const duration = Date.now() - startTime;

    logger.info(
      `Full cleanup completed: ` +
      `${expiredCount} expired, ` +
      `${deletedCount} deleted, ` +
      `${archivedCount} archived ` +
      `(${duration}ms)`
    );

    return { expiredCount, deletedCount, archivedCount, duration };
  }

  /**
   * Get job lifecycle stats
   */
  async getStats() {
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const expiredJobs = await Job.countDocuments({ isActive: false });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toExpire = await Job.countDocuments({
      fetchedAt: { $lt: thirtyDaysAgo },
      isActive: true,
    });

    return {
      totalJobs,
      activeJobs,
      expiredJobs,
      toExpireCount: toExpire,
      expiryPercentage: Math.round((toExpire / totalJobs) * 100),
    };
  }
}

export const jobLifecycleService = new JobLifecycleService();
```

**Checklist:**
- [ ] Create job lifecycle service
- [ ] Implement marking expired (30 days)
- [ ] Implement deletion of old jobs (60+ days)
- [ ] Implement log archival (90+ days)
- [ ] Test: Mark expired jobs correctly
- [ ] Test: Delete old jobs & associated matches
- [ ] Test: Full cleanup runs without errors

---

## 📝 INTEGRATION SUMMARY

**Core Business Logic Flow:**

```
1. Admin triggers scrape
   ↓
2. Scraping Service orchestrates buckets
   ↓
3. For each bucket:
   - OpenWeb Ninja API call (with rate limiting)
   - Normalization Service extracts 30+ fields
   - Deduplication Service checks externalJobId
   - API Usage Service records call & checks limits
   ↓
4. Matching Engine:
   - On demand: Compute 6-factor match for user
   - Batch: Compute matches for all users
   ↓
5. Job Lifecycle:
   - Mark expired after 30 days
   - Delete after 60 days
   - Archive logs after 90 days
```

---

## ✅ ACCEPTANCE CRITERIA

By end of Phase 3:

```bash
✅ Scrape all 11 buckets successfully
✅ Normalize 100+ jobs with correct field extraction
✅ Deduplicate by externalJobId
✅ API calls limited to 200/month with hard stop
✅ 6-factor matching produces 0-100 scores
✅ Matching is transparent (shows breakdown & reasons)
✅ Batch matching processes 1000+ jobs efficiently
✅ Jobs expire after 30 days
✅ Jobs deleted after 60 days
✅ All operations logged comprehensively
✅ Performance: Full scrape < 2 hours
✅ No duplicate jobs in database
✅ All scraped data normalized consistently
```

---

## 🚀 NEXT STEPS

Once Phase 3 is complete:
→ Move to **Phase 4: Resume Parsing & Advanced Matching**
→ Then **Phase 5: Notifications (WhatsApp, Telegram)**
→ Then **Phase 6-10: Testing, Deployment, Monitoring**

---

**Document Version:** 1.0  
**Created:** January 18, 2026  
**Estimated Completion:** 2-3 weeks  
**Core Differentiator:** Transparent 6-factor matching algorithm
