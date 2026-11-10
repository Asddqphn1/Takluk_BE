import { z } from 'zod';

export const createQrisSchema = z.object({
  voucher_code: z
    .string()
    .max(30)
    .trim()
    .toUpperCase()
    .optional(),
});

export const midtransWebhookSchema = z.object({
  order_id: z.string(),
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),
  transaction_id: z.string().optional(),
});

export type CreateQrisInput = z.infer<typeof createQrisSchema>;
export type MidtransWebhookPayload = z.infer<typeof midtransWebhookSchema>;

