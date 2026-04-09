import { z } from 'zod'

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Name is required').max(100),
  company: z.string().min(2, 'Company name is required').max(100),
  designation: z.string().min(2, 'Designation is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  address: z.string().min(5, 'Address is required').max(300),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const sampleSchema = z.object({
  sample_type: z.union([
    z.literal('soil'),
    z.literal('rock'),
    z.literal('water'),
  ]),
  test_required: z.string().min(3, 'Please describe the test required').max(500),
  num_parcels: z.number().int().min(1, 'At least 1 parcel required'),
  weight_kg: z.number().positive('Weight must be greater than 0'),
  pickup_date: z.string().min(1, 'Please select a pickup date'),
  pickup_time: z.string().min(1, 'Please select a pickup time'),
})

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export type RegisterForm = z.infer<typeof registerSchema>
export type LoginForm = z.infer<typeof loginSchema>
export type SampleForm = z.infer<typeof sampleSchema>