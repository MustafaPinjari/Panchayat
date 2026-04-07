import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { FAB } from '../components/FAB';
import { Mic, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { api } from '../../services/api';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPath = useCallback((tab: string, search: string, pageUrl?: string | null) => {
    if (pageUrl) {
      // Strip the base URL from the next URL — api.ts prepends it
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

  // Fetch when tab changes
  useEffect(() => {
    fetchComplaints(activeTab, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Debounced search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchComplaints(activeTab, query);
    }, 300);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Dashboard" showSearch onSearch={handleSearch} />

      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Welcome Back!</h2>
          <p className="text-muted-foreground">
            Stay updated with your society's latest complaints and announcements
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

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
              onClick={() => fetchComplaints(activeTab, searchQuery)}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </div>
        )}

        {/* Complaint list */}
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
                  isAnonymous={complaint.anonymous}
                  author={complaint.created_by}
                  onClick={() => navigate(`/complaint/${complaint.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No complaints found</p>
              </div>
            )}

            {/* Load more */}
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
    </div>
  );
}
