import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  char,
  jsonb,
  numeric,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════
// 1. ENUMS
// ═══════════════════════════════════════════
export const universityEnum = pgEnum('university_enum', [
  'UNRI',
  'UIN_SUSKA',
  'PCR',
  'UIR',
  'UMRI',
  'LAINNYA',
]);
export const videoCategoryEnum = pgEnum('video_category_enum', ['MATERI', 'UTS', 'UAS']);
export const examTypeEnum = pgEnum('exam_type_enum', ['UTS', 'UAS']);
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'EXPIRED',
]);
export const userRoleEnum = pgEnum('user_role_enum', ['STUDENT', 'TUTOR', 'ADMIN']);

// ═══════════════════════════════════════════
// 2. USERS TABLE
// ═══════════════════════════════════════════
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    fullName: varchar('full_name', { length: 150 }).notNull(),
    nim: varchar('nim', { length: 50 }).notNull(),
    university: universityEnum('university').default('UIN_SUSKA').notNull(),
    semester: smallint('semester').default(1).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    role: userRoleEnum('role').default('STUDENT').notNull(),
    activeDeviceId: varchar('active_device_id', { length: 255 }),
    deviceUpdatedAt: timestamp('device_updated_at', { withTimezone: true }),
    referralCode: varchar('referral_code', { length: 20 }).notNull().unique(),
    referredById: uuid('referred_by_id'),
    subscriptionValidUntil: timestamp('subscription_valid_until', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('idx_users_email').on(table.email),
    referralIdx: uniqueIndex('idx_users_referral_code').on(table.referralCode),
  })
);

// ═══════════════════════════════════════════
// 3. EMAIL OTPS TABLE
// ═══════════════════════════════════════════
export const emailOtps = pgTable(
  'email_otps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    otpCode: char('otp_code', { length: 6 }).notNull(),
    attempts: smallint('attempts').default(0).notNull(),
    isUsed: boolean('is_used').default(false).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lookupIdx: index('idx_email_otps_lookup').on(table.email, table.isUsed, table.expiresAt),
  })
);

// ═══════════════════════════════════════════
// 4. TUTORS TABLE
// ═══════════════════════════════════════════
export const tutors = pgTable('tutors', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bioTitle: varchar('bio_title', { length: 150 }).notNull(),
  bankName: varchar('bank_name', { length: 50 }),
  bankAccountNo: varchar('bank_account_no', { length: 50 }),
  revenueShareWeight: numeric('revenue_share_weight', { precision: 5, scale: 2 })
    .default('1.00')
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════
// 5. COURSES TABLE
// ═══════════════════════════════════════════
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 150 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
  semesterTarget: smallint('semester_target').default(1).notNull(),
  description: text('description'),
  sortOrder: smallint('sort_order').default(0).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════
// 6. VIDEOS TABLE
// ═══════════════════════════════════════════
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'restrict' }),
    tutorId: uuid('tutor_id')
      .notNull()
      .references(() => tutors.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 200 }).notNull(),
    category: videoCategoryEnum('category').default('MATERI').notNull(),
    universityTag: universityEnum('university_tag'),
    durationSeconds: integer('duration_seconds').notNull(),
    cfVideoUid: varchar('cf_video_uid', { length: 100 }).notNull(),
    summaryMarkdown: text('summary_markdown'),
    isFree: boolean('is_free').default(false).notNull(),
    isPublished: boolean('is_published').default(true).notNull(),
    sortOrder: smallint('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    courseFilterIdx: index('idx_videos_course_filter').on(
      table.courseId,
      table.category,
      table.universityTag
    ),
  })
);

// ═══════════════════════════════════════════
// 7. VIDEO CHAPTERS TABLE
// ═══════════════════════════════════════════
export const videoChapters = pgTable('video_chapters', {
  id: uuid('id').defaultRandom().primaryKey(),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  startSecond: integer('start_second').notNull(),
  sortOrder: smallint('sort_order').default(0).notNull(),
});

// ═══════════════════════════════════════════
// 8. WATCH HISTORIES & BOOKMARKS TABLE
// ═══════════════════════════════════════════
export const watchHistories = pgTable(
  'watch_histories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    lastPositionSec: integer('last_position_sec').default(0).notNull(),
    totalWatchedSec: integer('total_watched_sec').default(0).notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    isBookmarked: boolean('is_bookmarked').default(false).notNull(),
    lastWatchedAt: timestamp('last_watched_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userVideoUnique: uniqueIndex('uq_user_video_progress').on(table.userId, table.videoId),
  })
);

// ═══════════════════════════════════════════
// 9. ARCHIVE QUESTIONS TABLE
// ═══════════════════════════════════════════
export const archiveQuestions = pgTable('archive_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  universityTag: universityEnum('university_tag').notNull(),
  examType: examTypeEnum('exam_type').notNull(),
  academicYear: varchar('academic_year', { length: 20 }).notNull(),
  questionMarkdown: text('question_markdown').notNull(),
  optionsJson: jsonb('options_json').notNull(),
  correctKey: char('correct_key', { length: 1 }).notNull(),
  explanationMd: text('explanation_md').notNull(),
  relatedVideoId: uuid('related_video_id').references(() => videos.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ═══════════════════════════════════════════
// 10. VOUCHERS & TRANSACTIONS TABLES
// ═══════════════════════════════════════════
export const vouchers = pgTable('vouchers', {
  code: varchar('code', { length: 30 }).primaryKey(),
  discountAmount: integer('discount_amount').notNull(),
  maxQuota: integer('max_quota').default(100).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),
  voucherCode: varchar('voucher_code', { length: 30 }).references(() => vouchers.code, {
    onDelete: 'restrict',
  }),
  baseAmount: integer('base_amount').default(25000).notNull(),
  discountAmount: integer('discount_amount').default(0).notNull(),
  finalAmount: integer('final_amount').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('PENDING').notNull(),
  externalPgId: varchar('external_pg_id', { length: 100 }).unique(),
  qrisString: text('qris_string'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
