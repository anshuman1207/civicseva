import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { execute, apiLoading } = useApi();
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const query = new URLSearchParams(location.search);
  const isExpired = query.get('expired') === 'true';
  
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await execute(() => login(email, password));
    if (data) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-full w-full flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-3)] overflow-hidden flex flex-col"
      >
        <div className="bg-[var(--color-primary)] p-8 text-white relative overflow-hidden">
          {/* Background accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="text-blue-100 text-sm mt-1">Sign in to continue creating a better city.</p>
          </div>
        </div>

        <div className="p-8">
          {isExpired && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-[var(--color-warning-container)] border border-[var(--color-warning)]/20 rounded-[var(--radius-lg)] flex items-center gap-3 text-[var(--color-warning)] text-sm font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Your session has expired. Please sign in again.</span>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-1.5 ml-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-lg)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-0.5">
                <label className="block text-sm font-semibold text-[var(--color-on-surface)]">Password</label>
                <a href="#" className="text-xs font-semibold text-[var(--color-primary)] hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-lg)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={apiLoading}
              className="w-full py-3 mt-2 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-[var(--shadow-soft-2)] transition-all duration-200"
            >
              {apiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]/15 text-center">
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--color-primary)] font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
