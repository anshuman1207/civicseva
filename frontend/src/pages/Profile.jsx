import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Award, Shield, Target, Flame, Zap, Star, Flag, CheckCircle, Mic, Check, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { ProfileSkeleton } from '../components/common/Skeleton';

// ─── Animation Presets ──────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const { loading: apiLoading, get } = useApi();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await get('/auth/me');
        setProfileData(data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };
    fetchProfile();
  }, [get]);

  if (apiLoading) {
    return <ProfileSkeleton />;
  }

  if (!profileData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[var(--color-on-surface-variant)]">
        Please log in to view your profile.
      </div>
    );
  }

  const { name, email, level, stats } = profileData;
  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full h-full flex flex-col gap-8 overflow-y-auto px-4 py-6 md:pb-10 scrollbar-hide"
    >
      {/* ─── Header Section ──────────────────────── */}
      <motion.div variants={itemVariants} className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-2xl)] p-6 shadow-[var(--shadow-soft-1)] border border-[var(--color-outline-variant)]/20 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-tertiary)] flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0">
          {initial}
        </div>
        
        <div className="flex-1 text-center sm:text-left z-10">
          <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight">{name}</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-1 font-medium">{email}</p>
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4">
            <span className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-wider ${profileData.points >= 350 ? 'bg-purple-100 text-purple-800 border-purple-200' : profileData.points >= 150 ? 'bg-blue-100 text-blue-800 border-blue-200' : profileData.points >= 50 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>
              <Award className="w-3 h-3" />
              {level || 'Beginner'}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-800 rounded-full border border-slate-200 shadow-sm uppercase tracking-wider">
              <Shield className="w-3 h-3" />
              Verified Reporter
            </span>
          </div>
        </div>
      </motion.div>

      {/* ─── Level & XP Progress Card ─────────────────── */}
      <motion.div variants={itemVariants} className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-8 shadow-[var(--shadow-soft-2)] border border-[var(--color-outline-variant)]/20 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${profileData.points >= 350 ? 'bg-purple-500' : profileData.points >= 150 ? 'bg-blue-500' : profileData.points >= 50 ? 'bg-emerald-500' : 'bg-orange-500'}`} />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ${profileData.points >= 350 ? 'bg-gradient-to-br from-purple-500 to-pink-600' : profileData.points >= 150 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : profileData.points >= 50 ? 'bg-gradient-to-br from-emerald-400 to-teal-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xs font-black text-[var(--color-on-surface-variant)] tracking-[0.2em] uppercase mb-1">
                Progression
              </h2>
              <div className={`text-4xl font-black tracking-tighter ${profileData.points >= 1500 ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface)]'}`}>
                {level && level !== name ? level : 'Civic Explorer'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-8 bg-[var(--color-surface-container-low)]/50 p-4 rounded-2xl border border-[var(--color-outline-variant)]/10 backdrop-blur-sm">
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Impact</div>
              <div className="text-3xl font-black text-[var(--color-primary)] flex items-baseline gap-1">
                {stats?.impactScore || 0}
              </div>
            </div>
            <div className="w-px h-10 bg-[var(--color-outline-variant)]/20" />
            <div className="text-right flex flex-col items-end">
              <div className="text-[10px] font-black text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1">Total XP</div>
              <div className="text-3xl font-black text-[var(--color-on-surface)] flex items-baseline gap-1">
                {profileData.points || 0} <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Path Visual */}
        <div className="relative mt-12 mb-4 px-2">
          {/* Main Track */}
          <div className="absolute top-1/2 left-0 w-full h-1.5 bg-[var(--color-surface-container-high)] -translate-y-1/2 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (profileData.points / 1500) * 100)}%` }}
              transition={{ duration: 2, ease: "circOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${profileData.points >= 1500 ? 'from-purple-500 via-pink-500 to-purple-600' : 'from-[var(--color-primary)] to-[var(--color-tertiary)]'}`}
            />
          </div>

          {/* Level Nodes */}
          <div className="relative flex justify-between items-center">
            {[
              { name: 'Explorer', xp: 0, icon: Star },
              { name: 'Citizen', xp: 50, icon: Shield },
              { name: 'Leader', xp: 350, icon: Target },
              { name: 'Champion', xp: 1500, icon: Award }
            ].map((node, i) => {
              const milestones = [0, 50, 350, 1500];
              const isReached = profileData.points >= node.xp;
              const isCurrent = (i < 3 && profileData.points >= node.xp && profileData.points < milestones[i+1]) || (i === 3 && profileData.points >= 1500);
              
              return (
                <div key={i} className="flex flex-col items-center relative z-10">
                  <motion.div 
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isReached ? 'var(--color-primary-container)' : 'var(--color-surface-container-high)',
                      borderColor: isReached ? 'var(--color-primary)' : 'var(--color-outline-variant)'
                    }}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shadow-sm backdrop-blur-md transition-all duration-500 ${isReached ? 'text-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]/40'}`}
                  >
                    <node.icon className={`w-5 h-5 ${isReached ? 'opacity-100' : 'opacity-40'}`} />
                    
                    {isCurrent && (
                      <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 rounded-xl bg-[var(--color-primary)]/20 blur-md"
                        animate={{ opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <div className="absolute top-12 flex flex-col items-center whitespace-nowrap">
                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isReached ? 'text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]/40'}`}>
                      {node.name}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--color-on-surface-variant)]/60">
                      {node.xp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Detail */}
        <div className="mt-20 flex justify-between items-center text-xs font-bold bg-[var(--color-surface-container-low)]/30 p-3 rounded-xl border border-[var(--color-outline-variant)]/10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--color-on-surface-variant)]">
              {profileData.points >= 1500 
                ? "You've reached the pinnacle of civic engagement!" 
                : `${Math.max(0, (profileData.points >= 350 ? 1500 : profileData.points >= 50 ? 350 : 50) - profileData.points)} XP until next level`}
            </span>
          </div>
          <div className="text-[var(--color-primary)] font-black">
            {profileData.points >= 1500 ? 'MAX LEVEL' : `${Math.floor((profileData.points / 1500) * 100)}% TOTAL PROGRESS`}
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Grid ────────────────────────── */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Reports Filed', value: stats?.reports || 0, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Issues Resolved', value: stats?.resolved || 0, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Community Upvotes', value: stats?.upvotes || 0, icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Discussion Posts', value: stats?.comments || 0, icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Verifications', value: stats?.verifications || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Impact Score', value: stats?.impactScore || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Activity Streak', value: `${stats?.streak || 0}d`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{ y: -4 }}
            className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-5 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)] flex flex-col items-center justify-center text-center transition-transform"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-[var(--color-on-surface)]">{stat.value}</div>
            <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] mt-1 uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Badges Section ────────────────────────── */}
      {profileData.badges && profileData.badges.length > 0 && (
        <motion.div variants={itemVariants} className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-6 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]">
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-4">Earned Badges</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {profileData.badges.map((badge, i) => {
              const Icon = badge.icon === 'Flag' ? Flag : 
                           badge.icon === 'Shield' ? Shield : 
                           badge.icon === 'CheckCircle' ? CheckCircle : 
                           badge.icon === 'Mic' ? Mic : 
                           badge.icon === 'Target' ? Target :
                           badge.icon === 'Star' ? Star :
                           badge.icon === 'MessageSquare' ? MessageSquare :
                           Award;
              return (
                <div key={i} className="flex flex-col items-center justify-center p-4 bg-[var(--color-surface-container-low)] rounded-xl text-center border border-[var(--color-outline-variant)]/30 transition-transform hover:scale-105">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-orange-400 rounded-full flex items-center justify-center mb-2 shadow-sm text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{badge.name}</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── Challenges Section ────────────────────── */}
      {profileData.challenges && profileData.challenges.length > 0 && (
        <motion.div variants={itemVariants} className="bg-[var(--color-surface-container-lowest)] rounded-[var(--radius-xl)] p-6 border border-[var(--color-outline-variant)]/20 shadow-[var(--shadow-soft-1)]">
          <h2 className="text-lg font-bold text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Weekly Challenges
          </h2>
          <div className="flex flex-col gap-4">
            {profileData.challenges.map((challenge, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-bold text-[var(--color-on-surface)]">{challenge.title}</h3>
                    {challenge.isCompleted && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                        <Check className="w-3 h-3" /> COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">{challenge.description}</p>
                  
                  <div className="mt-3 relative h-2 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }}
                      transition={{ duration: 1 }}
                      className={`absolute top-0 left-0 h-full rounded-full ${challenge.isCompleted ? 'bg-green-500' : 'bg-[var(--color-primary)]'}`}
                    />
                  </div>
                  <div className="text-xs font-semibold text-[var(--color-on-surface-variant)] mt-1 text-right">
                    {challenge.progress} / {challenge.target}
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-800 font-black rounded-lg text-sm border border-purple-200">
                  +{challenge.xpReward} XP
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
