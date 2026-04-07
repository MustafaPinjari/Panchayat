import React from 'react';
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
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const statusData = [
  { name: 'Pending', value: 12, color: '#f59e0b' },
  { name: 'In Progress', value: 8, color: '#4F46E5' },
  { name: 'Resolved', value: 45, color: '#10b981' },
  { name: 'Rejected', value: 3, color: '#ef4444' },
];

const categoryData = [
  { name: 'Water', count: 15 },
  { name: 'Security', count: 8 },
  { name: 'Maintenance', count: 20 },
  { name: 'Electricity', count: 12 },
  { name: 'Parking', count: 6 },
  { name: 'Garden', count: 7 },
];

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  color: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${color}/10`}
      >
        <Icon className={`w-6 h-6 text-${color}`} style={{ color }} />
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

export default function AdminDashboard() {
  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Analytics Dashboard" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Complaints"
              value={68}
              icon={AlertCircle}
              trend="+12% this month"
              color="#4F46E5"
            />
            <StatCard
              title="Pending"
              value={12}
              icon={Clock}
              color="#f59e0b"
            />
            <StatCard
              title="In Progress"
              value={8}
              icon={TrendingUp}
              color="#4F46E5"
            />
            <StatCard
              title="Resolved"
              value={45}
              icon={CheckCircle}
              trend="66% resolution rate"
              color="#10b981"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Complaints by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Status Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-6">Status Distribution</h3>
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
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold">Recent Complaints</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Title
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      id: '#1234',
                      title: 'Water supply disrupted',
                      category: 'Water',
                      status: 'Pending',
                      time: '2 hours ago',
                    },
                    {
                      id: '#1233',
                      title: 'Security gate issue',
                      category: 'Security',
                      status: 'In Progress',
                      time: '5 hours ago',
                    },
                    {
                      id: '#1232',
                      title: 'Lift maintenance',
                      category: 'Maintenance',
                      status: 'Resolved',
                      time: '1 day ago',
                    },
                  ].map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 text-sm font-mono">{item.id}</td>
                      <td className="p-4 text-sm">{item.title}</td>
                      <td className="p-4 text-sm">{item.category}</td>
                      <td className="p-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'Pending'
                              ? 'bg-warning/10 text-warning'
                              : item.status === 'In Progress'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-accent/10 text-accent'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {item.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
