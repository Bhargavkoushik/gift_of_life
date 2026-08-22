import { Router } from 'express';
import requireRole from '../../middleware/role.js';
import * as adminController from './controller.js';

const router = Router();

router.get('/stats', adminController.getStats);
router.get('/active-staff', adminController.getActiveStaff);
router.get('/donations', adminController.getDonations);
router.get('/donations/stats', adminController.getDonationStats);
router.get('/reports', adminController.getReports);
router.get('/staff', adminController.getStaff);
router.post('/invite', adminController.invite);
router.post('/invitations/:id/resend', adminController.resendInvitation);
router.post('/invitations/:id/revoke', adminController.revokeInvitation);
router.delete('/invitations/:id', adminController.deleteInvitation);
router.post('/invitations/:id/review', adminController.review);
router.post('/users/:id/status', adminController.updateStatus);
router.get('/coordinators/:id/details', adminController.getCoordinatorDetails);
router.get('/coordinators/active', adminController.getActiveCoordinators);
router.get('/donors', adminController.getDonors);
router.get('/donors/:id/details', adminController.getDonorDetails);
router.get('/requests', adminController.getRequests);
router.get('/requests/:id/details', adminController.getRequestDetails);
router.post('/requests/:id/assign-coordinator', adminController.assignRequestCoordinator);
router.post('/requests/:id/cancel', adminController.cancelBloodRequest);
router.get('/audit-logs', adminController.getAuditLogs);
router.delete('/audit-logs', requireRole('SUPER_ADMIN'), adminController.deleteAuditLogs);

router.get('/notifications', adminController.getNotifications);
router.post('/notifications/:id/read', adminController.markNotificationAsRead);
router.post('/notifications/:id/send-reminder', adminController.sendCoordinatorReminder);
router.post('/notifications/:id/send-emergency', adminController.sendEmergencyNotification);
router.post('/notifications/:id/reassign', adminController.reassignCoordinatorEscalation);
router.delete('/notifications/:id', adminController.deleteNotification);

export default router;
