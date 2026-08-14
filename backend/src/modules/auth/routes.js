import { Router } from 'express';
import * as authController from './controller.js';
import authMiddleware from '../../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.post('/roles/donor', authMiddleware, authController.becomeDonor);
router.post('/roles/receiver', authMiddleware, authController.becomeReceiver);

export default router;
