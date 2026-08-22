import { Router } from 'express';
import * as controller from './controller.js';

const router = Router();

router.post('/requests', controller.createRequest);
router.get('/requests', controller.getRequests);
router.get('/requests/:id', controller.getRequestDetails);
router.patch('/requests/:id/cancel', controller.cancelRequest);

export default router;
