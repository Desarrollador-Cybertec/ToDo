import { FadeIn } from '../ui';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  delay?: number;
}

export function DashboardCard({ title, children, delay = 0 }: DashboardCardProps) {
  return (
    <FadeIn delay={delay} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      {children}
    </FadeIn>
  );
}
