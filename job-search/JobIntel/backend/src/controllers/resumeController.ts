import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import ParsedResume from '../models/ParsedResume';
import { User } from '../models/User';
import { resumeParserService } from '../services/resumeParserService';
import { batchMatchingService } from '../services/phase3/batchMatchingService';
import { deleteResumeFile } from '../middleware/resumeUpload';
import type { Multer } from 'multer';

declare global {
  namespace Express {
    interface Multer {
      File: any;
    }
  }
}

interface AuthRequest extends Request {
  user?: { id: string; email: string };
  file?: any; // Multer.File
  body: any;
  query: any;
}

/**
 * POST /api/resume/upload
 * Upload and parse a resume file
 */
export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    logger.info(`Resume upload started: ${req.file.filename}`, { userId });

    // Parse resume
    const parsedData = await resumeParserService.parseResume(req.file.path);

    // Delete the uploaded file after parsing (we store the parsed data)
    deleteResumeFile(req.file.filename);

    // Save parsed resume to database
    const existingResume = await ParsedResume.findOne({ userId });

    let savedResume;
    if (existingResume) {
      // Update existing resume
      savedResume = await ParsedResume.findByIdAndUpdate(existingResume._id, {
        skills: parsedData.skills,
        technologies: parsedData.technologies,
        workExperience: parsedData.workExperience,
        education: parsedData.education,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        parsingQuality: parsedData.parsingQuality,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        isParsed: true,
      }, { new: true });

      logger.info(`Resume updated for user: ${userId}`, { resumeId: savedResume._id });
    } else {
      // Create new resume
      const newResume = new ParsedResume({
        userId,
        skills: parsedData.skills,
        technologies: parsedData.technologies,
        workExperience: parsedData.workExperience,
        education: parsedData.education,
        email: parsedData.email,
        phone: parsedData.phone,
        location: parsedData.location,
        parsingQuality: parsedData.parsingQuality,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: new Date(),
        isParsed: true,
      });

      savedResume = await newResume.save();
      logger.info(`Resume created for user: ${userId}`, { resumeId: savedResume._id });
    }

    // Update user profile with skills
    await User.findByIdAndUpdate(userId, {
      skillsRating: parsedData.skills.reduce((acc, skill) => {
        acc[skill] = 4; // Default rating: 4/5
        return acc;
      }, {} as Record<string, number>),
      experienceYears: Math.min(parsedData.workExperience.length * 2, 20), // Rough estimate
      profileCompleteness: Math.round((parsedData.skills.length / 50) * 100),
    });

    // Trigger automatic matching
    logger.info(`Triggering batch matching for user: ${userId}`);
    batchMatchingService.matchUserToAllJobs(userId, { minScore: 50 }).catch((error) => {
      logger.error(`Batch matching failed: ${error}`, { userId });
    });

    return res.status(200).json({
      message: 'Resume uploaded and parsed successfully',
      resume: {
        _id: savedResume._id,
        userId: savedResume.userId,
        skills: savedResume.skills,
        technologies: savedResume.technologies,
        workExperience: savedResume.workExperience,
        education: savedResume.education,
        parsingQuality: savedResume.parsingQuality,
        email: savedResume.email,
        phone: savedResume.phone,
        location: savedResume.location,
        uploadedAt: savedResume.uploadedAt,
      },
      parsing: {
        quality: parsedData.parsingQuality,
        skillsDetected: parsedData.skills.length,
        technologiesDetected: parsedData.technologies.length,
        experienceEntries: parsedData.workExperience.length,
        educationEntries: parsedData.education.length,
      },
    });
  } catch (error) {
    logger.error(`Resume upload error: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to process resume' });
  }
};

/**
 * GET /api/resume
 * Get current user's parsed resume
 */
export const getResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resume = await ParsedResume.findOne({ userId });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json({ resume });
  } catch (error) {
    logger.error(`Error fetching resume: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to fetch resume' });
  }
};

/**
 * DELETE /api/resume
 * Delete user's resume
 */
export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resume = await ParsedResume.findOneAndDelete({ userId }) as any;

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    logger.info(`Resume deleted for user: ${userId}`, { resumeId: resume._id });

    return res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting resume: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
};

/**
 * GET /api/resume/matches
 * Get top job matches for user based on resume
 */
export const getResumeMatches = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const minScore = req.query.minScore ? parseInt(req.query.minScore as string) : 50;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has parsed resume
    const resume = await ParsedResume.findOne({ userId });
    if (!resume) {
      return res.status(400).json({ error: 'Please upload a resume first' });
    }

    // Get top matches
    const matches = await batchMatchingService.getUserTopMatches(userId, { limit, minScore });

    return res.status(200).json({
      matches,
      count: matches.length,
      averageScore: matches.length > 0 ? Math.round(matches.reduce((sum, m) => sum + m.totalScore, 0) / matches.length) : 0,
    });
  } catch (error) {
    logger.error(`Error fetching resume matches: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

/**
 * GET /api/resume/stats
 * Get resume parsing and matching statistics
 */
export const getResumeStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const resume = await ParsedResume.findOne({ userId });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    const matchStats = await batchMatchingService.getUserMatchingStats(userId);

    return res.status(200).json({
      resume: {
        uploadedAt: resume.createdAt,
        parsingQuality: resume.qualityScore,
        skills: resume.skills,
        technologies: resume.allSkills,
        workExperienceCount: resume.workExperience?.length || 0,
        educationCount: resume.education?.length || 0,
      },
      matching: matchStats,
    });
  } catch (error) {
    logger.error(`Error fetching resume stats: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * POST /api/resume/re-match
 * Trigger re-matching for user based on current resume and jobs
 */
export const reMatchResume = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has resume
    const resume = await ParsedResume.findOne({ userId });
    if (!resume) {
      return res.status(400).json({ error: 'Please upload a resume first' });
    }

    // Trigger matching
    const stats = await batchMatchingService.matchUserToAllJobs(userId, { minScore: 50 });

    logger.info(`Re-matching triggered for user: ${userId}`, { ...stats });

    return res.status(200).json({
      message: 'Re-matching triggered successfully',
      stats,
    });
  } catch (error) {
    logger.error(`Error re-matching resume: ${error}`, { userId: req.user?.id });
    return res.status(500).json({ error: 'Failed to trigger re-matching' });
  }
};
