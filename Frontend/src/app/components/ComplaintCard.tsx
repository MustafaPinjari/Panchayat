import React from 'react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { PriorityBadge } from './PriorityBadge';
import { Clock, MessageSquare, User, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface ComplaintCardProps {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'approved' | 'assigned' | 'in-progress' | 'in_progress' | 'resolved' | 'rejected';
  timestamp: string;
  createdAt?: string; // ISO string for overdue calculation
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isAnonymous?: boolean;
  author?: string;
  replies?: number;
  assignedManager?: string;
  userRole?: 'resident' | 'committee_member' | 'admin' | 'manager';
  onApprove?: () => void;
  onReject?: () => void;
  onAssign?: () => void;
  onStart?: () => void;
  onResolve?: () => void;
  onClick?: () => void;
}

export function ComplaintCard({
  id,
  title,
  category,
  status,
  timestamp,
  createdAt,
  priority,
  isAnonymous = false,
  author,
  replies = 0,
  assignedManager,
  userRole,
  onApprove,
  onReject,
  onAssign,
  onStart,
  onResolve,
  onClick,
}: ComplaintCardProps) {
  const showCommitteeActions = userRole === 'committee_member' || userRole === 'admin';
  const showManagerActions = userRole === 'manager';

  // Overdue: active complaint older than 3 days
  const isOverdue = (() => {
    if (!createdAt || status === 'resolved' || status === 'rejected') return false;
    const diffDays = (Date.now() - new Date(createdAt).getTime()) / 86400000;
    return diffDays > 3;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-card-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{isAnonymous ? 'Anonymous' : author}</span>
            <span>•</span>
            <Clock className="w-3 h-3" />
            <span>{timestamp}</span>
          </div>
          {assignedManager && (
            <div className="mt-1 text-xs text-muted-foreground">
              Assigned to: <span className="font-medium text-foreground">{assignedManager}</span>
            </div>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={category} />
          {priority && priority !== 'medium' && <PriorityBadge priority={priority} />}
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-destructive/10 text-destructive border-destructive/20">
              <AlertTriangle className="w-3 h-3" />
              Overdue
            </span>
          )}
        </div>
        {replies > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{replies} {replies === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}
      </div>

      {showCommitteeActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          {(status === 'pending') && onApprove && (
            <button
              onClick={onApprove}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-status-approved/10 text-status-approved hover:bg-status-approved/20 transition-colors"
            >
              Approve
            </button>
          )}
          {(status === 'pending') && onReject && (
            <button
              onClick={onReject}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              Reject
            </button>
          )}
          {(status === 'approved') && onAssign && (
            <button
              onClick={onAssign}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-status-assigned/10 text-status-assigned hover:bg-status-assigned/20 transition-colors"
            >
              Assign
            </button>
          )}
        </div>
      )}

      {showManagerActions && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          {status === 'assigned' && onStart && (
            <button
              onClick={onStart}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Start
            </button>
          )}
          {status === 'in_progress' && onResolve && (
            <button
              onClick={onResolve}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
