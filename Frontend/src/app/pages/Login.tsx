import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, User, Shield, UserCog } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/ui/utils';

type Role = 'resident' | 'committee' | 'admin';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const roles = [
    {
      id: 'resident' as Role,
      label: 'Resident',
      icon: User,
      description: 'Access your society dashboard',
    },
    {
      id: 'committee' as Role,
      label: 'Committee Member',
      icon: UserCog,
      description: 'Manage and coordinate',
    },
    {
      id: 'admin' as Role,
      label: 'Admin',
      icon: Shield,
      description: 'Full system access',
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('userRole', selectedRole || 'resident');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground mb-2">
              Society Hub
            </h1>
            <p className="text-muted-foreground">
              Smart Society Management System
            </p>
          </div>

          {!selectedRole ? (
            <>
              <h2 className="text-lg font-semibold text-center mb-6">
                Select Your Role
              </h2>
              <div className="space-y-3">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <motion.button
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(role.id)}
                      className="w-full p-4 border border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {role.label}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  Sign in as {roles.find((r) => r.id === selectedRole)?.label}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRole(null)}
                >
                  Change
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button className="text-primary hover:underline font-medium">
                Contact Admin
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
