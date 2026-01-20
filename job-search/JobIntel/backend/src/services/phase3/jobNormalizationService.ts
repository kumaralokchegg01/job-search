import { logger } from '../../utils/logger';

// Technology stack detection
const TECH_STACK_MAP = {
  frontend: ['React', 'Vue', 'Angular', 'Next.js', 'Svelte', 'Ember', 'TypeScript', 'JavaScript'],
  backend: ['Node.js', 'Python', 'Java', 'Go', 'Rust', 'PHP', 'C#', 'Ruby', 'Express', 'Django', 'Spring'],
  database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'Cassandra', 'Firebase', 'Mongoose'],
  cloud: ['AWS', 'Azure', 'GCP', 'Heroku', 'DigitalOcean', 'Linode', 'Lambda'],
  devops: ['Docker', 'Kubernetes', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'Terraform', 'Ansible'],
  mobile: ['React Native', 'Flutter', 'Ionic', 'Swift', 'Kotlin', 'Expo'],
};

const CAREER_LEVEL_KEYWORDS = {
  fresher: ['fresher', 'graduate', 'entry level', 'no experience required', '0 experience'],
  junior: ['junior developer', 'junior engineer', '1 year', '2 year', 'entry level'],
  mid: ['mid level', 'mid-level', 'intermediate', '3 year', '4 year', '5 year'],
  senior: ['senior developer', 'senior engineer', 'lead', '5+ year', '6 year', '7 year', '10+ year'],
  lead: ['technical lead', 'engineering lead', 'architect', 'staff engineer'],
};

