import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { FAB } from '../components/FAB';
import { Mic, RefreshCw, Wifi, ClipboardList } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { SkeletonCard } from '../components/SkeletonCard';
import { AssignModal } from '../components/AssignModal';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

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
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningComplaintId, setAssigningComplaintId] = useState<string | null>(null);
  const [rejectingComplaintId, setRejectingComplaintId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isLive, setIsLive] = useState(true);

  const isCommitteeOrAdmin = user?.role === 'committee_member' || user?.role === 'admin';

  const buildPath = useCallback((tab: string, search: string, pageUrl?: string | null) => {
    if (pageUrl) {
      try {
        const url = new URL(pageUrl);
        return url.pathname + url.search;
      } catch {
        return pageUrl;
      }
    }
    const params = new URLSearchParams();
    if (tab !== 'all') params.set('status', tab);
    if (search.trim()) params.set('search', search.trim());
    const qs = params.toString();
    return `/api/complaints/${qs ? `?${qs}` : ''}`;
  }, []);

  const fetchComplaints = useCallback(async (tab: string, search: string) => {
    setLoading(true);
    setError(null);
    setComplaints([]);
    setNextUrl(null);
    try {
      const path = buildPath(tab, search);
      const data = await api.get<PaginatedResponse<Complaint>>(path);
      setComplaints(data.results);
      setNextUrl(data.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [buildPath]);

  // Silent background poll — merges updates without resetting the list
  const pollComplaints = useCallback(async (tab: string, search: string) => {
    try {
      const path = buildPath(tab, search);
      const data = await api.get<PaginatedResponse<Complaint>>(path);
      setComplaints((prev) => {
        const incoming = data.results;
        // Merge: update existing, prepend new
        const prevMap = new Map(prev.map((c) => [c.id, c]));
        const merged = incoming.map((c) => prevMap.has(c.id) ? c : c);
        // Detect any changes to show live indicator pulse
        const changed = incoming.some((c) => {
          const old = prevMap.get(c.id);
          return !old || old.status !== c.status;
        });
        if (changed) setIsLive((v) => { void v; return true; });
        return merged;
      });
      setNextUrl(data.next);
    } catch {
      // silent — don't disrupt the user
    }
  }, [buildPath]);

  // Start/restart polling when tab or search changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      pollComplaints(activeTab, searchQuery);
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTab, searchQuery, pollComplaints]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const path = buildPath(activeTab, searchQuery, nextUrl);
      const data = await api.get<PaginatedResponse<Complaint>>(path);
      setComplaints((prev) => [...prev, ...data.results]);
      setNextUrl(data.next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more complaints');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchComplaints(activeTab, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchComplaints(activeTab, query);
    }, 300);
  };

  const updateComplaintStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/api/complaints/${id}/status/`, { status: newStatus });
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus as Complaint['status'] } : c))
      );
      toast.success(`Complaint ${newStatus}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen">
      <TopNav title="Dashboard" showSearch onSearch={handleSearch} />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full min-w-0">
        <div className="mb-6 rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1D3557 0%, #2A4A6B 50%, #1a3a5c 100%)',
            boxShadow: '0 4px 24px rgba(29,53,87,0.25)',
          }}
        >
          {/* Glow orb */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(45,226,230,0.2) 0%, transparent 70%)' }} />
          <div className="relative flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Welcome Back!</h2>
              <p className="text-white/60 text-sm">
                Stay updated with your society's latest complaints
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-white/60 bg-white/10 px-2.5 py-1.5 rounded-full shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                <span className="sr-only">Live updates active</span>
              </span>
              <Wifi className="w-3 h-3" />
              Live
            </span>
          </div>
        </div>

        <div className="mb-6 -mx-1 px-1 overflow-x-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-max min-w-full md:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchComplaints(activeTab, searchQuery)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {complaints.length > 0 ? (
              complaints.map((complaint) => (
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
                  userRole={user?.role}
                  onApprove={
                    isCommitteeOrAdmin && complaint.status === 'pending'
                      ? () => updateComplaintStatus(complaint.id, 'approved')
                      : undefined
                  }
                  onReject={
                    isCommitteeOrAdmin && complaint.status === 'pending'
                      ? () => setRejectingComplaintId(complaint.id)
                      : undefined
                  }
                  onAssign={
                    isCommitteeOrAdmin && complaint.status === 'approved'
                      ? () => setAssigningComplaintId(complaint.id)
                      : undefined
                  }
                  onClick={() => navigate(`/complaint/${complaint.id}`)}
                />
              ))
            ) : (
              <EmptyState
                icon={<ClipboardList className="w-8 h-8" />}
                title="No complaints found"
                description={
                  searchQuery
                    ? 'No complaints match your search. Try a different keyword.'
                    : activeTab !== 'all'
                    ? 'No complaints with this status yet.'
                    : 'No complaints have been submitted yet.'
                }
              />
            )}

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

      <FAB
        onClick={() => navigate('/voice-complaint')}
        icon={<Mic className="w-5 h-5" />}
        label="Report Issue"
        ariaLabel="Report Issue"
      />

      {assigningComplaintId && (
        <AssignModal
          complaintId={assigningComplaintId}
          onClose={() => setAssigningComplaintId(null)}
          onAssigned={(id) =>
            setComplaints((prev) =>
              prev.map((c) => (c.id === id ? { ...c, status: 'assigned' } : c))
            )
          }
        />
      )}

      <ConfirmDialog
        open={rejectingComplaintId !== null}
        title="Reject Complaint"
        description="This will permanently reject the complaint. This action cannot be undone."
        confirmLabel="Reject"
        confirmVariant="destructive"
        onConfirm={() => {
          if (rejectingComplaintId) {
            updateComplaintStatus(rejectingComplaintId, 'rejected');
            setRejectingComplaintId(null);
          }
        }}
        onCancel={() => setRejectingComplaintId(null)}
      />
    </div>
  );
}
