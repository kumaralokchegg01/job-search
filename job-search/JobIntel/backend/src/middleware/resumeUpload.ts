import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { Request } from 'express';

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

// Create uploads directory
const uploadDir = path.join(process.cwd(), 'uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: any, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: any, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const authReq = req as AuthRequest;
    cb(null, `${authReq.user?.id || 'unknown'}-${name}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only PDF and DOCX allowed
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const allowedExtensions = ['.pdf', '.docx'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedMimes.includes(mime) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and DOCX files are allowed'), false);
  }
};

// Create multer upload middleware
export const resumeUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * Handle resume upload errors
 */
export const handleResumeUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 5 MB limit' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Only one file allowed' });
    }
  }

  if (error) {
    logger.error(`Resume upload error: ${error.message}`);
    return res.status(400).json({ error: error.message || 'File upload failed' });
  }

  next();
};

/**
 * Get resume file path
 */
export const getResumeFilePath = (filename: string): string => {
  return path.join(uploadDir, filename);
};

/**
 * Delete resume file
 */
export const deleteResumeFile = (filename: string): void => {
  try {
    const filePath = getResumeFilePath(filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted resume file: ${filename}`);
    }
  } catch (error) {
    logger.error(`Error deleting resume file: ${error}`, { filename });
  }
};
