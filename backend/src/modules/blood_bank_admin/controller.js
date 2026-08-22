import * as requestsService from '../requests/service.js';
import { z } from 'zod';

const createRequestSchema = z.object({
  blood_group: z.string().min(1, 'Blood group is required'),
  required_units: z.number().int().positive('Required units must be a positive integer'),
  patient_name: z.string().min(1, 'Patient name is required'),
  hospital_name: z.string().min(1, 'Hospital name is required'),
  hospital_address: z.string().min(1, 'Hospital address is required'),
  location: z.string().min(1, 'Location is required'),
  required_date_time: z.string().min(1, 'Required date and time is required'),
  urgency_level: z.enum(['NORMAL', 'URGENT', 'EMERGENCY']),
  description: z.string().optional().nullable()
});

export async function createRequest(req, res, next) {
  try {
    const validatedData = createRequestSchema.parse(req.body);
    const request = await requestsService.createBloodRequest(
      req.user.id,
      'BLOOD_BANK_ADMIN',
      validatedData
    );

    return res.status(201).json({
      status: 'success',
      request
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        message: error.errors[0].message
      });
    }

    if (error.code === 'DUPLICATE_ACTIVE_REQUEST') {
      return res.status(409).json({
        status: 'error',
        code: 'DUPLICATE_ACTIVE_REQUEST',
        message: error.message,
        requestId: error.requestId
      });
    }

    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const requests = await requestsService.getRequests();
    return res.status(200).json({
      status: 'success',
      requests
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequestDetails(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestsService.getBloodRequestDetails(id);
    return res.status(200).json({
      status: 'success',
      request
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await requestsService.cancelBloodRequest(id, req.user.id, 'BLOOD_BANK_ADMIN');
    return res.status(200).json({
      status: 'success',
      request
    });
  } catch (error) {
    next(error);
  }
}
