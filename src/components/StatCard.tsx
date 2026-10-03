import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'default' | 'income' | 'expense' | 'savings' | 'warning';
  trendText?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  variant = 'default',
  trendText,
  trendPositive,
}) => {
  const iconColor = {
    default: 'text-slate-600 bg-slate-100',
    income: 'text-emerald-700 bg-emerald-50',
    expense: 'text-rose-700 bg-rose-50',
    savings: 'text-blue-700 bg-blue-50',
    warning: 'text-amber-700 bg-amber-50',
  }[variant];

  return (
    <div className="bg-white border border-slate-200/80 rounded-lg p-5 shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-md ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {(subtext || trendText) && (
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            {trendText && (
              <span className={`font-medium ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendText}
              </span>
            )}
            {trendText && subtext && <span>·</span>}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
