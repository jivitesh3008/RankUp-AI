import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function MetricCard({ label, value, icon, trend, trendUp }: MetricCardProps) {
  return (
    <div className="bg-card-bg border border-card-border p-4 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">{label}</span>
        {icon && <div className="text-foreground/40">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-foreground font-outfit">{value}</span>
        {trend && (
          <span className={`text-xs font-medium mb-1 ${trendUp ? 'text-accent-emerald-500' : 'text-accent-amber-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
