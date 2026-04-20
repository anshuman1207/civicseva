import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, Search, Inbox, TrendingUp,
  Award, BarChart3, FileSearch, ShieldCheck,
  Users, ArrowRight, Sparkles, Target
} from 'lucide-react';

// ─── Preset Configurations ──────────────────────
const PRESETS = {
  complaints: {
    icon: Inbox,
    title: 'No complaints yet',
    description: 'You haven\'t reported any civic issues. Help make your city better by reporting problems you see around you.',
    gradient: 'from-blue-500/10 to-indigo-500/10',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    actions: [
      { label: 'Report Your First Issue', icon: Plus, path: '/map', primary: true },
      { label: 'Explore Live Map', icon: MapPin, path: '/map' },
    ],
    tips: [
      'Snap a photo of the issue for faster resolution',
      'Drop a pin on the map to mark the exact location',
      'Add a clear title so authorities can act quickly',
    ],
  },
  searchNoResults: {
    icon: FileSearch,
    title: 'No matching results',
    description: 'We couldn\'t find any complaints matching your search criteria. Try adjusting your filters or search terms.',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    actions: [
      { label: 'Clear Search', icon: Search, action: 'clearSearch' },
    ],
    tips: [
      'Try broader keywords like "road" or "water"',
      'Remove active filters to see all complaints',
      'Check the category tabs for quick filtering',
    ],
  },
  filterEmpty: {
    icon: ShieldCheck,
    title: 'No issues in this category',
    description: 'Great news! There are currently no complaints matching this filter. The community is keeping things in check.',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-50',
    actions: [
      { label: 'View All Complaints', icon: Inbox, action: 'resetFilter' },
    ],
    tips: [],
  },
  leaderboard: {
    icon: Award,
    title: 'Leaderboard is loading',
    description: 'Community rankings are being calculated. Be one of the first to contribute and climb the ranks!',
    gradient: 'from-purple-500/10 to-pink-500/10',
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-50',
    actions: [
      { label: 'Start Contributing', icon: Plus, path: '/map', primary: true },
      { label: 'View Insights', icon: BarChart3, path: '/insights' },
    ],
    tips: [
      'Report issues to earn XP and climb the leaderboard',
      'Verify complaints from other citizens for bonus points',
      'Consistent contributions unlock badges and titles',
    ],
  },
  insights: {
    icon: TrendingUp,
    title: 'Analytics are building up',
    description: 'We need more civic data to generate meaningful insights. As more complaints are reported, trends will start to appear here.',
    gradient: 'from-cyan-500/10 to-blue-500/10',
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-50',
    actions: [
      { label: 'Report an Issue', icon: Plus, path: '/map', primary: true },
      { label: 'View Community', icon: Users, path: '/leaderboard' },
    ],
    tips: [],
  },
  activity: {
    icon: Sparkles,
    title: 'No activity yet',
    description: 'The activity feed is quiet. Be the first to make a difference in your community today!',
    gradient: 'from-indigo-500/10 to-violet-500/10',
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-50',
    actions: [
      { label: 'Take Action Now', icon: Plus, path: '/map', primary: true },
    ],
    tips: [],
  },
  challengesActive: {
    icon: Target,
    title: 'No active quests',
    description: 'You\'ve crushed all your current challenges! Check back soon for more.',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    actions: [
      { label: 'Start Reporting', icon: Plus, path: '/map', primary: true },
    ],
    tips: [],
  },
  challengesCompleted: {
    icon: Award,
    title: 'No completed quests',
    description: 'Complete your first challenge to see it listed here! Every quest counts.',
    gradient: 'from-green-500/10 to-emerald-500/10',
    iconColor: 'text-green-500',
    iconBg: 'bg-green-50',
    actions: [
      { label: 'View Active Quests', icon: Target, action: 'resetFilter' },
    ],
    tips: [],
  },
};

// ─── Floating Orb Background ────────────────────
function FloatingOrbs({ color }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className={`absolute w-32 h-32 rounded-full opacity-[0.04] ${color}`}
          animate={{
            x: [0, 20 * (i + 1), -10 * (i + 1), 0],
            y: [0, -15 * (i + 1), 10 * (i + 1), 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 6 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            left: `${20 + i * 30}%`,
            top: `${15 + i * 20}%`,
            filter: 'blur(30px)',
            background: `var(--color-primary)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Onboarding Tip Pill ────────────────────────
function TipPill({ text, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.12 }}
      className="flex items-center gap-2.5 px-4 py-2.5 bg-[var(--color-surface-container-lowest)] rounded-2xl border border-[var(--color-outline-variant)]/20 shadow-sm group hover:border-[var(--color-primary)]/20 transition-colors"
    >
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 group-hover:scale-125 transition-transform" />
      <span className="text-xs font-medium text-[var(--color-on-surface-variant)] leading-snug">{text}</span>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════
// MAIN EMPTY STATE COMPONENT
// ═══════════════════════════════════════════════
export default function EmptyState({
  preset,
  title: customTitle,
  description: customDescription,
  actions: customActions,
  onClearSearch,
  onResetFilter,
  className = '',
}) {
  const navigate = useNavigate();
  const config = PRESETS[preset] || PRESETS.complaints;
  
  const title = customTitle || config.title;
  const description = customDescription || config.description;
  const actions = customActions || config.actions;
  const Icon = config.icon;

  const handleAction = (action) => {
    if (action.path) {
      navigate(action.path);
    } else if (action.action === 'clearSearch' && onClearSearch) {
      onClearSearch();
    } else if (action.action === 'resetFilter' && onResetFilter) {
      onResetFilter();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative flex flex-col items-center justify-center py-12 px-6 gap-6 rounded-3xl bg-gradient-to-br ${config.gradient} border border-[var(--color-outline-variant)]/15 overflow-hidden ${className}`}
    >
      <FloatingOrbs color={config.iconBg} />
      
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
        className={`relative w-20 h-20 rounded-3xl ${config.iconBg} flex items-center justify-center shadow-md z-10`}
      >
        <Icon className={`w-9 h-9 ${config.iconColor}`} strokeWidth={1.5} />
        {/* Pulsing ring */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inset-0 rounded-3xl border-2 ${config.iconColor.replace('text-', 'border-')}`}
        />
      </motion.div>

      {/* Text */}
      <div className="text-center z-10 max-w-md">
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-[var(--color-on-surface)] tracking-tight"
        >
          {title}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[var(--color-on-surface-variant)] mt-2 leading-relaxed"
        >
          {description}
        </motion.p>
      </div>

      {/* Action Buttons */}
      {actions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3 z-10"
        >
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <motion.button
                key={i}
                onClick={() => handleAction(action)}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                  action.primary
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[var(--shadow-soft-2)] hover:brightness-110'
                    : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface)] border border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)]/30 shadow-sm'
                }`}
              >
                <ActionIcon className="w-4 h-4" />
                {action.label}
                {action.primary && <ArrowRight className="w-3.5 h-3.5" />}
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Onboarding Tips */}
      {config.tips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-sm space-y-2 z-10 mt-2"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]/60 text-center mb-3">
            Quick Tips to Get Started
          </p>
          {config.tips.map((tip, i) => (
            <TipPill key={i} text={tip} index={i} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
