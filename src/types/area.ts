import type { User } from './user';

export interface Area {
  id: number;
  name: string;
  description: string | null;
  process_identifier: string | null;
  manager_user_id: number | null;
  active: boolean;
  manager: User | null;
  members?: AreaMember[];
  members_count?: number;
  created_at: string;
  updated_at: string;
}

export interface AreaMember {
  id: number;
  area_id: number;
  user_id: number;
  assigned_by: number | null;
  claimed_by: number | null;
  joined_at: string;
  left_at: string | null;
  is_active: boolean;
  user: User;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  process_identifier?: string;
  manager_user_id?: number;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  process_identifier?: string;
  active?: boolean;
}

export interface ClaimWorkerRequest {
  area_id: number;
  user_id: number;
}
