import * as authService from './service.js';
import { registerSchema, loginSchema, becomeDonorSchema, becomeReceiverSchema, becomeCoordinatorSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from './validation.js';
import pool from '../../database/connection.js';
import * as donorService from '../donors/service.js';
import jwt from 'jsonwebtoken';

export async function register(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.registerUser(validatedData);
    return res.status(201).json({
      message: 'Registration successful',
      user
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const data = await authService.loginUser(validatedData);
    return res.status(200).json({
      message: 'Login successful',
      token: data.token,
      user: data.user
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function becomeDonor(req, res, next) {
  try {
    const validatedData = becomeDonorSchema.parse(req.body);
    const result = await authService.becomeDonor(req.user.id, validatedData);
    return res.status(200).json({
      message: 'Successfully registered as donor',
      ...result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function becomeReceiver(req, res, next) {
  try {
    const validatedData = becomeReceiverSchema.parse(req.body);
    const result = await authService.becomeReceiver(req.user.id, validatedData);
    return res.status(200).json({
      message: 'Successfully registered as receiver',
      ...result
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const validatedData = forgotPasswordSchema.parse(req.body);
    const result = await authService.requestPasswordReset(validatedData);
    return res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_IDENTIFIER',
        message: 'Please provide a valid email or phone number.'
      });
    }
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const result = await authService.resetUserPassword(validatedData);
    return res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_RESET_DATA',
        message: 'New password must satisfy all password requirements and passwords must match.'
      });
    }
    next(error);
  }
}

export async function changePassword(req, res, next) {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const result = await authService.changeUserPassword(req.user.id, validatedData);
    return res.status(200).json(result);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CHANGE_DATA',
        message: 'New password must satisfy all password requirements and passwords must match.'
      });
    }
    next(error);
  }
}

export async function validateInvitation(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    const invitation = await authService.validateInvitationToken(token);
    return res.status(200).json({ invitation });
  } catch (error) {
    next(error);
  }
}

export async function acceptInvitation(req, res, next) {
  try {
    const { token, password, phone, employee_id, notes, id_card_image } = req.body;
    if (!token || !password || !phone) {
      return res.status(400).json({ message: 'Token, password, and phone are required' });
    }
    const result = await authService.acceptInvitationAndSubmitVerification({
      token, password, phone, employee_id, notes, id_card_image
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (phone && !/^\+?[0-9\s-]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: 'Please provide a valid phone number' });
    }
    const result = await authService.updateUserProfile(req.user.id, { name, phone });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const actorId = req.user.id;
    await authService.logoutUser(actorId);
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
}

export async function getSetupStatus(req, res, next) {
  try {
    const isSetupClosed = await authService.checkSetupStatus();
    return res.status(200).json({ isSetupClosed });
  } catch (error) {
    next(error);
  }
}

export async function setupSuperAdmin(req, res, next) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.setupSuperAdmin(validatedData);
    return res.status(201).json({
      message: 'Super Admin setup completed successfully',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors
      });
    }
    next(error);
  }
}

export async function googleFormCallback(req, res, next) {
  try {
    const { request_reference, donor_id, form_data } = req.body;

    // 0. Callback Secret Verification
    const authHeader = req.headers.authorization;
    const expectedSecret = process.env.GOOGLE_FORM_CALLBACK_SECRET;
    if (expectedSecret) {
      if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({
          success: false,
          code: 'UNAUTHORIZED_CALLBACK',
          message: 'Unauthorized. Invalid or missing callback secret key.'
        });
      }
    }

    if (!request_reference || !donor_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing request_reference or donor_id.'
      });
    }

    const parts = request_reference.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request_reference format.'
      });
    }
    const hash = parts[2].toLowerCase();

    // 1. Find matching request
    const requestRes = await pool.query(
      `SELECT id, status FROM blood_requests 
       WHERE id::text LIKE $1 
         AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`,
      [`${hash}%`]
    );

    if (requestRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching eligible blood request found.'
      });
    }
    const request = requestRes.rows[0];

    // Check if the request has already been claimed by another active accepted response
    const activeResponseRes = await pool.query(
      `SELECT id FROM donor_responses WHERE request_id = $1 AND response_status = 'ACCEPTED'`,
      [request.id]
    );
    if (activeResponseRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        code: 'REQUEST_ALREADY_CLAIMED',
        message: 'This blood request has already been claimed by another active donor.'
      });
    }

    // 2. Validate and Decrypt signed donor token
    let donorProfileId = donor_id;
    try {
      const decoded = jwt.verify(donor_id, process.env.JWT_SECRET || 'fallback-secret');
      donorProfileId = decoded.donor_profile_id;
      
      // Request association verification
      if (decoded.request_id !== request.id) {
        return res.status(400).json({
          success: false,
          code: 'TOKEN_REQUEST_MISMATCH',
          message: 'Invalid callback parameters. Token request reference mismatch.'
        });
      }
    } catch (err) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_DONOR_TOKEN',
        message: 'The donor reference token is invalid, expired, or has been tampered with.'
      });
    }

    // 3. Find user_id from donorProfileId
    const donorRes = await pool.query(
      `SELECT user_id FROM donor_profiles WHERE id = $1`,
      [donorProfileId]
    );

    if (donorRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching donor profile found.'
      });
    }
    const userId = donorRes.rows[0].user_id;

    // 4. Process the acceptance response using donorService
    const result = await donorService.respondToRequest(
      userId,
      request.id,
      'ACCEPTED',
      `Google Form submitted context: ${JSON.stringify(form_data || {})}`
    );

    return res.status(200).json({
      success: true,
      message: 'Donor response successfully marked as ACCEPTED.',
      result
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'This blood request has already been claimed by another active donor.'
      });
    }
    next(error);
  }
}

export async function sendVerificationCode(req, res, next) {
  try {
    const { method } = req.body;
    if (!method || !['EMAIL', 'SMS'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification method. Select EMAIL or SMS.'
      });
    }

    const result = await authService.sendVerificationCode(req.user.id, method);
    return res.status(200).json({
      success: true,
      message: 'Verification code sent successfully.',
      ...result
    });
  } catch (error) {
    if (error.code === 'COOLDOWN_ACTIVE') {
      return res.status(429).json({
        success: false,
        code: 'COOLDOWN_ACTIVE',
        message: error.message,
        cooldown_seconds: error.cooldown_seconds
      });
    }
    next(error);
  }
}

export async function verifyCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be exactly 6 digits.'
      });
    }

    const result = await authService.verifyCode(req.user.id, code);
    return res.status(200).json({
      success: true,
      message: 'Account verified successfully.',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    if (error.code === 'INVALID_CODE') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_CODE',
        message: error.message,
        attempts_remaining: error.attempts_remaining
      });
    }
    if (error.code === 'OTP_EXPIRED' || error.code === 'ATTEMPTS_EXCEEDED') {
      return res.status(400).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
}

export async function getAuthConfig(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      sms_enabled: !!process.env.SMS_PROVIDER
    });
  } catch (error) {
    next(error);
  }
}

