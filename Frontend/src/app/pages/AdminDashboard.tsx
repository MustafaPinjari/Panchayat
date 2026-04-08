import React, { useState, useEffect } from 'react';
import { TopNav } from '../components/TopNav';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../services/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface Analytics {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
}

interface Complaint {
  id: number;
  text: string;
  audio_url?: string;
  created_by?: string;
  anonymous: boolean;
  category: string;
  status: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const getStatusColors = () => ({
  pending: getCssVar('--status-pending') || '#F59E0B',
  in_progress: getCssVar('--status-in-progress') || '#06B6D4',
  resolved: getCssVar('--status-resolved') || '#10B981',
  rejected: getCssVar('--status-rejected') || '#EF4444',
  approved: getCssVar('--status-approved') || '#3B82F6',
  assigned: getCssVar('--status-assigned') || '#8B5CF6',
});

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-status-pending/10 text-status-pending',
  approved: 'bg-status-approved/10 text-status-approved',
  assigned: 'bg-status-assigned/10 text-status-assigned',
  in_progress: 'bg-status-in-progress/10 text-status-in-progress',
  resolved: 'bg-status-resolved/10 text-status-resolved',
  rejected: 'bg-status-rejected/10 text-status-rejected',
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return '1 day ago';
  return date.toLocaleDateString();
}

function buildTrendData(complaints: Complaint[]): { day: string; submitted: number; resolved: number }[] {
  const days: { day: string; submitted: number; resolved: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      day: label,
      submitted: complaints.filter((c) => c.created_at?.slice(0, 10) === dateStr).length,
      resolved: complaints.filter((c) => c.status === 'resolved' && c.created_at?.slice(0, 10) === dateStr).length,
    });
  }
  return days;
}

// ── StatCard ─────────────────────────────────────────────────────────────────

const STAT_VARIANTS = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-status-pending/10 text-status-pending',
  info: 'bg-status-in-progress/10 text-status-in-progress',
  success: 'bg-status-resolved/10 text-status-resolved',
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  variant: 'primary' | 'warning' | 'info' | 'success';
}) => (
  <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${STAT_VARIANTS[variant]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      {trend && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <h3 className="text-2xl font-bold mb-1">{value}</h3>
    <p className="text-sm text-muted-foreground">{title}</p>
  </div>
);

// ── Skeleton ─────────────────────────────────────────────────────────────────

const ChartSkeleton = () => (
  <div className="animate-pulse bg-muted rounded-lg w-full h-[300px]" />
);

// ── AdminDashboard ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [allComplaints, setAllComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [analyticsData, complaintsData, allData] = await Promise.all([
          api.get<Analytics>('/api/admin/analytics/'),
          api.get<PaginatedResponse<Complaint>>('/api/complaints/?page_size=5'),
          api.get<PaginatedResponse<Complaint>>('/api/complaints/?page_size=200'),
        ]);
        setAnalytics(analyticsData);
        setComplaints(complaintsData.results);
        setAllComplaints(allData.results);
      } catch (err: any) {
        setError(err.message ?? 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusColors = getStatusColors();
  const statusData = analytics
    ? Object.entries(analytics.by_status).map(([key, value]) => ({
        name: STATUS_LABELS[key] ?? capitalize(key),
        value,
        color: statusColors[key as keyof ReturnType<typeof getStatusColors>] ?? (getCssVar('--muted-foreground') || '#94a3b8'),
      }))
    : [];

  const categoryData = analytics
    ? Object.entries(analytics.by_category).map(([key, value]) => ({
        name: capitalize(key),
        count: value,
      }))
    : [];

  const trendData = buildTrendData(allComplaints);

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Analytics Dashboard" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">

          {error && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Complaints"
              value={analytics?.total ?? '—'}
              icon={AlertCircle}
              variant="primary"
            />
            <StatCard
              title="Pending"
              value={analytics?.by_status?.pending ?? '—'}
              icon={Clock}
              variant="warning"
            />
            <StatCard
              title="In Progress"
              value={analytics?.by_status?.in_progress ?? '—'}
              icon={TrendingUp}
              variant="info"
            />
            <StatCard
              title="Resolved"
              value={analytics?.by_status?.resolved ?? '—'}
              icon={CheckCircle}
              variant="success"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Complaints by Category</h3>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={getCssVar('--muted-foreground')} />
                    <YAxis tick={{ fontSize: 12 }} stroke={getCssVar('--muted-foreground')} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: getCssVar('--card'),
                        border: `1px solid ${getCssVar('--border')}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={getCssVar('--primary')} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Status Distribution</h3>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill={getCssVar('--primary') || '#1D3557'}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* 7-Day Trend */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-6">7-Day Complaint Trend</h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={getCssVar('--border')} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke={getCssVar('--muted-foreground')} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke={getCssVar('--muted-foreground')} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: getCssVar('--card'),
                      border: `1px solid ${getCssVar('--border')}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    stroke={getCssVar('--primary')}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Submitted"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke={getCssVar('--status-resolved')}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Recent Activity Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Recent Complaints</h3>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-10 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">ID</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {complaints.map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-mono">#{complaint.id}</td>
                        <td className="p-4 text-sm max-w-[200px] truncate">{complaint.text}</td>
                        <td className="p-4 text-sm">{capitalize(complaint.category)}</td>
                        <td className="p-4 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[complaint.status] ?? STATUS_BADGE_CLASSES.pending}`}
                          >
                            {STATUS_LABELS[complaint.status] ?? capitalize(complaint.status)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(complaint.created_at)}
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                          No complaints found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
