import { Hono } from 'hono';
import { sql, desc, eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '../../db';
import { courses, videos, videoChapters, tutors, users } from '../../db/schema';
import { successResponse, errorResponse } from '../../utils/api-response';
import { generateBunnySignedHlsUrl } from '../../utils/bunny';

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

// Schema pendaftaran video materi baru oleh tim tech
const createVideoSchema = z.object({
  course_id: z.string().uuid('ID Mata kuliah harus berupa UUID yang valid'),
  tutor_id: z.string().uuid('ID Tutor harus berupa UUID yang valid'),
  title: z.string().min(3, 'Judul video minimal 3 karakter').max(200),
  category: z.enum(['MATERI', 'UTS', 'UAS']).default('MATERI'),
  university_tag: z.enum(['UNRI', 'UIN_SUSKA', 'PCR', 'UIR']).optional(),
  duration_seconds: z.coerce.number().int().positive('Durasi video dalam detik harus positif'),
  bunny_video_id: z.string().min(5, 'Bunny Video ID (GUID) wajib diisi dari panel Bunny.net'),
  summary_markdown: z.string().optional(),
  is_free: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  chapters: z
    .array(
      z.object({
        title: z.string().min(2, 'Judul bab minimal 2 karakter'),
        start_second: z.number().int().min(0, 'Detik mulai bab minimal 0'),
        sort_order: z.number().int().default(0),
      })
    )
    .optional(),
});

// POST /api/admin/videos — Daftarkan metadata video yang sudah di-upload di panel Bunny.net
admin.post(
  '/videos',
  zValidator('json', createVideoSchema, (result, c) => {
    if (!result.success) {
      return errorResponse(
        c,
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'Data pendaftaran video tidak valid.',
        422
      );
    }
  }),
  async (c) => {
    const input = c.req.valid('json');

    try {
      // 1. Validasi apakah course dan tutor terdaftar
      const [course] = await db
        .select({ id: courses.id, title: courses.title })
        .from(courses)
        .where(eq(courses.id, input.course_id))
        .limit(1);

      if (!course) {
        return errorResponse(c, 'COURSE_NOT_FOUND', 'Mata kuliah tidak ditemukan.', 404);
      }

      const [tutor] = await db
        .select({ id: tutors.id })
        .from(tutors)
        .where(eq(tutors.id, input.tutor_id))
        .limit(1);

      if (!tutor) {
        return errorResponse(c, 'TUTOR_NOT_FOUND', 'Tutor pengajar tidak ditemukan.', 404);
      }

      // 2. Simpan video ke tabel videos (simpan Bunny Video ID ke kolom cfVideoUid)
      const [newVideo] = await db
        .insert(videos)
        .values({
          courseId: input.course_id,
          tutorId: input.tutor_id,
          title: input.title,
          category: input.category,
          universityTag: input.university_tag,
          durationSeconds: input.duration_seconds,
          cfVideoUid: input.bunny_video_id,
          summaryMarkdown: input.summary_markdown,
          isFree: input.is_free,
          sortOrder: input.sort_order,
          isPublished: true,
        })
        .returning();

      // 3. Simpan bab materi jika disertakan
      if (input.chapters && input.chapters.length > 0) {
        await db.insert(videoChapters).values(
          input.chapters.map((ch, index) => ({
            videoId: newVideo.id,
            title: ch.title,
            startSecond: ch.start_second,
            sortOrder: ch.sort_order ?? index + 1,
          }))
        );
      }

      // Preview link streaming
      const bunnyPreview = generateBunnySignedHlsUrl(newVideo.cfVideoUid, 7200);

      return successResponse(
        c,
        {
          video_id: newVideo.id,
          title: newVideo.title,
          course_title: course.title,
          category: newVideo.category,
          duration_seconds: newVideo.durationSeconds,
          is_free: newVideo.isFree,
          bunny_video_id: newVideo.cfVideoUid,
          hls_preview_url: bunnyPreview.hls_url,
          embed_preview_url: bunnyPreview.embed_url,
          thumbnail_url: bunnyPreview.thumbnail_url,
        },
        'Video materi berhasil didaftarkan dan siap diakses mahasiswa!',
        201
      );
    } catch (err) {
      console.error('[ADMIN] createVideo error:', err);
      return errorResponse(c, 'INTERNAL_ERROR', 'Gagal mendaftarkan video materi baru.', 500);
    }
  }
);

// GET /api/admin/videos — Daftar seluruh video yang terdaftar di sistem
admin.get('/videos', async (c) => {
  try {
    const list = await db
      .select({
        id: videos.id,
        title: videos.title,
        courseTitle: courses.title,
        tutorName: users.fullName,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        bunnyVideoId: videos.cfVideoUid,
        isFree: videos.isFree,
        isPublished: videos.isPublished,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .innerJoin(courses, eq(videos.courseId, courses.id))
      .innerJoin(tutors, eq(videos.tutorId, tutors.id))
      .innerJoin(users, eq(tutors.userId, users.id))
      .orderBy(desc(videos.createdAt));

    return successResponse(c, list, 'Daftar video materi berhasil dimuat.');
  } catch (err) {
    console.error('[ADMIN] getAdminVideos error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat daftar video.', 500);
  }
});

// GET /api/admin/metadata-helpers — Helper ID Mata Kuliah & Tutor untuk mempermudah pendaftaran video
admin.get('/metadata-helpers', async (c) => {
  try {
    const coursesList = await db
      .select({ id: courses.id, title: courses.title, symbol: courses.symbol })
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(asc(courses.sortOrder));

    const tutorsList = await db
      .select({
        id: tutors.id,
        tutorName: users.fullName,
        bioTitle: tutors.bioTitle,
      })
      .from(tutors)
      .innerJoin(users, eq(tutors.userId, users.id))
      .where(eq(tutors.isActive, true));

    return successResponse(
      c,
      {
        courses: coursesList,
        tutors: tutorsList,
      },
      'Data helper mata kuliah & tutor berhasil dimuat.'
    );
  } catch (err) {
    console.error('[ADMIN] metadata-helpers error:', err);
    return errorResponse(c, 'INTERNAL_ERROR', 'Gagal memuat helper metadata.', 500);
  }
});

export default admin;

