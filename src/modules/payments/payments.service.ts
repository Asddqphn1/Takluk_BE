import { eq, and, sql, gt } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import { db } from '../../db';
import { transactions, vouchers, users } from '../../db/schema';
import { env } from '../../config/env';
import type { CreateQrisInput, MidtransWebhookPayload } from './payments.schema';

export class PaymentService {
  private readonly BASE_AMOUNT = 25000; // Harga langganan Takluk: Rp25.000 (INTEGER)

  /**
   * Membuat invoice transaksi langganan dan menghasilkan dynamic QRIS payload.
   */
  async createQris(userId: string, input: CreateQrisInput) {
    let discountAmount = 0;
    let appliedVoucherCode: string | null = null;

    // 1. Validasi voucher diskon jika disertakan oleh user
    if (input.voucher_code) {
      const voucherCode = input.voucher_code.trim().toUpperCase();

      const [voucher] = await db
        .select()
        .from(vouchers)
        .where(
          and(
            eq(vouchers.code, voucherCode),
            eq(vouchers.isActive, true),
            gt(vouchers.validUntil, new Date())
          )
        )
        .limit(1);

      if (!voucher) {
        throw new PaymentError(
          'VOUCHER_INVALID',
          'Kode voucher tidak ditemukan atau masa berlakunya telah berakhir.'
        );
      }

      if (voucher.usedCount >= voucher.maxQuota) {
        throw new PaymentError(
          'VOUCHER_QUOTA_EXCEEDED',
          'Yah, kuota pemakaian kode voucher ini sudah habis.'
        );
      }

      discountAmount = voucher.discountAmount;
      appliedVoucherCode = voucher.code;
    }

    const finalAmount = Math.max(0, this.BASE_AMOUNT - discountAmount);

    // 2. Buat nomor invoice unik (INV-TKL-YYYYMMDD-XXXXX)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const invoiceNumber = `INV-TKL-${dateStr}-${randomSuffix}`;

    // Batas waktu pembayaran 15 menit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 3. Request Dynamic QRIS ke Midtrans atau buat payload QRIS
    let qrisString = `00020101021226580016ID.CO.MIDTRANS.WWW0118936009110000000000520458125303360540${finalAmount}5802ID5914TAKLUK EDTECH6009PEKANBARU62070703A016304${invoiceNumber.slice(-4)}`;
    let externalPgId: string | null = null;

    const isMidtransLive =
      !env.MIDTRANS_SERVER_KEY.includes('dummy') &&
      !env.MIDTRANS_SERVER_KEY.includes('SB-Mid-server-xxxx');

    if (isMidtransLive && finalAmount > 0) {
      try {
        const midtransUrl = env.MIDTRANS_IS_PRODUCTION
          ? 'https://api.midtrans.com/v2/charge'
          : 'https://api.sandbox.midtrans.com/v2/charge';

        const authHeader = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString('base64');

        const midtransRes = await fetch(midtransUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          body: JSON.stringify({
            payment_type: 'qris',
            transaction_details: {
              order_id: invoiceNumber,
              gross_amount: finalAmount,
            },
            qris: {
              acquirer: 'gopay',
            },
            custom_expiry: {
              order_time: new Date().toISOString(),
              expiry_duration: 15,
              unit: 'minute',
            },
          }),
        });

        if (midtransRes.ok) {
          const midtransData = (await midtransRes.json()) as {
            transaction_id?: string;
            qr_string?: string;
          };
          if (midtransData.qr_string) {
            qrisString = midtransData.qr_string;
          }
          if (midtransData.transaction_id) {
            externalPgId = midtransData.transaction_id;
          }
        }
      } catch (pgError) {
        console.warn('[PAYMENTS] Midtrans API fallback to simulated payload:', pgError);
      }
    }

    // 4. Simpan transaksi ke database (status PENDING)
    const [trx] = await db
      .insert(transactions)
      .values({
        invoiceNumber,
        userId,
        voucherCode: appliedVoucherCode,
        baseAmount: this.BASE_AMOUNT,
        discountAmount,
        finalAmount,
        paymentStatus: 'PENDING',
        externalPgId,
        qrisString,
        expiresAt,
      })
      .returning();

