import type { User } from './user';
import type { Area } from './area';
import type { Task } from './task';
import type { MeetingClassificationType } from './enums';

export interface Meeting {
  id: number;
  title: string;
  meeting_date: string;
  area_id: number | null;
  classification: MeetingClassificationType;
  notes: string | null;
  created_by: number;
  area: Area | null;
  creator: User;
  tasks?: Task[];
  created_at: string;
  updated_at: string;
}

export interface CreateMeetingRequest {
  title: string;
  meeting_date: string;
  area_id?: number;
  classification: MeetingClassificationType;
  notes?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  meeting_date?: string;
  area_id?: number;
  classification?: MeetingClassificationType;
  notes?: string;
}
