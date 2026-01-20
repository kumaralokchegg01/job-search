import { logger } from '../../utils/logger';

export interface UserProfile {
  targetRoles?: string[];
  targetLocations?: string[];
  targetTechStack?: string[];
  targetDomains?: string[];
  experienceYears?: number;
  careerLevel?: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  workModePreference?: 'remote' | 'onsite' | 'hybrid';
  skillsRating?: Record<string, number>; // skill: rating (0-5)
}

interface JobData {
  title: string;
  description: string;
  requirements: string[];
  techStack: string[];
  experienceRequired?: number;
  careerLevel?: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  workMode?: 'remote' | 'onsite' | 'hybrid';
  location?: string;
  domain?: string;
  companyName: string;
}

interface MatchScore {
  totalScore: number; // 0-100
  skillScore: number; // 0-40
  roleScore: number; // 0-20
  levelScore: number; // 0-15
  experienceScore: number; // 0-10
  locationScore: number; // 0-10
  workModeScore: number; // 0-5
  breakdown: string[]; // Human-readable score explanation
  matchReasons: string[];
  skillGaps: string[];
}

class MatchingEngine {
  /**
   * Calculate skill match score (40 points)
   * How well user's skills match job requirements
   */
  private calculateSkillScore(
    userSkills: Record<string, number>,
    jobTechStack: string[],
    requirements: string[]
  ): { score: number; gaps: string[] } {
    const skillGaps: string[] = [];
    let matchedSkills = 0;
    let totalRequired = 0;

    // Check against job tech stack
    jobTechStack.forEach((tech) => {
      totalRequired++;
      const normalizedTech = tech.toLowerCase();
      const userHasSkill = Object.keys(userSkills).some(
        (skill) => skill.toLowerCase().includes(normalizedTech) || normalizedTech.includes(skill.toLowerCase())
      );

      if (userHasSkill) {
        matchedSkills++;
      } else {
        skillGaps.push(tech);
      }
    });

    // Also check requirements text for skills
    const reqText = requirements.join(' ').toLowerCase();
    Object.keys(userSkills).forEach((skill) => {
      if (reqText.includes(skill.toLowerCase())) {
        matchedSkills++;
      }
    });

    const skillScore = totalRequired > 0 ? Math.round((matchedSkills / totalRequired) * 40) : 20; // default 20 if no techs specified
    return { score: Math.min(40, skillScore), gaps: skillGaps };
  }

  /**
   * Calculate role match score (20 points)
   * How well job title matches user's target roles
   */
  private calculateRoleScore(jobTitle: string, targetRoles?: string[]): { score: number; explanation: string } {
    if (!targetRoles || targetRoles.length === 0) {
      return { score: 15, explanation: 'No target roles specified' };
    }

    const normalizedJobTitle = jobTitle.toLowerCase();
    let matchScore = 0;

    targetRoles.forEach((role) => {
      if (normalizedJobTitle.includes(role.toLowerCase())) {
        matchScore = 20; // Perfect match
      } else if (
        normalizedJobTitle.includes(role.split(' ')[0].toLowerCase()) ||
        role.includes(normalizedJobTitle.split(' ')[0])
      ) {
        matchScore = Math.max(matchScore, 12); // Partial match
      }
    });

    if (matchScore === 0) matchScore = 5; // No match

    return {
      score: matchScore,
      explanation: matchScore === 20 ? 'Exact role match' : 'Role match: ' + jobTitle,
    };
  }

  /**
   * Calculate career level match score (15 points)
   * How well user's level matches job requirements
   */
  private calculateLevelScore(
    userLevel: string | undefined,
    jobLevel: string | undefined
  ): { score: number; explanation: string } {
    const levelHierarchy: Record<string, number> = {
      fresher: 0,
      junior: 1,
      mid: 2,
      senior: 3,
      lead: 4,
    };

    if (!userLevel || !jobLevel) {
      return { score: 10, explanation: 'Level information not available' };
    }

    const userLevelNum = levelHierarchy[userLevel] ?? 1;
    const jobLevelNum = levelHierarchy[jobLevel] ?? 1;

    const diff = Math.abs(userLevelNum - jobLevelNum);

    // Perfect match = 15, off by 1 = 12, off by 2+ = 8
    let score = 15;
    if (diff === 1) score = 12;
    else if (diff >= 2) score = 8;

    const explanation = diff === 0 ? 'Perfect level match' : `Level: user=${userLevel}, job=${jobLevel}`;
    return { score, explanation };
  }

  /**
   * Calculate experience match score (10 points)
   * How well user's experience matches requirements
   */
  private calculateExperienceScore(
    userExperience: number | undefined,
    jobExperienceRequired: number | undefined
  ): { score: number; explanation: string } {
    if (!userExperience || !jobExperienceRequired) {
      return { score: 7, explanation: 'Experience information not available' };
    }

    const experienceDiff = userExperience - jobExperienceRequired;

    if (experienceDiff >= 0) {
      // User has sufficient or more experience
      return {
        score: 10,
        explanation: `Sufficient experience: user=${userExperience}yrs, required=${jobExperienceRequired}yrs`,
      };
    } else if (experienceDiff >= -1) {
      // User is close but slightly below requirement
      return {
        score: 6,
        explanation: `Close to requirement: user=${userExperience}yrs, required=${jobExperienceRequired}yrs`,
      };
    } else {
      // User is significantly below requirement
      return {
        score: 2,
        explanation: `Below requirement: user=${userExperience}yrs, required=${jobExperienceRequired}yrs`,
      };
    }
  }