    return {
      invoice_number: trx.invoiceNumber,
      base_amount: trx.baseAmount,
      discount_amount: trx.discountAmount,
      final_amount: trx.finalAmount,
      voucher_code: trx.voucherCode,
      payment_status: trx.paymentStatus,
      qris_string: trx.qrisString,
      expires_at: trx.expiresAt.toISOString(),
      expires_in_seconds: 900,
    };
  }

  /**
   * Webhook Handler dari Midtrans:
   * Memvalidasi signature SHA-512 dan memperbarui status secara atomic dengan DB Transaction.
   */
  async handleMidtransWebhook(payload: MidtransWebhookPayload) {
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status, transaction_id } =
      payload;

    // 1. Verifikasi Signature Midtrans: SHA512(order_id + status_code + gross_amount + ServerKey)
    const isMockOrDev =
      env.NODE_ENV === 'development' &&
      (signature_key === 'mock_signature_test' || env.MIDTRANS_SERVER_KEY.includes('dummy'));

    if (!isMockOrDev) {
      const expectedSignature = createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${env.MIDTRANS_SERVER_KEY}`)
        .digest('hex');

      if (signature_key !== expectedSignature) {
        throw new PaymentError('INVALID_SIGNATURE', 'Signature webhook Midtrans tidak sah.', 403);
      }
    }

    // 2. Ambil data transaksi
    const [trx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.invoiceNumber, order_id))
      .limit(1);

    if (!trx) {
      throw new PaymentError('TRANSACTION_NOT_FOUND', 'Invoice transaksi tidak ditemukan.', 404);
    }

    // Idempotensi: Jika transaksi sudah berstatus SUCCESS, jangan proses ulang
    if (trx.paymentStatus === 'SUCCESS') {
      return { status: 'ALREADY_PROCESSED', message: 'Transaksi sudah sukses sebelumnya.' };
    }

    // 3. Tentukan status baru berdasarkan status notifikasi Midtrans
    const isPaymentSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept');

    const isExpired = transaction_status === 'expire';
    const isFailed = transaction_status === 'cancel' || transaction_status === 'deny';

    if (isPaymentSuccess) {
      // 4. ATOMIC DATABASE TRANSACTION
      // Ubah status transaksi, naikkan used_count voucher, dan aktifkan masa langganan 30 hari
      await db.transaction(async (tx) => {
        // A. Update status transaksi menjadi SUCCESS
        await tx
          .update(transactions)
          .set({
            paymentStatus: 'SUCCESS',
            externalPgId: transaction_id ?? trx.externalPgId,
            paidAt: new Date(),
          })
          .where(eq(transactions.id, trx.id));

        // B. Jika menggunakan voucher, tingkatkan used_count
        if (trx.voucherCode) {
          await tx
            .update(vouchers)
            .set({
              usedCount: sql`${vouchers.usedCount} + 1`,
            })
            .where(eq(vouchers.code, trx.voucherCode));
        }

        // C. Perpanjang masa aktif langganan user selama 30 hari
        const [currentUser] = await tx
          .select({
            subscriptionValidUntil: users.subscriptionValidUntil,
          })
          .from(users)
          .where(eq(users.id, trx.userId))
          .limit(1);

        const currentExpiry =
          currentUser?.subscriptionValidUntil && currentUser.subscriptionValidUntil > new Date()
            ? new Date(currentUser.subscriptionValidUntil)
            : new Date();

        const newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);

        await tx
          .update(users)
          .set({
            subscriptionValidUntil: newExpiry,
            updatedAt: new Date(),
          })
          .where(eq(users.id, trx.userId));
      });

      return {
        status: 'SUCCESS',
        message: 'Pembayaran QRIS berhasil! Masa aktif langganan Takluk diperpanjang 30 hari.',
      };
    } else if (isExpired) {
      await db
        .update(transactions)
        .set({ paymentStatus: 'EXPIRED' })
        .where(eq(transactions.id, trx.id));

      return { status: 'EXPIRED', message: 'Batas waktu pembayaran QRIS telah kedaluwarsa.' };
    } else if (isFailed) {
      await db
        .update(transactions)
        .set({ paymentStatus: 'FAILED' })
        .where(eq(transactions.id, trx.id));

      return { status: 'FAILED', message: 'Pembayaran transaksi gagal.' };
    }

    return { status: trx.paymentStatus, message: 'Status transaksi tidak berubah.' };
  }

  /**
   * Mengambil status transaksi untuk polling ringan dari aplikasi mobile (Flutter).
   */
  async getTransactionStatus(invoiceNumber: string, userId: string) {
    const [trx] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.invoiceNumber, invoiceNumber), eq(transactions.userId, userId)))
      .limit(1);

    if (!trx) {
      throw new PaymentError('TRANSACTION_NOT_FOUND', 'Invoice transaksi tidak ditemukan.', 404);
    }

    const [user] = await db
      .select({ subscriptionValidUntil: users.subscriptionValidUntil })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      invoice_number: trx.invoiceNumber,
      payment_status: trx.paymentStatus,
      is_paid: trx.paymentStatus === 'SUCCESS',
      paid_at: trx.paidAt ? trx.paidAt.toISOString() : null,
      final_amount: trx.finalAmount,
      expires_at: trx.expiresAt.toISOString(),
      subscription_valid_until: user?.subscriptionValidUntil
        ? user.subscriptionValidUntil.toISOString()
        : null,
    };
  }

  /**
   * Mengambil riwayat transaksi pembayaran pengguna.
   */
  async getTransactionHistory(userId: string) {
    const list = await db
      .select({
        id: transactions.id,
        invoice_number: transactions.invoiceNumber,
        base_amount: transactions.baseAmount,
        discount_amount: transactions.discountAmount,
        final_amount: transactions.finalAmount,
        voucher_code: transactions.voucherCode,
        payment_status: transactions.paymentStatus,
        paid_at: transactions.paidAt,
        created_at: transactions.createdAt,
        expires_at: transactions.expiresAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.createdAt} DESC`);

    return list.map((item) => ({
      ...item,
      paid_at: item.paid_at ? item.paid_at.toISOString() : null,
      created_at: item.created_at.toISOString(),
      expires_at: item.expires_at.toISOString(),
    }));
  }
}

export class PaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 403 | 404 = 400
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
