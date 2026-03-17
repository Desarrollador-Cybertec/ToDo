export interface GeneralDashboard {
  tasks_by_status: Record<string, number>;
  tasks_by_area: AreaTaskCount[];
  total_active: number;
  total_completed: number;
  total_overdue: number;
  total_due_soon: number;
  completion_rate: number;
  avg_days_to_close: number;
  top_responsible: ResponsibleLoad[];
  completed_this_month: number;
}

export interface AreaTaskCount {
  area_id: number;
  area_name: string;
  count: number;
}

export interface ResponsibleLoad {
  user_id: number;
  user_name: string;
  task_count: number;
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
