import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'blue',
  loading = false,
}) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-600/10 to-blue-500/5',
      border: 'border-blue-500/10',
      iconBg: 'bg-blue-600/15 text-blue-400',
      glow: 'shadow-blue-500/5',
    },
    rose: {
      bg: 'from-rose-600/10 to-rose-500/5',
      border: 'border-rose-500/10',
      iconBg: 'bg-rose-600/15 text-rose-400',
      glow: 'shadow-rose-500/5',
    },
    yellow: {
      bg: 'from-yellow-600/10 to-yellow-500/5',
      border: 'border-yellow-500/10',
      iconBg: 'bg-yellow-600/15 text-yellow-400',
      glow: 'shadow-yellow-500/5',
    },
    emerald: {
      bg: 'from-emerald-600/10 to-emerald-500/5',
      border: 'border-emerald-500/10',
      iconBg: 'bg-emerald-600/15 text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
  };

  const theme = colorClasses[color];

  if (loading) {
    return (
      <div className="glass-panel border border-white/5 rounded-2xl p-6 h-[120px] animate-pulse flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-4 bg-slate-800 rounded w-24"></div>
          <div className="h-9 w-9 bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-6 bg-slate-800 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className={`glass-panel border ${theme.border} rounded-2xl p-6 flex items-center justify-between shadow-xl ${theme.glow} glass-panel-hover glow-card`}>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <span className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-slate-400 font-medium">
            {subtext}
          </span>
        )}
      </div>
      <div className={`p-3 rounded-xl shadow-inner ${theme.iconBg}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );
}
