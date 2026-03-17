import { z } from 'zod';
import { MeetingClassification } from '../types/enums';

export const createMeetingSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(255),
  meeting_date: z.string().min(1, 'La fecha es obligatoria'),
  area_id: z.number().int().positive().optional().nullable(),
  classification: z.enum(
    [
      MeetingClassification.STRATEGIC,
      MeetingClassification.OPERATIONAL,
      MeetingClassification.FOLLOW_UP,
      MeetingClassification.REVIEW,
      MeetingClassification.OTHER,
    ],
    { message: 'Selecciona una clasificación' },
  ),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

export const updateMeetingSchema = createMeetingSchema;

export type CreateMeetingFormData = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingFormData = z.infer<typeof updateMeetingSchema>;
