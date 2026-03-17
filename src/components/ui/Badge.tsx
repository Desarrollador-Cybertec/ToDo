import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'indigo' | 'amber';
  size?: 'sm' | 'md';
  className?: string;
}

const BADGE_COLORS = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
} as const;

export function Badge({ children, variant = 'gray', size = 'sm', className = '' }: BadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${BADGE_COLORS[variant]} ${sizeClasses} ${className}`}>
      {children}
    </span>
  );
}
