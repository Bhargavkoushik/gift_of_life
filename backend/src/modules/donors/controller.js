import { z } from 'zod';
import * as donorService from './service.js';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  blood_group_id: z.coerce.number().int().positive('Please select a blood group'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  gender: z.string().min(1, 'Please select gender'),
  phone: z.string().optional().nullable(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  area: z.string().min(2, 'Area must be at least 2 characters long'),
  district: z.string().min(2, 'District must be at least 2 characters long'),
  state: z.string().min(2, 'State must be at least 2 characters long'),
  pincode: z.string().min(4, 'Pincode must be at least 4 characters long')
});

const updateAvailabilitySchema = z.object({
  availability_status: z.enum(['AVAILABLE', 'NOT_AVAILABLE'])
});

const respondSchema = z.object({
  response_status: z.enum(['ACCEPTED', 'REJECTED']),
  notes: z.string().optional().nullable()
});

export async function getProfile(req, res, next) {
  try {
    const profile = await donorService.getDonorProfile(req.user.id);
    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    
    // Fetch the current profile to enforce comparison checks on protected fields
    const currentProfile = await donorService.getDonorProfile(req.user.id);
    if (!currentProfile) {
      return res.status(404).json({
        success: false,
        message: 'Donor profile not found.'
      });
    }

    if (validatedData.name !== currentProfile.name) {
      return res.status(400).json({
        success: false,
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Changing Full Name is restricted. Contact a coordinator to update verified identity details.'
      });
    }

    if (Number(validatedData.blood_group_id) !== Number(currentProfile.blood_group_id)) {
      return res.status(400).json({
        success: false,
        code: 'PROTECTED_FIELD_MODIFICATION',
        message: 'Changing Blood Group is restricted once registered for matching. Contact a coordinator to update medical details.'
      });
    }

    const updated = await donorService.updateDonorProfile(req.user.id, validatedData);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: updated
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid profile inputs provided.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const availability = await donorService.getDonorAvailability(req.user.id);
    return res.status(200).json({
      success: true,
      availability
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const validatedData = updateAvailabilitySchema.parse(req.body);
    const result = await donorService.updateDonorAvailability(req.user.id, validatedData.availability_status);
    return res.status(200).json({
      success: true,
      message: 'Availability updated successfully',
      availability_status: result.availability_status
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid availability parameters.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function getRequests(req, res, next) {
  try {
    const requests = await donorService.getMatchingRequests(req.user.id);
    return res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
}

export async function respondToRequest(req, res, next) {
  try {
    const { id: requestId } = req.params;
    const validatedData = respondSchema.parse(req.body);

    if (validatedData.response_status === 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        code: 'DIRECT_ACCEPTANCE_DISABLED',
        message: 'Direct acceptance via API is disabled. Please complete the prefilled Google Form to claim this request.'
      });
    }

    const result = await donorService.respondToRequest(
      req.user.id,
      requestId,
      validatedData.response_status,
      validatedData.notes
    );
    return res.status(200).json({
      success: true,
      message: `Request successfully ${validatedData.response_status.toLowerCase()}`,
      result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid response inputs.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function completeDonation(req, res, next) {
  try {
    const { id: requestId } = req.params;
    const result = await donorService.completeDonation(req.user.id, requestId);
    return res.status(200).json({
      success: true,
      message: 'Donation successfully marked as completed',
      result
    });
  } catch (error) {
    next(error);
  }
}

export async function getHistory(req, res, next) {
  try {
    const history = await donorService.getDonationHistory(req.user.id);
    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
}

export async function getNotifications(req, res, next) {
  try {
    const notifications = await donorService.getNotifications(req.user.id);
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const { id: notificationId } = req.params;
    const updated = await donorService.markNotificationAsRead(req.user.id, notificationId);
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: updated
    });
  } catch (error) {
    next(error);
  }
}
