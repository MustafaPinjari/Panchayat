import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '../../services/api';
import { toast } from 'sonner';

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

interface AssignModalProps {
  complaintId: string;
  onClose: () => void;
  onAssigned: (complaintId: string) => void;
}

export function AssignModal({ complaintId, onClose, onAssigned }: AssignModalProps) {
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
      <div className="bg-card border border-border rounded-2xl shadow-floating w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assign to Manager</h2>
          <button aria-label="Close modal" onClick={onClose} className="text-muted-foreground hover:text-foreground">
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
