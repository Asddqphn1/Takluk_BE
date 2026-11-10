import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { successResponse, errorResponse } from '../../utils/api-response';

const admin = new Hono();

// Pool Royalti Bulanan Takluk untuk Tutor Sebaya: Rp3.500.000
const MONTHLY_ROYALTY_POOL = 3500000;

// GET /api/admin/royalties/monthly — Laporan royalti tutor bulanan berdasarkan durasi tonton
admin.get('/royalties/monthly', async (c) => {
  try {
    const rawResult = await db.execute(sql`
      SELECT 
        t.id AS tutor_id,
        u.full_name AS tutor_name,
        COALESCE(SUM(wh.total_watched_sec), 0)::BIGINT AS total_watched_seconds,
        ROUND(COALESCE(SUM(wh.total_watched_sec), 0) / 60.0, 2) AS total_minutes_watched
      FROM tutors t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN videos v ON v.tutor_id = t.id
      LEFT JOIN watch_histories wh ON wh.video_id = v.id
      GROUP BY t.id, u.full_name
      ORDER BY total_watched_seconds DESC;
    `);

    const rows = (rawResult as unknown as Array<{
      tutor_id: string;
      tutor_name: string;
      total_watched_seconds: string | number;
      total_minutes_watched: string | number;
    }>) || [];

    const totalSystemSeconds = rows.reduce(
      (acc, r) => acc + Number(r.total_watched_seconds || 0),
      0
    );

    const tutorReport = rows.map((r) => {
      const watchedSec = Number(r.total_watched_seconds || 0);
      const sharePercentage =
        totalSystemSeconds > 0 ? (watchedSec / totalSystemSeconds) * 100 : 0;
      const estimatedPayout =
        totalSystemSeconds > 0
          ? Math.round((watchedSec / totalSystemSeconds) * MONTHLY_ROYALTY_POOL)
          : 0;

      return {
        tutor_id: r.tutor_id,
        tutor_name: r.tutor_name,
        total_watched_seconds: watchedSec,
        total_minutes_watched: Number(r.total_minutes_watched),
        share_percentage: Number(sharePercentage.toFixed(2)),
        estimated_payout_idr: estimatedPayout,
      };
    });

    return successResponse(
      c,
      {
        pool_royalty_idr: MONTHLY_ROYALTY_POOL,
        total_system_watched_minutes: Number((totalSystemSeconds / 60).toFixed(2)),
        tutors_count: tutorReport.length,
        tutors: tutorReport,
      },
      'Laporan bagi hasil royalti tutor berhasil dihitung.'
    );
  } catch (err) {
    console.error('[ADMIN] royalties error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal menghitung royalti tutor.', 500);
  }
});

export default admin;

