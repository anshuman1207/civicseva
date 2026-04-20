import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { execute, apiLoading } = useApi();
  const { showToast } = useToast();
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return showToast("Passwords do not match", "error");
    }
    
    if (formData.password.length < 6) {
      return showToast("Password must be at least 6 characters", "error");
    }
    
    const data = await execute(() => register(formData.name, formData.email, formData.password));
    if (data) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-full w-full flex items-center justify-center p-4 py-8 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-3)] overflow-hidden flex flex-col my-auto"
      >
        <div className="bg-[var(--color-primary)] p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-tight">Join CivicSeva</h1>
            <p className="text-blue-100 text-sm mt-1">Help build and monitor your local community.</p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-1.5 ml-0.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-lg)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-1.5 ml-0.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-lg)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-1.5 ml-0.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 rounded-[var(--radius-lg)] text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] transition-all"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[var(--color-on-surface)] mb-1.5 ml-0.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-on-surface-variant)]" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
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
                  Create Account
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-outline-variant)]/15 text-center">
            <p className="text-sm text-[var(--color-on-surface-variant)]">
              Already registered?{' '}
              <Link to="/login" className="text-[var(--color-primary)] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
