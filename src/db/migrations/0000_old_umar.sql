CREATE TYPE "public"."exam_type_enum" AS ENUM('UTS', 'UAS');--> statement-breakpoint
CREATE TYPE "public"."payment_status_enum" AS ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."university_enum" AS ENUM('UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA');--> statement-breakpoint
CREATE TYPE "public"."user_role_enum" AS ENUM('STUDENT', 'TUTOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."video_category_enum" AS ENUM('MATERI', 'UTS', 'UAS');--> statement-breakpoint
CREATE TABLE "archive_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"university_tag" "university_enum" NOT NULL,
	"exam_type" "exam_type_enum" NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"question_markdown" text NOT NULL,
	"options_json" jsonb NOT NULL,
	"correct_key" char(1) NOT NULL,
	"explanation_md" text NOT NULL,
	"related_video_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(150) NOT NULL,
	"symbol" varchar(10) NOT NULL,
	"semester_target" smallint DEFAULT 1 NOT NULL,
	"description" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "email_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_code" char(6) NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"voucher_code" varchar(30),
	"base_amount" integer DEFAULT 25000 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"final_amount" integer NOT NULL,
	"payment_status" "payment_status_enum" DEFAULT 'PENDING' NOT NULL,
	"external_pg_id" varchar(100),
	"qris_string" text,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_invoice_number_unique" UNIQUE("invoice_number"),
	CONSTRAINT "transactions_external_pg_id_unique" UNIQUE("external_pg_id")
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bio_title" varchar(150) NOT NULL,
	"bank_name" varchar(50),
	"bank_account_no" varchar(50),
	"revenue_share_weight" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"nim" varchar(50) NOT NULL,
	"university" "university_enum" DEFAULT 'UIN_SUSKA' NOT NULL,
	"semester" smallint DEFAULT 1 NOT NULL,
	"phone_number" varchar(20),
	"role" "user_role_enum" DEFAULT 'STUDENT' NOT NULL,
	"active_device_id" varchar(255),
	"device_updated_at" timestamp with time zone,
	"referral_code" varchar(20) NOT NULL,
	"referred_by_id" uuid,
	"subscription_valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "video_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"title" varchar(150) NOT NULL,
	"start_second" integer NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"category" "video_category_enum" DEFAULT 'MATERI' NOT NULL,
	"university_tag" "university_enum",
	"duration_seconds" integer NOT NULL,
	"cf_video_uid" varchar(100) NOT NULL,
	"summary_markdown" text,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"code" varchar(30) PRIMARY KEY NOT NULL,
	"discount_amount" integer NOT NULL,
	"max_quota" integer DEFAULT 100 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"last_position_sec" integer DEFAULT 0 NOT NULL,
	"total_watched_sec" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_bookmarked" boolean DEFAULT false NOT NULL,
	"last_watched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archive_questions" ADD CONSTRAINT "archive_questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archive_questions" ADD CONSTRAINT "archive_questions_related_video_id_videos_id_fk" FOREIGN KEY ("related_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voucher_code_vouchers_code_fk" FOREIGN KEY ("voucher_code") REFERENCES "public"."vouchers"("code") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_chapters" ADD CONSTRAINT "video_chapters_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_tutor_id_tutors_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_histories" ADD CONSTRAINT "watch_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_histories" ADD CONSTRAINT "watch_histories_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_otps_lookup" ON "email_otps" USING btree ("email","is_used","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_referral_code" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_videos_course_filter" ON "videos" USING btree ("course_id","category","university_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_video_progress" ON "watch_histories" USING btree ("user_id","video_id");