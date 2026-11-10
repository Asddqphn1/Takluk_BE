import { z } from 'zod';

export const syncProgressSchema = z.object({
  video_id: z.string().uuid('ID video harus berformat UUID valid'),
  last_position_sec: z.number().int().min(0, 'Posisi detik video tidak boleh negatif'),
  watched_delta_sec: z.number().int().min(0, 'Pertambahan durasi tonton tidak boleh negatif').default(0),
  is_bookmarked: z.boolean().optional(),
});

export type SyncProgressInput = z.infer<typeof syncProgressSchema>;

