import { logger } from '../../utils/logger';
import { scrapingQueue, ScrapingJobData } from '../../config/queues';
import { OpenWebNinjaClient } from '../../utils/openWebNinjaClient';
import { jobNormalizationService, RawJobData, NormalizedJob } from './jobNormalizationService';
import { deduplicationService } from './deduplicationService';
import { apiUsageService } from './apiUsageService';
import { v4 as uuidv4 } from 'uuid';
import ScrapingLog from '../../models/ScrapingLog';

interface ScrapeBucket {
  name: string;
  query: string;
  description: string;
}

const BUCKETS: ScrapeBucket[] = [
  { name: 'fresher', query: 'fresher jobs India', description: 'Entry-level positions' },
  { name: 'batch', query: 'batch jobs India placement', description: 'Campus placement opportunities' },
  { name: 'software', query: 'software engineer India', description: 'General software positions' },
  { name: 'data', query: 'data scientist engineer India', description: 'Data and analytics roles' },
  { name: 'cloud', query: 'cloud devops engineer India', description: 'Cloud infrastructure roles' },
  { name: 'mobile', query: 'mobile app developer India', description: 'Mobile app development' },
  { name: 'qa', query: 'qa automation tester India', description: 'Quality assurance roles' },
  { name: 'experience', query: 'senior engineer India 5 years', description: 'Experienced positions' },
  { name: 'remote', query: 'remote work from home India', description: 'Remote work opportunities' },
  { name: 'frontend', query: 'frontend react developer India', description: 'Frontend development' },
  { name: 'backend', query: 'backend nodejs python engineer India', description: 'Backend development' },
];

interface ScrapingStats {
  sessionId: string;
  bucket: string;
  totalJobs: number;
  jobsNormalized: number;
  jobsInserted: number;
  jobsUpdated: number;
  jobsDuplicate: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  durationMs?: number;
  apiCallsMade: number;
  rateLimitingActive: boolean;
}

class ScrapingService {
  /**
   * Scrape a single bucket of jobs
   */
  async scrapeBucket(bucket: ScrapeBucket, sessionId: string): Promise<ScrapingStats> {
    const startTime = new Date();
    const stats: ScrapingStats = {
      sessionId,
      bucket: bucket.name,
      totalJobs: 0,
      jobsNormalized: 0,
      jobsInserted: 0,
      jobsUpdated: 0,
      jobsDuplicate: 0,
      errors: 0,
      startTime,
      apiCallsMade: 0,
      rateLimitingActive: true,
    };

    logger.info(`Starting scrape for bucket: ${bucket.name}`, { sessionId, query: bucket.query });

    try {
      // Check API usage before proceeding
      const usage = apiUsageService.canMakeCall();
      if (!usage.allowed) {
        logger.warn(`API limit reached, skipping bucket: ${bucket.name}`, { sessionId });
        return { ...stats, errors: 1 };
      }

      // Make API call with rate limiting
      const client = new OpenWebNinjaClient(process.env.OPENWEBNINJA_API_KEY || '');
      const response = await client.searchJobs({
        query: bucket.query,
        country: 'in', // India only
        pageSize: 100,
      });

      const rawJobs = ((response as any)?.jobs || []) as any[];
      stats.totalJobs = rawJobs.length;
      stats.apiCallsMade = 1;
      apiUsageService.recordCall('openwebninja');

      logger.info(`Retrieved ${stats.totalJobs} raw jobs for bucket: ${bucket.name}`, { sessionId });

      // Normalize jobs
      const normalizedJobs = jobNormalizationService.normalizeBatch(rawJobs, bucket.name);
      stats.jobsNormalized = normalizedJobs.length;

      logger.info(`Normalized ${normalizedJobs.length} jobs for bucket: ${bucket.name}`, { sessionId });

      // Process through deduplication and insertion
      for (const job of normalizedJobs) {
        try {
          const result = await deduplicationService.processJob(job);

          if (result.action === 'inserted') {
            stats.jobsInserted++;
          } else if (result.action === 'updated') {
            stats.jobsUpdated++;
          }
        } catch (error) {
          stats.errors++;
          logger.error(`Error processing job: ${error}`, { jobId: job.externalJobId, sessionId });
        }
      }

      stats.jobsDuplicate = stats.jobsNormalized - stats.jobsInserted - stats.jobsUpdated;
      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - startTime.getTime();

      logger.info(`Bucket scraping complete: ${bucket.name}`, {
        sessionId,
        ...stats,
      });

      return stats;
    } catch (error) {
      stats.errors++;
      stats.endTime = new Date();
      stats.durationMs = stats.endTime.getTime() - startTime.getTime();

      logger.error(`Error scraping bucket ${bucket.name}: ${error}`, { sessionId });
      return stats;
    }
  }

