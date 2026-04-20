import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, BarChart3, Settings, AlertCircle, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { memo } from 'react';
import OfflineQueueWidget from './OfflineQueueWidget';
import DemoModeToggle from '../demo/DemoModeToggle';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Live Map', path: '/map', icon: MapPin },
  { name: 'My Complaints', path: '/complaints', icon: AlertCircle },
  { name: 'Leaderboard', path: '/leaderboard', icon: Award },
  { name: 'Insights', path: '/insights', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface-container-lowest)]/70 backdrop-blur-[30px] border border-[var(--color-outline-variant)]/20 h-full p-4 rounded-[var(--radius-xl)] shadow-[var(--shadow-soft-2)] flex-shrink-0">
      <div className="flex-1 space-y-2 mt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          
          return (
            <motion.div
              key={item.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={item.path}
                aria-label={item.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] ${
                  isActive 
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-soft-1)]' 
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--color-on-primary)]' : 'text-[var(--color-primary)]'}`} aria-hidden="true" />
                {item.name}
              </Link>
            </motion.div>
          );
        })}
      </div>
      
      {/* Bottom Area */}
      <div className="mt-auto pt-4 border-t border-[var(--color-outline-variant)]/30 space-y-3">
        <DemoModeToggle />
        <OfflineQueueWidget />
        {isAuthenticated && (
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-surface-container-low)] rounded-[var(--radius-lg)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary-container)] font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-[var(--color-on-surface)]">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--color-on-surface-variant)] truncate">Impact: {user?.impactScore || 0}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default memo(Sidebar);
