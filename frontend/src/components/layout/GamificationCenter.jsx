import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Trophy, Target, Zap, 
  Star, Shield, Flame, CheckCircle2, 
  Flag, MessageSquare, Mic, TrendingUp,
  ChevronRight, Lock
} from 'lucide-react';

const ICON_MAP = {
  Award: Award,
  Trophy: Trophy,
  Target: Target,
  Zap: Zap,
  Star: Star,
  Shield: Shield,
  Flame: Flame,
  CheckCircle: CheckCircle2,
  Flag: Flag,
  MessageSquare: MessageSquare,
  Mic: Mic,
  TrendingUp: TrendingUp
};

export default function GamificationCenter({ user }) {
  const [activeTab, setActiveTab] = useState('challenges'); // 'challenges' | 'badges'

  const badges = user?.badges || [];
  const challenges = user?.challenges || [];

  const completedChallenges = challenges.filter(c => c.isCompleted);
  const activeChallenges = challenges.filter(c => !c.isCompleted);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/30 overflow-hidden flex flex-col h-full"
    >
      {/* Header & Tabs */}
      <div className="p-5 border-b border-[var(--color-outline-variant)]/30 flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-[var(--color-surface-container-low)] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-xl)] bg-[var(--color-primary-container)] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[var(--color-on-primary-container)]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--color-on-surface)] tracking-tight">Gamification Hub</h3>
            <p className="text-[10px] font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Level: {user?.level}</p>
          </div>
        </div>

        <div className="flex bg-[var(--color-surface-container-high)] p-1 rounded-xl">
          {[
            { id: 'challenges', label: 'Challenges', icon: Target },
            { id: 'badges', label: 'Badges', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm' 
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'challenges' && activeChallenges.length > 0 && (
                <span className={`ml-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  activeTab === tab.id ? 'bg-[var(--color-on-primary)] text-[var(--color-primary)]' : 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                }`}>
                  {activeChallenges.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === 'challenges' ? (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge, idx) => (
                  <ChallengeCard key={challenge.title} challenge={challenge} index={idx} />
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-60">
                  <CheckCircle2 className="w-12 h-12 text-[var(--color-success)] mb-3" />
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">All caught up!</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Check back next week for new civic challenges.</p>
                </div>
              )}

              {completedChallenges.length > 0 && (
                <div className="pt-4">
                  <p className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-3 px-1">Completed Recently</p>
                  <div className="space-y-2 opacity-60">
                    {completedChallenges.slice(0, 3).map(challenge => (
                      <div key={challenge.title} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-low)] rounded-[var(--radius-lg)] border border-[var(--color-outline-variant)]/20">
                        <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                        <span className="text-xs font-semibold text-[var(--color-on-surface)]">{challenge.title}</span>
                        <span className="ml-auto text-[10px] font-bold text-[var(--color-primary)]">+{challenge.xpReward} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {badges.length > 0 ? (
                badges.map((badge, idx) => (
                  <BadgeItem key={badge.name} badge={badge} index={idx} />
                ))
              ) : (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-center p-10 opacity-60">
                  <Lock className="w-12 h-12 text-[var(--color-on-surface-variant)] mb-3" />
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">No badges yet</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Start reporting and verifying to earn civic honors.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / CTA */}
      <div className="p-4 bg-[var(--color-surface-container-low)]/50 border-t border-[var(--color-outline-variant)]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
           <span className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
             Earn XP to unlock exclusive titles
           </span>
        </div>
        <button className="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
          Full Statistics <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

function ChallengeCard({ challenge, index }) {
  const progress = Math.min(100, (challenge.progress / challenge.target) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-4 bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)] shadow-[var(--shadow-soft-1)] hover:shadow-[var(--shadow-soft-2)] transition-shadow group"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--color-on-surface)] truncate">{challenge.title}</h4>
          <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">{challenge.description}</p>
        </div>
        <div className="bg-[var(--color-primary-container)] px-2 py-0.5 rounded-full shrink-0">
          <span className="text-[10px] font-bold text-[var(--color-on-primary-container)]">+{challenge.xpReward} XP</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3 + (index * 0.1), duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full"
          />
        </div>
        <span className="text-[10px] font-black text-[var(--color-on-surface)] shrink-0 min-w-[40px] text-right">
          {challenge.progress} / {challenge.target}
        </span>
      </div>
    </motion.div>
  );
}

function BadgeItem({ badge, index }) {
  const Icon = ICON_MAP[badge.icon] || Award;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ y: -4 }}
      className="p-3 bg-[var(--color-surface-container-low)] rounded-[var(--radius-xl)] border border-[var(--color-outline-variant)]/30 flex flex-col items-center text-center group cursor-pointer relative"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-inner flex items-center justify-center mb-2 group-hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary-container)] to-transparent flex items-center justify-center border border-white/50">
          <Icon className="w-5 h-5 text-[var(--color-primary)]" />
        </div>
      </div>
      <p className="text-[10px] font-bold text-[var(--color-on-surface)] leading-tight">{badge.name}</p>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-[var(--color-on-surface)] text-[var(--color-surface)] rounded-lg text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
        {badge.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[var(--color-on-surface)]" />
      </div>
    </motion.div>
  );
}
