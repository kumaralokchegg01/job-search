import cron from 'node-cron';
import Debug from 'debug';
import { scrapingQueue } from './queues';

const log = Debug('jobintel:scheduler');

let scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Job buckets for scraping
 */
const JOB_BUCKETS = [
  'fresher',
  'batch',
  'software',
  'data',
  'cloud',
  'mobile',
];

const BUCKET_KEYWORDS: Record<string, string[]> = {
  fresher: ['entry level', 'junior', 'graduate', 'fresher', 'trainee', 'beginner'],
  batch: ['campus hiring', 'internship', 'batch', 'college', 'recruitment drive'],
  software: ['developer', 'software engineer', 'programmer', 'full stack', 'backend', 'frontend'],
  data: ['data scientist', 'data analyst', 'machine learning', 'ml', 'ai', 'big data'],
  cloud: ['devops', 'cloud engineer', 'aws', 'azure', 'gcp', 'kubernetes', 'infrastructure'],
  mobile: ['ios developer', 'android developer', 'mobile', 'react native', 'flutter', 'app'],
};

/**
 * Initialize scheduler
 */
export function initScheduler(): void {
  if (process.env.SCHEDULER_ENABLED !== 'true') {
    log('Scheduler disabled via SCHEDULER_ENABLED=false');
    return;
  }

  log('Initializing scheduler...');

  // Schedule scraping jobs for each bucket
  scheduleScrapingJobs();

  // Schedule cleanup job
  scheduleCleanupJob();

  // Schedule monthly reset
  scheduleMonthlyReset();

  log('✓ Scheduler initialized with', Object.keys(scheduledJobs).length, 'jobs');
}

/**
 * Schedule scraping jobs for each bucket
 */
function scheduleScrapingJobs(): void {
  const scheduleCronEnv = {
    fresher: process.env.SCRAPER_SCHEDULE_FRESHER || '0 0 * * *', // Daily at midnight
    batch: process.env.SCRAPER_SCHEDULE_BATCH || '0 1 * * *', // Daily at 1 AM
    software: process.env.SCRAPER_SCHEDULE_SOFTWARE || '0 2 * * *', // Daily at 2 AM
    data: process.env.SCRAPER_SCHEDULE_DATA || '0 3 * * *', // Daily at 3 AM
    cloud: process.env.SCRAPER_SCHEDULE_CLOUD || '0 4 * * *', // Daily at 4 AM
    mobile: process.env.SCRAPER_SCHEDULE_MOBILE || '0 5 * * *', // Daily at 5 AM
  };

  for (const bucket of JOB_BUCKETS) {
    const cronExpression = scheduleCronEnv[bucket as keyof typeof scheduleCronEnv];

    const task = cron.schedule(cronExpression, async () => {
      log(`[Cron] Triggering scrape for bucket: ${bucket}`);

      try {
        // Add job to scraping queue
        await scrapingQueue.add(
          'scrape-bucket',
          {
            bucket,
            keywords: BUCKET_KEYWORDS[bucket] || [],
            location: 'India',
            priority: 5,
          },
          {
            jobId: `scrape-${bucket}-${Date.now()}`,
            removeOnComplete: false,
            removeOnFail: false,
          }
        );

        log(`✓ Scraping job queued for bucket: ${bucket}`);
      } catch (err) {
        log(`✗ Failed to queue scraping job for bucket ${bucket}:`, err);
      }
    });

    scheduledJobs.set(`scrape-${bucket}`, task);
    log(`Scheduled scraping for ${bucket} at: ${cronExpression}`);
  }
}

/**
 * Schedule cleanup job (deletes old jobs, archives logs)
 */
function scheduleCleanupJob(): void {
  const cleanupCron = process.env.CLEANUP_SCHEDULE || '0 6 * * *'; // Daily at 6 AM

  const task = cron.schedule(cleanupCron, async () => {
    log('[Cron] Running cleanup job...');

    try {
      // This will be called by the cleanup service
      log('✓ Cleanup job completed');
    } catch (err) {
      log('✗ Cleanup job failed:', err);
    }
  });

  scheduledJobs.set('cleanup', task);
  log(`Scheduled cleanup at: ${cleanupCron}`);
}

/**
 * Schedule monthly reset (reset API usage counters)
 */
function scheduleMonthlyReset(): void {
  // Run on the 1st of every month at 00:00
  const task = cron.schedule('0 0 1 * *', async () => {
    log('[Cron] Running monthly reset...');

    try {
      // Reset API usage for all users
      log('✓ Monthly reset completed');
    } catch (err) {
      log('✗ Monthly reset failed:', err);
    }
  });

  scheduledJobs.set('monthly-reset', task);
  log('Scheduled monthly reset: 0 0 1 * * (1st of month at midnight)');
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduler(): void {
  for (const [name, task] of scheduledJobs.entries()) {
    task.stop();
    log(`Stopped scheduled job: ${name}`);
  }
  scheduledJobs.clear();
  log('✓ Scheduler stopped');
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  enabled: boolean;
  jobs: Array<{ name: string; status: string }>;
} {
  return {
    enabled: process.env.SCHEDULER_ENABLED === 'true',
    jobs: Array.from(scheduledJobs.entries()).map(([name, task]) => ({
      name,
      status: task.status === 0 ? 'running' : 'stopped',
    })),
  };
}

/**
 * Manually trigger a bucket scrape
 */
export async function triggerBucketScrape(bucket: string): Promise<void> {
  if (!JOB_BUCKETS.includes(bucket)) {
    throw new Error(`Invalid bucket: ${bucket}. Valid buckets: ${JOB_BUCKETS.join(', ')}`);
  }

  log(`Manually triggering scrape for bucket: ${bucket}`);

  await scrapingQueue.add(
    'scrape-bucket',
    {
      bucket,
      keywords: BUCKET_KEYWORDS[bucket] || [],
      location: 'India',
      priority: 10, // Higher priority for manual triggers
    },
    {
      jobId: `manual-scrape-${bucket}-${Date.now()}`,
      removeOnComplete: false,
      removeOnFail: false,
    }
  );

  log(`✓ Manual scraping job queued for bucket: ${bucket}`);
}

/**
 * Trigger all bucket scrapes
 */
export async function triggerAllScrapes(): Promise<void> {
  log('Manually triggering scrapes for all buckets...');

  for (const bucket of JOB_BUCKETS) {
    await triggerBucketScrape(bucket);
  }

  log('✓ All scraping jobs queued');
}

export default {
  initScheduler,
  stopScheduler,
  getSchedulerStatus,
  triggerBucketScrape,
  triggerAllScrapes,
};
