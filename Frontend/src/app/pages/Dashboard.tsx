import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { TopNav } from '../components/TopNav';
import { ComplaintCard } from '../components/ComplaintCard';
import { FAB } from '../components/FAB';
import { Mic } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const mockComplaints = [
  {
    id: '1',
    title: 'Water supply disrupted in Block A since morning',
    category: 'water' as const,
    status: 'pending' as const,
    timestamp: '2 hours ago',
    author: 'Rahul Sharma',
    replies: 5,
  },
  {
    id: '2',
    title: 'Security gate not functioning properly',
    category: 'security' as const,
    status: 'in-progress' as const,
    timestamp: '5 hours ago',
    isAnonymous: true,
    replies: 3,
  },
  {
    id: '3',
    title: 'Lift maintenance required urgently in Tower B',
    category: 'maintenance' as const,
    status: 'resolved' as const,
    timestamp: '1 day ago',
    author: 'Priya Patel',
    replies: 8,
  },
  {
    id: '4',
    title: 'Parking space occupied by unauthorized vehicle',
    category: 'parking' as const,
    status: 'pending' as const,
    timestamp: '3 hours ago',
    author: 'Amit Kumar',
    replies: 2,
  },
  {
    id: '5',
    title: 'Garden area needs cleaning and maintenance',
    category: 'garden' as const,
    status: 'in-progress' as const,
    timestamp: '6 hours ago',
    isAnonymous: true,
    replies: 1,
  },
  {
    id: '6',
    title: 'Power outage in common area during evening',
    category: 'electricity' as const,
    status: 'resolved' as const,
    timestamp: '2 days ago',
    author: 'Sneha Reddy',
    replies: 12,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const filteredComplaints =
    activeTab === 'all'
      ? mockComplaints
      : mockComplaints.filter((c) => c.status === activeTab);

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Dashboard" showSearch />

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
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {filteredComplaints.length > 0 ? (
            filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                {...complaint}
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No complaints found in this category
              </p>
            </div>
          )}
        </div>
      </main>

      <FAB
        onClick={() => navigate('/voice-complaint')}
        icon={<Mic className="w-5 h-5" />}
        label="Report Issue"
      />
    </div>
  );
}