  /**
   * Scrape all buckets sequentially
   */
  async scrapeAllBuckets(buckets: ScrapeBucket[] = BUCKETS): Promise<{
    sessionId: string;
    bucketStats: ScrapingStats[];
    totalStats: {
      totalTime: number;
      totalJobs: number;
      totalInserted: number;
      totalUpdated: number;
      totalErrors: number;
    };
  }> {
    const sessionId = uuidv4();
    const allStats: ScrapingStats[] = [];

    logger.info(`Starting full scrape session: ${sessionId}. Buckets: ${buckets.length}`);

    const sessionStartTime = new Date();

    // Create scraping log
    const scrapingLog = new ScrapingLog({
      sessionId,
      status: 'in_progress',
      bucketsToProcess: buckets.map((b) => b.name),
      startedAt: sessionStartTime,
    });

    try {
      for (const bucket of buckets) {
        // Check API usage before each bucket
        const usage = apiUsageService.canMakeCall();
        if (!usage.allowed) {
          logger.warn(`API limit reached. Stopping scrape after ${allStats.length} buckets`);
          break;
        }

        const bucketStats = await this.scrapeBucket(bucket, sessionId);
        allStats.push(bucketStats);

        // Small delay between buckets (rate limiting)
        await new Promise((resolve) => setTimeout(resolve, 1100)); // 1.1 seconds
      }

      const sessionEndTime = new Date();
      const totalTime = sessionEndTime.getTime() - sessionStartTime.getTime();

      const totalStats = {
        totalTime,
        totalJobs: allStats.reduce((sum, s) => sum + s.totalJobs, 0),
        totalInserted: allStats.reduce((sum, s) => sum + s.jobsInserted, 0),
        totalUpdated: allStats.reduce((sum, s) => sum + s.jobsUpdated, 0),
        totalErrors: allStats.reduce((sum, s) => sum + s.errors, 0),
      };

      // Update scraping log
      await ScrapingLog.findOneAndUpdate(
        { sessionId },
        {
          status: 'completed',
          completedAt: sessionEndTime,
          bucketStats: allStats,
          totalStats,
        }
      );

      logger.info(`Full scrape session complete: ${sessionId}`, {
        ...totalStats,
        durationSeconds: Math.round(totalTime / 1000),
      });

      return {
        sessionId,
        bucketStats: allStats,
        totalStats,
      };
    } catch (error) {
      await ScrapingLog.findOneAndUpdate(
        { sessionId },
        {
          status: 'failed',
          failureReason: String(error),
          completedAt: new Date(),
        }
      );

      logger.error(`Full scrape session failed: ${error}`, { sessionId });
      throw error;
    }
  }

  /**
   * Enqueue scraping job
   */
  async enqueueScrape(buckets?: string[], triggeredByUserId?: string): Promise<string> {
    const jobData: ScrapingJobData = {
      buckets: buckets || BUCKETS.map((b) => b.name),
      triggeredByUserId,
    };

    const job = await scrapingQueue.add('full-scrape', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info(`Scraping job enqueued: ${job.id}`, { jobData });
    return job.id?.toString() || 'unknown';
  }

  /**
   * Get scraping history
   */
  async getScrapingHistory(limit: number = 10) {
    try {
      const history = await ScrapingLog.find().sort({ startedAt: -1 }).limit(limit);
      return history;
    } catch (error) {
      logger.error(`Error fetching scraping history: ${error}`);
      throw error;
    }
  }
}

export const scrapingService = new ScrapingService();

export async function initScrapingService(): Promise<void> {
  logger.info(`Scraping Service initialized with ${BUCKETS.length} buckets`);
}
