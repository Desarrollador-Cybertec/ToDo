import { FadeIn } from '../ui';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

export function DashboardCard({ title, children, delay = 0 }: DashboardCardProps) {
  return (
    <FadeIn delay={delay} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {children}
    </FadeIn>
  );
}
