import { z } from 'zod';

export const videoFilterQuerySchema = z.object({
  course_id: z.string().uuid('ID mata kuliah harus berformat UUID').optional(),
  category: z.enum(['MATERI', 'UTS', 'UAS']).optional(),
  university_tag: z.enum(['UNRI', 'UIN_SUSKA', 'PCR', 'UIR', 'UMRI', 'LAINNYA']).optional(),
});

export type VideoFilterQuery = z.infer<typeof videoFilterQuerySchema>;

