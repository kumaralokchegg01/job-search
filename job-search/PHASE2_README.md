# JobIntel Phase 2: API Endpoints & Core Logic

**Phase Duration:** 2-3 weeks (10 days development)  
**Team Size:** 2-3 developers  
**Priority Level:** CRITICAL (implements all user-facing endpoints)  
**Prerequisites:** Phase 1 must be complete  
**Created:** January 18, 2026

---

## 📋 PHASE 2 OVERVIEW

Phase 2 implements all REST API endpoints that connect the frontend to the database. All route handlers are currently scaffolded but lack implementation. This phase focuses on:

1. ✅ Complete authentication endpoints (register, login, logout, refresh token)
2. ✅ Complete user profile endpoints (get, update, profile completion)
3. ✅ Complete admin scraping control endpoints (start, status, cancel, logs)
4. ✅ Complete API usage tracking endpoints (current usage, set limit, history)
5. ✅ Complete job search & filtering endpoints (search, featured, trending)
6. ✅ Complete resume management endpoints (upload, get, update, delete)
7. ✅ Complete job matching endpoints (my-jobs, match-details, statistics)
8. ✅ Complete saved jobs endpoints (CRUD operations)
9. ✅ Complete notification settings endpoints
10. ✅ Complete skill & profile field endpoints

---

## 📊 PHASE 2 DELIVERABLES

### By End of Phase 2, You Should Have:
- ✅ 50+ REST endpoints fully implemented
- ✅ All controllers with business logic
- ✅ Request/response validation middleware
- ✅ JWT authentication on protected routes
- ✅ Pagination on list endpoints
- ✅ Filtering & sorting on job search
- ✅ Complete error handling with proper HTTP status codes
- ✅ Database transactions where needed
- ✅ Request/response logging
- ✅ Comprehensive API documentation
- ✅ Postman/OpenAPI collection for testing
- ✅ All endpoints tested and working

### Testing Acceptance Criteria:
```bash
✅ POST /api/auth/register - Creates user account
✅ POST /api/auth/login - Returns JWT token
✅ POST /api/auth/refresh - Issues new token
✅ GET /api/user/profile - Returns user details
✅ PUT /api/user/profile - Updates user profile
✅ GET /api/user/profile-completion - Returns completion %
✅ POST /api/admin/scrape - Triggers scraping job
✅ GET /api/admin/scrape/status/:sessionId - Returns job status
✅ POST /api/admin/scrape/cancel - Cancels running scrape
✅ GET /api/admin/scrape/logs - Returns scraping history
✅ GET /api/admin/api-usage - Returns current usage stats
✅ POST /api/admin/api-usage/limit - Sets custom limit
✅ GET /api/jobs/search?q=react - Returns filtered jobs
✅ GET /api/jobs/featured - Returns featured jobs
✅ GET /api/jobs/trending - Returns trending jobs
✅ GET /api/jobs/:jobId - Returns job details
✅ GET /api/jobs/:jobId/apply-link - Returns application URL
✅ POST /api/resume/upload - Uploads resume file
✅ GET /api/resume - Returns uploaded resume
✅ DELETE /api/resume - Deletes resume
✅ GET /api/matching/my-jobs - Returns matched jobs for user
✅ GET /api/matching/my-jobs/:jobId - Returns match details
✅ GET /api/matching/statistics - Returns user match stats
✅ POST /api/saved-jobs - Saves a job
✅ GET /api/saved-jobs - Returns saved jobs
✅ DELETE /api/saved-jobs/:jobId - Removes saved job
✅ All endpoints return proper HTTP status codes
✅ All endpoints validate input
✅ All endpoints check authorization
```

---

## 🎯 DETAILED PHASE 2 TASKS

### TASK 2.1: Authentication Endpoints (Day 1-2, 4-5 hours)

**Objective:** Implement complete auth system with JWT + refresh tokens

**Files to Modify/Create:**

