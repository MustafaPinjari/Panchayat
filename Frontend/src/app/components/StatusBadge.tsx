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
      className: 'bg-status-pending/10 text-status-pending border-status-pending/20',
    },
    approved: {
      label: 'Approved',
      className: 'bg-status-approved/10 text-status-approved border-status-approved/20',
    },
    assigned: {
      label: 'Assigned',
      className: 'bg-status-assigned/10 text-status-assigned border-status-assigned/20',
    },
    'in-progress': {
      label: 'In Progress',
      className: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-status-in-progress/10 text-status-in-progress border-status-in-progress/20',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-status-resolved/10 text-status-resolved border-status-resolved/20',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-status-rejected/10 text-status-rejected border-status-rejected/20',
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
