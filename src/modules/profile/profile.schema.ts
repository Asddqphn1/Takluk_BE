import { z } from 'zod';

export const updateProfileSchema = z.object({
  phone_number: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid (contoh: 081234567890)')
    .optional(),
  semester: z
    .number()
    .int('Semester harus berupa bilangan bulat')
    .min(1, 'Semester minimal 1')
    .max(14, 'Semester maksimal 14')
    .optional(),
  major: z
    .string()
    .min(2, 'Nama program studi minimal 2 karakter')
    .max(100, 'Nama program studi maksimal 100 karakter')
    .optional(),
});

export const resetDeviceSchema = z.object({
  new_device_id: z.string().min(4, 'ID perangkat baru minimal 4 karakter'),
  otp_code: z.string().length(6, 'Kode OTP harus 6 digit angka').regex(/^\d{6}$/, 'OTP harus berupa angka').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ResetDeviceInput = z.infer<typeof resetDeviceSchema>;