#### 1️⃣ User Model Extension
**File:** `src/models/User.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  
  // Career Details
  careerLevel?: 'fresher' | 'junior' | 'mid' | 'senior';
  yearsOfExperience?: number;
  currentRole?: string;
  targetRoles?: string[];
  targetDomains?: string[];
  preferredWorkMode?: 'remote' | 'onsite' | 'hybrid';
  targetLocations?: string[];
  
  // Resume
  resumeUploadedAt?: Date;
  resumeId?: mongoose.Types.ObjectId;
  
  // Preferences
  openToRelocation?: boolean;
  minSalaryExpectation?: number;
  notifications?: {
    email: boolean;
    whatsapp: boolean;
    telegram: boolean;
  };
  
  // Admin
  userRole: 'user' | 'admin';
  isActive: boolean;
  
  // Profile
  profileCompleteness?: number;
  lastLoggedIn?: Date;
  
  createdAt?: Date;
  updatedAt?: Date;
  
  // Methods
  comparePassword(password: string): Promise<boolean>;
  toPublic(): Omit<IUser, 'password'>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    firstName: String,
    lastName: String,
    profilePicture: String,
    
    careerLevel: { type: String, enum: ['fresher', 'junior', 'mid', 'senior'] },
    yearsOfExperience: Number,
    currentRole: String,
    targetRoles: { type: [String], default: [] },
    targetDomains: { type: [String], default: [] },
    preferredWorkMode: String,
    targetLocations: { type: [String], default: [] },
    
    resumeUploadedAt: Date,
    resumeId: { type: Schema.Types.ObjectId, ref: 'ParsedResume' },
    
    openToRelocation: { type: Boolean, default: false },
    minSalaryExpectation: Number,
    notifications: {
      email: { type: Boolean, default: true },
      whatsapp: { type: Boolean, default: false },
      telegram: { type: Boolean, default: false },
    },
    
    userRole: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true, index: true },
    
    profileCompleteness: { type: Number, default: 0, min: 0, max: 100 },
    lastLoggedIn: Date,
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (password: string) {
  return bcryptjs.compare(password, this.password);
};

// Remove password from public response
UserSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Calculate profile completeness
UserSchema.methods.calculateProfileCompleteness = function () {
  let completeness = 0;
  const fields = [
    'firstName', 'lastName', 'careerLevel', 'yearsOfExperience', 'currentRole',
    'targetRoles', 'targetDomains', 'preferredWorkMode', 'targetLocations',
    'resumeId'
  ];
  
  let filledFields = 0;
  fields.forEach(field => {
    const value = (this as any)[field];
    if (value && (Array.isArray(value) ? value.length > 0 : true)) {
      filledFields++;
    }
  });
  
  completeness = Math.round((filledFields / fields.length) * 100);
  this.profileCompleteness = completeness;
  return completeness;
};

export default mongoose.model<IUser>('User', UserSchema);
```

#### 2️⃣ Auth Controller
**File:** `src/controllers/authController.ts`

```typescript
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  token?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';

// Generate JWT token
const generateToken = (userId: string, role: string) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Generate refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Create user
  const user = new User({
    email,
    password,
    firstName,
    lastName,
    userRole: 'user',
  });

  await user.save();
  logger.info(`User registered: ${email}`);

  // Generate tokens
  const token = generateToken(user._id.toString(), 'user');
  const refreshToken = generateRefreshToken(user._id.toString());

  res.status(201).json({
    message: 'Registration successful',
    token,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    logger.warn(`Failed login attempt for: ${email}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is inactive' });
  }

  // Update last login
  user.lastLoggedIn = new Date();
  await user.save();

  // Generate tokens
  const token = generateToken(user._id.toString(), user.userRole);
  const refreshToken = generateRefreshToken(user._id.toString());

  logger.info(`User logged in: ${email}`);

  res.json({
    message: 'Login successful',
    token,
    refreshToken,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: user.userRole,
      profileCompleteness: user.profileCompleteness,
    },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new access token
    const newToken = generateToken(user._id.toString(), user.userRole);

    res.json({
      token: newToken,
      refreshToken, // Return same refresh token (can implement rotation if needed)
    });
  } catch (err) {
    logger.warn(`Invalid refresh token attempted`);
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  logger.info(`User logged out: ${req.userId}`);
  res.json({ message: 'Logout successful' });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both passwords required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify current password
  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  logger.info(`Password changed for user: ${req.userId}`);

  res.json({ message: 'Password changed successfully' });
});

