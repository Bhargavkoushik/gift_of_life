import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(8, 'Phone number must be at least 8 characters long').max(50),
  password: z.string().min(6, 'Password must be at least 6 characters long').max(100),
});

export const loginSchema = z.object({
  email: z.string().min(1, 'Email or Phone is required'),
  password: z.string().min(1, 'Password is required'),
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
