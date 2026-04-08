import React, { useState, useEffect, useCallback } from 'react';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { Button } from '../components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
import { api } from '../../services/api';
import { toast } from 'sonner';
import { SkeletonCard } from '../components/SkeletonCard';
import { SearchInput } from '../components/SearchInput';
import { FilterTabs } from '../components/FilterTabs';
import { EmptyState } from '../components/EmptyState';

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
    <div className="flex-1 min-w-0 flex flex-col min-h-screen">
      <TopNav title="My Tasks" />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Assigned Tasks</h2>
          <p className="text-muted-foreground mb-6">
            Complaints assigned to you — start work or mark them resolved.
          </p>
          {/* Search + filter */}
          <div className="flex gap-2 flex-wrap">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tasks…" className="flex-1 min-w-[200px]" />
            <FilterTabs
              options={[
                { value: 'all', label: 'All' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
              ]}
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as 'all' | 'assigned' | 'in_progress')}
            />
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
                <EmptyState
                  icon={<Search className="w-8 h-8" />}
                  title="No tasks found"
                  description={search || statusFilter !== 'all' ? 'No tasks match your filter.' : 'No tasks assigned to you yet.'}
                />
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
