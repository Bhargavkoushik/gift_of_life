import * as authService from './service.js';
import { registerSchema, loginSchema, becomeDonorSchema, becomeReceiverSchema } from './validation.js';

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
