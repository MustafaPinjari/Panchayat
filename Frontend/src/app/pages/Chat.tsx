import React, { useState } from 'react';
import { TopNav } from '../components/TopNav';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Pin } from 'lucide-react';
import { motion } from 'motion/react';
import { CategoryBadge } from '../components/CategoryBadge';
import { cn } from '../components/ui/utils';

interface Message {
  id: string;
  text: string;
  sender: string;
  isAdmin: boolean;
  timestamp: string;
  isAnnouncement?: boolean;
}

const mockThreads = [
  {
    id: '1',
    title: 'Water supply disrupted in Block A',
    category: 'water' as const,
    messages: [
      {
        id: 'm1',
        text: 'Water supply has been disrupted since morning. When will it be fixed?',
        sender: 'Rahul Sharma',
        isAdmin: false,
        timestamp: '10:30 AM',
      },
      {
        id: 'm2',
        text: 'We are aware of the issue. Plumber has been called and will fix it by afternoon.',
        sender: 'Admin',
        isAdmin: true,
        timestamp: '10:45 AM',
      },
      {
        id: 'm3',
        text: 'Thank you for the quick response!',
        sender: 'Rahul Sharma',
        isAdmin: false,
        timestamp: '10:47 AM',
      },
    ],
  },
  {
    id: '2',
    title: 'Security gate not functioning',
    category: 'security' as const,
    messages: [
      {
        id: 'm4',
        text: 'The main gate is not closing properly. This is a security concern.',
        sender: 'Anonymous',
        isAdmin: false,
        timestamp: '09:15 AM',
      },
      {
        id: 'm5',
        text: 'Security team has been notified. Gate will be fixed today.',
        sender: 'Admin',
        isAdmin: true,
        timestamp: '09:30 AM',
      },
    ],
  },
];

export default function Chat() {
  const [selectedThread, setSelectedThread] = useState(mockThreads[0]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    // Add message logic here
    setNewMessage('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen pb-20 md:pb-0">
      <TopNav title="Communication" />

      <div className="flex-1 flex overflow-hidden">
        {/* Thread List - Hidden on mobile when thread selected */}
        <div className="w-full md:w-80 border-r border-border bg-muted/30 overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">Active Discussions</h3>
          </div>
          <div className="divide-y divide-border">
            {mockThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={cn(
                  'w-full p-4 text-left hover:bg-accent/50 transition-colors',
                  selectedThread.id === thread.id && 'bg-accent/70'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">
                    {thread.title}
                  </h4>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {thread.messages[thread.messages.length - 1].timestamp}
                  </span>
                </div>
                <CategoryBadge category={thread.category} />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">{selectedThread.title}</h3>
                <CategoryBadge category={selectedThread.category} />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedThread.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex',
                  message.isAdmin ? 'justify-start' : 'justify-end'
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-3',
                    message.isAdmin
                      ? 'bg-primary/10 text-primary-foreground/90'
                      : 'bg-card border border-border'
                  )}
                >
                  {message.isAdmin && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-[10px] text-primary-foreground font-medium">
                          A
                        </span>
                      </div>
                      <span className="text-xs font-medium text-primary">
                        {message.sender}
                      </span>
                    </div>
                  )}
                  {!message.isAdmin && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {message.sender}
                    </p>
                  )}
                  <p className="text-sm">{message.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
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
              />
              <Button type="submit" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
