import React from 'react';
import { cn } from './ui/utils';

type Status = 'pending' | 'approved' | 'assigned' | 'in-progress' | 'in_progress' | 'resolved' | 'rejected';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: 'Pending',
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    approved: {
      label: 'Approved',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    assigned: {
      label: 'Assigned',
      className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    in_progress: {
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

  const config = statusConfig[status] ?? statusConfig['pending'];

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
