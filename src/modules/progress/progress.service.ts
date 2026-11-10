import { eq, and, sql, desc } from 'drizzle-orm';
import { db } from '../../db';
import { watchHistories, videos, courses, tutors, users } from '../../db/schema';
import type { SyncProgressInput } from './progress.schema';

export class ProgressService {
  /**
   * Sync riwayat tontonan, progres detik terakhir, royalti tonton, dan bookmark
   * menggunakan klausa ON CONFLICT DO UPDATE.
   */
  async syncProgress(userId: string, input: SyncProgressInput) {
    // 1. Cari durasi video untuk penentuan status is_completed (>= 85%)
    const [video] = await db
      .select({
        id: videos.id,
        durationSeconds: videos.durationSeconds,
      })
      .from(videos)
      .where(eq(videos.id, input.video_id))
      .limit(1);

    if (!video) {
      throw new ProgressError('VIDEO_NOT_FOUND', 'Video yang ditonton tidak ditemukan.', 404);
    }

    const isCompletedNow = input.last_position_sec >= Math.floor(video.durationSeconds * 0.85);

    // 2. Lakukan Upsert Atomic ke tabel watch_histories
    const [record] = await db
      .insert(watchHistories)
      .values({
        userId,
        videoId: input.video_id,
        lastPositionSec: input.last_position_sec,
        totalWatchedSec: input.watched_delta_sec,
        isCompleted: isCompletedNow,
        isBookmarked: input.is_bookmarked ?? false,
        lastWatchedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [watchHistories.userId, watchHistories.videoId],
        set: {
          lastPositionSec: input.last_position_sec,
          totalWatchedSec: sql`${watchHistories.totalWatchedSec} + ${input.watched_delta_sec}`,
          isCompleted: sql`(${watchHistories.isCompleted} OR ${isCompletedNow})`,
          isBookmarked:
            input.is_bookmarked !== undefined
              ? input.is_bookmarked
              : sql`${watchHistories.isBookmarked}`,
          lastWatchedAt: new Date(),
        },
      })
      .returning();

    return {
      video_id: record.videoId,
      last_position_sec: record.lastPositionSec,
      total_watched_sec: record.totalWatchedSec,
      is_completed: record.isCompleted,
      is_bookmarked: record.isBookmarked,
      last_watched_at: record.lastWatchedAt.toISOString(),
    };
  }

  /**
   * Mengambil daftar video "Lanjut Menonton" untuk beranda.
   */
  async getResumeWatching(userId: string) {
    const list = await db
      .select({
        id: videos.id,
        title: videos.title,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        courseTitle: courses.title,
        courseSymbol: courses.symbol,
        lastPositionSec: watchHistories.lastPositionSec,
        isCompleted: watchHistories.isCompleted,
        lastWatchedAt: watchHistories.lastWatchedAt,
      })
      .from(watchHistories)
      .innerJoin(videos, eq(watchHistories.videoId, videos.id))
      .innerJoin(courses, eq(videos.courseId, courses.id))
      .where(and(eq(watchHistories.userId, userId), eq(watchHistories.isCompleted, false)))
      .orderBy(desc(watchHistories.lastWatchedAt))
      .limit(5);

    return list;
  }

  /**
   * Mengambil daftar materi yang disimpan (Bookmark).
   */
  async getBookmarks(userId: string) {
    const list = await db
      .select({
        id: videos.id,
        title: videos.title,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        isFree: videos.isFree,
        courseTitle: courses.title,
        courseSymbol: courses.symbol,
        tutorName: users.fullName,
        lastPositionSec: watchHistories.lastPositionSec,
        isCompleted: watchHistories.isCompleted,
        lastWatchedAt: watchHistories.lastWatchedAt,
      })
      .from(watchHistories)
      .innerJoin(videos, eq(watchHistories.videoId, videos.id))
      .innerJoin(courses, eq(videos.courseId, courses.id))
      .innerJoin(tutors, eq(videos.tutorId, tutors.id))
      .innerJoin(users, eq(tutors.userId, users.id))
      .where(and(eq(watchHistories.userId, userId), eq(watchHistories.isBookmarked, true)))
      .orderBy(desc(watchHistories.lastWatchedAt));

    return list;
  }
}

export class ProgressError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 404 = 400
  ) {
    super(message);
    this.name = 'ProgressError';
  }
}

