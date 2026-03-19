/**
 * Compare IDs safely — handles string/number coercion from backend.
 */
export function idsMatch(a: number | string | null | undefined, b: number | string | null | undefined): boolean {
  if (a == null || b == null) return false;
  return Number(a) === Number(b);
}

/**
 * Derive status progress percentage from task status string.
 */
export function statusProgress(status: string): number {
  if (status === 'completed') return 100;
  if (status === 'in_review') return 75;
  if (status === 'in_progress' || status === 'rejected' || status === 'overdue') return 25;
  return 0;
}

/**
 * Priority sort order — lower is more urgent.
 */
export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};
