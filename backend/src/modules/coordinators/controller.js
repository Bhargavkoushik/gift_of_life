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

const availabilitySchema = z.object({
  status: z.enum(['AVAILABLE', 'OFFLINE'])
});

export async function getRequests(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const status = req.query.status || 'ALL';
    const search = req.query.search || '';

    const result = await coordinatorService.getAssignedRequestsPaginated(req.user.id, { page, limit, status, search });
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function getRequestDetails(req, res, next) {
  try {
    const { id } = req.params;
    const details = await coordinatorService.getRequestDetails(id, req.user.id);
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
    const result = await coordinatorService.coordinateRequest(id, req.user.id);
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
    const result = await coordinatorService.confirmVisit(id, req.user.id);
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
    const result = await coordinatorService.recordScreening(requestId, validatedData, req.user.id);
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

export async function getAvailability(req, res, next) {
  try {
    const result = await coordinatorService.getAvailability(req.user.id);
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const validatedData = availabilitySchema.parse(req.body);
    const result = await coordinatorService.updateAvailability(req.user.id, validatedData.status);
    return res.status(200).json({
      success: true,
      message: 'Availability status successfully updated.',
      ...result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid status input.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function getDashboardData(req, res, next) {
  try {
    const data = await coordinatorService.getDashboardData(req.user.id);
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    next(error);
  }
}

const campSchema = z.object({
  name: z.string().min(1, 'Camp name is required'),
  organizer: z.string().min(1, 'Organizer is required'),
  description: z.string().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  venue: z.string().min(1, 'Venue is required'),
  address: z.string().min(1, 'Address is required'),
  area: z.string().min(1, 'Area is required'),
  district: z.string().min(1, 'District is required'),
  state: z.string().min(1, 'State is required'),
  contact_name: z.string().min(1, 'Contact name is required'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  status: z.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
});

const inventorySchema = z.object({
  blood_group_id: z.number().int().min(1, 'Blood group is required'),
  component: z.enum(['WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA']),
  blood_bank_location: z.string().min(1, 'Blood bank location is required'),
  units: z.number().int().min(0, 'Units must be non-negative'),
  collection_date: z.string().min(1, 'Collection date is required'),
  expiration_date: z.string().min(1, 'Expiration date is required'),
  status: z.enum(['AVAILABLE', 'RESERVED', 'EXPIRED', 'DISPOSED']).optional()
});

export async function getCamps(req, res, next) {
  try {
    const camps = await coordinatorService.getBloodCamps({
      ...req.query,
      isCoordinator: true
    });
    return res.status(200).json(camps);
  } catch (error) {
    next(error);
  }
}

export async function createCamp(req, res, next) {
  try {
    const validatedData = campSchema.parse(req.body);
    const camp = await coordinatorService.createBloodCamp(validatedData, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Blood camp successfully created.',
      camp
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid camp parameters.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function updateCamp(req, res, next) {
  try {
    const validatedData = campSchema.parse(req.body);
    const camp = await coordinatorService.updateBloodCamp(req.params.id, validatedData, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Blood camp successfully updated.',
      camp
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid camp parameters.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function deleteCamp(req, res, next) {
  try {
    const camp = await coordinatorService.deleteBloodCamp(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Blood camp successfully deactivated.',
      camp
    });
  } catch (error) {
    next(error);
  }
}

export async function getInventory(req, res, next) {
  try {
    const inventory = await coordinatorService.getBloodAvailability({
      ...req.query,
      isCoordinator: true
    });
    return res.status(200).json(inventory);
  } catch (error) {
    next(error);
  }
}

export async function createInventory(req, res, next) {
  try {
    const validatedData = inventorySchema.parse(req.body);
    const item = await coordinatorService.createBloodInventory(validatedData, req.user.id);
    return res.status(201).json({
      success: true,
      message: 'Blood inventory successfully created.',
      item
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid inventory parameters.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function updateInventory(req, res, next) {
  try {
    const validatedData = inventorySchema.parse(req.body);
    const item = await coordinatorService.updateBloodInventory(req.params.id, validatedData, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Blood inventory successfully updated.',
      item
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Invalid inventory parameters.',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function deleteInventory(req, res, next) {
  try {
    const item = await coordinatorService.deleteBloodInventory(req.params.id, req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Blood inventory successfully deleted.',
      item
    });
  } catch (error) {
    next(error);
  }
}

export async function getBloodGroups(req, res, next) {
  try {
    const groups = await coordinatorService.getBloodGroups();
    return res.status(200).json(groups);
  } catch (error) {
    next(error);
  }
}
