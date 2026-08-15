import { Router } from 'express';
import * as receiverController from './controller.js';

const router = Router();

router.get('/profile', receiverController.getProfile);
router.put('/profile', receiverController.updateProfile);
router.get('/dashboard-stats', receiverController.getDashboardStats);
router.post('/requests', receiverController.createRequest);
router.get('/requests', receiverController.getRequests);
router.get('/requests/:id', receiverController.getRequestDetails);
router.get('/history', receiverController.getHistory);
router.patch('/requests/:id/cancel', receiverController.cancelRequest);
router.get('/notifications', receiverController.getNotifications);
router.post('/notifications/:id/read', receiverController.markNotificationAsRead);

export default router;
