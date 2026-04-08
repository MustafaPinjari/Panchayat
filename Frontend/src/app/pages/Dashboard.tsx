import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { FAB } from '../components/FAB';
import { Mic, RefreshCw, X, Wifi } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

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

interface Manager {
  id: string;
  name: string;
  email: string;
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

// ── Assign Modal ─────────────────────────────────────────────────────────────

function AssignModal({
  complaintId,
  onClose,
  onAssigned,
}: {
  complaintId: string;
  onClose: () => void;
  onAssigned: (complaintId: string) => void;
}) {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    api.get<PaginatedResponse<Manager>>('/api/users/managers/')
      .then((data) => setManagers(data.results ?? []))
      .catch(() => toast.error('Could not load managers'))
      .finally(() => setLoadingManagers(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      await api.patch(`/api/complaints/${complaintId}/assign/`, { manager_id: selectedId });
      toast.success('Complaint assigned successfully');
      onAssigned(complaintId);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assign to Manager</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingManagers ? (
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        ) : managers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No property managers found. Register a manager account first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {managers.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedId === m.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <p className="font-medium text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleAssign}
            disabled={!selectedId || assigning || loadingManagers}
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  );
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
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Dashboard" showSearch onSearch={handleSearch} />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-semibold">Welcome Back!</h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-resolved opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-status-resolved" />
              </span>
              <Wifi className="w-3 h-3" />
              Live
            </span>
          </div>
          <p className="text-muted-foreground">
            Stay updated with your society's latest complaints and announcements
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

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
                      ? () => updateComplaintStatus(complaint.id, 'rejected')
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
              <div className="text-center py-12">
                <p className="text-muted-foreground">No complaints found</p>
              </div>
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
    </div>
  );
}