const DOMAIN_KEYWORDS = {
  software: ['software engineer', 'developer', 'backend', 'frontend', 'full stack', 'web developer'],
  data: ['data engineer', 'data scientist', 'analytics', 'ml engineer', 'ai engineer', 'analytics engineer'],
  cloud: ['cloud engineer', 'devops', 'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'infrastructure'],
  mobile: ['mobile developer', 'react native', 'flutter', 'ios', 'android', 'app developer'],
  qa: ['qa engineer', 'test engineer', 'automation tester', 'quality assurance', 'qa automation'],
  'non-tech': ['product manager', 'sales', 'marketing', 'operations', 'hr', 'business analyst'],
};

const WORK_MODE_KEYWORDS = {
  remote: ['remote', 'work from home', 'wfh', 'virtual'],
  onsite: ['onsite', 'on-site', 'office', 'in-office'],
  hybrid: ['hybrid', 'flexible'],
};

export interface RawJobData {
  title?: string;
  companyName?: string;
  location?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
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
  title: string;
  companyName: string;
  location?: string;
  description?: string;
  requirements: string[];
  responsibilities: string[];
  applyUrl?: string;
  externalJobId: string;
  source: string;
  careerLevel?: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  domain?: 'software' | 'data' | 'cloud' | 'mobile' | 'qa' | 'non-tech';
  techStack: string[];
  experienceRequired?: number;
  workMode?: 'remote' | 'onsite' | 'hybrid';
  batchEligible?: boolean;
  bucket?: string;
  normalizedTitle: string;
  normalizedCompany: string;
  salary?: string;
  fetchedAt: Date;
  expiryDate: Date;
  isActive: boolean;
  parseQuality: 'high' | 'medium' | 'low';
  parseConfidence: number;
  postedAt?: Date;
}

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
  private detectCareerLevel(text: string): 'fresher' | 'junior' | 'mid' | 'senior' | 'lead' {
    const lowerText = text.toLowerCase();

    for (const [level, keywords] of Object.entries(CAREER_LEVEL_KEYWORDS)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return level as 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
      }
    }

    return 'junior'; // default
  }

  /**
   * Detect domain from text
   */
  private detectDomain(
    text: string
  ): 'software' | 'data' | 'cloud' | 'mobile' | 'qa' | 'non-tech' | undefined {
    const lowerText = text.toLowerCase();

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return domain as 'software' | 'data' | 'cloud' | 'mobile' | 'qa' | 'non-tech';
      }
    }

    return undefined;
  }

  /**
   * Detect work mode from text
   */
  private detectWorkMode(text: string): 'remote' | 'onsite' | 'hybrid' | undefined {
    const lowerText = text.toLowerCase();

    for (const [mode, keywords] of Object.entries(WORK_MODE_KEYWORDS)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        return mode as 'remote' | 'onsite' | 'hybrid';
      }
    }

    return undefined;
  }

  /**
   * Extract experience requirement (in years) from text
   */
  private extractExperienceRequired(text: string): number | undefined {
    const matches = text.match(/(\d+)\s*(?:\+)?\s*(?:years?|yrs?)/i);
    if (matches && matches[1]) {
      return parseInt(matches[1], 10);
    }
    return undefined;
  }

  /**
   * Check if batch eligible based on job description
   */
  private isBatchEligible(text: string, careerLevel: string): boolean {
    if (careerLevel === 'fresher') {
      return true;
    }
    const batchKeywords = ['batch', 'placement drive', 'campus', 'engineering student', 'final year'];
    return batchKeywords.some((keyword) => text.toLowerCase().includes(keyword));
  }

  /**
   * Calculate parse quality and confidence
   */
  private calculateParseQuality(rawJob: RawJobData, normalized: Partial<NormalizedJob>): {
    quality: 'high' | 'medium' | 'low';
    confidence: number;
  } {
    let score = 0;
    let maxScore = 0;

    // Check for required fields
    if (rawJob.title) score += 15;
    maxScore += 15;

    if (rawJob.companyName) score += 15;
    maxScore += 15;

    if (rawJob.description && rawJob.description.length > 100) score += 15;
    maxScore += 15;

    if (normalized.techStack && normalized.techStack.length > 0) score += 15;
    maxScore += 15;

    if (normalized.careerLevel) score += 15;
    maxScore += 15;

    if (normalized.domain) score += 15;
    maxScore += 15;

    if (rawJob.applyUrl || rawJob.jobUrl) score += 10;
    maxScore += 10;

    const confidence = Math.round((score / maxScore) * 100);
    let quality: 'high' | 'medium' | 'low' = 'low';

    if (confidence >= 80) quality = 'high';
    else if (confidence >= 50) quality = 'medium';

    return { quality, confidence };
  }

  /**
   * Normalize a raw job to standard schema
   */
  public normalize(rawJob: RawJobData, bucket?: string): NormalizedJob {
    try {
      const combinedText = `${rawJob.title || ''} ${rawJob.description || ''} ${rawJob.requirements || ''}`
        .trim();

      const careerLevel = this.detectCareerLevel(combinedText);
      const domain = this.detectDomain(combinedText);
      const techStack = this.extractTechStack(combinedText);
      const workMode = this.detectWorkMode(combinedText);
      const experienceRequired = this.extractExperienceRequired(combinedText);
      const batchEligible = this.isBatchEligible(combinedText, careerLevel);

      const normalized: Partial<NormalizedJob> = {
        careerLevel,
        domain,
        techStack,
        workMode,
        experienceRequired,
        batchEligible,
      };

      const { quality, confidence } = this.calculateParseQuality(rawJob, normalized);

      const now = new Date();
      const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      return {
        title: rawJob.title || 'Untitled',
        companyName: rawJob.companyName || 'Unknown',
        location: rawJob.location,
        description: rawJob.description,
        requirements: Array.isArray(rawJob.requirements)
          ? rawJob.requirements
          : rawJob.requirements
            ? rawJob.requirements.split('\n').filter((r) => r.trim())
            : [],
        responsibilities: Array.isArray(rawJob.responsibilities)
          ? rawJob.responsibilities
          : rawJob.responsibilities
            ? rawJob.responsibilities.split('\n').filter((r) => r.trim())
            : [],
        applyUrl: rawJob.applyUrl || rawJob.jobUrl,
        externalJobId: rawJob.externalId || `ext_${Date.now()}_${Math.random()}`,
        source: rawJob.source || 'unknown',
        careerLevel,
        domain,
        techStack,
        workMode,
        experienceRequired,
        batchEligible,
        bucket,
        normalizedTitle: rawJob.title ? rawJob.title.toLowerCase().trim() : '',
        normalizedCompany: rawJob.companyName ? rawJob.companyName.toLowerCase().trim() : '',
        salary: rawJob.salary,
        fetchedAt: now,
        expiryDate,
        isActive: true,
        parseQuality: quality,
        parseConfidence: confidence,
        postedAt: rawJob.postedDate ? new Date(rawJob.postedDate) : undefined,
      };
    } catch (error) {
      logger.error(`Error normalizing job: ${error}`, { rawJob });
      throw error;
    }
  }

  /**
   * Batch normalize jobs
   */
  public normalizeBatch(rawJobs: RawJobData[], bucket?: string): NormalizedJob[] {
    return rawJobs.map((job) => this.normalize(job, bucket));
  }
}

// Export singleton instance
export const jobNormalizationService = new JobNormalizationService();

export async function initJobNormalization(): Promise<void> {
  logger.info('Job normalization service initialized');
}
