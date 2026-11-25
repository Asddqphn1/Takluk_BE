import { eq, and, asc, isNull, or } from 'drizzle-orm';
import { db } from '../../db';
import { courses, videos, videoChapters, users, tutors } from '../../db/schema';
import { generateBunnySignedHlsUrl } from '../../utils/bunny';
import type { VideoFilterQuery } from './courses.schema';

export class CourseService {
  /**
   * Mengambil semua katalog mata kuliah yang aktif/tayang.
   */
  async getCourses() {
    return await db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        symbol: courses.symbol,
        semesterTarget: courses.semesterTarget,
        description: courses.description,
        sortOrder: courses.sortOrder,
      })
      .from(courses)
      .where(eq(courses.isPublished, true))
      .orderBy(asc(courses.sortOrder));
  }

  /**
   * Mengambil daftar video berdasarkan filter course_id, category, dan university_tag.
   */
  async getVideos(query: VideoFilterQuery) {
    const conditions = [eq(videos.isPublished, true)];

    if (query.course_id) {
      conditions.push(eq(videos.courseId, query.course_id));
    }
    if (query.category) {
      conditions.push(eq(videos.category, query.category));
    }
    if (query.university_tag) {
      conditions.push(eq(videos.universityTag, query.university_tag));
    }

    const rows = await db
      .select({
        id: videos.id,
        courseId: videos.courseId,
        courseTitle: courses.title,
        courseSymbol: courses.symbol,
        tutorName: users.fullName,
        tutorBio: tutors.bioTitle,
        title: videos.title,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        isFree: videos.isFree,
        sortOrder: videos.sortOrder,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .innerJoin(courses, eq(videos.courseId, courses.id))
      .innerJoin(tutors, eq(videos.tutorId, tutors.id))
      .innerJoin(users, eq(tutors.userId, users.id))
      .where(and(...conditions))
      .orderBy(asc(videos.sortOrder), asc(videos.createdAt));

    return rows;
  }

  /**
   * Mengambil detail satu video (metadata, tutor, bab/chapters, dan catatan rumus)
   * tanpa menerbitkan token pemutaran stream.
   */
  async getVideoDetail(videoId: string) {
    const [video] = await db
      .select({
        id: videos.id,
        courseId: videos.courseId,
        courseTitle: courses.title,
        courseSymbol: courses.symbol,
        tutorId: tutors.id,
        tutorName: users.fullName,
        tutorBio: tutors.bioTitle,
        title: videos.title,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        summaryMarkdown: videos.summaryMarkdown,
        isFree: videos.isFree,
        isPublished: videos.isPublished,
        sortOrder: videos.sortOrder,
        createdAt: videos.createdAt,
      })
      .from(videos)
      .innerJoin(courses, eq(videos.courseId, courses.id))
      .innerJoin(tutors, eq(videos.tutorId, tutors.id))
      .innerJoin(users, eq(tutors.userId, users.id))
      .where(and(eq(videos.id, videoId), eq(videos.isPublished, true)))
      .limit(1);

    if (!video) {
      throw new CourseError('VIDEO_NOT_FOUND', 'Video materi yang kamu cari tidak ditemukan atau belum tayang.', 404);
    }

    const chapters = await db
      .select({
        id: videoChapters.id,
        title: videoChapters.title,
        startSecond: videoChapters.startSecond,
        sortOrder: videoChapters.sortOrder,
      })
      .from(videoChapters)
      .where(eq(videoChapters.videoId, video.id))
      .orderBy(asc(videoChapters.sortOrder), asc(videoChapters.startSecond));

    return {
      ...video,
      chapters: chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        start_second: ch.startSecond,
        sort_order: ch.sortOrder,
      })),
    };
  }

  /**
   * Endpoint Play Video: Memeriksa hak akses sebelum memberikan Bunny.net Stream Signed URL.
   */
  async getPlayVideo(videoId: string, userId: string) {
    // 1. Ambil data video
    const [video] = await db
      .select({
        id: videos.id,
        courseId: videos.courseId,
        title: videos.title,
        category: videos.category,
        universityTag: videos.universityTag,
        durationSeconds: videos.durationSeconds,
        cfVideoUid: videos.cfVideoUid,
        summaryMarkdown: videos.summaryMarkdown,
        isFree: videos.isFree,
        isPublished: videos.isPublished,
      })
      .from(videos)
      .where(and(eq(videos.id, videoId), eq(videos.isPublished, true)))
      .limit(1);

    if (!video) {
      throw new CourseError('VIDEO_NOT_FOUND', 'Video materi yang kamu cari tidak ditemukan atau belum tayang.', 404);
    }

    // 2. Cek apakah video berbayar dan user belum berlangganan
    if (!video.isFree) {
      const [user] = await db
        .select({
          subscriptionValidUntil: users.subscriptionValidUntil,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isSubscribed =
        user?.subscriptionValidUntil && new Date(user.subscriptionValidUntil) > new Date();

      if (!isSubscribed) {
        throw new CourseError(
          'PAYMENT_REQUIRED',
          'Materi ini khusus untuk pelanggan Takluk. Yuk, langganan sekarang cuma Rp25.000/bulan!',
          402
        );
      }
    }

    // 3. Ambil bab materi video (video_chapters)
    const chapters = await db
      .select({
        id: videoChapters.id,
        title: videoChapters.title,
        startSecond: videoChapters.startSecond,
        sortOrder: videoChapters.sortOrder,
      })
      .from(videoChapters)
      .where(eq(videoChapters.videoId, video.id))
      .orderBy(asc(videoChapters.sortOrder), asc(videoChapters.startSecond));

    // 4. Generate Bunny.net Stream Signed HLS URL & Embed Player URL (berlaku 2 jam)
    const bunnyStream = generateBunnySignedHlsUrl(video.cfVideoUid, 7200);

    return {
      video_id: video.id,
      title: video.title,
      category: video.category,
      university_tag: video.universityTag,
      duration_seconds: video.durationSeconds,
      is_free: video.isFree,
      hls_stream_url: bunnyStream.hls_url,
      embed_player_url: bunnyStream.embed_url,
      thumbnail_url: bunnyStream.thumbnail_url,
      expires_in_seconds: 7200,
      summary_markdown: video.summaryMarkdown,
      chapters: chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        start_second: ch.startSecond,
        sort_order: ch.sortOrder,
      })),
    };
  }
}

export class CourseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 402 | 404 = 400
  ) {
    super(message);
    this.name = 'CourseError';
  }
}

