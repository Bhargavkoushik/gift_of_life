import { z } from 'zod';

const passwordComplexity = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password must be at most 100 characters long')
  .refine((val) => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
  .refine((val) => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
  .refine((val) => /[0-9]/.test(val), 'Password must contain at least one number')
  .refine((val) => /[^a-zA-Z0-9]/.test(val), 'Password must contain at least one special character');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').max(50),
  password: passwordComplexity,
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Email or phone number is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordComplexity,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordComplexity,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const becomeDonorSchema = z.object({
  blood_group_id: z.number().int().positive('Invalid blood group ID'),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
  gender: z.string().min(1, 'Gender is required').max(50),
  phone: z.string().max(50).optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  area: z.string().min(1, 'Area is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().min(4, 'Pincode must be at least 4 characters long').max(20),
});

export const becomeReceiverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(255).optional(),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').max(50).optional(),
  address: z.string().min(5, 'Address must be at least 5 characters long'),
  area: z.string().min(1, 'Area is required').max(100),
  district: z.string().min(1, 'District is required').max(100),
  state: z.string().min(1, 'State is required').max(100),
  pincode: z.string().min(4, 'Pincode must be at least 4 characters long').max(20),
  receiver_type: z.enum(['INDIVIDUAL', 'PATIENT_ATTENDANT', 'HOSPITAL']).default('INDIVIDUAL'),
});

export const becomeCoordinatorSchema = z.object({
  area: z.string().min(2, 'Area must be at least 2 characters long').max(100),
  district: z.string().min(2, 'District must be at least 2 characters long').max(100),
  state: z.string().min(2, 'State must be at least 2 characters long').max(100)
});
