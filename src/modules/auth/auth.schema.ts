import { z } from 'zod';

export const requestOtpSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
});

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email('Format email tidak valid')
    .max(255)
    .transform((val) => val.toLowerCase().trim()),
  otp_code: z
    .string()
    .length(6, 'Kode OTP harus 6 digit')
    .regex(/^\d{6}$/, 'Kode OTP harus berupa angka'),
  device_id: z
    .string()
    .min(1, 'Device ID wajib diisi')
    .max(255),
  full_name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(150)
    .optional(),
  nim: z
    .string()
    .min(5, 'NIM minimal 5 karakter')
    .max(50)
    .optional(),
  university: z
    .enum(['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA'])
    .optional(),
  semester: z
    .number()
    .int()
    .min(1)
    .max(14)
    .optional(),
  phone_number: z
    .string()
    .max(20)
    .optional()
    .nullable(),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
