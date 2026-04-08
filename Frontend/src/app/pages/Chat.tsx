import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from '../components/TopNav';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CategoryBadge } from '../components/CategoryBadge';
import { cn } from '../components/ui/utils';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface Complaint {
  id: string;
  text: string;
  category: string;
  status: string;
  created_by: string;
  anonymous: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  complaint_id: string;
  created_by: string;
  text: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  results: T[];
  next: string | null;
  previous: string | null;
  count: number;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function Chat() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Complaint[]>([]);
  const [selectedThread, setSelectedThread] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load complaint threads
  useEffect(() => {
    setLoadingThreads(true);
    api.get<PaginatedResponse<Complaint>>('/api/complaints/')
      .then((data) => {
        setThreads(data.results);
        if (data.results.length > 0) setSelectedThread(data.results[0]);
      })
      .finally(() => setLoadingThreads(false));
  }, []);

  // Load comments when thread changes
  useEffect(() => {
    if (!selectedThread) return;
    setLoadingComments(true);
    setComments([]);
    api.get<Comment[]>(`/api/comments/${selectedThread.id}/`)
      .then(setComments)
      .finally(() => setLoadingComments(false));
  }, [selectedThread]);

  // Scroll to bottom when comments load or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || sending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const comment = await api.post<Comment>('/api/comments/', {
        complaint_id: selectedThread.id,
        text,
      });
      setComments((prev) => [...prev, comment]);
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (comment: Comment) =>
    user?.id !== undefined && String(comment.created_by) === String(user.id);

  return (
    <div className="flex-1 flex flex-col h-screen pb-20 md:pb-0">
      <TopNav title="Communication" />

      <div className="flex-1 flex overflow-hidden">
        {/* Thread List */}
        <div className="w-full md:w-80 border-r border-border bg-muted/30 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Active Discussions</h3>
          </div>

          {loadingThreads ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No complaints yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-accent/50 transition-colors',
                    selectedThread?.id === thread.id && 'bg-accent/70'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-medium text-sm line-clamp-2">{thread.text}</h4>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatTime(thread.created_at)}
                    </span>
                  </div>
                  <CategoryBadge category={thread.category as any} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card">
              <h3 className="font-semibold mb-1 line-clamp-1">{selectedThread.text}</h3>
              <CategoryBadge category={selectedThread.category as any} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground mt-8">
                  No replies yet. Be the first to comment.
                </p>
              ) : (
                comments.map((comment) => {
                  const mine = isMyMessage(comment);
                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3',
                          mine
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10'
                        )}
                      >
                        {!mine && (
                          <p className="text-xs font-medium mb-1 text-primary">
                            {comment.created_by}
                          </p>
                        )}
                        <p className="text-sm">{comment.text}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 border-t border-border bg-card"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a discussion to view messages
          </div>
        )}
      </div>
    </div>
  );
}
