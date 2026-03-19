export interface GeneralDashboard {
  tasks_by_status: Record<string, number>;
  tasks_by_area: AreaTaskCount[];
  total_all: number;
  total_active: number;
  total_completed: number;
  total_cancelled?: number;
  overdue_tasks: number;
  due_soon: number;
  completion_rate: number;
  global_progress: number;
  pending_by_user: PendingByUser[];
  completed_this_month: number;
  my_tasks: MyTask[];
}

export interface MyTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  is_overdue: boolean;
  progress_percent: number;
  area_id: number | null;
}

export interface PendingByUser {
  user_id: number;
  user_name: string;
  pending_tasks: number;
}

export interface AreaTaskCount {
  area_id: number;
  area_name: string;
  total: number;
}

export interface ResponsibleLoad {
  user_id: number | null;
  user_name: string;
  active_tasks: number;
}

export interface AwaitingClaimTask {
  id: number;
  title: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

export interface AreaDashboard {
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  due_soon: number;
  without_progress: number;
  pending_assignment_tasks: number;
  completion_rate: number;
  tasks_by_status: Record<string, number>;
  by_responsible: ResponsibleLoad[];
  awaiting_claim: AwaitingClaimTask[];
  area: { id: number; name: string; manager_user_id: number | null };
}

export interface ConsolidatedDashboard {
  summary: {
    total_tasks: number;
    total_completed: number;
    total_active: number;
    total_overdue: number;
    global_completion_rate: number;
  };
  by_area: ConsolidatedArea[];
}

export interface ConsolidatedArea {
  area_id: number;
  area_name: string;
  process_identifier: string | null;
  manager: string | null;
  total: number;
  by_status: Record<string, number> | unknown[];
  completion_rate: number;
  overdue: number;
  without_progress: number;
  oldest_pending_days: number | null;
  avg_days_without_update: number | null;
}

export interface PersonalDashboard {
  active_tasks: number;
  overdue_tasks: number;
  due_soon_tasks: number;
  completed_tasks: number;
  tasks_by_status: Record<string, number>;
  upcoming_tasks: UpcomingTask[];
}

export interface UpcomingTask {
  id: number;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  is_overdue?: boolean;
}
