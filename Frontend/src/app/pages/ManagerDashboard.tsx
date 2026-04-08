import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { Button } from '../components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface Complaint {
  id: string;
  text: string;
  audio_url?: string;
  created_by?: string;
  anonymous: boolean;
  category: string;
  status: 'pending' | 'approved' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
  created_at: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string | null;
  approved_by?: string | null;
  resolved_at?: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-5 bg-muted rounded-full w-20" />
      </div>
      <div className="h-6 bg-muted rounded-lg w-24" />
    </div>
  );
}

// ── ManagerDashboard ──────────────────────────────────────────────────────────

export default function ManagerDashboard() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'in_progress'>('all');
  const [inFlight, setInFlight] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    setComplaints([]);
    setNextUrl(null);
    try {
      const data = await api.get<PaginatedResponse<Complaint>>('/api/manager/tasks/');
      setComplaints(data.results);
      setNextUrl(data.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      let path: string;
      try {
        const url = new URL(nextUrl);
        path = url.pathname + url.search;
      } catch {
        path = nextUrl;
      }
      const data = await api.get<PaginatedResponse<Complaint>>(path);
      setComplaints((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load more tasks');
    } finally {
      setLoadingMore(false);
    }
  };

  const updateStatus = async (id: string, newStatus: 'in_progress' | 'resolved') => {
    if (inFlight.has(id)) return;

    // Snapshot previous status for rollback
    const previous = complaints.find((c) => c.id === id)?.status;

    // Optimistic update
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
    setInFlight((prev) => new Set(prev).add(id));

    try {
      await api.patch(`/api/complaints/${id}/status/`, { status: newStatus });
    } catch (err) {
      // Roll back on error
      setComplaints((prev) =>
        prev.map((c) => (c.id === id && previous ? { ...c, status: previous } : c))
      );
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="My Tasks" />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Assigned Tasks</h2>
          <p className="text-muted-foreground mb-4">
            Complaints assigned to you — start work or mark them resolved.
          </p>
          {/* Search + filter */}
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-1">
              {(['all', 'assigned', 'in_progress'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                    statusFilter === f
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'assigned' ? 'Assigned' : 'In Progress'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchTasks}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Task list */}
        {!loading && !error && (
          <div className="space-y-4">
            {(() => {
              const filtered = complaints
                .filter((c) => statusFilter === 'all' || c.status === statusFilter)
                .filter((c) => !search || c.text.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));
              return filtered.length > 0 ? (
                filtered.map((complaint) => (
                  <ComplaintCard
                    key={complaint.id}
                    id={complaint.id}
                    title={complaint.text}
                    category={complaint.category}
                    status={complaint.status}
                    timestamp={formatTimestamp(complaint.created_at)}
                    createdAt={complaint.created_at}
                    priority={complaint.priority}
                    isAnonymous={complaint.anonymous}
                    author={complaint.created_by}
                    userRole="manager"
                    onStart={
                      complaint.status === 'assigned' && !inFlight.has(complaint.id)
                        ? () => updateStatus(complaint.id, 'in_progress')
                        : undefined
                    }
                    onResolve={
                      complaint.status === 'in_progress' && !inFlight.has(complaint.id)
                        ? () => updateStatus(complaint.id, 'resolved')
                        : undefined
                    }
                  />
                ))
              ) : (
                <div className="text-center py-12 space-y-2">
                  <Search className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-muted-foreground">
                    {search || statusFilter !== 'all' ? 'No tasks match your filter.' : 'No tasks assigned to you yet.'}
                  </p>
                </div>
              );
            })()}

            {nextUrl && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full md:w-auto"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
