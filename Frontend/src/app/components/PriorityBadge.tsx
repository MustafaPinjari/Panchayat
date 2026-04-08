import React from 'react';
import { cn } from './ui/utils';
import { AlertTriangle, ArrowDown, ArrowUp, Flame } from 'lucide-react';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const config: Record<Priority, { label: string; className: string; icon: React.ReactNode }> = {
  low: {
    label: 'Low',
    className: 'bg-priority-low/10 text-priority-low border-priority-low/20',
    icon: <ArrowDown className="w-3 h-3" />,
  },
  medium: {
    label: 'Medium',
    className: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
    icon: <ArrowUp className="w-3 h-3" />,
  },
  high: {
    label: 'High',
    className: 'bg-priority-high/10 text-priority-high border-priority-high/20',
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <Flame className="w-3 h-3" />,
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, className: colorClass, icon } = config[priority] ?? config.medium;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}
