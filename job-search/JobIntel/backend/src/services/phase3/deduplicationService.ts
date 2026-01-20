import { logger } from '../../utils/logger';
import { Job } from '../../models/Job';
import { NormalizedJob } from './jobNormalizationService';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingJobId?: string;
  changes?: Record<string, any>;
}

interface DeduplicationStats {
  totalProcessed: number;
  duplicatesFound: number;
  newJobsInserted: number;
  jobsUpdated: number;
  errors: number;
}

class DeduplicationService {
  private stats: DeduplicationStats = {
    totalProcessed: 0,
    duplicatesFound: 0,
    newJobsInserted: 0,
    jobsUpdated: 0,
    errors: 0,
  };

  /**
   * Check if a job already exists by externalJobId
   */
  async checkDuplicate(externalJobId: string): Promise<DuplicateCheckResult> {
    try {
      const existingJob = await Job.findOne({ externalJobId }).lean();

      if (existingJob) {
        return {
          isDuplicate: true,
          existingJobId: existingJob._id?.toString(),
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      logger.error(`Error checking duplicate for externalJobId ${externalJobId}: ${error}`);
      throw error;
    }
  }

  /**
   * Detect changes in an existing job
   */
  async detectChanges(externalJobId: string, newJobData: NormalizedJob): Promise<DuplicateCheckResult> {
    try {
      const existingJob = await Job.findOne({ externalJobId }).lean();

      if (!existingJob) {
        return { isDuplicate: false };
      }

      const changes: Record<string, any> = {};

      // Compare key fields
      if (existingJob.title !== newJobData.title) {
        changes.title = { old: existingJob.title, new: newJobData.title };
      }

      if (existingJob.description !== newJobData.description) {
        changes.description = { old: existingJob.description, new: newJobData.description };
      }

      // Check salary changes
      if (String(existingJob.ctc || '') !== String(newJobData.salary || '')) {
        changes.salary = { old: existingJob.ctc, new: newJobData.salary };
      }

      // Check if job is still active
      if (existingJob.status !== 'active' && newJobData.isActive) {
        changes.status = { old: existingJob.status, new: 'active' };
      }

      return {
        isDuplicate: true,
        existingJobId: existingJob._id?.toString(),
        changes: Object.keys(changes).length > 0 ? changes : undefined,
      };
    } catch (error) {
      logger.error(`Error detecting changes for externalJobId ${externalJobId}: ${error}`);
      throw error;
    }
  }

  /**
   * Process a job for deduplication and insert/update
   */
  async processJob(normalizedJob: NormalizedJob): Promise<{ jobId: string; action: 'inserted' | 'updated' }> {
    this.stats.totalProcessed++;

    try {
      const duplicateCheck = await this.checkDuplicate(normalizedJob.externalJobId);

      if (duplicateCheck.isDuplicate && duplicateCheck.existingJobId) {
        // Update existing job
        const updated = await Job.findByIdAndUpdate(
          duplicateCheck.existingJobId,
          {
            ...normalizedJob,
            updatedAt: new Date(),
          },
          { new: true }
        );

        this.stats.jobsUpdated++;
        this.stats.duplicatesFound++;

        logger.info(`Job updated (duplicate): ${normalizedJob.externalJobId}`, {
          jobId: updated?._id,
        });

        return { jobId: updated?._id?.toString() || duplicateCheck.existingJobId, action: 'updated' };
      }

      // Insert new job
      const newJob = new Job(normalizedJob);
      const saved = await newJob.save();

      this.stats.newJobsInserted++;

      logger.info(`New job inserted: ${normalizedJob.externalJobId}`, {
        jobId: saved._id,
      });

      return { jobId: saved._id?.toString() || '', action: 'inserted' };
    } catch (error) {
      this.stats.errors++;
      logger.error(`Error processing job for deduplication: ${error}`, { normalizedJob });
      throw error;
    }
  }

  /**
   * Batch process jobs
   */
  async processBatch(normalizedJobs: NormalizedJob[]): Promise<DeduplicationStats> {
    logger.info(`Starting batch deduplication processing for ${normalizedJobs.length} jobs`);

    const session = await Job.startSession();
    session.startTransaction();

    try {
      for (const job of normalizedJobs) {
        await this.processJob(job);
      }

      await session.commitTransaction();
      logger.info(`Batch deduplication complete`, this.stats);

      return this.stats;
    } catch (error) {
      await session.abortTransaction();
      logger.error(`Batch deduplication failed: ${error}`);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Get deduplication statistics
   */
  getStats(): DeduplicationStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalProcessed: 0,
      duplicatesFound: 0,
      newJobsInserted: 0,
      jobsUpdated: 0,
      errors: 0,
    };
  }

  /**
   * Check for duplicates across multiple external sources
   */
  async checkMultiSourceDuplicate(jobTitle: string, companyName: string, location?: string): Promise<any[]> {
    try {
      const query: Record<string, any> = {
        normalizedTitle: jobTitle.toLowerCase().trim(),
        normalizedCompany: companyName.toLowerCase().trim(),
      };

      if (location) {
        query.location = location;
      }

      const duplicates = await Job.find(query).lean();
      return duplicates;
    } catch (error) {
      logger.error(`Error checking multi-source duplicates: ${error}`);
      throw error;
    }
  }
}

export const deduplicationService = new DeduplicationService();

export async function initDeduplication(): Promise<void> {
  logger.info('Deduplication service initialized');
}
