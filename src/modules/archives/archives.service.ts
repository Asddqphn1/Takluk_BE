import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db';
import { archiveQuestions, courses, videos } from '../../db/schema';
import type { ArchiveFilterQuery } from './archives.schema';

export class ArchiveService {
  /**
   * Mengambil daftar bank soal latihan arsip UTS/UAS.
   */
  async getQuestions(query: ArchiveFilterQuery) {
    const conditions = [];

    if (query.course_id) {
      conditions.push(eq(archiveQuestions.courseId, query.course_id));
    }
    if (query.university_tag) {
      conditions.push(eq(archiveQuestions.universityTag, query.university_tag));
    }
    if (query.exam_type) {
      conditions.push(eq(archiveQuestions.examType, query.exam_type));
    }

    const rows = await db
      .select({
        id: archiveQuestions.id,
        courseId: archiveQuestions.courseId,
        courseTitle: courses.title,
        courseSymbol: courses.symbol,
        universityTag: archiveQuestions.universityTag,
        examType: archiveQuestions.examType,
        academicYear: archiveQuestions.academicYear,
        questionMarkdown: archiveQuestions.questionMarkdown,
        optionsJson: archiveQuestions.optionsJson,
        relatedVideoId: archiveQuestions.relatedVideoId,
        createdAt: archiveQuestions.createdAt,
      })
      .from(archiveQuestions)
      .innerJoin(courses, eq(archiveQuestions.courseId, courses.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(archiveQuestions.createdAt));

    return rows;
  }

  /**
   * Evaluasi jawaban kuis pilihan ganda dan berikan pembahasan instan.
   */
  async evaluateAnswer(questionId: string, selectedKey: string) {
    const [question] = await db
      .select({
        id: archiveQuestions.id,
        correctKey: archiveQuestions.correctKey,
        explanationMd: archiveQuestions.explanationMd,
        relatedVideoId: archiveQuestions.relatedVideoId,
      })
      .from(archiveQuestions)
      .where(eq(archiveQuestions.id, questionId))
      .limit(1);

    if (!question) {
      throw new ArchiveError('QUESTION_NOT_FOUND', 'Soal latihan yang kamu pilih tidak ditemukan.', 404);
    }

    const isCorrect = question.correctKey.trim().toUpperCase() === selectedKey.trim().toUpperCase();

    return {
      question_id: question.id,
      selected_key: selectedKey,
      is_correct: isCorrect,
      correct_key: question.correctKey,
      explanation_md: question.explanationMd,
      related_video_id: question.relatedVideoId,
    };
  }
}

export class ArchiveError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: 400 | 404 = 400
  ) {
    super(message);
    this.name = 'ArchiveError';
  }
}

