import * as receiverService from './service.js';
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
  description: z.string().optional().nullable(),
  relation_type: z.enum(['MYSELF', 'SOMEONE_ELSE']).optional()
});

const updateProfileSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  area: z.string().min(1, 'Area is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(1, 'Pincode is required'),
  receiver_type: z.enum(['INDIVIDUAL', 'PATIENT_ATTENDANT', 'HOSPITAL']),
  secondary_phone: z.string().max(50).optional().nullable()
});

export async function getProfile(req, res, next) {
  try {
    const profile = await receiverService.getReceiverProfile(req.user.id);
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const profile = await receiverService.updateReceiverProfile(req.user.id, validatedData);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid profile inputs',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function createRequest(req, res, next) {
  try {
    const validatedData = createRequestSchema.parse(req.body);
    const request = await receiverService.createRequest(req.user.id, validatedData);
    return res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      request
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid request inputs',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const requests = await receiverService.getRequests(req.user.id);
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const history = await receiverService.getHistory(req.user.id);
    return res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
}

export async function getRequestDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await receiverService.getRequestDetails(req.user.id, id);
    return res.status(200).json({ success: true, ...details });
  } catch (error) {
    next(error);
  }
}

export async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;
    const request = await receiverService.cancelRequest(req.user.id, id);
    return res.status(200).json({
      success: true,
      message: 'Blood request cancelled successfully',
      request
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await receiverService.getDashboardStats(req.user.id);
    return res.status(200).json({ success: true, ...stats });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const notifications = await receiverService.getNotifications(req.user.id);
    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await receiverService.markNotificationAsRead(id, req.user.id);
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
}
