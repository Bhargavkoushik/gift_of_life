import { Router } from 'express';
import * as coordinatorController from './controller.js';

const router = Router();

router.get('/requests', coordinatorController.getRequests);
router.get('/requests/:id', coordinatorController.getRequestDetails);
router.post('/requests/:id/coordinate', coordinatorController.coordinateRequest);
router.post('/requests/:id/confirm-visit', coordinatorController.confirmVisit);
router.post('/requests/:id/screening', coordinatorController.recordScreening);
router.post('/requests/:id/complete-donation', coordinatorController.completeDonation);

export default router;
