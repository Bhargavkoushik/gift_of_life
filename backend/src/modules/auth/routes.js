import { Router } from 'express';
import * as authController from './controller.js';
import authMiddleware from '../../middleware/auth.js';
import createRateLimiter from '../../middleware/rateLimit.js';

const router = Router();

// Rate limit bounds configuration
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many login or reset attempts, please try again in 15 minutes.'
});

const recoveryLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many recovery requests, please try again in an hour.'
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/roles/donor', authMiddleware, authController.becomeDonor);
router.post('/roles/receiver', authMiddleware, authController.becomeReceiver);

router.post('/forgot-password', recoveryLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.post('/change-password', authMiddleware, authController.changePassword);

router.get('/invitations/validate', authController.validateInvitation);
router.post('/invitations/accept', authController.acceptInvitation);

export default router;
