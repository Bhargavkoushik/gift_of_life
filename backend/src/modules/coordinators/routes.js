import { Router } from 'express';
import * as coordinatorController from './controller.js';

const router = Router();

router.get('/requests', coordinatorController.getRequests);
router.get('/dashboard', coordinatorController.getDashboardData);
router.get('/responses', coordinatorController.getDonorResponses);
router.get('/follow-ups', coordinatorController.getFollowUps);
router.get('/requests/:id', coordinatorController.getRequestDetails);
router.post('/requests/:id/coordinate', coordinatorController.coordinateRequest);
router.post('/requests/:id/confirm-visit', coordinatorController.confirmVisit);
router.post('/requests/:id/screening', coordinatorController.recordScreening);
router.post('/requests/:id/complete-donation', coordinatorController.completeDonation);
router.post('/requests/:id/release-donor', coordinatorController.releaseDonor);

router.get('/availability', coordinatorController.getAvailability);
router.put('/availability', coordinatorController.updateAvailability);

router.get('/public-site/camps', coordinatorController.getCamps);
router.post('/public-site/camps', coordinatorController.createCamp);
router.put('/public-site/camps/:id', coordinatorController.updateCamp);
router.delete('/public-site/camps/:id', coordinatorController.deleteCamp);

router.get('/public-site/blood-availability', coordinatorController.getInventory);
router.post('/public-site/blood-availability', coordinatorController.createInventory);
router.put('/public-site/blood-availability/:id', coordinatorController.updateInventory);
router.delete('/public-site/blood-availability/:id', coordinatorController.deleteInventory);

router.get('/blood-groups', coordinatorController.getBloodGroups);

export default router;
