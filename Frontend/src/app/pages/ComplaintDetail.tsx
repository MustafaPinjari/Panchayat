import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import {
  ArrowLeft,
  Clock,
  User,
  Send,
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';

interface Complaint {
  id: string;
  text: string;
  audio_url?: string;
  created_by?: string;
  anonymous: boolean;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
}

interface Comment {
  id: string;
  complaint_id: string;
  created_by: string;
  text: string;
  created_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className ?? ''}`} />
  );
}

function ComplaintSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <SkeletonBlock className="h-5 w-32" />
      <SkeletonBlock className="h-7 w-3/4" />
      <SkeletonBlock className="h-4 w-48" />
      <SkeletonBlock className="h-20 w-full mt-4" />
    </div>
  );
}

const STATUS_ITEMS = [
  {
    value: 'pending',
    label: 'Mark as Pending',
    icon: '🕐',
    className: 'text-yellow-600 dark:text-yellow-400',
  },
  {
    value: 'in_progress',
    label: 'Mark as In Progress',
    icon: '⚙️',
    className: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'resolved',
    label: 'Mark as Resolved',
    icon: '✅',
    className: 'text-green-600 dark:text-green-400',
  },
];

function StatusDropdown({ onSelect, disabled }: { onSelect: (s: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="text-muted-foreground hover:text-foreground"
      >
        <MoreVertical className="w-4 h-4" />
      </Button>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.1 }}
          className="absolute right-0 top-10 z-50 w-52 bg-popover border border-border rounded-xl shadow-xl overflow-hidden"
        >
          <p className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Update Status
          </p>
          <div className="p-1">
            {STATUS_ITEMS.map((item) => (
              <button
                key={item.value}
                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-3 transition-colors hover:bg-muted ${item.className}`}
                onClick={() => { onSelect(item.value); setOpen(false); }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ComplaintDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newReply, setNewReply] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canChangeStatus =
    user?.role === 'committee_member' || user?.role === 'admin';

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const [complaintData, commentsData] = await Promise.all([
          api.get<Complaint>('/api/complaints/' + id),
          api.get<Comment[]>('/api/comments/' + id),
        ]);
        setComplaint(complaintData);
        setComments(commentsData);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404') || msg.includes('Not found')) {
          setNotFound(true);
        } else {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !id) return;
    setPostingReply(true);
    try {
      const created = await api.post<Comment>('/api/comments/', {
        complaint_id: id,
        text: newReply.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewReply('');
      toast.success('Reply posted successfully');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post reply';
      toast.error(msg);
    } finally {
      setPostingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !complaint) return;
    setUpdatingStatus(true);
    try {
      const updated = await api.patch<Complaint>(
        '/api/complaints/' + id + '/status/',
        { status: newStatus }
      );
      setComplaint((prev) => (prev ? { ...prev, status: updated.status } : prev));
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Complaint Details" />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Loading state */}
          {loading && <ComplaintSkeleton />}

          {/* 404 state */}
          {!loading && notFound && (
            <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
              <p className="text-2xl font-semibold">Complaint not found</p>
              <p className="text-muted-foreground">
                The complaint you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Error state */}
          {!loading && error && !notFound && (
            <div className="bg-card border border-destructive rounded-xl p-10 text-center space-y-3">
              <p className="text-xl font-semibold text-destructive">
                Something went wrong
              </p>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}

          {/* Complaint Card */}
          {!loading && complaint && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={complaint.category as 'water'} />
                    <StatusBadge status={complaint.status} />
                  </div>
                  <h1 className="text-2xl font-semibold">{complaint.text}</h1>
                </div>

                {canChangeStatus && (
                  <StatusDropdown
                    onSelect={handleStatusChange}
                    disabled={updatingStatus}
                  />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>
                    {complaint.anonymous ? 'Anonymous' : (complaint.created_by ?? 'Unknown')}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(complaint.created_at)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Comments / Discussion Section */}
          {!loading && complaint && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">
                Discussion ({comments.length})
              </h2>

              <div className="space-y-4 mb-6">
                {comments.map((comment) => {
                  const isPrivileged =
                    comment.created_by === 'Admin' ||
                    comment.created_by?.toLowerCase().includes('admin');
                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-lg p-4 ${
                        isPrivileged
                          ? 'bg-primary/5 border border-primary/20'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isPrivileged
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {(comment.created_by ?? '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {comment.created_by ?? 'Unknown'}
                            </p>
                            {isPrivileged && (
                              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </motion.div>
                  );
                })}

                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to reply.
                  </p>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Add a reply..."
                  rows={3}
                  className="resize-none"
                  disabled={postingReply}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={postingReply || !newReply.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    {postingReply ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
