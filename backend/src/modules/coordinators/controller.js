import * as coordinatorService from './service.js';
import { z } from 'zod';

const screeningSchema = z.object({
  donor_id: z.string().uuid('Invalid donor ID'),
  status: z.enum(['ELIGIBLE', 'TEMPORARILY_DEFERRED', 'NOT_ELIGIBLE']),
  deferred_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional().nullable()
});

const completeDonationSchema = z.object({
  donor_id: z.string().uuid('Invalid donor ID')
});

export async function getRequests(req, res, next) {
  try {
    const requests = await coordinatorService.getAssignedRequests(req.user.id);
    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequestDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await coordinatorService.getRequestDetails(id);
    return res.status(200).json({
      success: true,
      ...details
    });
  } catch (error) {
    next(error);
  }
}

export async function coordinateRequest(req, res, next) {
  try {
    const { id } = req.params;
    const result = await coordinatorService.coordinateRequest(id);
    return res.status(200).json({
      success: true,
      message: 'Coordinating blood request has successfully started.',
      result
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmVisit(req, res, next) {
  try {
    const { id } = req.params;
    const result = await coordinatorService.confirmVisit(id);
    return res.status(200).json({
      success: true,
      message: 'Donation visit confirmed.',
      result
    });
  } catch (error) {
    next(error);
  }
}

export async function recordScreening(req, res, next) {
  try {
    const { id: requestId } = req.params;
    const validatedData = screeningSchema.parse(req.body);
    const result = await coordinatorService.recordScreening(requestId, validatedData);
    return res.status(200).json({
      success: true,
      message: 'Medical screening outcome recorded.',
      result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid screening inputs.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function completeDonation(req, res, next) {
  try {
    const { id: requestId } = req.params;
    const validatedData = completeDonationSchema.parse(req.body);
    const result = await coordinatorService.completeDonation(requestId, validatedData, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Donation successfully marked as completed',
      result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid donation inputs.',
        errors: error.errors
      });
    }
    next(error);
  }
}
