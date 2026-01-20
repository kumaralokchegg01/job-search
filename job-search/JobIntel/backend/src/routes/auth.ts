import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  changePassword,
  verifyToken,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);
router.post('/change-password', authenticateToken, changePassword);
router.get('/verify', authenticateToken, verifyToken);

export default router;
