import React from 'react';
import { cn } from './ui/utils';

type Status = 'pending' | 'in-progress' | 'resolved' | 'rejected';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-accent/10 text-accent border-accent/20',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
