import React from 'react';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { Clock, MessageSquare, User } from 'lucide-react';
import { motion } from 'motion/react';

interface ComplaintCardProps {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in-progress' | 'in_progress' | 'resolved' | 'rejected';
  timestamp: string;
  isAnonymous?: boolean;
  author?: string;
  replies?: number;
  onClick?: () => void;
}

export function ComplaintCard({
  id,
  title,
  category,
  status,
  timestamp,
  isAnonymous = false,
  author,
  replies = 0,
  onClick,
}: ComplaintCardProps) {
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
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-center justify-between">
        <CategoryBadge category={category} />
        {replies > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{replies} {replies === 1 ? 'reply' : 'replies'}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
