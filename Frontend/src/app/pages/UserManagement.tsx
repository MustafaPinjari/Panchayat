import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  User,
  UserCog,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api } from '../../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  flat_number: string;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return Shield;
    case 'committee_member':
      return UserCog;
    default:
      return User;
  }
};

const getRoleBadge = (role: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive border-destructive/20',
    committee_member: 'bg-primary/10 text-primary border-primary/20',
    resident: 'bg-accent/10 text-accent border-accent/20',
  };
  return colors[role] || colors.resident;
};

const ROLE_OPTIONS = ['resident', 'committee_member', 'admin'];

function UserActionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)}>
        <MoreVertical className="w-4 h-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-44 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-1">
            <button
              className="w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-2.5 hover:bg-muted transition-colors"
              onClick={() => { onEdit(); setOpen(false); }}
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
              Edit User
            </button>
            <button
              className="w-full text-left px-3 py-2.5 text-sm rounded-lg flex items-center gap-2.5 hover:bg-destructive/10 text-destructive transition-colors"
              onClick={() => { onDelete(); setOpen(false); }}
            >
              <Trash2 className="w-4 h-4" />
              Remove User
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit dialog state
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '', flat_number: '' });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add user dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', role: 'resident', flat_number: '', password: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<PaginatedResponse<User>>('/api/users/');
      setUsers(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.flat_number ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete handlers
  function openDelete(user: User) {
    setDeleteTarget(user);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/users/${deleteTarget.id}/`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      // keep dialog open, error surfaced via toast in global handler
    } finally {
      setDeleting(false);
    }
  }

  // Edit handlers
  function openEdit(user: User) {
    setEditTarget(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      flat_number: user.flat_number ?? '',
    });
    setEditError(null);
  }

  async function saveEdit() {
    if (!editTarget) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await api.put<User>(`/api/users/${editTarget.id}/`, editForm);
      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? updated : u)));
      setEditTarget(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  // Add user handlers
  function openAdd() {
    setAddForm({ name: '', email: '', phone: '', role: 'resident', flat_number: '', password: '' });
    setAddError(null);
    setAddOpen(true);
  }

  async function submitAdd() {
    setAdding(true);
    setAddError(null);
    try {
      const newUser = await api.post<User>('/api/users/register/', addForm);
      setUsers((prev) => [...prev, newUser]);
      setAddOpen(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="User Management" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Manage Users</h2>
              <p className="text-muted-foreground">
                Add, edit, or remove users and manage their roles
              </p>
            </div>
            <Button className="w-full md:w-auto" onClick={openAdd}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Loading / Error states */}
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading users...
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" onClick={fetchUsers}>Retry</Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Users Table - Desktop */}
              <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Flat</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Phone</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => {
                        const RoleIcon = getRoleIcon(user.role);
                        return (
                          <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="outline" className={getRoleBadge(user.role)}>
                                <RoleIcon className="w-3 h-3 mr-1" />
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                              </Badge>
                            </td>
                            <td className="p-4 text-sm">{user.flat_number || '—'}</td>
                            <td className="p-4 text-sm">{user.phone || '—'}</td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <UserActionsMenu
                                onEdit={() => openEdit(user)}
                                onDelete={() => openDelete(user)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Users List - Mobile */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <div key={user.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium mb-1">{user.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <UserActionsMenu
                          onEdit={() => openEdit(user)}
                          onDelete={() => openDelete(user)}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={getRoleBadge(user.role)}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                        </Badge>
                        {user.flat_number && <Badge variant="outline">{user.flat_number}</Badge>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No users found.</p>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user's details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-flat">Flat Number</Label>
              <Input
                id="edit-flat"
                value={editForm.flat_number}
                onChange={(e) => setEditForm((f) => ({ ...f, flat_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role">Role</Label>
              <select
                id="edit-role"
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Register a new user to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-flat">Flat Number</Label>
              <Input
                id="add-flat"
                value={addForm.flat_number}
                onChange={(e) => setAddForm((f) => ({ ...f, flat_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-role">Role</Label>
              <select
                id="add-role"
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={submitAdd} disabled={adding}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
