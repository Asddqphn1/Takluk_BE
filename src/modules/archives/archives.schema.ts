import { z } from 'zod';

export const archiveFilterQuerySchema = z.object({
  course_id: z.string().uuid('ID mata kuliah harus berformat UUID').optional(),
  university_tag: z.enum(['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA']).optional(),
  exam_type: z.enum(['UTS', 'UAS']).optional(),
});

export const evaluateAnswerSchema = z.object({
  selected_key: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Pilihan jawaban harus salah satu dari A, B, C, atau D.' }),
  }),
});

export type ArchiveFilterQuery = z.infer<typeof archiveFilterQuerySchema>;
export type EvaluateAnswerInput = z.infer<typeof evaluateAnswerSchema>;

