import { motion } from 'framer-motion';
import { Award, Zap, ChevronRight, Star, TrendingUp } from 'lucide-react';

const LEVELS = [
  { name: 'Civic Explorer', minXp: 0, color: 'text-slate-500', bg: 'bg-slate-500/10', bar: 'bg-slate-500' },
  { name: 'Local Observer', minXp: 20, color: 'text-blue-500', bg: 'bg-blue-500/10', bar: 'bg-blue-500' },
  { name: 'Active Citizen', minXp: 50, color: 'text-cyan-500', bg: 'bg-cyan-500/10', bar: 'bg-cyan-500' },
  { name: 'Community Contributor', minXp: 100, color: 'text-emerald-500', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500' },
  { name: 'Neighborhood Guard', minXp: 200, color: 'text-green-500', bg: 'bg-green-500/10', bar: 'bg-green-500' },
  { name: 'Civic Leader', minXp: 350, color: 'text-indigo-500', bg: 'bg-indigo-500/10', bar: 'bg-indigo-500' },
  { name: 'City Advocate', minXp: 550, color: 'text-purple-500', bg: 'bg-purple-500/10', bar: 'bg-purple-500' },
  { name: 'Urban Visionary', minXp: 800, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', bar: 'bg-fuchsia-500' },
  { name: 'Civic Guardian', minXp: 1100, color: 'text-rose-500', bg: 'bg-rose-500/10', bar: 'bg-rose-500' },
  { name: 'Civic Champion', minXp: 1500, color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' }
];

export default function ProgressionStats({ user }) {
  if (!user) return null;

  const currentPoints = user.points || 0;
  
  // Find current level and next level
  let currentLevelIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (currentPoints >= LEVELS[i].minXp) {
      currentLevelIdx = i;
      break;
    }
  }

  const currentLevel = LEVELS[currentLevelIdx];
  const nextLevel = LEVELS[currentLevelIdx + 1] || null;
  
  let progress = 0;
  let xpToNext = 0;

  if (nextLevel) {
    const range = nextLevel.minXp - currentLevel.minXp;
    const earnedInRange = currentPoints - currentLevel.minXp;
    progress = Math.min(100, (earnedInRange / range) * 100);
    xpToNext = nextLevel.minXp - currentPoints;
  } else {
    progress = 100;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-[var(--color-surface-container-lowest)] to-[var(--color-surface-container-low)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/20 relative overflow-hidden group shrink-0"
    >
      {/* Decorative background flare */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 -mr-10 -mt-10 transition-colors duration-1000 ${currentLevel.bg}`} />
      
      <div className="relative z-10 flex flex-col gap-6">
        {/* Top Header: User Info & Level */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-2xl font-black text-[var(--color-on-primary)] shadow-lg group-hover:rotate-3 transition-transform">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-[var(--color-surface-container-lowest)] flex items-center justify-center shadow-sm">
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-on-surface)] tracking-tight leading-normal py-0.5">
                {user.name.split(' ')[0]}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${currentLevel.bg} ${currentLevel.color} border-current/20`}>
                  {currentLevel.name}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {currentPoints} XP Total
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-[var(--color-on-surface)] tracking-tighter leading-normal py-0.5">
              {user.stats?.impactScore || 0}
            </p>
            <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest">
              Impact Score
            </p>
          </div>
        </div>

        {/* Progress Bar Area */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-[var(--color-on-surface)] flex items-center gap-1.5">
                {nextLevel ? (
                  <>
                    Next Level: <span className={nextLevel.color}>{nextLevel.name}</span>
                  </>
                ) : (
                  'Maximum Level Reached'
                )}
              </p>
              {nextLevel && (
                <p className="text-[10px] text-[var(--color-on-surface-variant)] font-medium mt-0.5">
                  Earn {xpToNext} more XP to level up
                </p>
              )}
            </div>
            <span className="text-lg font-black text-[var(--color-on-surface)] opacity-50">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-3 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden border border-[var(--color-outline-variant)]/30 p-0.5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.4)] ${currentLevel.bar} relative overflow-hidden`}
            >
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 h-full skew-x-12"
              />
            </motion.div>
          </div>
        </div>

        {/* Mini Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Reports', value: user.stats?.reports || 0, icon: Award, color: 'text-blue-500' },
            { label: 'Resolved', value: user.stats?.resolved || 0, icon: Zap, color: 'text-emerald-500' },
            { label: 'Streak', value: user.stats?.streak || 0, icon: TrendingUp, color: 'text-orange-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-[var(--color-surface-container)] rounded-[var(--radius-lg)] p-2.5 flex flex-col items-center justify-center border border-[var(--color-outline-variant)]/10 hover:border-current/20 transition-colors">
              <stat.icon className={`w-3.5 h-3.5 mb-1 ${stat.color}`} />
              <p className="text-sm font-black text-[var(--color-on-surface)]">{stat.value}</p>
              <p className="text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-tighter">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
