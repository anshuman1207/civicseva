import { Link, useNavigate } from 'react-router-dom';
import { Menu, Moon, Sun, User, WifiOff, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectivity } from '../../context/ConnectivityContext';
import { useComplaintQueue } from '../../hooks/useComplaintQueue';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useEffect, memo } from 'react';
import NotificationDropdown from './NotificationDropdown';

function Navbar({ onReportClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { isOnline } = useConnectivity();
  const { queueLength, syncing } = useComplaintQueue();
  const { isAuthenticated, user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--color-surface-container-lowest)]/70 backdrop-blur-[30px] border-b border-[var(--color-outline-variant)]/10 shadow-[var(--shadow-soft-1)]">
      <div className="flex items-center justify-between px-4 h-16 max-w-[var(--spacing-container-max)] mx-auto">
        {/* Left: Menu & Logo */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-[var(--color-surface-container)] hover:scale-105 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" aria-label="Menu">
            <Menu className="w-5 h-5 text-[var(--color-on-surface)]" aria-hidden="true" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[var(--color-on-surface)] hover:opacity-80 transition-opacity">
            Civic<span className="text-[var(--color-primary)]">Seva</span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-500 ${
                !isOnline
                  ? 'bg-amber-500 animate-pulse'
                  : syncing
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-green-500'
              }`}
              title={!isOnline ? 'Offline' : syncing ? 'Syncing...' : 'Connected'}
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {(!isOnline || queueLength > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  !isOnline ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                <WifiOff size={12} />
                {queueLength > 0 ? `${queueLength} queued` : 'Offline'}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--color-surface-container)] hover:scale-105 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
          </button>
          
          <NotificationDropdown />
          
          <button 
            onClick={onReportClick}
            className={`hidden sm:flex items-center justify-center px-5 py-2 rounded-[var(--radius-lg)] text-sm font-semibold hover:scale-[1.02] active:scale-[0.98] shadow-[var(--shadow-soft-2)] transition-all duration-300 ${
              !isOnline ? 'bg-amber-500 text-white' : 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:brightness-110'
            }`}
          >
            {!isOnline ? 'Report (Offline)' : 'Report Issue'}
          </button>
          
          {/* Auth State Block */}
          <div className="relative" ref={menuRef}>
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User menu"
                  className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  <span className="hidden lg:block text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <div className="w-8 h-8 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] flex items-center justify-center font-bold text-sm shrink-0">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 rounded-[var(--radius-lg)] bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 shadow-[var(--shadow-soft-3)] backdrop-blur-lg py-2 overflow-hidden origin-top-right"
                    >
                      <div className="px-4 py-2 border-b border-[var(--color-outline-variant)]/10">
                        <p className="text-xs text-[var(--color-on-surface-variant)] font-medium truncate">{user?.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-colors"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Link>
                      <Link 
                        to="/settings" 
                        onClick={() => setShowUserMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-[var(--color-error-container)]/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link 
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-container)]/20 border border-[var(--color-primary)]/30 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default memo(Navbar);