export const verify = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userRole: user.userRole,
      profileCompleteness: user.profileCompleteness,
    },
  });
});
```

#### 3️⃣ Auth Middleware
**File:** `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    logger.warn(`Invalid token: ${err}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'admin') {
    logger.warn(`Unauthorized admin access by ${req.userId}`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireUser = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
```

#### 4️⃣ Auth Routes
**File:** `src/routes/auth.ts`

```typescript
import express from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, requireUser } from '../middleware/auth';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.post('/change-password', authenticateToken, authController.changePassword);
router.get('/verify', authenticateToken, authController.verify);

export default router;
```

**Checklist:**
- [ ] Implement User model with password hashing
- [ ] Implement auth controller with 6 endpoints
- [ ] Implement JWT middleware
- [ ] Implement auth routes
- [ ] Test: POST /api/auth/register creates user
- [ ] Test: POST /api/auth/login returns token
- [ ] Test: JWT token verified correctly
- [ ] Test: Expired token rejected
- [ ] Test: POST /api/auth/refresh issues new token
- [ ] Test: Password hashing works

---

### TASK 2.2: User Profile Endpoints (Day 2-3, 3-4 hours)

**File:** `src/controllers/userController.ts`

```typescript
import { Response } from 'express';
import User from '../models/User';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePicture: user.profilePicture,
      careerLevel: user.careerLevel,
      yearsOfExperience: user.yearsOfExperience,
      currentRole: user.currentRole,
      targetRoles: user.targetRoles,
      targetDomains: user.targetDomains,
      preferredWorkMode: user.preferredWorkMode,
      targetLocations: user.targetLocations,
      resumeUploadedAt: user.resumeUploadedAt,
      openToRelocation: user.openToRelocation,
      minSalaryExpectation: user.minSalaryExpectation,
      notifications: user.notifications,
      profileCompleteness: user.profileCompleteness,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { firstName, lastName, profilePicture, careerLevel, yearsOfExperience, 
    currentRole, targetRoles, targetDomains, preferredWorkMode, targetLocations,
    openToRelocation, minSalaryExpectation, notifications } = req.body;

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update fields
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (careerLevel !== undefined) user.careerLevel = careerLevel;
  if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience;
  if (currentRole !== undefined) user.currentRole = currentRole;
  if (targetRoles !== undefined) user.targetRoles = targetRoles;
  if (targetDomains !== undefined) user.targetDomains = targetDomains;
  if (preferredWorkMode !== undefined) user.preferredWorkMode = preferredWorkMode;
  if (targetLocations !== undefined) user.targetLocations = targetLocations;
  if (openToRelocation !== undefined) user.openToRelocation = openToRelocation;
  if (minSalaryExpectation !== undefined) user.minSalaryExpectation = minSalaryExpectation;
  if (notifications !== undefined) user.notifications = notifications;

  // Calculate profile completeness
  (user as any).calculateProfileCompleteness();

  await user.save();
  logger.info(`Profile updated for user: ${req.userId}`);

  res.json({
    message: 'Profile updated successfully',
    profileCompleteness: user.profileCompleteness,
  });
});

export const getProfileCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const completion = (user as any).calculateProfileCompleteness();

  const fields = {
    basic: {
      firstName: !!user.firstName,
      lastName: !!user.lastName,
    },
    career: {
      careerLevel: !!user.careerLevel,
      yearsOfExperience: user.yearsOfExperience !== undefined,
      currentRole: !!user.currentRole,
    },
    targets: {
      targetRoles: user.targetRoles && user.targetRoles.length > 0,
      targetDomains: user.targetDomains && user.targetDomains.length > 0,
      preferredWorkMode: !!user.preferredWorkMode,
      targetLocations: user.targetLocations && user.targetLocations.length > 0,
    },
    resume: {
      uploaded: !!user.resumeId,
    },
    preferences: {
      openToRelocation: user.openToRelocation !== undefined,
      minSalaryExpectation: user.minSalaryExpectation !== undefined,
    },
  };

  res.json({
    completion,
    fields,
    totalFields: 11,
    completedFields: Object.values(fields).flat().filter(Boolean).length,
  });
});

export const deleteProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password required to delete account' });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Verify password
  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  logger.warn(`Account deleted: ${req.userId}`);

  res.json({ message: 'Account deleted successfully' });
});
```

**File:** `src/routes/user.ts`

```typescript
import express from 'express';
import * as userController from '../controllers/userController';
import { authenticateToken, requireUser } from '../middleware/auth';

const router = express.Router();

router.get('/profile', authenticateToken, requireUser, userController.getProfile);
router.put('/profile', authenticateToken, requireUser, userController.updateProfile);
router.get('/profile-completion', authenticateToken, requireUser, userController.getProfileCompletion);
router.delete('/profile', authenticateToken, requireUser, userController.deleteProfile);

export default router;
```

**Checklist:**
- [ ] Create user controller with 4 endpoints
- [ ] Create user routes
- [ ] Test: GET /api/user/profile returns profile
- [ ] Test: PUT /api/user/profile updates fields
- [ ] Test: Profile completeness calculated correctly
- [ ] Test: DELETE /api/user/profile soft deletes

---

### TASK 2.3: Admin Scraping Control Endpoints (Day 3-4, 4-5 hours)

**File:** `src/controllers/adminController.ts`

```typescript
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { scrapingQueue, ScrapingJobData } from '../config/queue';
import { ScrapingLog } from '../models/ScrapingLog';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

const VALID_BUCKETS = [
  'fresher', 'batch', 'software', 'data', 'cloud', 
  'mobile', 'qa', 'non-tech', 'experience', 'employment', 'work-mode'
];

export const startScraping = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { buckets } = req.body;

  if (!buckets || !Array.isArray(buckets) || buckets.length === 0) {
    return res.status(400).json({ error: 'Buckets array required' });
  }

  // Validate buckets
  const invalidBuckets = buckets.filter(b => !VALID_BUCKETS.includes(b));
  if (invalidBuckets.length > 0) {
    return res.status(400).json({ error: `Invalid buckets: ${invalidBuckets.join(', ')}` });
  }

  const sessionId = uuidv4();

  // Create scraping log entry
  const scrapingLog = new ScrapingLog({
    sessionId,
    triggeredBy: 'admin',
    triggeredByUserId: req.userId,
    bucketsRequested: buckets,
    status: 'in-progress',
  });
  await scrapingLog.save();

  // Queue scraping job
  const job = await scrapingQueue.add(
    'scrape-buckets',
    {
      buckets,
      sessionId,
      triggeredBy: 'admin',
      triggeredByUserId: req.userId,
    } as ScrapingJobData,
    {
      attempts: 1,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: false,
    }
  );

  logger.info(`Scraping job started: ${sessionId} by admin ${req.userId}`);

  res.status(202).json({
    message: 'Scraping started',
    sessionId,
    jobId: job.id,
    buckets,
  });
});

export const getScrapeStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;

  const scrapingLog = await ScrapingLog.findOne({ sessionId });
  if (!scrapingLog) {
    return res.status(404).json({ error: 'Scraping session not found' });
  }

  res.json({
    sessionId: scrapingLog.sessionId,
    status: scrapingLog.status,
    progress: {
      total: scrapingLog.bucketsRequested.length,
      completed: scrapingLog.bucketsCompleted.length,
      failed: scrapingLog.bucketsFailed.length,
    },
    stats: {
      totalApiCalls: scrapingLog.totalApiCalls,
      totalJobsFound: scrapingLog.totalJobsFound,
      newJobsAdded: scrapingLog.newJobsAdded,
      jobsUpdated: scrapingLog.jobsUpdated,
    },
    startedAt: scrapingLog.startedAt,
    completedAt: scrapingLog.completedAt,
    durationMs: scrapingLog.durationMs,
    bucketDetails: scrapingLog.bucketDetails,
  });
});

export const cancelScrape = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const scrapingLog = await ScrapingLog.findOne({ sessionId });
  if (!scrapingLog) {
    return res.status(404).json({ error: 'Scraping session not found' });
  }

  if (scrapingLog.status !== 'in-progress') {
    return res.status(400).json({ error: 'Can only cancel in-progress scrapes' });
  }

  scrapingLog.status = 'failed';
  scrapingLog.errorMessage = 'Manually cancelled by admin';
  await scrapingLog.save();

  // TODO: Cancel BullMQ job if still processing

  logger.info(`Scraping cancelled: ${sessionId}`);

  res.json({ message: 'Scraping cancelled' });
});

export const getScrapeLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 20, offset = 0, status, triggeredBy } = req.query;

  const query: any = {};
  if (status) query.status = status;
  if (triggeredBy) query.triggeredBy = triggeredBy;

  const logs = await ScrapingLog.find(query)
    .sort({ startedAt: -1 })
    .limit(parseInt(limit as string))
    .skip(parseInt(offset as string));

  const total = await ScrapingLog.countDocuments(query);

  res.json({
    logs,
    pagination: {
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});
```

**Checklist:**
- [ ] Create admin controller with 4 endpoints
- [ ] Create scraping log functionality
- [ ] Test: POST /api/admin/scrape starts job
- [ ] Test: GET /api/admin/scrape/status/:sessionId returns status
- [ ] Test: POST /api/admin/scrape/cancel stops job
- [ ] Test: GET /api/admin/scrape/logs returns history

---

### TASK 2.4: API Usage Tracking Endpoints (Day 4, 2-3 hours)

**File:** `src/controllers/apiUsageController.ts`

```typescript
import { Response } from 'express';
import { ApiUsage } from '../models/ApiUsage';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getCurrentUsage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = getCurrentMonth();
  
  let usage = await ApiUsage.findOne({ month });
  if (!usage) {
    usage = new ApiUsage({
      month,
      provider: 'OpenWeb Ninja',
      monthlyLimit: 200,
      totalCallsUsed: 0,
      callsRemaining: 200,
    });
    await usage.save();
  }

  res.json({
    month: usage.month,
    totalCallsUsed: usage.totalCallsUsed,
    monthlyLimit: usage.monthlyLimit,
    callsRemaining: usage.callsRemaining,
    safetyThreshold: usage.safetyThreshold,
    isLimitReached: usage.isLimitReached,
    isWarningTriggered: usage.isWarningTriggered,
    percentageUsed: Math.round((usage.totalCallsUsed / usage.monthlyLimit) * 100),
  });
});

export const setMonthlyLimit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { monthlyLimit } = req.body;

  if (typeof monthlyLimit !== 'number' || monthlyLimit < 1) {
    return res.status(400).json({ error: 'Valid monthly limit required' });
  }

  const month = getCurrentMonth();
  
  let usage = await ApiUsage.findOne({ month });
  if (!usage) {
    usage = new ApiUsage({ month });
  }

  usage.adminConfiguredLimit = monthlyLimit;
  usage.monthlyLimit = monthlyLimit;
  usage.lastConfiguredAt = new Date();
  usage.lastConfiguredBy = req.userId;
  
  // Recalculate remaining calls
  usage.callsRemaining = monthlyLimit - usage.totalCallsUsed;
  usage.safetyThreshold = Math.round(monthlyLimit * 0.8);

  await usage.save();

  logger.info(`API usage limit set to ${monthlyLimit} by admin ${req.userId}`);

  res.json({
    message: 'Monthly limit updated',
    monthlyLimit: usage.monthlyLimit,
    safetyThreshold: usage.safetyThreshold,
  });
});

export const getUsageHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { limit = 50, offset = 0 } = req.query;
  const month = getCurrentMonth();

  const usage = await ApiUsage.findOne({ month });
  if (!usage) {
    return res.json({
      callHistory: [],
      total: 0,
    });
  }

  const history = usage.callHistory
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string));

  res.json({
    callHistory: history,
    total: usage.callHistory.length,
    pagination: {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    },
  });
});

export const addApiCall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { bucket, keyword, resultCount, status, errorMessage } = req.body;

  const month = getCurrentMonth();
  
  let usage = await ApiUsage.findOne({ month });
  if (!usage) {
    usage = new ApiUsage({
      month,
      provider: 'OpenWeb Ninja',
      monthlyLimit: 200,
    });
  }

  // Add to call history
  usage.callHistory.push({
    timestamp: new Date(),
    bucket,
    keyword,
    resultCount: resultCount || 0,
    status,
    errorMessage,
    initiatedBy: req.userId,
  });

  // Update counters
  if (status === 'success') {
    usage.totalCallsUsed++;
    usage.callsRemaining = usage.monthlyLimit - usage.totalCallsUsed;

    // Check if limit reached
    if (usage.totalCallsUsed >= usage.monthlyLimit) {
      usage.isLimitReached = true;
      logger.warn(`API usage limit reached for ${month}`);
    }

    // Check warning threshold (80%)
    if (usage.totalCallsUsed >= usage.safetyThreshold && !usage.isWarningTriggered) {
      usage.isWarningTriggered = true;
      logger.warn(`API usage approaching limit: ${usage.totalCallsUsed}/${usage.monthlyLimit}`);
    }
  }

  await usage.save();

  res.json({
    message: 'API call logged',
    totalCalls: usage.totalCallsUsed,
    callsRemaining: usage.callsRemaining,
    isLimitReached: usage.isLimitReached,
  });
});
```

**Checklist:**
- [ ] Create API usage controller
- [ ] Implement usage tracking service
- [ ] Test: GET /api/admin/api-usage returns current usage
- [ ] Test: POST /api/admin/api-usage/limit sets limit
- [ ] Test: GET /api/admin/api-usage/history returns call log
- [ ] Test: Hard stop at 200 calls/month

---

### TASK 2.5: Job Search Endpoints (Day 4-5, 4-5 hours)

**File:** `src/controllers/jobController.ts`

```typescript
import { Response } from 'express';
import Job from '../models/Job';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const searchJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    q,
    careerLevel,
    domain,
    workMode,
    location,
    page = 1,
    limit = 20,
    sortBy = '-createdAt',
  } = req.query;

  const query: any = { isActive: true };

  // Text search
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
    ];
  }

  // Filters
  if (careerLevel) query.careerLevel = careerLevel;
  if (domain) query.domain = domain;
  if (workMode) query.workMode = workMode;
  if (location) query.location = { $regex: location, $options: 'i' };

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const total = await Job.countDocuments(query);

  const jobs = await Job.find(query)
    .sort(sortBy as any)
    .skip(skip)
    .limit(parseInt(limit as string));

  res.json({
    jobs,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

export const getJobDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json({ job });
});

export const getApplyLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  if (!job.applyUrl) {
    return res.status(400).json({ error: 'Apply link not available' });
  }

  res.json({
    jobId: job._id,
    jobTitle: job.title,
    applyUrl: job.applyUrl,
    externalSource: job.source,
  });
});

export const getFeaturedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const jobs = await Job.find({ isActive: true })
    .sort({ postedAt: -1 })
    .limit(10);

  res.json({ jobs });
});

export const getTrendingJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Get jobs with most applications/views in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const jobs = await Job.find({
    isActive: true,
    createdAt: { $gte: sevenDaysAgo },
  })
    .sort({ 'meta.applicationsCount': -1 })
    .limit(10);

  res.json({ jobs });
});
```

**File:** `src/routes/job.ts`

```typescript
import express from 'express';
import * as jobController from '../controllers/jobController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/search', authenticateToken, jobController.searchJobs);
router.get('/featured', authenticateToken, jobController.getFeaturedJobs);
router.get('/trending', authenticateToken, jobController.getTrendingJobs);
router.get('/:jobId', authenticateToken, jobController.getJobDetail);
router.get('/:jobId/apply-link', authenticateToken, jobController.getApplyLink);

export default router;
```

**Checklist:**
- [ ] Create job controller with 5 endpoints
- [ ] Implement search with filters
- [ ] Implement pagination
- [ ] Test: GET /api/jobs/search?q=react returns jobs
- [ ] Test: Filtering by careerLevel, domain, workMode works
- [ ] Test: Pagination works correctly
- [ ] Test: GET /api/jobs/:jobId returns details
- [ ] Test: GET /api/jobs/featured/trending returns trending

---

### TASK 2.6: Resume Management Endpoints (Day 5, 3-4 hours)

**File:** `src/controllers/resumeController.ts`

```typescript
import { Response } from 'express';
import { ParsedResume } from '../models/ParsedResume';
import User from '../models/User';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const uploadResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  // TODO: Implement file upload (integrate with multer)
  // TODO: Extract text from PDF/DOCX
  // TODO: Parse resume with AI
  
  const { rawText, uploadedFileName, parseQuality, parseConfidence } = req.body;

  if (!rawText || !uploadedFileName) {
    return res.status(400).json({ error: 'Resume content and filename required' });
  }

  const existingResume = await ParsedResume.findOne({ userId: req.userId });
  if (existingResume) {
    await existingResume.deleteOne();
  }

  const resume = new ParsedResume({
    userId: req.userId,
    rawText,
    uploadedFileName,
    uploadedAt: new Date(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    parseQuality: parseQuality || 'medium',
    parseConfidence: parseConfidence || 50,
  });

  await resume.save();

  // Update user
  const user = await User.findById(req.userId);
  if (user) {
    user.resumeUploadedAt = new Date();
    user.resumeId = resume._id;
    (user as any).calculateProfileCompleteness();
    await user.save();
  }

  logger.info(`Resume uploaded: ${req.userId}`);

  res.status(201).json({
    message: 'Resume uploaded successfully',
    resume: {
      id: resume._id,
      uploadedAt: resume.uploadedAt,
      expiryDate: resume.expiryDate,
      parseQuality: resume.parseQuality,
    },
  });
});

export const getResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resume = await ParsedResume.findOne({ userId: req.userId });
  
  if (!resume) {
    return res.status(404).json({ error: 'No resume found' });
  }

  res.json({
    resume: {
      id: resume._id,
      uploadedFileName: resume.uploadedFileName,
      uploadedAt: resume.uploadedAt,
      expiryDate: resume.expiryDate,
      skills: resume.skills,
      technicalSkills: resume.technicalSkills,
      softSkills: resume.softSkills,
      totalYearsOfExperience: resume.totalYearsOfExperience,
      workHistory: resume.workHistory,
      education: resume.education,
      parseQuality: resume.parseQuality,
      parseConfidence: resume.parseConfidence,
    },
  });
});

export const updateResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { skills, technicalSkills, softSkills, totalYearsOfExperience } = req.body;

  const resume = await ParsedResume.findOne({ userId: req.userId });
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  if (skills) resume.skills = skills;
  if (technicalSkills) resume.technicalSkills = technicalSkills;
  if (softSkills) resume.softSkills = softSkills;
  if (totalYearsOfExperience !== undefined) resume.totalYearsOfExperience = totalYearsOfExperience;

  await resume.save();
  logger.info(`Resume updated: ${req.userId}`);

  res.json({ message: 'Resume updated successfully' });
});

export const deleteResume = asyncHandler(async (req: AuthRequest, res: Response) => {
  const resume = await ParsedResume.findOne({ userId: req.userId });
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  await resume.deleteOne();

  // Update user
  const user = await User.findById(req.userId);
  if (user) {
    user.resumeId = undefined;
    user.resumeUploadedAt = undefined;
    (user as any).calculateProfileCompleteness();
    await user.save();
  }

  logger.info(`Resume deleted: ${req.userId}`);

  res.json({ message: 'Resume deleted successfully' });
});
```

**Checklist:**
- [ ] Create resume controller
- [ ] Implement file upload handler (with multer)
- [ ] Test: POST /api/resume/upload stores resume
- [ ] Test: GET /api/resume retrieves resume
- [ ] Test: PUT /api/resume updates fields
- [ ] Test: DELETE /api/resume removes resume

---

### TASK 2.7: Job Matching Endpoints (Day 5-6, 3-4 hours)

**File:** `src/controllers/matchingController.ts`

```typescript
import { Response } from 'express';
import { JobMatch } from '../models/JobMatch';
import Job from '../models/Job';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const getMyJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    minScore = 50, 
    matchType,
    page = 1, 
    limit = 20,
    sortBy = '-totalScore'
  } = req.query;

  const query: any = { userId: req.userId, totalScore: { $gte: minScore } };
  if (matchType) query.matchType = matchType;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const total = await JobMatch.countDocuments(query);

  const matches = await JobMatch.find(query)
    .populate('jobId')
    .sort(sortBy as any)
    .skip(skip)
    .limit(parseInt(limit as string));

  res.json({
    matches,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

export const getMatchDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { matchId } = req.params;

  const match = await JobMatch.findOne({
    _id: matchId,
    userId: req.userId,
  }).populate('jobId');

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  // Mark as viewed
  if (!match.userViewed) {
    match.userViewed = true;
    match.viewedAt = new Date();
    await match.save();
  }

  res.json({
    match: {
      id: match._id,
      job: match.jobId,
      scores: {
        skillMatch: match.skillMatch,
        roleMatch: match.roleMatch,
        levelMatch: match.levelMatch,
        experienceMatch: match.experienceMatch,
        locationMatch: match.locationMatch,
        workModeMatch: match.workModeMatch,
      },
      totalScore: match.totalScore,
      matchType: match.matchType,
      matchReason: match.matchReason,
      userActions: {
        viewed: match.userViewed,
        saved: match.userSaved,
        applied: match.userApplied,
      },
    },
  });
});

export const getMatchStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const matches = await JobMatch.find({ userId: req.userId });

  const stats = {
    total: matches.length,
    byType: {
      excellent: matches.filter(m => m.matchType === 'excellent').length,
      good: matches.filter(m => m.matchType === 'good').length,
      okay: matches.filter(m => m.matchType === 'okay').length,
      poor: matches.filter(m => m.matchType === 'poor').length,
    },
    viewed: matches.filter(m => m.userViewed).length,
    saved: matches.filter(m => m.userSaved).length,
    applied: matches.filter(m => m.userApplied).length,
    averageScore: matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.totalScore, 0) / matches.length)
      : 0,
  };

  res.json({ statistics: stats });
});

export const markJobViewed = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { matchId } = req.body;

  const match = await JobMatch.findOne({
    _id: matchId,
    userId: req.userId,
  });

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  match.userViewed = true;
  match.viewedAt = new Date();
  await match.save();

  res.json({ message: 'Marked as viewed' });
});

export const markJobApplied = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { matchId } = req.body;

  const match = await JobMatch.findOne({
    _id: matchId,
    userId: req.userId,
  });

  if (!match) {
    return res.status(404).json({ error: 'Match not found' });
  }

  match.userApplied = true;
  match.appliedAt = new Date();
  await match.save();

  logger.info(`User ${req.userId} applied for job ${match.jobId}`);

  res.json({ message: 'Application recorded' });
});
```

**Checklist:**
- [ ] Create matching controller
- [ ] Test: GET /api/matching/my-jobs returns matches
- [ ] Test: GET /api/matching/my-jobs/:matchId returns details
- [ ] Test: GET /api/matching/statistics returns stats
- [ ] Test: Mark job viewed, applied
- [ ] Test: Filtering by score/matchType works

---

### TASK 2.8: Saved Jobs Endpoints (Day 6, 2-3 hours)

**File:** `src/controllers/savedJobsController.ts`

```typescript
import { Response } from 'express';
import { SavedJob } from '../models/SavedJob';
import Job from '../models/Job';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from './authController';

export const saveJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId, notes, priority } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Check if already saved
  const existing = await SavedJob.findOne({ userId: req.userId, jobId });
  if (existing) {
    return res.status(409).json({ error: 'Job already saved' });
  }

  const savedJob = new SavedJob({
    userId: req.userId,
    jobId,
    externalJobId: job.externalJobId,
    notes,
    priority: priority || 'medium',
    status: 'saved',
    savedAt: new Date(),
  });

  await savedJob.save();
  logger.info(`Job saved: ${jobId} by user ${req.userId}`);

  res.status(201).json({
    message: 'Job saved successfully',
    savedJob: {
      id: savedJob._id,
      jobId: savedJob.jobId,
      savedAt: savedJob.savedAt,
    },
  });
});

export const getSavedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 20, status, priority, sortBy = '-savedAt' } = req.query;

  const query: any = { userId: req.userId };
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const total = await SavedJob.countDocuments(query);

  const savedJobs = await SavedJob.find(query)
    .populate('jobId')
    .sort(sortBy as any)
    .skip(skip)
    .limit(parseInt(limit as string));

  res.json({
    savedJobs,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string)),
    },
  });
});

export const updateSavedJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { savedJobId } = req.params;
  const { notes, priority, status } = req.body;

  const savedJob = await SavedJob.findOne({
    _id: savedJobId,
    userId: req.userId,
  });

  if (!savedJob) {
    return res.status(404).json({ error: 'Saved job not found' });
  }

  if (notes !== undefined) savedJob.notes = notes;
  if (priority !== undefined) savedJob.priority = priority;
  if (status !== undefined) savedJob.status = status;

  await savedJob.save();
  logger.info(`Saved job updated: ${savedJobId}`);

  res.json({ message: 'Saved job updated' });
});

export const deleteSavedJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { savedJobId } = req.params;

  const savedJob = await SavedJob.findOneAndDelete({
    _id: savedJobId,
    userId: req.userId,
  });

  if (!savedJob) {
    return res.status(404).json({ error: 'Saved job not found' });
  }

  logger.info(`Saved job deleted: ${savedJobId}`);

  res.json({ message: 'Saved job deleted' });
});
```

**File:** `src/routes/saved-jobs.ts`

```typescript
import express from 'express';
import * as savedJobsController from '../controllers/savedJobsController';
import { authenticateToken, requireUser } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticateToken, requireUser, savedJobsController.saveJob);
router.get('/', authenticateToken, requireUser, savedJobsController.getSavedJobs);
router.put('/:savedJobId', authenticateToken, requireUser, savedJobsController.updateSavedJob);
router.delete('/:savedJobId', authenticateToken, requireUser, savedJobsController.deleteSavedJob);

export default router;
```

**Checklist:**
- [ ] Create saved jobs controller
- [ ] Test: POST /api/saved-jobs saves job
- [ ] Test: GET /api/saved-jobs returns saved jobs
- [ ] Test: PUT /api/saved-jobs/:id updates
- [ ] Test: DELETE /api/saved-jobs/:id removes
- [ ] Test: Filtering by status/priority works

---

## 📝 MAIN ENDPOINT SUMMARY

### Authentication (6 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/change-password
GET    /api/auth/verify
```

### User Profile (4 endpoints)
```
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/profile-completion
DELETE /api/user/profile
```

### Admin Scraping (4 endpoints)
```
POST   /api/admin/scrape
GET    /api/admin/scrape/status/:sessionId
POST   /api/admin/scrape/cancel
GET    /api/admin/scrape/logs
```

### API Usage (3 endpoints)
```
GET    /api/admin/api-usage
POST   /api/admin/api-usage/limit
GET    /api/admin/api-usage/history
```

### Jobs (5 endpoints)
```
GET    /api/jobs/search
GET    /api/jobs/featured
GET    /api/jobs/trending
GET    /api/jobs/:jobId
GET    /api/jobs/:jobId/apply-link
```

### Resume (4 endpoints)
```
POST   /api/resume/upload
GET    /api/resume
PUT    /api/resume
DELETE /api/resume
```

### Job Matching (4 endpoints)
```
GET    /api/matching/my-jobs
GET    /api/matching/my-jobs/:matchId
GET    /api/matching/statistics
POST   /api/matching/mark-viewed
```

### Saved Jobs (4 endpoints)
```
POST   /api/saved-jobs
GET    /api/saved-jobs
PUT    /api/saved-jobs/:savedJobId
DELETE /api/saved-jobs/:savedJobId
```

**Total: 34 Core Endpoints**

---

## ✅ ACCEPTANCE CRITERIA

By end of Phase 2:

```bash
✅ All 34 endpoints implemented & working
✅ JWT authentication on protected routes
✅ Proper HTTP status codes (201, 400, 401, 403, 404, 409, 500)
✅ Request validation on all endpoints
✅ Pagination on list endpoints
✅ Filtering & sorting on search endpoints
✅ Error messages clear & helpful
✅ All endpoints have logging
✅ Database transactions where needed
✅ Postman collection created with all endpoints
✅ All endpoints tested manually
```

---

## 🚀 NEXT STEPS

Once Phase 2 is complete:
→ Move to **Phase 3: Job Extraction & Matching** for core business logic

---

**Document Version:** 1.0  
**Created:** January 18, 2026  
**Estimated Completion:** 2-3 weeks  
