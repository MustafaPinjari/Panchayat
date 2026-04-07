import React, { useState } from 'react';
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
  CheckCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Reply {
  id: string;
  text: string;
  sender: string;
  isAdmin: boolean;
  timestamp: string;
}

const mockComplaint = {
  id: '1',
  title: 'Water supply disrupted in Block A since morning',
  description:
    'There is no water supply in Block A since morning. Multiple residents have complained about this issue. The overhead tank seems to be empty. Please look into this urgently.',
  category: 'water' as const,
  status: 'pending' as const,
  timestamp: '2 hours ago',
  author: 'Rahul Sharma',
  unit: 'A-501',
  isAnonymous: false,
  replies: [
    {
      id: 'r1',
      text: 'Same issue in my flat. Please fix this ASAP.',
      sender: 'Priya Patel',
      isAdmin: false,
      timestamp: '1 hour ago',
    },
    {
      id: 'r2',
      text: 'We are aware of the issue. The water pump was damaged. Plumber has been called and should arrive within 2 hours.',
      sender: 'Admin',
      isAdmin: true,
      timestamp: '45 minutes ago',
    },
    {
      id: 'r3',
      text: 'Thank you for the update!',
      sender: 'Rahul Sharma',
      isAdmin: false,
      timestamp: '30 minutes ago',
    },
  ] as Reply[],
};

export default function ComplaintDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [newReply, setNewReply] = useState('');
  const [complaint] = useState(mockComplaint);
  const userRole = localStorage.getItem('userRole') || 'resident';

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    toast.success('Reply posted successfully');
    setNewReply('');
  };

  const handleStatusChange = (newStatus: string) => {
    toast.success(`Status updated to ${newStatus}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="Complaint Details" />

      <main className="flex-1 overflow-y-auto">
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

          {/* Complaint Card */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={complaint.category} />
                  <StatusBadge status={complaint.status} />
                </div>
                <h1 className="text-2xl font-semibold">{complaint.title}</h1>
              </div>
              {userRole === 'admin' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('in-progress')}
                    >
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('resolved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2 text-accent" />
                      Mark as Resolved
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange('rejected')}
                      className="text-destructive"
                    >
                      Reject Complaint
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>
                  {complaint.isAnonymous ? 'Anonymous' : complaint.author}
                </span>
              </div>
              {!complaint.isAnonymous && (
                <>
                  <span>•</span>
                  <span>{complaint.unit}</span>
                </>
              )}
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{complaint.timestamp}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-muted-foreground leading-relaxed">
                {complaint.description}
              </p>
            </div>
          </div>

          {/* Replies Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">
              Discussion ({complaint.replies.length})
            </h2>

            <div className="space-y-4 mb-6">
              {complaint.replies.map((reply) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg p-4 ${
                    reply.isAdmin
                      ? 'bg-primary/5 border border-primary/20'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        reply.isAdmin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <span className="text-xs font-medium">
                        {reply.sender.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{reply.sender}</p>
                        {reply.isAdmin && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reply.timestamp}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm">{reply.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="space-y-3">
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Add a reply..."
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end">
                <Button type="submit">
                  <Send className="w-4 h-4 mr-2" />
                  Post Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
