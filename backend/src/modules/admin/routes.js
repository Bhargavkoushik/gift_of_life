import { Router } from 'express';
import * as adminController from './controller.js';

const router = Router();

router.get('/stats', adminController.getStats);
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

export default router;