  /**
   * Calculate location match score (10 points)
   * How well job location matches user preference
   */
  private calculateLocationScore(jobLocation: string | undefined, targetLocations?: string[]): {
    score: number;
    explanation: string;
  } {
    if (!jobLocation) {
      return { score: 7, explanation: 'Job location not specified' };
    }

    if (!targetLocations || targetLocations.length === 0) {
      return { score: 7, explanation: 'No location preferences set' };
    }

    const normalizedJobLocation = jobLocation.toLowerCase();

    for (const location of targetLocations) {
      if (normalizedJobLocation.includes(location.toLowerCase())) {
        return { score: 10, explanation: `Perfect location match: ${jobLocation}` };
      }
    }

    // Check for "India" keyword (project default)
    if (normalizedJobLocation.includes('india') || normalizedJobLocation.includes('indian')) {
      return { score: 8, explanation: `India-based job: ${jobLocation}` };
    }

    return { score: 3, explanation: `Location mismatch: ${jobLocation}` };
  }

  /**
   * Calculate work mode match score (5 points)
   * How well work mode matches user preference
   */
  private calculateWorkModeScore(jobWorkMode: string | undefined, userPreference?: string): {
    score: number;
    explanation: string;
  } {
    if (!jobWorkMode) {
      return { score: 3, explanation: 'Work mode not specified' };
    }

    if (!userPreference) {
      return { score: 3, explanation: 'No work mode preference' };
    }

    const normalizedJobMode = jobWorkMode.toLowerCase();
    const normalizedUserPref = userPreference.toLowerCase();

    if (normalizedJobMode === normalizedUserPref) {
      return { score: 5, explanation: `Perfect match: ${jobWorkMode}` };
    }

    // Hybrid can be acceptable for both remote and onsite preferences
    if (normalizedJobMode === 'hybrid') {
      return { score: 4, explanation: `Flexible option: ${jobWorkMode}` };
    }

    return { score: 1, explanation: `Mismatch: job=${jobWorkMode}, preference=${userPreference}` };
  }

  /**
   * Calculate overall match between user and job
   */
  public calculateMatch(userProfile: UserProfile, job: JobData): MatchScore {
    logger.debug('Calculating match for job', { jobTitle: job.title });

    const skillResult = this.calculateSkillScore(
      userProfile.skillsRating || {},
      job.techStack || [],
      job.requirements || []
    );

    const roleResult = this.calculateRoleScore(job.title, userProfile.targetRoles);
    const levelResult = this.calculateLevelScore(userProfile.careerLevel, job.careerLevel);
    const expResult = this.calculateExperienceScore(userProfile.experienceYears, job.experienceRequired);
    const locResult = this.calculateLocationScore(job.location, userProfile.targetLocations);
    const workModeResult = this.calculateWorkModeScore(job.workMode, userProfile.workModePreference);

    const totalScore =
      skillResult.score +
      roleResult.score +
      levelResult.score +
      expResult.score +
      locResult.score +
      workModeResult.score;

    const breakdown = [
      `Skill match: ${skillResult.score}/40 (${roleResult.explanation})`,
      `Role match: ${roleResult.score}/20`,
      `Level match: ${levelResult.score}/15 (${levelResult.explanation})`,
      `Experience: ${expResult.score}/10 (${expResult.explanation})`,
      `Location: ${locResult.score}/10 (${locResult.explanation})`,
      `Work mode: ${workModeResult.score}/5 (${workModeResult.explanation})`,
    ];

    const matchReasons: string[] = [];
    if (skillResult.score >= 30) matchReasons.push('Strong skill alignment');
    if (roleResult.score === 20) matchReasons.push('Perfect role match');
    if (workModeResult.score === 5) matchReasons.push('Work mode preference match');
    if (locResult.score >= 8) matchReasons.push('Location preference match');

    if (matchReasons.length === 0) {
      matchReasons.push('Potential opportunity');
    }

    return {
      totalScore: Math.min(100, totalScore),
      skillScore: skillResult.score,
      roleScore: roleResult.score,
      levelScore: levelResult.score,
      experienceScore: expResult.score,
      locationScore: locResult.score,
      workModeScore: workModeResult.score,
      breakdown,
      matchReasons,
      skillGaps: skillResult.gaps,
    };
  }

  /**
   * Match user to multiple jobs and return sorted results
   */
  public matchToMultipleJobs(userProfile: UserProfile, jobs: JobData[]): Array<{ job: JobData; match: MatchScore }> {
    const matches = jobs.map((job) => ({
      job,
      match: this.calculateMatch(userProfile, job),
    }));

    // Sort by totalScore descending
    matches.sort((a, b) => b.match.totalScore - a.match.totalScore);

    return matches;
  }

  /**
   * Filter jobs by minimum match score
   */
  public filterByMinimumScore(
    matches: Array<{ job: JobData; match: MatchScore }>,
    minimumScore: number = 50
  ): Array<{ job: JobData; match: MatchScore }> {
    return matches.filter((m) => m.match.totalScore >= minimumScore);
  }
}

export const matchingEngine = new MatchingEngine();

export async function initMatchingEngine(): Promise<void> {
  logger.info('6-Factor Matching Engine initialized with weights: Skill 40%, Role 20%, Level 15%, Experience 10%, Location 10%, WorkMode 5%');
}
