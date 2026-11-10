import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createQrisSchema, midtransWebhookSchema } from './payments.schema';
import { PaymentService, PaymentError } from './payments.service';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { deviceMiddleware } from '../../middlewares/device.middleware';
import { successResponse, errorResponse } from '../../utils/api-response';
import type { JwtPayload } from '../../utils/jwt';

const payments = new Hono();
const paymentService = new PaymentService();

// POST /api/payments/qris — Request invoice & Dynamic QRIS
payments.post(
  '/qris',
  authMiddleware,
  deviceMiddleware,
  zValidator('json', createQrisSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Format data checkout QRIS tidak valid.', 422);
    }
  }),
  async (c) => {
    const input = c.req.valid('json');
    const payload = c.get('jwtPayload') as JwtPayload;

    try {
      const trx = await paymentService.createQris(payload.sub, input);
      return successResponse(
        c,
        trx,
        'Invoice QRIS berhasil dibuat! Silakan bayar dalam 15 menit ya.',
        201
      );
    } catch (err) {
      if (err instanceof PaymentError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[PAYMENTS] createQris error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal membuat tagihan QRIS. Coba lagi nanti ya!', 500);
    }
  }
);

// GET /api/payments/history — Riwayat transaksi pembayaran pengguna
payments.get('/history', authMiddleware, deviceMiddleware, async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const list = await paymentService.getTransactionHistory(payload.sub);
    return successResponse(c, list, 'Riwayat transaksi berhasil dimuat.');
  } catch (err) {
    console.error('[PAYMENTS] history error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat riwayat transaksi.', 500);
  }
});

// GET /api/payments/:invoice_number/status — Polling status pembayaran QRIS
payments.get('/:invoice_number/status', authMiddleware, deviceMiddleware, async (c) => {
  const invoiceNumber = c.req.param('invoice_number');
  const payload = c.get('jwtPayload') as JwtPayload;

  try {
    const status = await paymentService.getTransactionStatus(invoiceNumber, payload.sub);
    return successResponse(c, status, 'Status transaksi berhasil dicek.');
  } catch (err) {
    if (err instanceof PaymentError) {
      return errorResponse(c, err.code, err.message, err.status);
    }
    console.error('[PAYMENTS] status error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal mengecek status transaksi.', 500);
  }
});

// POST /api/payments/webhook — Webhook verifikasi lunas dari Midtrans
payments.post(
  '/webhook',
  zValidator('json', midtransWebhookSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(c, 'VALIDATION_ERROR', 'Payload notifikasi webhook tidak valid.', 422);
    }
  }),
  async (c) => {
    const webhookData = c.req.valid('json');

    try {
      const result = await paymentService.handleMidtransWebhook(webhookData);
      return successResponse(c, result, result.message);
    } catch (err) {
      if (err instanceof PaymentError) {
        return errorResponse(c, err.code, err.message, err.status);
      }
      console.error('[PAYMENTS] webhook error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memproses webhook pembayaran.', 500);
    }
  }
);

export default payments;

