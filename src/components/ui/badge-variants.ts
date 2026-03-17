export const STATUS_BADGE_VARIANT: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'amber'> = {
  draft: 'gray',
  pending_assignment: 'yellow',
  pending: 'blue',
  in_progress: 'indigo',
  in_review: 'purple',
  completed: 'green',
  rejected: 'red',
  cancelled: 'gray',
  overdue: 'red',
};

export const PRIORITY_BADGE_VARIANT: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'amber'> = {
  low: 'gray',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};
