import { Router } from 'express';
import * as donorController from './controller.js';

const router = Router();

router.get('/profile', donorController.getProfile);
router.put('/profile', donorController.updateProfile);
router.get('/availability', donorController.getAvailability);
router.put('/availability', donorController.updateAvailability);
router.get('/requests', donorController.getRequests);
router.post('/requests/:id/respond', donorController.respondToRequest);
router.post('/requests/:id/complete', donorController.completeDonation);
router.get('/history', donorController.getHistory);
router.get('/notifications', donorController.getNotifications);
router.post('/notifications/:id/read', donorController.markNotificationAsRead);

export default router;
