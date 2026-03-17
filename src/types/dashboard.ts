export interface GeneralDashboard {
  tasks_by_status: Record<string, number>;
  tasks_by_area: AreaTaskCount[];
  total_all: number;
  total_active: number;
  total_completed: number;
  overdue_tasks: number;
  due_soon: number;
  completion_rate: number;
  global_progress: number;
  pending_by_user: PendingByUser[];
  completed_this_month: number;
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
  user_id: number;
  user_name: string;
  active_tasks: number;
}

export interface AreaDashboard {
  tasks_by_status: Record<string, number>;
  overdue_tasks: number;
  completion_rate: number;
  tasks_by_responsible: ResponsibleLoad[];
  tasks_without_progress: number;
}

export interface ConsolidatedDashboard {
  summary: {
    total: number;
    completed: number;
    active: number;
    overdue: number;
    completion_rate: number;
  };
  areas: ConsolidatedArea[];
}

export interface ConsolidatedArea {
  area_id: number;
  area_name: string;
  process_identifier: string | null;
  manager_name: string | null;
  total: number;
  by_status: Record<string, number>;
  completion_rate: number;
  overdue: number;
  without_progress: number;
  max_age_days: number;
  avg_days_without_report: number;
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
}
