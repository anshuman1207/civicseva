import { Link, useLocation } from 'react-router-dom';
import { Home, MapPin, AlertCircle, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { memo } from 'react';

const NAV_ITEMS = [
  { name: 'Home',       path: '/',           icon: Home },
  { name: 'Map',        path: '/map',        icon: MapPin },
  { name: 'Complaints', path: '/complaints', icon: AlertCircle },
  { name: 'Insights',   path: '/insights',   icon: BarChart3 },
  { name: 'Settings',   path: '/settings',   icon: Settings },
];

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-[var(--color-surface-container-lowest)]/90 backdrop-blur-xl border-t border-[var(--color-outline-variant)]/30 z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.name}
              className="flex-1 h-full"
              whileTap={{ scale: 0.9 }}
            >
              <Link
                to={item.path}
                aria-label={item.name}
                className={`relative flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 w-5 h-[3px] rounded-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} aria-hidden="true" />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(BottomNav);
