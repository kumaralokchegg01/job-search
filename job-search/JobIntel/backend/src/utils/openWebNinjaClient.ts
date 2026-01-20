import HTTPClient from '../utils/httpClient';
import RateLimiter from '../utils/rateLimiter';
import Debug from 'debug';

const log = Debug('jobintel:openwebninja-client');

export interface JSearchQuery {
  query: string;
  location?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface Job {
  id: string;
  externalJobId?: string;
  title: string;
  companyName: string;
  location: string;
  jobDescription: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  postedDate?: string;
  jobType?: string;
  careerLevel?: string;
  domain?: string;
  techStack?: string[];
  workMode?: string;
  applyUrl?: string;
  sourceUrl?: string;
}

export interface JSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * OpenWeb Ninja JSearch API Client
 * Handles job scraping with rate limiting and retry logic
 */
export class OpenWebNinjaClient {
  private httpClient: HTTPClient;
  private rateLimiter: RateLimiter;
  private apiKey: string;
  private apiHost: string = 'api.openwebninja.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    this.httpClient = new HTTPClient(`https://${this.apiHost}`, {
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2,
    });

    this.rateLimiter = new RateLimiter({
      requestsPerSecond: 1, // 1 request per second
      requestsPerMonth: parseInt(process.env.API_RATE_LIMIT_REQUESTS || '200', 10),
    });

    // Set API key
    this.httpClient.setApiKey(this.apiKey, 'Authorization');

    log('✓ OpenWeb Ninja client initialized');
  }

  /**
   * Search jobs with JSearch API
   */
  async searchJobs(query: JSearchQuery): Promise<JSearchResponse> {
    // Ensure country is set to India
    if (!query.country) {
      query.country = 'in';
    }

    return this.rateLimiter.execute(async () => {
      try {
        log(`Searching jobs: ${query.query} in ${query.location || 'all locations'}`);

        const params = new URLSearchParams({
          apikey: this.apiKey,
          query: query.query,
          ...(query.location && { location: query.location }),
          country: query.country || 'in',
          page: String(query.page || 1),
          pageSize: String(query.pageSize || 50),
        });

        const data = await this.httpClient.get<JSearchResponse>(
          `/api/v1/jobs/search?${params.toString()}`
        );

        log(`✓ Found ${data.jobs.length} jobs for query: ${query.query}`);

        return {
          ...data,
          jobs: this.normalizeJobs(data.jobs),
        };
      } catch (err: any) {
        log(`✗ Search failed: ${err.message}`);
        throw err;
      }
    });
  }

  /**
   * Get job details
   */
  async getJobDetails(jobId: string): Promise<Job> {
    return this.rateLimiter.execute(async () => {
      try {
        const params = new URLSearchParams({
          apikey: this.apiKey,
          jobId,
        });

        const data = await this.httpClient.get<Job>(
          `/api/v1/jobs/detail?${params.toString()}`
        );

        return this.normalizeJob(data);
      } catch (err: any) {
        log(`✗ Failed to get job details: ${err.message}`);
        throw err;
      }
    });
  }

  /**
   * Get salary information
   */
  async getSalaryInfo(
    jobTitle: string,
    location: string,
    country: string = 'in'
  ): Promise<{
    avgSalary?: number;
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
  }> {
    return this.rateLimiter.execute(async () => {
      try {
        const params = new URLSearchParams({
          apikey: this.apiKey,
          jobTitle,
          location,
          country,
        });

        const data = await this.httpClient.get<any>(
          `/api/v1/salary?${params.toString()}`
        );

        return {
          avgSalary: data.avgSalary,
          minSalary: data.minSalary,
          maxSalary: data.maxSalary,
          currency: data.currency || 'INR',
        };
      } catch (err: any) {
        log(`✗ Failed to get salary info: ${err.message}`);
        return {};
      }
    });
  }

  /**
   * Get company salary information
   */
  async getCompanySalary(companyName: string, country: string = 'in'): Promise<any> {
    return this.rateLimiter.execute(async () => {
      try {
        const params = new URLSearchParams({
          apikey: this.apiKey,
          companyName,
          country,
        });

        const data = await this.httpClient.get<any>(
          `/api/v1/company/salary?${params.toString()}`
        );

        return data;
      } catch (err: any) {
        log(`✗ Failed to get company salary: ${err.message}`);
        return {};
      }
    });
  }

  /**
   * Get API usage statistics
   */
  getApiUsage() {
    return this.rateLimiter.getUsage();
  }

  /**
   * Check if at rate limit
   */
  isAtRateLimit(): boolean {
    return this.rateLimiter.isAtLimit();
  }

  /**
   * Get remaining API calls
   */
  getRemainingCalls(): number {
    return this.rateLimiter.getRemainingCalls();
  }

  /**
   * Normalize job data from API response
   */
  private normalizeJob(job: any): Job {
    return {
      id: job.id || job.jobId,
      externalJobId: job.id || job.jobId,
      title: job.title || job.jobTitle,
      companyName: job.companyName || job.company,
      location: job.location || job.jobLocation,
      jobDescription: job.description || job.jobDescription,
      salary: job.salary ? {
        min: job.salary.min,
        max: job.salary.max,
        currency: job.salary.currency || 'INR',
      } : undefined,
      postedDate: job.postedDate || job.datePosted,
      jobType: job.jobType || job.employmentType,
      careerLevel: job.careerLevel || job.jobLevel,
      domain: job.domain || this.detectDomain(job.title),
      techStack: job.techStack || this.extractTechStack(job.description),
      workMode: job.workMode || this.detectWorkMode(job.description),
      applyUrl: job.applyUrl || job.applicationUrl,
      sourceUrl: job.sourceUrl || job.jobUrl,
    };
  }

  /**
   * Normalize multiple jobs
   */
  private normalizeJobs(jobs: any[]): Job[] {
    return jobs.map((job) => this.normalizeJob(job));
  }

  /**
   * Detect job domain from title
   */
  private detectDomain(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('mobile') || lowerTitle.includes('ios') || lowerTitle.includes('android')) {
      return 'mobile';
    }
    if (lowerTitle.includes('data') || lowerTitle.includes('ml') || lowerTitle.includes('ai')) {
      return 'data';
    }
    if (lowerTitle.includes('devops') || lowerTitle.includes('cloud') || lowerTitle.includes('infra')) {
      return 'cloud';
    }
    if (lowerTitle.includes('qa') || lowerTitle.includes('test')) {
      return 'qa';
    }
    if (lowerTitle.includes('design') || lowerTitle.includes('ux') || lowerTitle.includes('ui')) {
      return 'design';
    }
    return 'web';
  }

  /**
   * Extract tech stack from description
   */
  private extractTechStack(description: string): string[] {
    const technologies = [
      'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin', 'swift',
      'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js',
      'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'laravel', 'rails',
      'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
      'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'jenkins',
      'git', 'github', 'gitlab', 'bitbucket',
    ];

    const found = new Set<string>();
    const lowerDesc = description.toLowerCase();

    for (const tech of technologies) {
      if (lowerDesc.includes(tech)) {
        found.add(tech);
      }
    }

    return Array.from(found);
  }

  /**
   * Detect work mode from description
   */
  private detectWorkMode(description: string): string {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('remote') || lowerDesc.includes('wfh') || lowerDesc.includes('work from home')) {
      return 'remote';
    }
    if (lowerDesc.includes('hybrid')) {
      return 'hybrid';
    }
    if (lowerDesc.includes('onsite') || lowerDesc.includes('office')) {
      return 'onsite';
    }

    return 'onsite'; // default
  }
}

export default OpenWebNinjaClient;
