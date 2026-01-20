import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { getRedis } from '../config/redis';
import Debug from 'debug';

const log = Debug('jobintel:queues');

const connectionOptions: ConnectionOptions = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

/**
 * Scraping Queue - For job scraping tasks
 */
export interface ScrapingJobData {
  buckets?: string[];
  bucket?: string;
  keywords?: string[];
  location?: string;
  priority?: number;
  triggeredByUserId?: string;
}

export const scrapingQueue = new Queue<ScrapingJobData>('scraping', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

/**
 * Notification Queue - For sending notifications
 */
export interface NotificationJobData {
  userId: string;
  event: string;
  channels: string[];
  data: Record<string, any>;
}

export const notificationQueue = new Queue<NotificationJobData>('notification', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

/**
 * Matching Queue - For job matching tasks
 */
export interface MatchingJobData {
  userId: string;
  resumeId: string;
  jobIds?: string[];
}

export const matchingQueue = new Queue<MatchingJobData>('matching', {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});

/**
 * Initialize all queues
 */
export async function initQueues(): Promise<void> {
  try {
    // Initialize all queues - connection is lazy
    log('✓ All BullMQ queues initialized');

    // Setup event listeners
    setupQueueListeners();
  } catch (err) {
    log('✗ Failed to initialize queues:', err);
    throw err;
  }
}

/**
 * Setup event listeners for queues
 */
function setupQueueListeners(): void {
  // Scraping queue listeners
  (scrapingQueue as any).on('waiting', (job: any) => {
    log(`[Scraping] Job ${job.id} waiting`);
  });

  (scrapingQueue as any).on('active', (job: any) => {
    log(`[Scraping] Job ${job.id} active`);
  });

  (scrapingQueue as any).on('completed', (job: any) => {
    log(`[Scraping] Job ${job.id} completed`);
  });

  (scrapingQueue as any).on('failed', (job: any, err: any) => {
    log(`[Scraping] Job ${job?.id} failed: ${err.message}`);
  });

  // Notification queue listeners
  (notificationQueue as any).on('waiting', (job: any) => {
    log(`[Notification] Job ${job.id} waiting`);
  });

  (notificationQueue as any).on('active', (job: any) => {
    log(`[Notification] Job ${job.id} active`);
  });

  (notificationQueue as any).on('completed', (job: any) => {
    log(`[Notification] Job ${job.id} completed`);
  });

  (notificationQueue as any).on('failed', (job: any, err: any) => {
    log(`[Notification] Job ${job?.id} failed: ${err.message}`);
  });

  // Matching queue listeners
  (matchingQueue as any).on('waiting', (job: any) => {
    log(`[Matching] Job ${job.id} waiting`);
  });

  (matchingQueue as any).on('active', (job: any) => {
    log(`[Matching] Job ${job.id} active`);
  });

  (matchingQueue as any).on('completed', (job: any) => {
    log(`[Matching] Job ${job.id} completed`);
  });

  (matchingQueue as any).on('failed', (job: any, err: any) => {
    log(`[Matching] Job ${job?.id} failed: ${err.message}`);
  });
}

/**
 * Close all queues
 */
export async function closeQueues(): Promise<void> {
  await Promise.all([
    scrapingQueue.close(),
    notificationQueue.close(),
    matchingQueue.close(),
  ]);
  log('✓ All BullMQ queues closed');
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  return {
    scraping: {
      active: await scrapingQueue.getActiveCount(),
      delayed: await scrapingQueue.getDelayedCount(),
      failed: await scrapingQueue.getFailedCount(),
      waiting: await scrapingQueue.getWaitingCount(),
    },
    notification: {
      active: await notificationQueue.getActiveCount(),
      delayed: await notificationQueue.getDelayedCount(),
      failed: await notificationQueue.getFailedCount(),
      waiting: await notificationQueue.getWaitingCount(),
    },
    matching: {
      active: await matchingQueue.getActiveCount(),
      delayed: await matchingQueue.getDelayedCount(),
      failed: await matchingQueue.getFailedCount(),
      waiting: await matchingQueue.getWaitingCount(),
    },
  };
}

export default {
  scrapingQueue,
  notificationQueue,
  matchingQueue,
  initQueues,
  closeQueues,
  getQueueStats,
};
