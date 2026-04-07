import React, { useState } from 'react';
import { TopNav } from '../components/TopNav';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Search,
  UserPlus,
  MoreVertical,
  Shield,
  User,
  UserCog,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const mockUsers = [
  {
    id: '1',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    role: 'resident',
    unit: 'A-501',
    status: 'active',
    joinedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    role: 'committee',
    unit: 'B-302',
    status: 'active',
    joinedDate: '2024-02-01',
  },
  {
    id: '3',
    name: 'Amit Kumar',
    email: 'amit.kumar@example.com',
    role: 'resident',
    unit: 'C-105',
    status: 'active',
    joinedDate: '2024-03-10',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    role: 'admin',
    unit: 'Admin Office',
    status: 'active',
    joinedDate: '2023-12-01',
  },
  {
    id: '5',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    role: 'resident',
    unit: 'A-203',
    status: 'inactive',
    joinedDate: '2024-01-20',
  },
];

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin':
      return Shield;
    case 'committee':
      return UserCog;
    default:
      return User;
  }
};

const getRoleBadge = (role: string) => {
  const colors = {
    admin: 'bg-destructive/10 text-destructive border-destructive/20',
    committee: 'bg-primary/10 text-primary border-primary/20',
    resident: 'bg-accent/10 text-accent border-accent/20',
  };
  return colors[role as keyof typeof colors] || colors.resident;
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
      <TopNav title="User Management" />

      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-semibold mb-1">
                Manage Users
              </h2>
              <p className="text-muted-foreground">
                Add, edit, or remove users and manage their roles
              </p>
            </div>
            <Button className="w-full md:w-auto">
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

          {/* Users Table - Desktop */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Unit
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role);
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={getRoleBadge(user.role)}
                          >
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{user.unit}</td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className={
                              user.status === 'active'
                                ? 'bg-accent/10 text-accent border-accent/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }
                          >
                            {user.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit User</DropdownMenuItem>
                              <DropdownMenuItem>Change Role</DropdownMenuItem>
                              <DropdownMenuItem>
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                <div
                  key={user.id}
                  className="bg-card border border-border rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit User</DropdownMenuItem>
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Remove User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={getRoleBadge(user.role)}
                    >
                      <RoleIcon className="w-3 h-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Badge>
                    <Badge variant="outline">{user.unit}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        user.status === 'active'
                          ? 'bg-accent/10 text-accent border-accent/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
