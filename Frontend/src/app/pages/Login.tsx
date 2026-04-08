import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = (location.state as { role?: string } | null)?.role;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Invalid email or password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f1f35 0%, #1D3557 30%, #1a3a5c 60%, #0d2240 100%)',
      }}
    >
      {/* Mesh gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #2DE2E6 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3A6EA5 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #2DE2E6 0%, transparent 60%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-2xl p-8 shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-white/50 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Change role
          </button>

          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2DE2E6, #3A6EA5)' }}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Society Hub</h1>
            <p className="text-white/50 capitalize">
              Sign in as {role?.replace('_', ' ')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent/30"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-semibold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2DE2E6, #3A6EA5)', border: 'none' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-white/40 hover:text-white/70 transition-colors"
                onClick={() => toast.info('Password reset is not yet available. Please contact your society admin.')}
              >
                Forgot password?
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/40">
              Don't have an account?{' '}
              <button className="text-accent hover:text-accent/80 font-medium transition-colors">
                Contact Admin
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
